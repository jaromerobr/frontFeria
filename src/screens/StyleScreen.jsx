import { useEffect, useState } from 'react';
import Screen from '../components/Screen.jsx';
import BigButton from '../components/BigButton.jsx';
import { PHOTO_STYLES } from '../photoStyles.js';
import { renderStylePreview } from '../services/photoEffect.js';
import { STYLE_SAMPLE_PHOTO } from '../config.js';

/**
 * Selector de estilo.
 *
 * Va DESPUES de "Comenzar" y ANTES de la cuenta regresiva.
 * Tambien se reutiliza desde la vista previa ("Otro estilo").
 *
 * Cada tarjeta muestra una cosa distinta segun el momento, y esto es
 * deliberado:
 *
 *   ANTES de la foto   -> la imagen de REFERENCIA del estilo (/styles/<id>.jpg).
 *                         Todavia no hay foto de la persona, asi que lo util
 *                         es ensenar a que aspira el estilo.
 *
 *   DESPUES de la foto -> la cara de la propia persona pasada por el filtro.
 *                         Ya no interesa el ejemplo: interesa como quedo ella.
 *
 * Si falta el archivo de referencia, la tarjeta cae sola a la miniatura
 * generada. Por eso se pueden agregar referencias despues sin tocar codigo.
 *
 * @param {string} sampleSrc foto real de la persona, si ya se la tomo
 * @param {(style) => void} onSelect
 * @param {() => void} onBack
 * @param {string|null} currentId estilo ya elegido, si vuelve a entrar
 */
export default function StyleScreen({ sampleSrc, onSelect, onBack, currentId = null }) {
  const hasOwnPhoto = Boolean(sampleSrc);
  const sample = sampleSrc || STYLE_SAMPLE_PHOTO;
  const [previews, setPreviews] = useState({});

  // Las miniaturas se calculan en el momento con el mismo filtro real,
  // no son imagenes guardadas: si cambias un estilo, aqui se ve solo.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      for (const style of PHOTO_STYLES) {
        try {
          const url = await renderStylePreview(sample, style, 300);
          if (cancelled) return;
          setPreviews((prev) => ({ ...prev, [style.id]: url }));
        } catch {
          /* si falla una miniatura, la tarjeta se queda con su color */
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sample]);

  return (
    <Screen className="screen--styles">
      <h2 className="title">Elige tu estilo</h2>
      <p className="lead lead--small">
        {hasOwnPhoto ? 'Asi quedaria tu foto en cada estilo' : 'Toca el que mas te guste'}
      </p>

      <div className="style-grid">
        {PHOTO_STYLES.map((style) => (
          <button
            key={style.id}
            type="button"
            className={`style-card ${currentId === style.id ? 'is-current' : ''}`}
            onClick={() => onSelect(style)}
          >
            <StyleArt
              style={style}
              preview={previews[style.id]}
              preferReference={!hasOwnPhoto}
            />
            <span className="style-card__name">{style.name}</span>
            <span className="style-card__tag">{style.tagline}</span>
          </button>
        ))}
      </div>

      <BigButton variant="secondary" onClick={onBack}>
        Volver
      </BigButton>
    </Screen>
  );
}

/** Referencia -> miniatura generada -> franjas de color. En ese orden. */
function StyleArt({ style, preview, preferReference }) {
  const [refFailed, setRefFailed] = useState(false);
  const showReference = preferReference && style.reference && !refFailed;

  if (showReference) {
    return (
      <span className="style-card__art">
        <img src={style.reference} alt="" onError={() => setRefFailed(true)} />
        <span className="style-card__badge">Ejemplo</span>
      </span>
    );
  }

  return (
    <span className="style-card__art">
      {preview ? (
        <img src={preview} alt="" />
      ) : (
        <span className="style-card__swatch">
          {style.swatch.map((c) => (
            <i key={c} style={{ background: c }} />
          ))}
        </span>
      )}
    </span>
  );
}
