import { useEffect, useRef, useState } from 'react';

const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'touchstart', 'mousemove'];

/**
 * Timeout de sesion del totem.
 * Si el usuario se va a la mitad del flujo, la sesion se reinicia sola
 * para que la siguiente persona no vea sus datos.
 *
 * @param {boolean} active  activarlo solo en pantallas de interaccion
 * @param {number} timeoutMs  ms sin interaccion antes de reiniciar
 * @param {() => void} onTimeout  que hacer al expirar (resetSession)
 * @param {number} warningSeconds  segundos antes del final para avisar
 * @returns {number|null} segundos restantes cuando estamos en zona de aviso, si no null
 */
export function useIdleTimeout(active, timeoutMs, onTimeout, warningSeconds = 15) {
  const [warnLeft, setWarnLeft] = useState(null);
  const deadlineRef = useRef(0);
  const cbRef = useRef(onTimeout);
  cbRef.current = onTimeout;

  useEffect(() => {
    if (!active) {
      setWarnLeft(null);
      return;
    }

    const reset = () => {
      deadlineRef.current = Date.now() + timeoutMs;
      setWarnLeft(null);
    };
    reset();

    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, reset, { passive: true }));

    const id = setInterval(() => {
      const msLeft = deadlineRef.current - Date.now();
      if (msLeft <= 0) {
        cbRef.current?.();
      } else if (msLeft <= warningSeconds * 1000) {
        setWarnLeft(Math.ceil(msLeft / 1000));
      }
    }, 500);

    return () => {
      clearInterval(id);
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [active, timeoutMs, warningSeconds]);

  return warnLeft;
}
