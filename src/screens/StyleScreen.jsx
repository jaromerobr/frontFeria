import { useEffect, useState } from 'react';
import Screen from '../components/Screen.jsx';
import BigButton from '../components/BigButton.jsx';
import { stylesForGroup } from '../photoStyles.js';
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
export default function StyleScreen({ group, sampleSrc, onSelect, onBack, currentId = null }) {
  const hasOwnPhoto = Boolean(sampleSrc);
  const sample = sampleSrc || STYLE_SAMPLE_PHOTO;
  const styles = stylesForGroup(group.id);
  const [previews, setPreviews] = useState({});

  // Las miniaturas se calculan en el momento con el mismo filtro real,
  // no son imagenes guardadas: si cambias un estilo, aqui se ve solo.
  //
  // Solo se calculan cuando hacen falta, o sea cuando la persona ya se
  // tomo la foto. Antes de eso las tarjetas muestran la imagen de
  // ejemplo, y calcular 16 miniaturas para no ensenarlas era gastar
  // medio segundo de CPU del Jetson en nada.
  useEffect(() => {
    if (!hasOwnPhoto) return undefined;
    let cancelled = false;

    (async () => {
      for (const style of styles) {
        try {
          const url = await renderStylePreview(sample, style, 300, group.guide);
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
    // Se recalcula si cambia la foto de muestra o el grupo (que cambia
    // tanto la lista de estilos como la guia de encuadre).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sample, group.id, hasOwnPhoto]);

  return (
    <Screen className="screen--styles">
      <h2 className="title">Elige tu estilo</h2>
      <p className="lead lead--small">
        {hasOwnPhoto
          ? 'Asi quedaria tu foto en cada estilo'
          : `Estilos para ${group.name.toLowerCase()}`}
      </p>
      {/* Las imagenes son ejemplos hechos con IA: nadie va a salir igual
          que en la tarjeta, y conviene decirlo antes de que lo pregunten. */}
      {!hasOwnPhoto && (
        <p className="hint">Son ejemplos: tu foto sera unica</p>
      )}

      <div className="style-grid">
        {styles.map((style) => (
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
      <span className="style-card__art style-card__art--reference">
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
