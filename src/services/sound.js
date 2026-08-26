/**
 * ============================================================
 *  SONIDO
 * ------------------------------------------------------------
 *  En una feria con musica y gente, sin sonido la persona no sabe
 *  cuando se disparo la foto y sale mirando a otro lado. Es de las
 *  cosas que mas fotos malas evita.
 *
 *  Los sonidos se GENERAN con Web Audio, no son archivos: no hay
 *  nada que descargar, funciona sin internet y no pesa en el build.
 *
 *  Los navegadores no dejan sonar nada hasta que el usuario toca la
 *  pantalla, por eso hay que llamar a initSound() dentro del primer
 *  gesto (el boton Comenzar).
 * ============================================================
 */

import { SOUND_ENABLED } from '../config.js';

let ctx = null;

/** Llamar dentro de un gesto del usuario (click/touch), si no queda mudo. */
export function initSound() {
  if (!SOUND_ENABLED || ctx) return;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  ctx = new AudioCtx();
  if (ctx.state === 'suspended') ctx.resume();
}

/** Un tono corto. Es el ladrillo con el que se arman los demas. */
function tone({ freq, duration = 0.12, type = 'sine', gain = 0.25, delay = 0 }) {
  if (!ctx) return;
  const start = ctx.currentTime + delay;

  const osc = ctx.createOscillator();
  const vol = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;

  // Subida y bajada suaves: un corte seco suena a "clic" defectuoso.
  vol.gain.setValueAtTime(0.0001, start);
  vol.gain.exponentialRampToValueAtTime(gain, start + 0.01);
  vol.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  osc.connect(vol).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

/** Cada segundo de la cuenta regresiva. */
export function playTick() {
  tone({ freq: 660, duration: 0.09, type: 'triangle', gain: 0.2 });
}

/** Los ultimos 3 segundos: mas agudo, para que se note que ya viene. */
export function playTickUrgent() {
  tone({ freq: 880, duration: 0.11, type: 'triangle', gain: 0.28 });
}

/** Obturador: dos golpes secos, como una camara de verdad. */
export function playShutter() {
  tone({ freq: 1800, duration: 0.05, type: 'square', gain: 0.22 });
  tone({ freq: 1200, duration: 0.07, type: 'square', gain: 0.18, delay: 0.07 });
}

/** Foto enviada: tres notas que suben. */
export function playSuccess() {
  tone({ freq: 523, duration: 0.14, gain: 0.22 });
  tone({ freq: 659, duration: 0.14, gain: 0.22, delay: 0.13 });
  tone({ freq: 784, duration: 0.26, gain: 0.24, delay: 0.26 });
}

/** Algo fallo: dos notas que bajan. */
export function playError() {
  tone({ freq: 400, duration: 0.16, type: 'sawtooth', gain: 0.18 });
  tone({ freq: 300, duration: 0.24, type: 'sawtooth', gain: 0.18, delay: 0.15 });
}
