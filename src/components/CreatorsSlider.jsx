import { useEffect, useState } from 'react';
import { CREATORS, CREATOR_SECONDS } from '../creators.js';
import { asset } from '../assets.js';

/**
 * Las empresas que hicieron el totem, rotando una a una.
 *
 * Ocupa el sitio donde antes estaba el titulo del evento, que es la
 * zona que la gente mira primero. Va una sola a la vez y grande: en
 * una feria se mira la pantalla dos segundos de reojo, y cinco logos
 * pequenos no los lee nadie.
 */
export default function CreatorsSlider() {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (CREATORS.length < 2) return undefined;
    const id = setInterval(
      () => setI((v) => (v + 1) % CREATORS.length),
      CREATOR_SECONDS * 1000,
    );
    return () => clearInterval(id);
  }, []);

  const actual = CREATORS[i];

  return (
    <div className="creators">

      {/* El key fuerza a React a remontar el elemento en cada cambio,
          que es lo que dispara la animacion de entrada. */}
      <div className="creators__slide" key={i}>
        <CreatorMark creator={actual} />
      </div>

      {CREATORS.length > 1 && (
        <div className="creators__dots" aria-hidden="true">
          {CREATORS.map((c, n) => (
            <span key={c.name} className={n === i ? 'is-on' : ''} />
          ))}
        </div>
      )}
    </div>
  );
}

/** Con logo si existe; si no, el nombre grande. */
function CreatorMark({ creator }) {
  const [sinLogo, setSinLogo] = useState(false);

  if (creator.logo && !sinLogo) {
    return (
      <img
        className="creators__logo"
        src={asset(creator.logo)}
        alt={creator.name}
        onError={() => setSinLogo(true)}
      />
    );
  }
  return <span className="creators__name">{creator.name}</span>;
}
