/**
 * ============================================================
 *  GENERACION DE LA IMAGEN
 * ------------------------------------------------------------
 *  Aqui entra la IA. La UI solo llama:
 *
 *      const foto = await generatePhoto(shot, style, group)
 *
 *  y no sabe ni le importa si la imagen la genero un modelo o el
 *  filtro local. Eso permite dos cosas:
 *
 *    - Hoy, sin backend, el totem funciona igual (filtro de canvas).
 *    - Manana, si la IA se cae en plena feria, el totem NO se queda
 *      tirado: cae solo al filtro local y la fila sigue avanzando.
 *      Una feria con fotos feas es mejor que una feria detenida.
 *
 *  ------------------------------------------------------------
 *  CONTRATO REAL DEL BACKEND (el que paso el equipo):
 *
 *      POST {API_BASE_URL}/image-generation/upload
 *      Content-Type: multipart/form-data
 *
 *        prompt          (obligatorio) descripcion para el modelo
 *        image           (archivo)     la foto tomada en el totem
 *        provider        'gemini' | 'qwen'
 *        model           ej. 'qwen-image-3.0'
 *        negativePrompt  lo que no debe aparecer
 *        aspectRatio     '1:1' | '16:9' | '9:16' | '3:4' | '4:3'
 *        size            ej. '1024*1024'
 *
 *  Los nombres de los campos son los del DTO del backend, no los
 *  nuestros: es su endpoint, manda su contrato.
 *
 *  OJO: NestJS suele validar con `forbidNonWhitelisted`, que rechaza
 *  con 400 cualquier campo que no este en el DTO. Por eso NO se
 *  mandan `styleId` ni `groupId` salvo que se activen a proposito
 *  con VITE_AI_SEND_METADATA=true (ver config.js).
 * ============================================================
 */

import {
  AI_MODE,
  AI_ENDPOINT,
  AI_MODEL,
  AI_PROVIDER,
  AI_SEND_METADATA,
  AI_SIZE,
  AI_TIMEOUT_MS,
  API_BASE_URL,
} from '../config.js';
import { getPrompt, NEGATIVE_PROMPT } from '../photoStyles.js';
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

async function requestGeneration(shot, style, group) {
  const blob = await asBlob(shot);

  const form = new FormData();
  form.append('prompt', getPrompt(style, group));
  form.append('image', blob, 'foto.jpg');
  form.append('negativePrompt', NEGATIVE_PROMPT);
  if (AI_PROVIDER) form.append('provider', AI_PROVIDER);
  if (AI_MODEL) form.append('model', AI_MODEL);
  if (AI_SIZE) form.append('size', AI_SIZE);

  // La proporcion sale de la foto de verdad, no de un valor fijo: el
  // totem es vertical y recorta la camara a lo que se ve en pantalla,
  // asi que pedir 1:1 devolveria a la gente estirada o cortada.
  const ratio = await aspectRatioOf(shot);
  if (ratio) form.append('aspectRatio', ratio);

  // Solo si el backend acepta campos extra (ver cabecera del archivo).
  if (AI_SEND_METADATA) {
    form.append('styleId', style.id);
    form.append('groupId', group.id);
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), AI_TIMEOUT_MS);

  try {
    const res = await fetch(`${API_BASE_URL}${AI_ENDPOINT}`, {
      method: 'POST',
      body: form,
      signal: ctrl.signal,
    });

    if (!res.ok) {
      const detalle = await res.text().catch(() => '');
      throw new Error(`El generador respondio ${res.status}. ${detalle.slice(0, 200)}`);
    }

    return await readImage(res);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Lee la imagen venga como venga.
 *
 * Todavia no esta confirmado que devuelve el backend, asi que se
 * aceptan las formas habituales en vez de apostar por una: binario,
 * dataURL, base64 pelado o una URL. Cuando se confirme se puede
 * recortar, pero mientras tanto esto evita una sorpresa el dia de la
 * integracion.
 */
async function readImage(res) {
  const tipo = res.headers.get('content-type') ?? '';

  if (tipo.startsWith('image/')) {
    const blob = await res.blob();
    return { dataUrl: await blobToDataUrl(blob), blob };
  }

  const body = await res.json();
  const valor =
    body.image ??
    body.imageUrl ??
    body.url ??
    body.b64_json ??
    body.data?.url ??
    body.data?.image ??
    (Array.isArray(body.data) ? body.data[0]?.url ?? body.data[0]?.b64_json : null);

  if (!valor) {
    throw new Error(`La respuesta no traia imagen: ${JSON.stringify(body).slice(0, 200)}`);
  }

  // base64 pelado, sin el prefijo data:
  const src = /^[A-Za-z0-9+/=]+$/.test(valor.slice(0, 60))
    ? `data:image/jpeg;base64,${valor}`
    : valor;

  const blob = await (await fetch(src)).blob();
  return { dataUrl: src.startsWith('data:') ? src : await blobToDataUrl(blob), blob };
}

/** La proporcion permitida mas parecida a la de la foto tomada. */
async function aspectRatioOf(shot) {
  const permitidas = [
    ['1:1', 1],
    ['16:9', 16 / 9],
    ['9:16', 9 / 16],
    ['4:3', 4 / 3],
    ['3:4', 3 / 4],
  ];

  try {
    const img = await loadImage(shot.dataUrl);
    const real = img.width / img.height;
    return permitidas.reduce((mejor, actual) =>
      Math.abs(actual[1] - real) < Math.abs(mejor[1] - real) ? actual : mejor,
    )[0];
  } catch {
    return null; // si falla, que decida el backend
  }
}

/* ---------------- helpers ---------------- */

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

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
