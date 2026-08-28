/**
 * ============================================================
 *  PAGINA DE DESCARGA — llamadas al backend
 * ------------------------------------------------------------
 *  Esta es la parte que corre en el CELULAR de la persona, no en
 *  el totem. Son solo tres llamadas.
 *
 *  ------------------------------------------------------------
 *  LO QUE TIENE QUE LEVANTAR EL BACKEND (3 endpoints)
 *  ------------------------------------------------------------
 *
 *  1) GET  {API}/feria/photos/:id
 *     Lo llama la pagina al abrirse, para mostrar la foto.
 *     -> 200 { "previewUrl": "https://...", "expiresAt": "2026-09-05T..." }
 *     -> 404 si el id no existe o ya caduco
 *
 *  2) POST {API}/feria/photos/:id/claim      (application/json)
 *     Los datos de la persona. Aqui es donde el backend guarda el
 *     lead y dispara el correo con la foto.
 *     { "name": "...", "email": "...", "phone": "...",
 *       "consent": true, "consentText": "...", "consentAt": "ISO" }
 *     -> 200 { "downloadUrl": "https://..." }
 *
 *  3) GET  {downloadUrl}
 *     El archivo. Puede ser el mismo id con un token, o una URL
 *     firmada del storage. La pagina solo la abre.
 *
 *  ------------------------------------------------------------
 *  DETALLES QUE IMPORTAN
 *  ------------------------------------------------------------
 *
 *  - El `id` NO puede ser secuencial. Con /f/1, /f/2 cualquiera
 *    navega las fotos de los demas. Aleatorio de 6 a 8 caracteres.
 *  - El enlace caduca (7 dias es razonable) y la foto se borra.
 *  - CORS: la pagina vive en nodo.com.ec y llama al backend; si
 *    estan en dominios distintos hay que permitirlo.
 *  - El backend responde `previewUrl` y `downloadUrl` como URLs
 *    absolutas, para que el celular las pueda abrir directo.
 * ============================================================
 */

import {
  API_BASE_URL,
  API_MODE,
  DOWNLOAD_API_PATH,
  CONSENT_TEXT,
  PRIVACY_TEXT,
} from '../config.js';

const base = () => `${API_BASE_URL}${DOWNLOAD_API_PATH}`;

/** Lee el id de la foto de la URL: ?f=AB12CD o /feria/f/AB12CD */
export function readPhotoId() {
  const query = new URLSearchParams(window.location.search).get('f');
  if (query) return query.trim();

  const match = window.location.pathname.match(/\/f\/([A-Za-z0-9_-]+)/);
  return match ? match[1] : null;
}

/**
 * Datos de la foto para mostrarla.
 * @returns {Promise<{previewUrl:string, expiresAt?:string}>}
 */
export async function fetchPhoto(id) {
  if (API_MODE !== 'real') {
    await espera(600);
    return { previewUrl: demoImage(), expiresAt: null };
  }

  const res = await fetch(`${base()}/photos/${encodeURIComponent(id)}`);
  if (res.status === 404) {
    throw new Error('Este enlace ya no esta disponible. Las fotos se borran a los pocos dias.');
  }
  if (!res.ok) throw new Error('No pudimos cargar tu foto. Intenta de nuevo.');

  const body = await res.json();
  if (!body.previewUrl) throw new Error('La respuesta del servidor no traia la foto.');
  return body;
}

/**
 * Manda los datos y devuelve el enlace de descarga.
 * @returns {Promise<{downloadUrl:string}>}
 */
export async function claimPhoto(id, datos) {
  const cuerpo = {
    ...datos,
    consent: true,
    // Se guarda el texto COMPLETO que se le mostro, no solo la linea
    // de la casilla: es lo unico que prueba a que dio permiso.
    consentText: `${CONSENT_TEXT} ${PRIVACY_TEXT}`,
    consentAt: new Date().toISOString(),
  };

  if (API_MODE !== 'real') {
    console.log('[descarga:fake] datos enviados', cuerpo);
    await espera(900);
    return { downloadUrl: demoImage() };
  }

  const res = await fetch(`${base()}/photos/${encodeURIComponent(id)}/claim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cuerpo),
  });

  if (!res.ok) {
    const detalle = await res.json().catch(() => ({}));
    throw new Error(detalle.message || 'No pudimos guardar tus datos. Intenta de nuevo.');
  }

  const body = await res.json();
  if (!body.downloadUrl) throw new Error('El servidor no devolvio el enlace de descarga.');
  return body;
}

/* ---------------- helpers ---------------- */

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

/** Imagen de mentira para poder ver la pagina sin backend. */
function demoImage() {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#2f9c8e';
  ctx.fillRect(0, 0, 768, 1024);
  ctx.fillStyle = '#f6e7c8';
  ctx.font = 'bold 54px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('FOTO DE PRUEBA', 384, 500);
  ctx.font = '30px sans-serif';
  ctx.fillText('sin backend conectado', 384, 560);
  return canvas.toDataURL('image/jpeg');
}
