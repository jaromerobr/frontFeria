import { SOCIAL_LINKS, qrPath } from '../social.js';
import { BRAND } from '../config.js';

/**
 * Tira de codigos QR en la pantalla de bienvenida.
 *
 * En una feria la gente pasa caminando y no toca nada: si las redes
 * estan escondidas detras de un boton, no existen. Aqui se ven de una,
 * y quien quiera puede escanear sin siquiera usar el totem.
 *
 * Al tocarla se abre la pantalla completa, con los codigos mas grandes
 * para quien prefiera acercarse con calma.
 */
export default function SocialStrip({ onOpen }) {
  return (
    <button className="social-strip" type="button" onClick={onOpen}>
      <span className="social-strip__title">Conoce {BRAND.footer}</span>

      <span className="social-strip__items">
        {SOCIAL_LINKS.map((link) => (
          <span className="social-mini" key={link.id}>
            <img className="social-mini__qr" src={qrPath(link.id)} alt={link.url} />
            <span className="social-mini__name" style={{ color: link.color }}>
              {link.name}
            </span>
          </span>
        ))}
      </span>

      <span className="social-strip__hint">Escanea con tu celular</span>
    </button>
  );
}
