/**
 * ============================================================
 *  COLA DE ENVIOS PENDIENTES
 * ------------------------------------------------------------
 *  Sin esto, si el wifi de la feria se cae en el momento del envio,
 *  la persona ve el error, se va, y esa foto se perdio para siempre.
 *
 *  Con esto el envio se guarda en el navegador y se reintenta solo
 *  cada cierto tiempo hasta que entra. La persona ya se fue, pero
 *  su foto igual le llega al correo.
 *
 *  PRIVACIDAD: aqui quedan guardados datos personales (correo,
 *  celular, foto) en el equipo del totem. Por eso:
 *    - se borra cada envio apenas se logra mandar
 *    - hay un maximo de elementos y una caducidad
 *    - clearQueue() deja todo limpio al terminar el evento
 * ============================================================
 */

import { QUEUE_MAX_ITEMS, QUEUE_MAX_AGE_HOURS } from '../config.js';

const KEY = 'totem.pendingSends';

/** Lee la cola. Nunca lanza: si el almacenamiento esta roto, devuelve vacio. */
export function readQueue() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const items = JSON.parse(raw);
    return Array.isArray(items) ? items.filter(isFresh) : [];
  } catch {
    return [];
  }
}

/**
 * Guarda un envio que fallo.
 * @returns {boolean} true si se pudo guardar
 */
export function enqueue({ name, email, phone, consent, consentText, consentAt, photo, style }) {
  try {
    const items = readQueue();
    items.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: Date.now(),
      name,
      email,
      phone,
      consent,
      consentText,
      consentAt,
      styleId: style?.id ?? null,
      // Se guarda el dataUrl porque un Blob no sobrevive a JSON.
      photoDataUrl: photo.dataUrl,
    });

    // Si se llena, se sacan los mas viejos: mejor perder el de hace
    // dos horas que el de la persona que acaba de irse.
    const trimmed = items.slice(-QUEUE_MAX_ITEMS);
    localStorage.setItem(KEY, JSON.stringify(trimmed));
    return true;
  } catch {
    // Cuota llena o almacenamiento bloqueado: no se puede hacer mas.
    return false;
  }
}

export function removeFromQueue(id) {
  try {
    const items = readQueue().filter((item) => item.id !== id);
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* nada que hacer */
  }
}

/** Deja el totem sin datos personales guardados. */
export function clearQueue() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nada que hacer */
  }
}

export function queueSize() {
  return readQueue().length;
}

/**
 * Reintenta todos los pendientes, uno por uno.
 *
 * @param {(data) => Promise<any>} send la funcion sendPhoto de api.js
 * @param {(style: string|null) => object} resolveStyle para recuperar el estilo por id
 * @returns {Promise<number>} cuantos se lograron enviar
 */
export async function flushQueue(send, resolveStyle) {
  const items = readQueue();
  let sent = 0;

  for (const item of items) {
    try {
      const blob = await (await fetch(item.photoDataUrl)).blob();
      await send({
        name: item.name,
        email: item.email,
        phone: item.phone,
        consent: item.consent,
        consentText: item.consentText,
        consentAt: item.consentAt,
        photo: { dataUrl: item.photoDataUrl, blob },
        style: resolveStyle(item.styleId),
        queued: true, // el backend puede querer saber que venia demorado
      });
      removeFromQueue(item.id);
      sent += 1;
    } catch {
      // Sigue sin red: se corta el intento y se prueba en la proxima ronda.
      break;
    }
  }

  return sent;
}

/** Descarta lo que ya no tiene sentido reintentar. */
function isFresh(item) {
  const ageHours = (Date.now() - (item.createdAt ?? 0)) / 3_600_000;
  return ageHours < QUEUE_MAX_AGE_HOURS;
}
