import { useEffect, useState } from 'react';
import Screen from '../components/Screen.jsx';
import { PROCESSING_SLOW_SECONDS } from '../config.js';

/**
 * Pantalla de espera mientras se crea la imagen.
 *
 * No es un "cargando..." cualquiera: generar con IA tarda entre unos
 * segundos y medio minuto, y la persona esta parada mirando la pantalla.
 * Tres cosas la hacen soportable:
 *
 *   1. VE SU PROPIA FOTO revelandose. Es lo mas importante: confirma que
 *      la foto salio bien y le da algo suyo que mirar, no un giro vacio.
 *   2. Mensajes que van cambiando, para que se note que algo avanza.
 *   3. Una barra que se acerca al final sin llegar nunca sola. Nadie sabe
 *      cuanto tarda el modelo, asi que prometer un porcentaje exacto seria
 *      mentira; esto avanza rapido al principio y se frena, que es como se
 *      siente de verdad.
 *
 * Si se pasa de PROCESSING_SLOW_SECONDS, avisa. Una espera larga
 * molesta mucho menos cuando alguien te dice que sabe que es larga.
 */

const MESSAGES = [
  'Mezclando la tinta...',
  'Afilando los lapices...',
  'Dibujando el contorno...',
  'Poniendo el color...',
  'Los ultimos detalles...',
];

export default function ProcessingScreen({ rawSrc, styleName }) {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(4);
  const [slow, setSlow] = useState(false);

  // Mensajes rotativos.
  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % MESSAGES.length), 2600);
    return () => clearInterval(id);
  }, []);

  // Barra que se acerca al 94 % y se va frenando. Nunca llega sola:
  // el 100 % lo pone la foto al aparecer, no el reloj.
  useEffect(() => {
    const id = setInterval(() => setProgress((p) => p + (94 - p) * 0.05), 220);
    return () => clearInterval(id);
  }, []);

  // Aviso de que esto se esta tardando mas de lo normal.
  useEffect(() => {
    const id = setTimeout(() => setSlow(true), PROCESSING_SLOW_SECONDS * 1000);
    return () => clearTimeout(id);
  }, []);

  return (
    <Screen className="screen--processing">
      <h2 className="title">Creando tu {styleName ?? 'foto'}</h2>

      {rawSrc && (
        <div className="developing">
          {/* Dos copias de la misma foto: la de abajo a color y la de
              arriba en gris. La mascara animada va corriendo de arriba
              a abajo y "revela" el color, como una foto en el cuarto
              oscuro. Si el navegador no soporta mascaras, se queda la
              gris y no pasa nada. */}
          <img className="developing__color" src={rawSrc} alt="" />
          <img className="developing__gray" src={rawSrc} alt="" />
          <span className="developing__scan" />
        </div>
      )}

      <p className="processing__message" key={step}>
        {MESSAGES[step]}
      </p>

      <div className="ticker__bar processing__bar">
        <span style={{ transform: `scaleX(${progress / 100})` }} />
      </div>

      {slow && (
        <p className="hint">Esta tardando un poco mas. No te vayas, ya casi.</p>
      )}
    </Screen>
  );
}
