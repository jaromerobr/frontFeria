import Screen from '../components/Screen.jsx';
import BigButton from '../components/BigButton.jsx';
import { PHOTO_GROUPS } from '../photoGroups.js';

/**
 * Primera pregunta: con quien te vas a tomar la foto.
 *
 * Va antes del estilo porque de esto depende que estilos ofrecer,
 * como encuadrar y cuanto dura la cuenta regresiva.
 */
export default function GroupScreen({ onSelect, onBack }) {
  return (
    <Screen className="screen--groups">
      <h2 className="title">Quien sale en la foto</h2>
      <p className="lead lead--small">Elige y te mostramos los estilos</p>

      <div className="group-grid">
        {PHOTO_GROUPS.map((group) => (
          <button
            key={group.id}
            type="button"
            className="group-card"
            onClick={() => onSelect(group)}
          >
            <span className="group-card__icon" aria-hidden="true">
              {group.icon}
            </span>
            <span className="group-card__name">{group.name}</span>
            <span className="group-card__tag">{group.tagline}</span>
          </button>
        ))}
      </div>

      {/* Boton grande y no un enlace: es la unica salida de esta
          pantalla y con el dedo hay que acertarle de una. */}
      <BigButton variant="secondary" onClick={onBack}>
        Volver
      </BigButton>
    </Screen>
  );
}
