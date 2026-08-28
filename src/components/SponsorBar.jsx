import { useState } from 'react';
import { SPONSORS, SPONSOR_SCROLL_SECONDS } from '../sponsors.js';
import { asset } from '../assets.js';

/**
 * Banda de auspiciantes que se desplaza sin parar en el pie del totem.
 *
 * La lista se pinta DOS veces seguidas y la animacion recorre justo la
 * mitad del ancho: asi el bucle es continuo y no se ve el salto.
 */
export default function SponsorBar() {
  return (
    <footer className="sponsor-bar" aria-label="Auspiciantes">
      <div
        className="sponsor-bar__track"
        style={{ animationDuration: `${SPONSOR_SCROLL_SECONDS}s` }}
      >
        {[...SPONSORS, ...SPONSORS].map((s, i) => (
          <SponsorLogo key={`${s.name}-${i}`} sponsor={s} />
        ))}
      </div>
    </footer>
  );
}

/** Si el archivo del logo no existe todavia, se muestra el nombre. */
function SponsorLogo({ sponsor }) {
  const [failed, setFailed] = useState(false);

  if (failed || !sponsor.logo) {
    return <span className="sponsor sponsor--text">{sponsor.name}</span>;
  }

  return (
    <span className="sponsor">
      <img src={asset(sponsor.logo)} alt={sponsor.name} onError={() => setFailed(true)} />
    </span>
  );
}
