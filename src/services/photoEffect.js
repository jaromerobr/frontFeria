/**
 * ============================================================
 *  EFECTO DE FOTO  (version local, sin IA)
 * ------------------------------------------------------------
 *  Convierte la foto real en una ilustracion segun el ESTILO que
 *  eligio la persona, y le pone el marco con las marcas.
 *
 *  Todo con canvas puro: sin librerias, sin internet, sin IA.
 *  Corre en el Jetson (~200 ms a 1200 px).
 *
 *  Orden del proceso:
 *      1. deformar (chistoso: cabezon)
 *      2. ilustrar  (color plano + contorno de tinta)
 *      3. marco y marcas
 *
 *  Se deforma ANTES de ilustrar: si se hiciera al reves, el
 *  posterizado ya habria hecho manchas planas y la deformacion
 *  las estiraria dejando escalones feos.
 *
 *  Esta es la ruta que funciona HOY. Cuando el backend conecte el
 *  modelo de imagenes, la foto vendra generada de alla y este
 *  archivo queda como respaldo (ver PROMPTS.md).
 *
 *  La UI solo llama:
 *      const foto = await applyPhotoEffect(shot, style)
 * ============================================================
 */

import { PHOTO_EFFECT, PHOTO_FRAME, FACE_GUIDE, BRAND } from '../config.js';
import { DEFAULT_STYLE } from '../photoStyles.js';
import { asset } from '../assets.js';

/** Ancho maximo de procesado. Mas que esto no se nota y cuesta el doble. */
const MAX_WIDTH = 1200;

/**
 * @param {{dataUrl:string, blob:Blob|null}} shot lo que devuelve capturePhoto()
 * @param {object} style un elemento de PHOTO_STYLES
 * @returns {Promise<{dataUrl:string, blob:Blob}>}
 */
export async function applyPhotoEffect(shot, style = DEFAULT_STYLE, guide = FACE_GUIDE) {
  if (PHOTO_EFFECT === 'none') return shot;

  const look = style.local;
  const img = await loadImage(shot.dataUrl);

  const scale = Math.min(1, MAX_WIDTH / img.width);
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, w, h);

  if (look.bulge) warpFace(ctx, w, h, look.bulge, guide);
  illustrate(ctx, w, h, look);

  if (PHOTO_FRAME) await drawFrame(ctx, w, h, look.frame);

  const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
  const blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', 0.92));
  return { dataUrl, blob };
}

/**
 * Miniatura para el selector de estilos: mismo proceso pero en chico
 * y sin marco. Se calcula en vivo, no es una imagen
 * guardada: si cambias un estilo, la tarjeta cambia sola.
 *
 * @param {string} src ruta de la imagen de muestra
 * @param {object} style un elemento de PHOTO_STYLES
 * @param {number} width ancho de la miniatura en px
 */
export async function renderStylePreview(src, style, width = 300, guide = FACE_GUIDE) {
  const img = await loadImage(src);
  const w = width;
  const h = Math.round((img.height / img.width) * width);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, w, h);

  if (style.local.bulge) warpFace(ctx, w, h, style.local.bulge, guide);
  illustrate(ctx, w, h, style.local);

  return canvas.toDataURL('image/jpeg', 0.85);
}

/* ============================================================
   1. DEFORMACION CHISTOSA
   ------------------------------------------------------------
   Lente de aumento sobre la cara: agranda la cabeza (cabezon).
   El centro y el radio salen de la guia del grupo, asi que con una
   familia se ensancha sola y no le agranda la cabeza solo al del medio.
   Con un radio chico y `dy` positivo agarra solo nariz y boca, por
   si algun estilo nuevo lo necesita.

   Para cada pixel de SALIDA se busca de donde traerlo en la
   entrada. Dentro del radio se toma una muestra mas cercana al
   centro que la posicion real, y eso es justo lo que agranda.
   Fuera del radio no se toca nada, asi el borde no se nota.
   ============================================================ */

function warpFace(ctx, w, h, bulge, guide = FACE_GUIDE) {
  const srcImage = ctx.getImageData(0, 0, w, h);
  const src = srcImage.data;
  const out = ctx.createImageData(w, h);
  const dst = out.data;

  const cx = guide.cx * w;
  const cy = (guide.cy + (bulge.dy ?? 0)) * h;
  const radius = bulge.radius * guide.w * w;
  const power = 1 + bulge.strength;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      let sx = x;
      let sy = y;

      if (dist < radius && dist > 0) {
        // d va de 0 (centro) a 1 (borde del circulo).
        const d = dist / radius;
        const pulled = Math.pow(d, power); // siempre <= d  ->  aumenta
        sx = cx + (dx / dist) * pulled * radius;
        sy = cy + (dy / dist) * pulled * radius;
      }

      sampleBilinear(src, w, h, sx, sy, dst, i);
    }
  }

  ctx.putImageData(out, 0, 0);
}

/** Muestra interpolada: sin esto la deformacion se ve dentada. */
function sampleBilinear(src, w, h, x, y, dst, di) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(x0 + 1, w - 1);
  const y1 = Math.min(y0 + 1, h - 1);
  const fx = x - x0;
  const fy = y - y0;

  const i00 = (y0 * w + x0) * 4;
  const i10 = (y0 * w + x1) * 4;
  const i01 = (y1 * w + x0) * 4;
  const i11 = (y1 * w + x1) * 4;

  for (let c = 0; c < 3; c++) {
    const top = src[i00 + c] * (1 - fx) + src[i10 + c] * fx;
    const bottom = src[i01 + c] * (1 - fx) + src[i11 + c] * fx;
    dst[di + c] = top * (1 - fy) + bottom * fy;
  }
  dst[di + 3] = 255;
}

/* ============================================================
   2. ILUSTRAR
   saturacion + posterizado + tinte + contorno de tinta.
   Los numeros salen del estilo elegido (photoStyles.js).
   Con edge muy alto (999) no dibuja contornos: eso deja la foto
   nitida, que es lo que necesita el cromo del mundial.
   ============================================================ */

function illustrate(ctx, w, h, look) {
  const image = ctx.getImageData(0, 0, w, h);
  const src = image.data;

  const drawsEdges = look.edge < 400;
  const edges = drawsEdges ? sobel(toGrayBlurred(src, w, h), w, h) : null;

  const step = 255 / (look.posterize - 1);
  const [tr, tg, tb] = look.tint;

  for (let i = 0; i < src.length; i += 4) {
    let r = src[i];
    let g = src[i + 1];
    let b = src[i + 2];

    // Saturacion: aleja cada canal del gris medio del pixel.
    const mean = (r + g + b) / 3;
    r = mean + (r - mean) * look.saturation;
    g = mean + (g - mean) * look.saturation;
    b = mean + (b - mean) * look.saturation;

    // Posterizado: pocos tonos planos, que es lo que la vuelve dibujo.
    r = Math.round(clamp(r) / step) * step;
    g = Math.round(clamp(g) / step) * step;
    b = Math.round(clamp(b) / step) * step;

    // Tinte del estilo (calido, frio, tierra...).
    r = clamp(r * tr);
    g = clamp(g * tg);
    b = clamp(b * tb);

    // Contorno de tinta donde el borde es fuerte.
    if (drawsEdges) {
      const e = edges[i / 4];
      if (e > look.edge) {
        const k = Math.min(1, (e - look.edge) / 60);
        r *= 1 - k;
        g *= 1 - k;
        b *= 1 - k;
      }
    }

    src[i] = r;
    src[i + 1] = g;
    src[i + 2] = b;
  }

  ctx.putImageData(image, 0, 0);

  // Vineta suave: enfoca la atencion en el centro.
  const grad = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.8);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(40,20,0,0.3)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

/** Gris + desenfoque 3x3, para que el detector de bordes no capte ruido. */
function toGrayBlurred(src, w, h) {
  const g = new Float32Array(w * h);
  for (let i = 0, p = 0; i < src.length; i += 4, p++) {
    g[p] = 0.299 * src[i] + 0.587 * src[i + 1] + 0.114 * src[i + 2];
  }

  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0;
      let n = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const yy = y + dy;
          const xx = x + dx;
          if (yy < 0 || yy >= h || xx < 0 || xx >= w) continue;
          sum += g[yy * w + xx];
          n++;
        }
      }
      out[y * w + x] = sum / n;
    }
  }
  return out;
}

/** Sobel: magnitud del gradiente = "que tan borde" es cada pixel. */
function sobel(gray, w, h) {
  const out = new Float32Array(w * h);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const tl = gray[i - w - 1], t = gray[i - w], tr = gray[i - w + 1];
      const l = gray[i - 1], r = gray[i + 1];
      const bl = gray[i + w - 1], b = gray[i + w], br = gray[i + w + 1];

      const gx = -tl - 2 * l - bl + tr + 2 * r + br;
      const gy = -tl - 2 * t - tr + bl + 2 * b + br;
      out[i] = Math.sqrt(gx * gx + gy * gy);
    }
  }
  return out;
}

/* ============================================================
   3. MARCO Y MARCAS
   Dos tipos:
     'paper'  -> marco de papel con banda de color (estilos dibujados)
     'panini' -> cromo de album, para el estilo Mundial 2026
   ============================================================ */

async function drawFrame(ctx, w, h, frame) {
  // Sin esto, el canvas dibuja el texto con la fuente por defecto
  // porque Bungee todavia no termino de cargar.
  await document.fonts.ready;

  if (frame.kind === 'panini') return drawPaniniFrame(ctx, w, h, frame);
  return drawPaperFrame(ctx, w, h, frame);
}

async function drawPaperFrame(ctx, w, h, frame) {
  const border = Math.round(Math.min(w, h) * 0.035);
  const bannerH = Math.round(h * 0.11);

  ctx.strokeStyle = '#f6e7c8';
  ctx.lineWidth = border;
  ctx.strokeRect(border / 2, border / 2, w - border, h - border);

  ctx.strokeStyle = '#181410';
  ctx.lineWidth = Math.max(2, border * 0.16);
  ctx.strokeRect(border * 1.15, border * 1.15, w - border * 2.3, h - border * 2.3);

  ctx.fillStyle = frame.bg;
  ctx.fillRect(border, h - border - bannerH, w - border * 2, bannerH);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const titleSize = bannerH * 0.42;
  ctx.fillStyle = frame.title;
  ctx.font = `400 ${titleSize}px Bungee, Impact, sans-serif`;
  ctx.fillText(BRAND.title.toUpperCase(), w / 2, h - border - bannerH * 0.62);

  ctx.fillStyle = frame.foot;
  ctx.font = `400 ${titleSize * 0.62}px Bungee, Impact, sans-serif`;
  ctx.fillText(BRAND.footer.toUpperCase(), w / 2, h - border - bannerH * 0.22);

  await drawCornerLogo(ctx, w, h, border * 1.6, border * 1.6, w * 0.12);
}

/**
 * Cromo de album estilo Mundial: borde blanco de sticker, banda
 * lateral turquesa con el ano, escudo con la bandera y placa roja
 * con el nombre abajo. Los colores son los de Ecuador.
 */
async function drawPaniniFrame(ctx, w, h) {
  const TEAL = '#00b3ae';
  const YELLOW = '#ffd400';
  const RED = '#e2001a';
  const BLUE = '#0033a0';

  const pad = Math.round(Math.min(w, h) * 0.03);
  const plateH = Math.round(h * 0.14);

  // Franja lateral con el ano del mundial.
  const bandW = Math.round(w * 0.09);
  ctx.fillStyle = TEAL;
  ctx.fillRect(w - pad - bandW, pad, bandW, h - pad * 2);

  ctx.save();
  ctx.translate(w - pad - bandW / 2, h * 0.42);
  ctx.rotate(Math.PI / 2);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `400 ${bandW * 0.62}px Bungee, Impact, sans-serif`;
  ctx.fillText('2026', 0, 0);
  ctx.restore();

  // Escudo con los colores de la bandera.
  const badgeR = Math.round(Math.min(w, h) * 0.085);
  const bx = pad + badgeR * 1.25;
  const by = pad + badgeR * 1.25;

  ctx.save();
  ctx.beginPath();
  ctx.arc(bx, by, badgeR, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = YELLOW;
  ctx.fillRect(bx - badgeR, by - badgeR, badgeR * 2, badgeR);
  ctx.fillStyle = BLUE;
  ctx.fillRect(bx - badgeR, by, badgeR * 2, badgeR * 0.5);
  ctx.fillStyle = RED;
  ctx.fillRect(bx - badgeR, by + badgeR * 0.5, badgeR * 2, badgeR * 0.5);
  ctx.restore();

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(3, badgeR * 0.16);
  ctx.beginPath();
  ctx.arc(bx, by, badgeR, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = `400 ${badgeR * 0.52}px Bungee, Impact, sans-serif`;
  ctx.fillText('ECUADOR', bx + badgeR * 1.3, by);

  // Placa roja con el nombre del evento.
  const plateX = pad;
  const plateY = h - pad - plateH;
  const plateW = w - pad * 2 - bandW * 1.15;

  ctx.fillStyle = RED;
  roundRect(ctx, plateX, plateY, plateW, plateH, plateH * 0.28);
  ctx.fill();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = `400 ${plateH * 0.38}px Bungee, Impact, sans-serif`;
  ctx.fillText(BRAND.title.toUpperCase(), plateX + plateW / 2, plateY + plateH * 0.38);

  ctx.fillStyle = YELLOW;
  ctx.font = `400 ${plateH * 0.24}px Bungee, Impact, sans-serif`;
  ctx.fillText(BRAND.footer.toUpperCase(), plateX + plateW / 2, plateY + plateH * 0.74);

  // Borde blanco de sticker, por encima de todo.
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = pad * 1.1;
  roundRect(ctx, pad / 2, pad / 2, w - pad, h - pad, pad * 1.6);
  ctx.stroke();
}

/** Logo opcional en la esquina. Si no existe el archivo, no pasa nada. */
async function drawCornerLogo(ctx, w, h, x, y, width) {
  const logo = await loadImage(asset('/logo.webp')).catch(() => null);
  if (!logo) return;
  const lh = width * (logo.height / logo.width);
  ctx.drawImage(logo, w - x - width, y, width, lh);
}

/* ---------------- helpers ---------------- */

/** ctx.roundRect no existe en Chromium viejo (posible en el Jetson). */
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x, y, w, h, r);
    return;
  }
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function clamp(v) {
  return v < 0 ? 0 : v > 255 ? 255 : v;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
    img.src = src;
  });
}
