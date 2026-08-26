/**
 * ============================================================
 *  CATALOGO DE ESTILOS DE FOTO
 * ------------------------------------------------------------
 *  Cada estilo tiene DOS implementaciones:
 *
 *   1. `local`  -> filtro de canvas que corre YA, en el totem,
 *                  sin internet y sin IA. Es lo que se ve hoy.
 *
 *   2. `ai`     -> el prompt que el backend le pasara al modelo
 *                  de imagenes cuando este conectado.
 *                  El frontend solo lo ENVIA, no lo ejecuta.
 *
 *  Asi la feria funciona aunque la IA no este lista, y el dia que
 *  este lista no hay que tocar la interfaz: el backend recibe
 *  styleId + prompt y devuelve la imagen generada.
 *
 *  Los prompts estan en ingles a proposito: todos los modelos de
 *  imagen responden mejor en ingles, incluso para temas locales.
 *
 *  Imagenes de referencia del cliente: carpeta /refs (no se publican).
 * ============================================================
 */

/**
 * Instruccion que va DELANTE de todos los prompts.
 *
 * Es la parte que le dice al modelo que NO invente a alguien: tiene que
 * partir de la foto que le mandamos y devolver a ESA persona dibujada.
 * Sin esto, los modelos generan una cara cualquiera con el estilo pedido
 * y la gente no se reconoce, que es lo unico que importa en un totem.
 */
export const IMAGE_INSTRUCTION =
  'Use the provided photograph as the base image. Redraw the same real person ' +
  'from that photo in the style described below. Keep their identity, face shape, ' +
  'hair, skin tone, glasses and clothing recognizable, and keep the same pose and ' +
  'framing. Do not invent a different person and do not add any text.';

/**
 * Negativo comun a todos: lo que NUNCA queremos que aparezca.
 *
 * Tres grupos:
 *  - fallas tecnicas (caras deformes, manos raras)
 *  - textos: el totem NO pide el nombre antes de la foto, asi que el
 *    modelo no tiene que escribir ningun nombre ni leyenda en la imagen
 *  - burla: en una feria familiar la caricatura tiene que ser simpatica
 */
export const NEGATIVE_PROMPT =
  'different person, face swap, photorealistic, extra faces, extra limbs, ' +
  'deformed face, distorted eyes, blurry, low quality, watermark, nsfw, ' +
  'text, letters, words, names, captions, name plate, typography, signature, ' +
  'mean spirited caricature, ugly, grotesque, creepy, scary, insulting exaggeration';

/**
 * `reference`: imagen de ejemplo que se muestra en el selector ANTES de que
 * la persona se tome la foto. Es la referencia visual del estilo (las que
 * paso el cliente, en /refs, reducidas a 720 px en public/styles/).
 *
 * Convencion: public/styles/<id>.jpg
 * Si el archivo no existe, la tarjeta cae automaticamente a la miniatura
 * generada con el filtro local. Por eso se pueden agregar despues sin tocar
 * codigo: basta con dejar el archivo con el nombre del id.
 *
 * Parametros de `local`:
 *   posterize  cuantos tonos por canal (menos = mas dibujo)
 *   edge       umbral del contorno negro (mas alto = menos lineas; 999 = ninguna)
 *   saturation cuanto sube el color
 *   tint       multiplicadores [r, g, b] del tinte final
 *   bulge      deformacion chistosa sobre la cara (ver photoEffect.js)
 *   frame      colores y tipo del marco: 'paper' o 'panini'
 */
const STYLE_DEFS = [
  {
    id: 'rubber-hose',
    name: 'Rubber Hose',
    tagline: 'Caricatura de los anos 30',
    swatch: ['#f6e7c8', '#e0403a', '#181410'],
    reference: '/styles/rubber-hose.jpg',
    local: {
      posterize: 4,
      edge: 50,
      saturation: 1.5,
      tint: [1.06, 0.98, 0.86],
      bulge: null,
      frame: { kind: 'paper', bg: '#e0403a', title: '#f6e7c8', foot: '#f0b13c' },
    },
    ai: {
      // solo la descripcion del estilo; la instruccion de img2img
      // se le pega delante automaticamente (ver abajo)
      style:
        '1930s rubber hose cartoon portrait, cream and vermillion two color print, ' +
        'thick black ink outlines, round pie-cut eyes, big friendly smile, ' +
        'white gloves aesthetic, looping curved limbs, hand inked vintage animation ' +
        'cel, aged paper with light speckles, warm and family friendly',
      strength: 0.62,
    },
  },
  {
    id: 'mundial-2026',
    name: 'Mundial 2026',
    tagline: 'Tu cromo de la seleccion',
    swatch: ['#00b3ae', '#ffd400', '#e2001a'],
    reference: '/styles/mundial-2026.jpg',
    local: {
      // Este NO es un filtro de dibujo: es un cromo. La foto se mantiene
      // nitida y lo que cambia es el marco y el color, como en un Panini.
      posterize: 10,
      edge: 999,
      saturation: 1.3,
      tint: [1.04, 1.02, 0.98],
      bulge: null,
      frame: { kind: 'panini', bg: '#e2001a', title: '#ffffff', foot: '#ffd400' },
    },
    ai: {
      // solo la descripcion del estilo; la instruccion de img2img
      // se le pega delante automaticamente (ver abajo)
      style:
        'modern football collectible sticker portrait, glossy trading card look, ' +
        'the person wearing a bright yellow Ecuador national football jersey with navy ' +
        'blue collar, vivid turquoise and yellow graphic background with bold abstract ' +
        'shapes, flag colors of Ecuador, crisp modern sports studio lighting, ' +
        'high saturation, clean vector shapes, no text anywhere in the image',
      strength: 0.45,
    },
  },
  {
    id: 'cabezon',
    name: 'Cabezon',
    tagline: 'Cabeza gigante, cuerpo chiquito',
    swatch: ['#ffcf6b', '#ff7a3d', '#3d5afe'],
    reference: '/styles/cabezon.jpg',
    local: {
      posterize: 6,
      edge: 62,
      saturation: 1.4,
      tint: [1.03, 1.0, 0.96],
      // Agranda la cabeza justo donde estaba el ovalo guia.
      bulge: { radius: 1.35, strength: 0.55 },
      frame: { kind: 'paper', bg: '#ff7a3d', title: '#fff6e6', foot: '#3d5afe' },
    },
    ai: {
      // solo la descripcion del estilo; la instruccion de img2img
      // se le pega delante automaticamente (ver abajo)
      style:
        'funny caricature portrait, oversized head on a small cartoon body, ' +
        'exaggerated friendly features, big expressive eyes and huge smile, ' +
        'smooth cel shading, bright saturated colors, modern cartoon illustration, ' +
        'theme park caricature artist style, playful and flattering, family friendly',
      strength: 0.6,
    },
  },
  {
    id: 'muneco-3d',
    name: 'Muneco 3D',
    tagline: 'Como de pelicula animada',
    swatch: ['#7fd1ff', '#ffb3c7', '#ffd97d'],
    reference: '/styles/muneco-3d.jpg',
    local: {
      posterize: 9,
      edge: 120,
      saturation: 1.35,
      tint: [1.04, 1.01, 1.02],
      bulge: { radius: 1.15, strength: 0.32 },
      frame: { kind: 'paper', bg: '#5aa9e6', title: '#ffffff', foot: '#ffd97d' },
    },
    ai: {
      // solo la descripcion del estilo; la instruccion de img2img
      // se le pega delante automaticamente (ver abajo)
      style:
        'cute 3d animated movie character portrait, stylized big head proportions, ' +
        'soft rounded shapes, subsurface skin shading, glossy expressive eyes, ' +
        'warm cinematic lighting, modern animation studio render, colorful simple ' +
        'background, wholesome and funny',
      strength: 0.58,
    },
  },
];

/**
 * Prompt final = instruccion de imagen a imagen + descripcion del estilo.
 *
 * Se compone aqui, una sola vez, para que sea IMPOSIBLE mandar un prompt
 * sin la instruccion: si se escribiera a mano en cada estilo, tarde o
 * temprano se olvida en uno y ese estilo devuelve la cara de otra persona.
 */
export const PHOTO_STYLES = STYLE_DEFS.map((style) => ({
  ...style,
  ai: {
    ...style.ai,
    prompt: `${IMAGE_INSTRUCTION} Style: ${style.ai.style}`,
    /** Le dice al backend que esto es imagen a imagen, no texto a imagen. */
    mode: 'image-to-image',
  },
}));

/** El que se usa si nadie elige (por ejemplo si el timeout reinicia todo). */
export const DEFAULT_STYLE = PHOTO_STYLES[0];

export function getStyle(id) {
  return PHOTO_STYLES.find((s) => s.id === id) ?? DEFAULT_STYLE;
}
