import Screen from '../components/Screen.jsx';
import BigButton from '../components/BigButton.jsx';
import { SOCIAL_LINKS, qrPath } from '../social.js';
import { BRAND } from '../config.js';

/**
 * Conoce NODO: la web y las redes, en codigos QR.
 *
 * No hay botones que abran Facebook. En un totem eso deja a la persona
 * atrapada dentro del navegador del kiosco, y al siguiente le toca
 * encontrarse esa pagina abierta. Con el QR se lo lleva en su celular,
 * el totem no se mueve, y el contacto queda despues de la feria.
 */
export default function SocialScreen({ onBack }) {
  return (
    <Screen className="screen--social">
      <h2 className="title">Conoce {BRAND.footer}</h2>
      <p className="lead lead--small">
        Apunta con la camara de tu celular a cualquier codigo
      </p>

      <div className="social-grid">
        {SOCIAL_LINKS.map((link) => (
          <div className="social-card" key={link.id}>
            <span className="social-card__top" style={{ background: link.color }}>
              {link.name}
            </span>
            <img className="social-card__qr" src={qrPath(link.id)} alt={link.url} />
            <span className="social-card__handle">{link.handle}</span>
          </div>
        ))}
      </div>

      <BigButton onClick={onBack}>Volver</BigButton>
    </Screen>
  );
}
