/**
 * ============================================================
 *  SERVICIO DE CAMARA
 * ------------------------------------------------------------
 *  La UI NUNCA habla con el hardware. Solo llama a:
 *
 *      await startCamera(videoEl)   -> enciende preview (si aplica)
 *      await capturePhoto()         -> devuelve { dataUrl, blob|null }
 *      stopCamera()                 -> apaga y libera el dispositivo
 *
 *  Cambiar de demo a camara real = cambiar VITE_CAMERA_MODE en .env.
 *  Ningun componente se toca.
 * ============================================================
 */

import {
  CAMERA_MODE,
  DEMO_PHOTO_URL,
  CAMERA_SERVICE_URL,
  MIRROR_CAMERA,
} from '../config.js';

let stream = null;
let videoEl = null;

/** true si el modo actual puede mostrar video en vivo detras de la cuenta regresiva. */
export function hasLivePreview() {
  return CAMERA_MODE === 'webcam';
}

/**
 * Enciende la camara. Idempotente: llamarla dos veces no rompe nada.
 * @param {HTMLVideoElement|null} el elemento <video> donde pintar el preview
 */
export async function startCamera(el) {
  if (CAMERA_MODE !== 'webcam') return;

  videoEl = el ?? videoEl;
  if (!stream) {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1920 }, height: { ideal: 1080 }, facingMode: 'user' },
      audio: false,
    });
  }
  if (videoEl && videoEl.srcObject !== stream) {
    videoEl.srcObject = stream;
    await videoEl.play().catch(() => {});
  }
}

/** Apaga la camara y suelta el dispositivo (importante entre sesiones). */
export function stopCamera() {
  if (stream) {
    stream.getTracks().forEach((t) => t.stop());
    stream = null;
  }
  if (videoEl) {
    videoEl.srcObject = null;
    videoEl = null;
  }
}

/**
 * Dispara la foto.
 * @returns {Promise<{dataUrl: string, blob: Blob|null}>}
 *   dataUrl -> sirve para <img src> y para envio base64
 *   blob    -> sirve para multipart. null en modo demo con SVG.
 */
export async function capturePhoto() {
  switch (CAMERA_MODE) {
    case 'webcam':
      return captureFromWebcam();
    case 'service':
      return captureFromService();
    case 'demo':
    default:
      return captureDemo();
  }
}

/* ---------------- implementaciones ---------------- */

async function captureDemo() {
  // Pequeno retardo para que se sienta como un disparo real.
  await new Promise((r) => setTimeout(r, 300));
  const res = await fetch(DEMO_PHOTO_URL);
  const blob = await res.blob();
  const dataUrl = await blobToDataUrl(blob);
  return { dataUrl, blob };
}

async function captureFromWebcam() {
  if (!videoEl) throw new Error('La camara no esta iniciada');

  // El video se muestra con object-fit: cover, o sea RECORTADO.
  // Si guardaramos el cuadro completo, la foto no seria la que la persona
  // vio y el ovalo guia dejaria de encuadrar lo que encuadraba en pantalla.
  // Por eso se captura exactamente la region visible.
  const vw = videoEl.videoWidth || 1280;
  const vh = videoEl.videoHeight || 720;
  const bw = videoEl.clientWidth || vw;
  const bh = videoEl.clientHeight || vh;

  const scale = Math.max(bw / vw, bh / vh); // asi funciona 'cover'
  const sw = Math.min(vw, bw / scale);
  const sh = Math.min(vh, bh / scale);
  const sx = (vw - sw) / 2;
  const sy = (vh - sh) / 2;

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(sw);
  canvas.height = Math.round(sh);
  const ctx = canvas.getContext('2d');

  // El preview esta espejado; la foto tambien, para que salga lo que vio.
  if (MIRROR_CAMERA) {
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(videoEl, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', 0.92));
  const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
  return { dataUrl, blob };
}

/**
 * CAMARA REAL VIA SERVICIO LOCAL (la opcion recomendada para el Jetson).
 * Contrato esperado del servicio Python/OpenCV:
 *
 *   POST {CAMERA_SERVICE_URL}/capture   ->  200, body = image/jpeg (binario)
 *
 * Si el companero prefiere devolver JSON {"image": "data:image/jpeg;base64,..."}
 * solo hay que ajustar este bloque.
 */
async function captureFromService() {
  const res = await fetch(`${CAMERA_SERVICE_URL}/capture`, { method: 'POST' });
  if (!res.ok) throw new Error(`Servicio de camara respondio ${res.status}`);
  const blob = await res.blob();
  const dataUrl = await blobToDataUrl(blob);
  return { dataUrl, blob };
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = reject;
    fr.readAsDataURL(blob);
  });
}
