import { useCallback, useEffect, useState } from 'react';
import './styles.css';

import Welcome from './screens/Welcome.jsx';
import CountdownScreen from './screens/CountdownScreen.jsx';
import PreviewScreen from './screens/PreviewScreen.jsx';
import UserDataScreen from './screens/UserDataScreen.jsx';
import StyleScreen from './screens/StyleScreen.jsx';
import SendingScreen from './screens/SendingScreen.jsx';
import ProcessingScreen from './screens/ProcessingScreen.jsx';
import SuccessScreen from './screens/SuccessScreen.jsx';
import ErrorScreen from './screens/ErrorScreen.jsx';
import IdleWarning from './components/IdleWarning.jsx';
import Bunting from './components/Bunting.jsx';
import SponsorBar from './components/SponsorBar.jsx';

import { capturePhoto, stopCamera } from './services/camera.js';
import { applyPhotoEffect } from './services/photoEffect.js';
import { DEFAULT_STYLE, getStyle } from './photoStyles.js';
import { initSound, playError, playSuccess } from './services/sound.js';
import { enqueue, flushQueue } from './services/queue.js';
import { sendPhoto } from './services/api.js';
import { useIdleTimeout } from './hooks/useIdleTimeout.js';
import { enterFullscreen, installKioskGuards } from './kiosk.js';
import { SESSION_TIMEOUT_MS, SESSION_WARNING_SECONDS, QUEUE_RETRY_MS } from './config.js';

/**
 * ============================================================
 *  MAQUINA DE ESTADOS DEL TOTEM
 * ------------------------------------------------------------
 *  WELCOME -> COUNTDOWN -> PREVIEW -> FORM -> SENDING -> SUCCESS -> WELCOME
 *                  ^          |
 *                  +-- REPETIR+
 *  Cualquier fallo cae en ERROR, que siempre ofrece salida.
 * ============================================================
 */
const SCREENS = {
  WELCOME: 'WELCOME',
  STYLE: 'STYLE',
  COUNTDOWN: 'COUNTDOWN',
  PROCESSING: 'PROCESSING',
  PREVIEW: 'PREVIEW',
  FORM: 'FORM',
  SENDING: 'SENDING',
  SUCCESS: 'SUCCESS',
  ERROR: 'ERROR',
};

/** Pantallas donde el usuario puede quedarse quieto y abandonar el totem. */
const IDLE_WATCHED = [
  SCREENS.STYLE,
  SCREENS.COUNTDOWN,
  SCREENS.PREVIEW,
  SCREENS.FORM,
  SCREENS.ERROR,
];

export default function App() {
  const [screen, setScreen] = useState(SCREENS.WELCOME);
  const [photo, setPhoto] = useState(null); // foto ya ilustrada { dataUrl, blob }
  const [rawShot, setRawShot] = useState(null); // foto original, para cambiar de estilo
  const [style, setStyle] = useState(DEFAULT_STYLE);
  const [userData, setUserData] = useState(null); // { name, email, phone }
  const [errorMessage, setErrorMessage] = useState('');
  /** true si la foto quedo en la cola en vez de enviarse al momento. */
  const [wasQueued, setWasQueued] = useState(false);

  useEffect(() => installKioskGuards(), []);

  /**
   * Reintenta en segundo plano lo que quedo pendiente por falta de red.
   * Corre siempre, sin importar en que pantalla este el totem: las
   * personas de la cola ya se fueron y no hay nadie a quien avisar.
   */
  useEffect(() => {
    const retry = () => flushQueue(sendPhoto, getStyle).catch(() => {});
    retry();
    const id = setInterval(retry, QUEUE_RETRY_MS);
    window.addEventListener('online', retry);
    return () => {
      clearInterval(id);
      window.removeEventListener('online', retry);
    };
  }, []);

  /** Borra TODO rastro de la persona anterior. */
  const resetSession = useCallback(() => {
    stopCamera();
    setPhoto(null);
    setRawShot(null);
    setUserData(null);
    setStyle(DEFAULT_STYLE);
    setErrorMessage('');
    setWasQueued(false);
    setScreen(SCREENS.WELCOME);
  }, []);

  const idleSecondsLeft = useIdleTimeout(
    IDLE_WATCHED.includes(screen),
    SESSION_TIMEOUT_MS,
    resetSession,
    SESSION_WARNING_SECONDS,
  );

  /* ---------------- transiciones ---------------- */

  const handleStart = () => {
    enterFullscreen(); // requiere gesto del usuario, por eso va aqui
    initSound(); // idem: sin un gesto previo el navegador no deja sonar nada
    setPhoto(null);
    setRawShot(null);
    setUserData(null);
    setScreen(SCREENS.STYLE);
  };

  /**
   * Elegir estilo hace dos cosas distintas segun el momento:
   *  - antes de la foto  -> arranca la cuenta regresiva
   *  - despues de la foto -> reprocesa la MISMA foto, sin volver a tomarla
   */
  const handleStyleSelect = async (chosen) => {
    setStyle(chosen);

    if (!rawShot) {
      setScreen(SCREENS.COUNTDOWN);
      return;
    }

    setScreen(SCREENS.PROCESSING);
    try {
      setPhoto(await applyPhotoEffect(rawShot, chosen));
      setScreen(SCREENS.PREVIEW);
    } catch (err) {
      setErrorMessage(err.message || 'No se pudo aplicar el estilo.');
      playError();
      setScreen(SCREENS.ERROR);
    }
  };

  const handleCountdownFinish = async () => {
    try {
      const shot = await capturePhoto();
      setRawShot(shot); // se guarda cruda para poder cambiar de estilo despues
      // Ilustrar tarda unas decimas: se avisa en pantalla en vez
      // de dejar la interfaz congelada.
      setScreen(SCREENS.PROCESSING);
      const finished = await applyPhotoEffect(shot, style);
      setPhoto(finished);
      setScreen(SCREENS.PREVIEW);
    } catch (err) {
      setErrorMessage(err.message || 'No se pudo tomar la foto.');
      playError();
      setScreen(SCREENS.ERROR);
    }
  };

  const handleAccept = () => setScreen(SCREENS.FORM);

  const handleRetake = () => {
    setPhoto(null);
    setRawShot(null);
    setScreen(SCREENS.COUNTDOWN);
  };

  const handleSubmit = async (data) => {
    setUserData(data);
    setScreen(SCREENS.SENDING);
    try {
      await sendPhoto({ ...data, photo, style });
      stopCamera();
      setWasQueued(false);
      playSuccess();
      setScreen(SCREENS.SUCCESS);
    } catch (err) {
      setErrorMessage(err.message || 'No se pudo enviar la foto.');
      playError();
      setScreen(SCREENS.ERROR);
    }
  };

  /**
   * Salida cuando no hay red: la foto se guarda y se reintenta sola.
   * Es mejor que "vuelve a intentar": la persona no tiene por que
   * quedarse parada esperando a que vuelva el wifi de la feria.
   */
  const handleSaveForLater = () => {
    const saved = enqueue({ ...userData, photo, style });
    if (!saved) {
      setErrorMessage('No hay espacio para guardar la foto en este equipo.');
      return;
    }
    stopCamera();
    setWasQueued(true);
    playSuccess();
    setScreen(SCREENS.SUCCESS);
  };

  /** Reintento inteligente: vuelve al punto donde fallo. */
  const handleRetry = () => {
    setErrorMessage('');
    if (userData && photo) handleSubmit(userData);
    else if (photo) setScreen(SCREENS.PREVIEW);
    else setScreen(SCREENS.COUNTDOWN);
  };

  /* ---------------- render ---------------- */

  return (
    <div className="app">
      <Bunting />
      <IdleWarning secondsLeft={idleSecondsLeft} />
      <div className="app__content">{renderScreen()}</div>
      <SponsorBar />
    </div>
  );

  function renderScreen() {
    switch (screen) {
      case SCREENS.STYLE:
        return (
          <StyleScreen
            sampleSrc={rawShot?.dataUrl}
            currentId={rawShot ? style.id : null}
            onSelect={handleStyleSelect}
            onBack={rawShot ? () => setScreen(SCREENS.PREVIEW) : resetSession}
          />
        );

      case SCREENS.COUNTDOWN:
        return <CountdownScreen onFinish={handleCountdownFinish} onCancel={resetSession} />;

      case SCREENS.PROCESSING:
        return <ProcessingScreen />;

      case SCREENS.PREVIEW:
        return (
          <PreviewScreen
            photo={photo}
            styleName={style.name}
            onRetake={handleRetake}
            onChangeStyle={() => setScreen(SCREENS.STYLE)}
            onAccept={handleAccept}
          />
        );

      case SCREENS.FORM:
        return (
          <UserDataScreen
            photo={photo}
            onSubmit={handleSubmit}
            onBack={() => setScreen(SCREENS.PREVIEW)}
          />
        );

      case SCREENS.SENDING:
        return <SendingScreen />;

      case SCREENS.SUCCESS:
        return <SuccessScreen onDone={resetSession} queued={wasQueued} />;

      case SCREENS.ERROR:
        return (
          <ErrorScreen
            message={errorMessage}
            onRetry={handleRetry}
            onCancel={resetSession}
            /* Solo tiene sentido guardar si ya hay foto y datos que guardar. */
            onSaveForLater={userData && photo ? handleSaveForLater : null}
          />
        );

      case SCREENS.WELCOME:
      default:
        return <Welcome onStart={handleStart} />;
    }
  }
}
