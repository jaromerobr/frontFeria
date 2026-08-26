import { useEffect, useRef, useState } from 'react';
import CameraPreview from '../components/CameraPreview.jsx';
import FaceGuide from '../components/FaceGuide.jsx';
import { useCountdown } from '../hooks/useCountdown.js';
import { COUNTDOWN_SECONDS, BRAND } from '../config.js';
import { startCamera, hasLivePreview } from '../services/camera.js';
import { playShutter, playTick, playTickUrgent } from '../services/sound.js';

/**
 * Pantalla de cuenta regresiva.
 *
 * La camara ocupa TODA la pantalla para que la persona se vea y se centre.
 * El contador va en una banda lateral (o inferior en pantalla vertical),
 * nunca encima de la cara.
 *
 * El conteo NO arranca hasta que la camara esta dando imagen: si no,
 * la persona pierde los primeros 2 segundos mirando un cuadro negro.
 */
export default function CountdownScreen({ onFinish, onCancel }) {
  const videoRef = useRef(null);
  const live = hasLivePreview();
  const [ready, setReady] = useState(!live);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!live) return;
    let cancelled = false;

    startCamera(videoRef.current)
      .then(() => !cancelled && setReady(true))
      .catch((err) => {
        if (cancelled) return;
        setError(
          err.name === 'NotAllowedError'
            ? 'Permiso de camara denegado.'
            : 'No se encontro la camara.',
        );
      });

    return () => {
      cancelled = true;
    };
  }, [live]);

  return (
    <main className="stage">
      {/* La camara vive en su propio recuadro: la banda del contador NO
          la tapa, y asi el ovalo guia coincide con lo que se captura. */}
      <div className="stage__viewport">
        <CameraPreview ref={videoRef} live={live} />
        <div className="stage__vignette" />
        {ready && !error && <FaceGuide />}
      </div>

      <aside className="ticker-panel">
        <p className="ticker-panel__brand">{BRAND.title}</p>

        {error ? (
          <p className="ticker-panel__error">{error}</p>
        ) : ready ? (
          <Ticker seconds={COUNTDOWN_SECONDS} onFinish={onFinish} />
        ) : (
          <p className="ticker-panel__hint">Encendiendo la camara...</p>
        )}

        <p className="ticker-panel__foot">{BRAND.footer}</p>
      </aside>

      <button className="ghost-button" type="button" onClick={onCancel}>
        Cancelar
      </button>
    </main>
  );
}

/**
 * Se monta solo cuando hay imagen. Al montarse empieza a contar,
 * asi el hook no necesita saber nada de la camara.
 */
function Ticker({ seconds, onFinish }) {
  const left = useCountdown(seconds, onFinish);
  const shooting = left <= 0;

  // Un pitido por segundo, mas agudo en los ultimos tres, y el
  // obturador al disparar. Sin esto, con el ruido de la feria la
  // gente no sabe cuando fue la foto.
  useEffect(() => {
    if (shooting) playShutter();
    else if (left <= 3) playTickUrgent();
    else playTick();
  }, [left, shooting]);

  return (
    <>
      <p className="ticker__label">
        {shooting ? 'Ya!' : left <= 3 ? 'Sonrie' : 'Centrate en el ovalo'}
      </p>
      <div key={left} className={`ticker__number ${shooting ? 'is-shooting' : ''}`}>
        {shooting ? '📸' : left}
      </div>
      <div className="ticker__bar">
        <span style={{ transform: `scaleX(${Math.max(left, 0) / seconds})` }} />
      </div>
    </>
  );
}
