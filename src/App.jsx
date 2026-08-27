import { useCallback, useEffect, useRef, useState } from 'react';
import './styles.css';

import Welcome from './screens/Welcome.jsx';
import CountdownScreen from './screens/CountdownScreen.jsx';
import PreviewScreen from './screens/PreviewScreen.jsx';
import UserDataScreen from './screens/UserDataScreen.jsx';
import GroupScreen from './screens/GroupScreen.jsx';
import SocialScreen from './screens/SocialScreen.jsx';
import StyleScreen from './screens/StyleScreen.jsx';
import SendingScreen from './screens/SendingScreen.jsx';
import ProcessingScreen from './screens/ProcessingScreen.jsx';
import SuccessScreen from './screens/SuccessScreen.jsx';
import ErrorScreen from './screens/ErrorScreen.jsx';
import IdleWarning from './components/IdleWarning.jsx';
import Bunting from './components/Bunting.jsx';
import HomeButton from './components/HomeButton.jsx';
import SponsorBar from './components/SponsorBar.jsx';

import { capturePhoto, stopCamera } from './services/camera.js';
import { generatePhoto } from './services/ai.js';
import { DEFAULT_STYLE, getStyle } from './photoStyles.js';
import { DEFAULT_GROUP, getGroup } from './photoGroups.js';
import { initSound, playError, playSuccess } from './services/sound.js';
import { enqueue, flushQueue } from './services/queue.js';
import { sendPhoto } from './services/api.js';
import { useIdleTimeout } from './hooks/useIdleTimeout.js';
import { enterFullscreen, installKioskGuards } from './kiosk.js';
import {
  SESSION_TIMEOUT_MS,
  SESSION_WARNING_SECONDS,
  QUEUE_RETRY_MS,
  PROCESSING_MIN_MS,
} from './config.js';

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
  SOCIAL: 'SOCIAL',
  GROUP: 'GROUP',
  STYLE: 'STYLE',
  COUNTDOWN: 'COUNTDOWN',
  PROCESSING: 'PROCESSING',
  PREVIEW: 'PREVIEW',
  FORM: 'FORM',
  SENDING: 'SENDING',
  SUCCESS: 'SUCCESS',
  ERROR: 'ERROR',
};

/**
 * Deja que la pantalla de espera se vea completa aunque el resultado
 * llegue enseguida. Sin esto, con el filtro local la pantalla aparece y
 * desaparece en 200 ms: un parpadeo que se siente como un error.
 */
async function withMinimumWait(promise) {
  const started = Date.now();
  const result = await promise;
  const remaining = PROCESSING_MIN_MS - (Date.now() - started);
  if (remaining > 0) await new Promise((r) => setTimeout(r, remaining));
  return result;
}

/**
 * Pantallas SIN banderines.
 *
 * En la cuenta regresiva la camara ocupa toda la pantalla y la persona
 * se esta mirando para acomodarse: los banderines le tapan justo la
 * parte de arriba, que es donde esta su cara.
 */
const NO_BUNTING = [SCREENS.COUNTDOWN];

/**
 * Pantallas SIN boton de inicio.
 *
 *   WELCOME  ya es el inicio
 *   SENDING  hay datos viajando: cortar ahi deja la foto a medio enviar
 *   SUCCESS  vuelve sola en 5 segundos
 */
const NO_HOME = [SCREENS.WELCOME, SCREENS.SENDING, SCREENS.SUCCESS];

/** Pantallas donde el usuario puede quedarse quieto y abandonar el totem. */
const IDLE_WATCHED = [
  SCREENS.SOCIAL,
  SCREENS.GROUP,
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
  const [group, setGroup] = useState(DEFAULT_GROUP);
  const [userData, setUserData] = useState(null); // { name, email, phone }
  const [errorMessage, setErrorMessage] = useState('');
  /** true si la foto quedo en la cola en vez de enviarse al momento. */
  const [wasQueued, setWasQueued] = useState(false);

  /**
   * Resultados ya generados de la foto actual, por estilo.
   *
   * Cada generacion con IA cuesta dinero, asi que no se pide dos veces
   * lo mismo. Pasa constantemente: la persona mira Rubber Hose, prueba
   * Pixar, no le gusta y vuelve a Rubber Hose. Sin esto son tres
   * llamadas para dos imagenes.
   *
   * Se vacia con cada foto nueva: los resultados valen solo para la
   * foto con la que se hicieron.
   */
  const generatedByStyle = useRef(new Map());

  useEffect(() => installKioskGuards(), []);

  /**
   * Reintenta en segundo plano lo que quedo pendiente por falta de red.
   * Corre siempre, sin importar en que pantalla este el totem: las
   * personas de la cola ya se fueron y no hay nadie a quien avisar.
   */
  useEffect(() => {
    const retry = () => flushQueue(sendPhoto, getStyle, getGroup).catch(() => {});
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
    generatedByStyle.current.clear();
    setPhoto(null);
    setRawShot(null);
    setUserData(null);
    setStyle(DEFAULT_STYLE);
    setGroup(DEFAULT_GROUP);
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
    setScreen(SCREENS.GROUP);
  };

  const handleGroupSelect = (chosen) => {
    setGroup(chosen);
    setScreen(SCREENS.STYLE);
  };

  /**
   * Elegir estilo hace dos cosas distintas segun el momento:
   *  - antes de la foto  -> arranca la cuenta regresiva
   *  - despues de la foto -> reprocesa la MISMA foto, sin volver a tomarla
   *
   * Nunca se genera "por si acaso": solo el estilo que la persona toco.
   * Las miniaturas del selector son filtro local, no tocan la IA.
   */
  const handleStyleSelect = async (chosen) => {
    setStyle(chosen);

    if (!rawShot) {
      setScreen(SCREENS.COUNTDOWN);
      return;
    }

    // Ya se genero antes con esta misma foto: se reusa y no se gasta
    // otra llamada. Cubre volver al estilo anterior y tocar dos veces
    // el mismo, que es lo que mas pasa.
    const cached = generatedByStyle.current.get(chosen.id);
    if (cached) {
      setPhoto(cached);
      setScreen(SCREENS.PREVIEW);
      return;
    }

    setScreen(SCREENS.PROCESSING);
    try {
      const result = await withMinimumWait(generatePhoto(rawShot, chosen, group));
      generatedByStyle.current.set(chosen.id, result);
      setPhoto(result);
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
      // Foto nueva: lo generado para la anterior ya no sirve.
      generatedByStyle.current.clear();
      // Generar con IA tarda entre 5 y 20 segundos: la pantalla de
      // espera le muestra a la persona su propia foto revelandose.
      setScreen(SCREENS.PROCESSING);
      const finished = await withMinimumWait(generatePhoto(shot, style, group));
      generatedByStyle.current.set(style.id, finished);
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
    generatedByStyle.current.clear();
    setPhoto(null);
    setRawShot(null);
    setScreen(SCREENS.COUNTDOWN);
  };

  const handleSubmit = async (data) => {
    setUserData(data);
    setScreen(SCREENS.SENDING);
    try {
      await sendPhoto({ ...data, photo, style, group });
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
    const saved = enqueue({ ...userData, photo, style, group });
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
      {!NO_BUNTING.includes(screen) && <Bunting />}
      {!NO_HOME.includes(screen) && <HomeButton onClick={resetSession} />}
      <IdleWarning secondsLeft={idleSecondsLeft} />
      <div className="app__content">{renderScreen()}</div>
      <SponsorBar />
    </div>
  );

  function renderScreen() {
    switch (screen) {
      case SCREENS.SOCIAL:
        return <SocialScreen onBack={resetSession} />;

      case SCREENS.GROUP:
        return <GroupScreen onSelect={handleGroupSelect} onBack={resetSession} />;

      case SCREENS.STYLE:
        return (
          <StyleScreen
            group={group}
            sampleSrc={rawShot?.dataUrl}
            currentId={rawShot ? style.id : null}
            onSelect={handleStyleSelect}
            onBack={
              rawShot ? () => setScreen(SCREENS.PREVIEW) : () => setScreen(SCREENS.GROUP)
            }
          />
        );

      case SCREENS.COUNTDOWN:
        return (
          <CountdownScreen
            group={group}
            onFinish={handleCountdownFinish}
            onCancel={resetSession}
          />
        );

      case SCREENS.PROCESSING:
        return <ProcessingScreen rawSrc={rawShot?.dataUrl} styleName={style.name} />;

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
        return (
          <Welcome onStart={handleStart} onSocial={() => setScreen(SCREENS.SOCIAL)} />
        );
    }
  }
}
