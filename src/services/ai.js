/**
 * ============================================================
 *  GENERACION DE LA IMAGEN
 * ------------------------------------------------------------
 *  Este es el punto donde entra la IA (Gemini). La UI solo llama:
 *
 *      const foto = await generatePhoto(shot, style)
 *
 *  y no sabe ni le importa si la imagen la genero un modelo o el
 *  filtro local. Eso permite dos cosas:
 *
 *    - Hoy, sin backend, el totem funciona igual (filtro de canvas).
 *    - Manana, si la IA se cae en plena feria, el totem NO se queda
 *      tirado: cae solo al filtro local y la fila sigue avanzando.
 *      Una feria con fotos feas es mejor que una feria detenida.
 *
 *  El contrato del endpoint esta en INTEGRACION.md.
 * ============================================================
 */

import { AI_MODE, API_BASE_URL, AI_TIMEOUT_MS } from '../config.js';
import { styleFields } from '../photoStyles.js';
import { applyPhotoEffect } from './photoEffect.js';

/**
 * @param {{dataUrl:string, blob:Blob|null}} shot foto recien tomada
 * @param {object} style estilo elegido (ver photoStyles.js)
 * @param {object} group grupo elegido (ver photoGroups.js)
 * @returns {Promise<{dataUrl:string, blob:Blob, fromAI:boolean}>}
 */
export async function generatePhoto(shot, style, group) {
  if (AI_MODE !== 'real') {
    return { ...(await applyPhotoEffect(shot, style, group.guide)), fromAI: false };
  }

  try {
    const generated = await requestGeneration(shot, style, group);
    return { ...generated, fromAI: true };
  } catch (err) {
    // No se muestra un error: la persona no tiene la culpa de que la IA
    // este caida, y ya esta parada frente al totem con su foto tomada.
    console.warn('[ai] fallo la generacion, se usa el filtro local:', err.message);
    return { ...(await applyPhotoEffect(shot, style, group.guide)), fromAI: false };
  }
}

/**
 * POST {API_BASE_URL}/api/generate   (multipart/form-data)
 *
 *   photo          la foto tomada (archivo jpeg)
 *   styleId        identificador del estilo
 *   groupId        'personal' | 'pareja' | 'familia' | 'ninos'
 *   styleMode      'image-to-image'
 *   stylePrompt    prompt completo: ya incluye la instruccion de usar la
 *                  foto como base y cuanta gente hay en ella
 *   styleNegative  lo que el modelo no debe hacer
 *   styleStrength  cuanto respetar la foto original (0 a 1)
 *
 * Respuesta aceptada, cualquiera de las dos:
 *   - 200 con Content-Type: image/*  y la imagen en el cuerpo
 *   - 200 con JSON { "image": "data:image/jpeg;base64,..." }
 */
async function requestGeneration(shot, style, group) {
  const form = new FormData();
  form.append('photo', await asBlob(shot), 'photo.jpg');
  Object.entries(styleFields(style, group)).forEach(([k, v]) => form.append(k, String(v)));

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), AI_TIMEOUT_MS);

  try {
    const res = await fetch(`${API_BASE_URL}/api/generate`, {
      method: 'POST',
      body: form,
      signal: ctrl.signal,
    });

    if (!res.ok) throw new Error(`El generador respondio ${res.status}`);

    const contentType = res.headers.get('content-type') ?? '';

    if (contentType.includes('application/json')) {
      const body = await res.json();
      if (!body.image) throw new Error('La respuesta no traia imagen');
      const blob = await (await fetch(body.image)).blob();
      return { dataUrl: body.image, blob };
    }

    const blob = await res.blob();
    return { dataUrl: await blobToDataUrl(blob), blob };
  } finally {
    clearTimeout(timer);
  }
}

async function asBlob(shot) {
  if (shot.blob) return shot.blob;
  return await (await fetch(shot.dataUrl)).blob();
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = reject;
    fr.readAsDataURL(blob);
  });
}
