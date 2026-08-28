import { BRAND } from '../config.js';
import { asset } from '../assets.js';

/**
 * Boton de inicio con el logo de NODO.
 *
 * En un totem la gente se pierde: entra a un estilo que no queria, se
 * arrepiente, o simplemente no sabe como salir. Sin una salida visible
 * empiezan a tocar todo hasta que alguien del estand va a rescatarlos.
 *
 * Va arriba a la izquierda, lejos de los botones de accion, para que no
 * se toque por error justo cuando iban a aceptar la foto.
 *
 * Reinicia la sesion: borra la foto y los datos de quien estaba antes.
 * Eso no es un efecto secundario, es parte del punto.
 */
export default function HomeButton({ onClick }) {
  return (
    <button className="home-button" type="button" onClick={onClick} aria-label="Volver al inicio">
      <img className="home-button__logo" src={asset('/logo.webp')} alt={BRAND.footer} />
    </button>
  );
}
