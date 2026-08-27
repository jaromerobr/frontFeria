/**
 * ============================================================
 *  SERVICIO DE API  ->  UNICO PUNTO DE CONTACTO CON EL BACKEND
 * ------------------------------------------------------------
 *  La UI solo llama:
 *
 *      await sendPhoto({ name, email, phone, photo })
 *
 *  photo = { dataUrl, blob }  (lo que devuelve capturePhoto())
 *
 *  Cuando el backend defina su contrato, se cambia UNICAMENTE
 *  VITE_UPLOAD_STRATEGY en .env (o esta funcion). Ninguna pantalla cambia.
 * ============================================================
 */

import {
  API_MODE,
  API_BASE_URL,
  API_TIMEOUT_MS,
  UPLOAD_STRATEGY,
  DOWNLOAD_ENDPOINT,
  DOWNLOAD_BASE_URL,
  DOWNLOAD_FILE_FIELD,
} from '../config.js';
import { styleFields } from '../photoStyles.js';

/**
 * @param {object} data
 * @param {string} data.name
 * @param {string} data.email
 * @param {string} data.phone
 * @param {{dataUrl:string, blob:Blob|null}} data.photo foto ya ilustrada
 * @param {object} data.style estilo elegido (ver photoStyles.js)
 * @param {object} data.group grupo elegido (ver photoGroups.js)
 * @param {boolean} data.consent la persona acepto el uso de sus datos
 * @param {string} data.consentText texto exacto que acepto
 * @param {string} data.consentAt fecha ISO en que lo acepto
 * @param {boolean} [data.queued] true si venia de la cola de reintentos
 * @returns {Promise<{success:true, id?:string}>}
 * @throws {Error} con .message legible para mostrar en pantalla
 */
export async function sendPhoto(data) {
  if (API_MODE !== 'real') return sendPhotoFake(data);

  switch (UPLOAD_STRATEGY) {
    case 'base64':
      return sendBase64(data);
    case 'two-step':
      return sendTwoStep(data);
    case 'multipart':
    default:
      return sendMultipart(data);
  }
}

/* ---------------- BACKEND FALSO (modo feria sin backend) ---------------- */

async function sendPhotoFake({ name, email, phone, photo, style, group, consent, queued }) {
  console.log('[api:fake] enviando', {
    name,
    email,
    phone,
    consent,
    queued: Boolean(queued),
    styleId: style?.id,
    groupId: group?.id,
    prompt: style?.ai?.prompt,
    photoBytes: photo?.blob?.size ?? photo?.dataUrl?.length ?? 0,
  });
  await new Promise((r) => setTimeout(r, 2000));

  // Para probar la pantalla de error a mano, descomentar:
  // throw new Error('No se pudo enviar la foto. Intenta de nuevo.');

  return { success: true, id: `fake-${Date.now()}` };
}

/* ---------------- OPCION A: multipart/form-data ---------------- */
/*
    POST {API_BASE_URL}/api/photos
    Content-Type: multipart/form-data
    campos: name, email, phone, photo (archivo jpeg)
*/
async function sendMultipart(data) {
  const { name, email, phone, photo, style, group } = data;
  const form = new FormData();
  form.append('name', name);
  form.append('email', email);
  form.append('phone', phone);
  form.append('photo', await asBlob(photo), 'photo.jpg');
  appendStyle((k, v) => form.append(k, v), style, group);
  appendConsent((k, v) => form.append(k, v), data);

  const res = await request(`${API_BASE_URL}/api/photos`, {
    method: 'POST',
    body: form, // OJO: no fijar Content-Type a mano, el browser pone el boundary
  });
  return parse(res);
}

/* ---------------- OPCION B: JSON con base64 ---------------- */
/*
    POST {API_BASE_URL}/api/photos
    Content-Type: application/json
    { name, email, phone, image: "data:image/jpeg;base64,..." }
*/
async function sendBase64(data) {
  const { name, email, phone, photo, style, group } = data;
  const res = await request(`${API_BASE_URL}/api/photos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      email,
      phone,
      image: photo.dataUrl,
      ...styleFields(style, group),
      ...consentFields(data),
    }),
  });
  return parse(res);
}

/* ---------------- OPCION C: dos pasos ---------------- */
/*
    1) POST {API_BASE_URL}/api/photos/upload   (multipart, campo "photo")
       -> { "photoUrl": "https://..." }
    2) POST {API_BASE_URL}/api/send            (json)
       -> { name, email, phone, photoUrl }
*/
async function sendTwoStep(data) {
  const { name, email, phone, photo, style, group } = data;
  const form = new FormData();
  form.append('photo', await asBlob(photo), 'photo.jpg');
  appendStyle((k, v) => form.append(k, v), style, group);

  const up = await parse(
    await request(`${API_BASE_URL}/api/photos/upload`, { method: 'POST', body: form }),
  );

  const res = await request(`${API_BASE_URL}/api/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      email,
      phone,
      photoUrl: up.photoUrl,
      ...styleFields(style, group),
      ...consentFields(data),
    }),
  });
  return parse(res);
}

/* ---------------- estilo elegido ---------------- */
/*
   El frontend NO ejecuta la IA: solo manda que estilo y que grupo eligio
   la persona, y el prompt que corresponde a esa combinacion. El backend
   decide si lo usa para generar la imagen o si se queda con la foto que
   ya viene ilustrada.

   Los campos los arma styleFields() en photoStyles.js, para que sean
   exactamente los mismos que se mandan al generar (services/ai.js).
*/

function appendStyle(append, style, group) {
  Object.entries(styleFields(style, group)).forEach(([k, v]) => append(k, String(v)));
}

/* ---------------- consentimiento ---------------- */
/*
   Se manda el texto exacto que la persona acepto y cuando, no solo un
   true. Si algun dia alguien pregunta a que dio permiso, la respuesta
   tiene que estar guardada con la foto, no en la memoria de nadie.
*/

function consentFields(data) {
  return {
    consent: data.consent === true,
    consentText: data.consentText ?? '',
    consentAt: data.consentAt ?? '',
    ...(data.queued ? { queued: true } : {}),
  };
}

function appendConsent(append, data) {
  Object.entries(consentFields(data)).forEach(([k, v]) => append(k, String(v)));
}

/* ---------------- helpers ---------------- */

async function request(url, options) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), API_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: ctrl.signal });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('El servidor tardo demasiado en responder.');
    }
    throw new Error('No hay conexion con el servidor.');
  } finally {
    clearTimeout(timer);
  }
}

async function parse(res) {
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Error del servidor (${res.status}). ${detail}`.trim());
  }
  const ct = res.headers.get('content-type') ?? '';
  const body = ct.includes('application/json') ? await res.json() : {};
  return { success: true, ...body };
}

/** El blob puede faltar (modo demo con SVG); en ese caso se reconstruye del dataUrl. */
async function asBlob(photo) {
  if (photo.blob) return photo.blob;
  return await (await fetch(photo.dataUrl)).blob();
}

/* ============================================================
   ENTREGA POR QR
   ------------------------------------------------------------
   Sube la foto y devuelve el enlace donde la persona la descarga
   y deja sus datos desde su propio celular.

   Es lo practico en una feria: nadie tiene que escribir un correo
   con el teclado en pantalla, la fila avanza mucho mas rapido, y
   cada quien teclea sus datos en el teclado al que esta
   acostumbrado, con menos errores.
   ============================================================ */

/**
 * @param {{photo:{dataUrl:string, blob:Blob|null}, style:object, group:object}} data
 * @returns {Promise<{url:string}>} enlace para el codigo QR
 */
export async function publishForDownload({ photo, style, group }) {
  if (API_MODE !== 'real') {
    console.log('[api:fake] publicando para descarga', {
      styleId: style?.id,
      groupId: group?.id,
    });
    await new Promise((r) => setTimeout(r, 900));
    return { url: `${DOWNLOAD_BASE_URL || 'https://nodo.com.ec/foto'}/demo-${Date.now()}` };
  }

  const form = new FormData();
  form.append(DOWNLOAD_FILE_FIELD, await asBlob(photo), 'foto.jpg');
  appendStyle((k, v) => form.append(k, v), style, group);

  const res = await request(`${API_BASE_URL}${DOWNLOAD_ENDPOINT}`, {
    method: 'POST',
    body: form,
  });
  const body = await parse(res);

  const url =
    body.url ??
    body.photoUrl ??
    body.downloadUrl ??
    (body.id && DOWNLOAD_BASE_URL ? `${DOWNLOAD_BASE_URL}/${body.id}` : null);

  if (!url) {
    throw new Error('El servidor no devolvio el enlace de descarga.');
  }
  return { url };
}
