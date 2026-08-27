import Screen from '../components/Screen.jsx';
import { useCountdown } from '../hooks/useCountdown.js';
import { SUCCESS_SCREEN_SECONDS, BRAND } from '../config.js';
import { MAIN_LINK, qrPath } from '../social.js';

export default function SuccessScreen({ onDone, queued = false }) {
  const left = useCountdown(SUCCESS_SCREEN_SECONDS, onDone);

  return (
    <Screen className="screen--success">
      <div className="success__check">✓</div>
      <h2 className="title">{queued ? 'Foto guardada!' : 'Foto enviada!'}</h2>
      <p className="lead">
        {queued
          ? 'Te la enviamos apenas vuelva la conexion.'
          : 'Revisa tu correo electronico.'}
      </p>
      <p className="lead lead--small">Gracias por participar</p>

      {/* El mejor momento para ofrecer el contacto: la persona acaba de
          recibir algo que le gusto y todavia tiene el celular en la mano. */}
      <div className="success__qr">
        <img src={qrPath(MAIN_LINK.id)} alt={MAIN_LINK.url} />
        <span>Conoce mas de {BRAND.footer}</span>
      </div>
      <p className="hint">Volviendo al inicio en {Math.max(left, 0)}s</p>
    </Screen>
  );
}
