import { useEffect, useRef, useState } from 'react';

/**
 * Cuenta regresiva en segundos.
 * @param {number} seconds  valor inicial
 * @param {() => void} onFinish  se llama UNA sola vez al llegar a 0
 * @returns {number} segundos restantes
 */
export function useCountdown(seconds, onFinish) {
  const [left, setLeft] = useState(seconds);
  const finishRef = useRef(onFinish);
  finishRef.current = onFinish;

  useEffect(() => {
    setLeft(seconds);
    let value = seconds;
    const id = setInterval(() => {
      value -= 1;
      setLeft(value);
      if (value <= 0) {
        clearInterval(id);
        finishRef.current?.();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [seconds]);

  return left;
}
