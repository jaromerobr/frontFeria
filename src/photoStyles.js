/**
 * ============================================================
 *  CATALOGO DE ESTILOS DE FOTO
 * ------------------------------------------------------------
 *  Cada estilo tiene DOS implementaciones:
 *
 *   1. `local`  -> filtro de canvas que corre YA, en el totem,
 *                  sin internet y sin IA. Es el respaldo.
 *
 *   2. `ai`     -> la descripcion que el backend le pasara a Gemini.
 *                  El frontend solo la ENVIA, no ejecuta nada.
 *
 *  Y una lista de `groups`: con cuanta gente tiene sentido. Un cromo
 *  de futbol no funciona con cinco personas y una postal de San
 *  Valentin no funciona con una sola.
 *
 *  Los prompts estan en ingles a proposito: todos los modelos de
 *  imagen responden mejor en ingles, incluso para temas locales.
 *
 *  SOBRE MARCAS: cuatro estilos nombran franquicias (Dragon Ball, los
 *  Simpson, Disney, Pixar). Es una decision del cliente, tomada porque
 *  sin nombrarlas el modelo no acierta el estilo. Queda anotado aqui
 *  porque es un evento publico con auspiciantes: si algun dia hay que
 *  quitarlas, son esas cuatro y se cambian en su `ai.style`.
 * ============================================================
 */

/**
 * Instruccion que va DELANTE de todos los prompts.
 *
 * Dice tres cosas, y las tres importan:
 *
 *   1. Que la imagen adjunta es una FOTO TOMADA EN VIVO por la camara
 *      del totem, ahora mismo. Sin esa frase los modelos la tratan como
 *      una referencia de estilo mas y devuelven a otra persona.
 *   2. Que esa foto es la UNICA referencia de quien aparece.
 *   3. Cuanta gente hay, y que no agregue ni quite a nadie.
 *
 * Sin esto los modelos generan caras cualquiera con el estilo pedido y
 * la gente no se reconoce, que es lo unico que importa en un totem.
 *
 * Depende del grupo: en fotos de a varios hay que prohibir expresamente
 * agregar o quitar gente, que es la falla favorita de los modelos ahi.
 */
export function buildInstruction(group) {
  return (
    'The attached image is a live photograph that was just taken by this photo ' +
    'booth kiosk camera. Use that photograph as the base image and as the only ' +
    `reference for who appears. It shows ${group.subject}. Redraw the same real ` +
    `${group.people} from that photograph in the style described below, keeping ` +
    'their identity, face shape, hair, skin tone, glasses and clothing clearly ' +
    'recognizable, and keeping the same pose, the same number of people and the ' +
    'same framing. Do not add or remove people, do not replace anyone with a ' +
    'different face, and do not add any text.'
  );
}

/**
 * Negativo comun a todos: lo que NUNCA queremos que aparezca.
 *
 * Cuatro grupos, los cuatro necesarios:
 *  - suplantacion: que devuelva a otra persona
 *  - conteo: que agregue o borre gente (pasa mucho en fotos de grupo)
 *  - textos: el totem no pide el nombre antes de la foto, y las letras
 *    generadas salen deformes
 *  - burla: es una feria familiar, la caricatura tiene que ser simpatica
 */
export const NEGATIVE_PROMPT =
  'different person, face swap, photorealistic, extra people, missing people, ' +
  'extra faces, extra limbs, deformed face, distorted eyes, blurry, low quality, ' +
  'watermark, nsfw, text, letters, words, names, captions, name plate, typography, ' +
  'signature, mean spirited caricature, ugly, grotesque, creepy, scary, ' +
  'insulting exaggeration';

/**
 * Tratamientos locales reutilizables (el respaldo sin IA).
 *
 *   posterize  cuantos tonos por canal (menos = mas dibujo)
 *   edge       umbral del contorno negro (mas alto = menos lineas; 999 = ninguna)
 *   saturation cuanto sube el color
 *   tint       multiplicadores [r, g, b] del tinte final
 *   bulge      deformacion chistosa sobre la cara, o null
 *   frame      colores y tipo del marco: 'paper' o 'panini'
 *
 * Se comparten entre estilos a proposito: sin IA, "Paris" y "San Valentin"
 * no pueden verse distintos de verdad (el filtro no sabe dibujar la torre
 * Eiffel). Lo que los diferencia es el prompt.
 */
const LOOKS = {
  tinta: (frame) => ({
    posterize: 4,
    edge: 50,
    saturation: 1.5,
    tint: [1.06, 0.98, 0.86],
    bulge: null,
    frame: { kind: 'paper', ...frame },
  }),
  vivo: (frame) => ({
    posterize: 6,
    edge: 62,
    saturation: 1.55,
    tint: [1.04, 1.0, 0.97],
    bulge: null,
    frame: { kind: 'paper', ...frame },
  }),
  suave: (frame) => ({
    posterize: 9,
    edge: 120,
    saturation: 1.3,
    tint: [1.04, 1.01, 1.02],
    bulge: null,
    frame: { kind: 'paper', ...frame },
  }),
  foto: (frame) => ({
    posterize: 10,
    edge: 999,
    saturation: 1.3,
    tint: [1.04, 1.02, 0.98],
    bulge: null,
    frame: { kind: 'paper', ...frame },
  }),
};

export const PHOTO_STYLES = [
  /* ============================ SOLO ============================ */
  {
    id: 'mundial-2026',
    name: 'Mundial 2026',
    tagline: 'Tu cromo de la seleccion',
    groups: ['personal'],
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
      style:
        'modern football collectible sticker portrait, glossy trading card look, ' +
        'wearing a bright yellow Ecuador national football jersey with navy blue ' +
        'collar, vivid turquoise and yellow graphic background with bold abstract ' +
        'shapes, flag colors of Ecuador, crisp modern sports studio lighting, ' +
        'high saturation, clean vector shapes, no text anywhere in the image',
      strength: 0.45,
    },
  },
  {
    id: 'anime-90',
    name: 'Dragon Ball',
    tagline: 'Aura de energia',
    reference: '/styles/anime-90.jpg',
    groups: ['personal'],
    swatch: ['#ff8a00', '#2b6cff', '#ffe66b'],
    local: LOOKS.vivo({ bg: '#ff8a00', title: '#fff8e6', foot: '#2b6cff' }),
    ai: {
      style:
        'Dragon Ball Z anime art style by Akira Toriyama, 1990s cel animation, ' +
        'spiky windblown hair, glowing golden energy aura surrounding the body, ' +
        'dramatic speed lines, cracked rocky battlefield, stormy sky with lightning, ' +
        'bold cel shading with hard shadows, intense determined expression, ' +
        'vibrant saturated colors',
      strength: 0.62,
    },
  },
  {
    id: 'astronauta',
    name: 'Astronauta',
    tagline: 'Al espacio desde Loja',
    reference: '/styles/astronauta.jpg',
    groups: ['personal'],
    swatch: ['#0b1b3a', '#c9d6e8', '#ff5a3c'],
    local: LOOKS.suave({ bg: '#0b1b3a', title: '#ffffff', foot: '#ff5a3c' }),
    ai: {
      style:
        'astronaut portrait, wearing a white space suit with the visor open, ' +
        'orbital station interior behind, Earth visible through a round window, ' +
        'cinematic space photography lighting, crisp detail, deep blue and white ' +
        'palette with warm orange accents',
      strength: 0.5,
    },
  },
  {
    id: 'cabezon',
    name: 'Cabezon',
    tagline: 'Cabeza gigante, cuerpo chiquito',
    groups: ['personal', 'ninos'],
    swatch: ['#ffcf6b', '#ff7a3d', '#3d5afe'],
    reference: '/styles/cabezon.jpg',
    local: {
      posterize: 6,
      edge: 62,
      saturation: 1.4,
      tint: [1.03, 1.0, 0.96],
      // Agranda la cabeza justo donde esta la guia de encuadre.
      bulge: { radius: 1.35, strength: 0.55 },
      frame: { kind: 'paper', bg: '#ff7a3d', title: '#fff6e6', foot: '#3d5afe' },
    },
    ai: {
      style:
        'funny caricature, oversized head on a small cartoon body, exaggerated ' +
        'friendly features, big expressive eyes and huge smile, smooth cel shading, ' +
        'bright saturated colors, modern cartoon illustration, theme park ' +
        'caricature artist style, playful and flattering, family friendly',
      strength: 0.6,
    },
  },

  /* ============================ PAREJA ============================ */
  {
    id: 'san-valentin',
    name: 'San Valentin',
    tagline: 'Postal de enamorados',
    reference: '/styles/san-valentin.jpg',
    groups: ['pareja'],
    swatch: ['#ff5c8a', '#ffd9e3', '#c1121f'],
    local: LOOKS.suave({ bg: '#ff5c8a', title: '#fff5f8', foot: '#c1121f' }),
    ai: {
      style:
        'romantic valentine postcard illustration, soft watercolor and gouache, ' +
        'floating paper hearts and rose petals, warm pink and red palette, golden ' +
        'bokeh lights, tender affectionate mood, hand painted vintage greeting ' +
        'card look',
      strength: 0.58,
    },
  },
  {
    id: 'paris',
    name: 'Paris',
    tagline: 'Bajo la torre Eiffel',
    reference: '/styles/paris.jpg',
    groups: ['pareja'],
    swatch: ['#8fb8d8', '#e8d9c0', '#3b4a5a'],
    local: LOOKS.suave({ bg: '#3b4a5a', title: '#f3ece0', foot: '#8fb8d8' }),
    ai: {
      style:
        'vintage travel postcard illustration of Paris, Eiffel tower in the ' +
        'background, cobblestone street with a cafe terrace, soft watercolor wash ' +
        'with ink linework, warm golden hour light, dusty blue and cream palette, ' +
        'romantic european holiday mood',
      strength: 0.58,
    },
  },
  {
    id: 'montana-rusa',
    name: 'Montaña Rusa',
    tagline: 'La foto de la caida',
    reference: '/styles/montana-rusa.jpg',
    groups: ['pareja', 'ninos'],
    swatch: ['#ffd400', '#e63946', '#3aa8ff'],
    local: LOOKS.vivo({ bg: '#e63946', title: '#fffbe6', foot: '#3aa8ff' }),
    ai: {
      style:
        'hilarious amusement park roller coaster drop photo, wind blowing hair ' +
        'straight back, exaggerated screaming and laughing faces, motion blur ' +
        'streaks, bright carnival colors, blue sky, colorful roller coaster track, ' +
        'cartoon comedy energy, family friendly fun',
      strength: 0.6,
    },
  },
  {
    id: 'escena-cine',
    name: 'Cine',
    tagline: 'Como una pelicula',
    reference: '/styles/escena-cine.jpg',
    groups: ['pareja'],
    swatch: ['#1b2430', '#d9a066', '#f2e8dc'],
    local: LOOKS.foto({ bg: '#1b2430', title: '#f2e8dc', foot: '#d9a066' }),
    ai: {
      style:
        'cinematic romantic movie still, anamorphic wide shot, dramatic teal and ' +
        'orange color grading, shallow depth of field, warm rim lighting, rain ' +
        'slicked city street at night with glowing signs, film grain, ' +
        'emotional storytelling frame, no text or title cards',
      strength: 0.5,
    },
  },

  /* ============================ FAMILIA ============================ */
  {
    id: 'rubber-hose',
    name: 'Rubber Hose',
    tagline: 'Caricatura de los anos 30',
    groups: ['familia', 'pareja'],
    swatch: ['#f6e7c8', '#e0403a', '#181410'],
    reference: '/styles/rubber-hose.jpg',
    local: LOOKS.tinta({ bg: '#e0403a', title: '#f6e7c8', foot: '#f0b13c' }),
    ai: {
      style:
        '1930s rubber hose cartoon group portrait, cream and vermillion two color ' +
        'print, thick black ink outlines, round pie-cut eyes, big friendly smiles, ' +
        'white gloves aesthetic, looping curved limbs, hand inked vintage animation ' +
        'cel, aged paper with light speckles, warm and family friendly',
      strength: 0.62,
    },
  },
  {
    id: 'caricatura-amarilla',
    name: 'Los Simpson',
    tagline: 'La familia amarilla',
    reference: '/styles/caricatura-amarilla.jpg',
    groups: ['familia'],
    swatch: ['#ffd90f', '#3aa8ff', '#e63946'],
    local: LOOKS.vivo({ bg: '#ffd90f', title: '#2b2b2b', foot: '#3aa8ff' }),
    ai: {
      style:
        'Create an original 2D cartoon illustration of a family in the style of The Simpsons by Matt Groening. Use a very bright, saturated, unmistakably yellow skin color for all human characters, similar to a vivid golden yellow. The skin must look clearly yellow, not tan, brown, beige, orange, peach, or realistic human skin tones. Avoid muted or dark yellow tones. Use bold black outlines, large round expressive eyes, simple geometric shapes, exaggerated facial expressions, and clean flat coloring. The characters must keep the faces, hairstyles, clothing and expressions of the real people in the attached photograph, redrawn in that cartoon style so that each person is still recognizable. High-quality digital illustration, vibrant colors, clean composition, and consistent bright yellow skin across all characters.',
      strength: 0.65,
    },
  },
  {
    id: 'feria-loja',
    name: 'Feria de Loja',
    tagline: 'La feria de fondo',
    reference: '/styles/feria-loja.jpg',
    groups: ['familia', 'pareja', 'ninos'],
    swatch: ['#e0403a', '#f0b13c', '#2f9c8e'],
    local: LOOKS.tinta({ bg: '#2f9c8e', title: '#f6e7c8', foot: '#f0b13c' }),
    ai: {
      style:
        'Create a realistic candid photograph of the family from the provided reference image visiting the Feria de Loja in Loja, Ecuador. ' +
        'Preserve the exact identity, facial features, body proportions, skin tones, and overall appearance of every person from the reference image. ' +
        'The scene should look like a genuine photograph taken spontaneously during their visit to the real Feria de Loja, not a staged promotional image. ' +
        'Show the family naturally walking through the fairgrounds, talking, laughing, looking around, or casually enjoying the event instead of standing in a perfectly posed group. ' +
        'Use an authentic fair environment with realistic crowds, exhibition areas, colorful stalls, event lights, decorations, and recognizable details of a large Ecuadorian fair. ' +
        'Capture the atmosphere naturally, as if a professional photographer happened to take the photo while the family was visiting the Feria de Loja. ' +
        'Use realistic late afternoon or early evening lighting, natural shadows, authentic skin tones, documentary-style photography, subtle cinematic quality, and realistic depth of field. ' +
        'Avoid illustration, cartoon, animation, folk-art style, artificial posing, exaggerated colors, overly perfect backgrounds, or generic amusement park scenery. ' +
        'The final image must look like an authentic real-life photograph of this specific family spending time at the Feria de Loja.',
      strength: 0.6,
    },
  },
  {
    id: 'nasa',
    name: 'NASA',
    tagline: 'Listos para despegar',
    reference: '/styles/nasa.jpg',
    groups: ['familia'],
    swatch: ['#c9d6e8', '#0b1b3a', '#ff5a3c'],
    local: LOOKS.foto({ bg: '#0b1b3a', title: '#ffffff', foot: '#ff5a3c' }),
    ai: {
      style:
          'realistic cinematic photograph of a space agency crew inside a spacecraft traveling through outer space, everyone wearing matching orange flight suits, ' +
          'naturally positioned inside the spacecraft cabin, interacting with control panels, navigation systems, and each other, ' +
          'large spacecraft windows showing the Earth, stars, and deep space outside, ' +
          'subtle zero-gravity atmosphere with small objects gently floating, realistic spacecraft interior with advanced technology and illuminated control panels, ' +
          'candid documentary-style moment as if the crew was photographed during an actual space mission, ' +
          'not a posed promotional portrait, natural expressions and authentic interactions, ' +
          'cinematic realistic lighting coming from the spacecraft windows and control panels, ' +
          'highly detailed photorealistic editorial photography, realistic skin tones, natural body proportions, dramatic but believable space environment, ' +
          'avoid cartoon, illustration, artificial heroic poses, launch pad, rocket exterior, or studio portrait appearance',
      strength: 0.5,
    },
  },

  /* ============================ NINOS ============================ */
  {
    id: 'parque-magico',
    name: 'Disney',
    tagline: 'Castillo y fuegos artificiales',
    reference: '/styles/parque-magico.jpg',
    groups: ['ninos', 'familia'],
    swatch: ['#8f6bff', '#ffd9f2', '#4cc9f0'],
    local: LOOKS.suave({ bg: '#8f6bff', title: '#fff5ff', foot: '#4cc9f0' }),
    ai: {
      style:
        'Disney animation style, standing in front of the Disneyland castle at ' +
        'night, tall fairytale castle with glowing turrets, fireworks bursting in ' +
        'the purple sky, floating sparkles, pastel lavender and pink palette, ' +
        'wide eyed wonder, dreamy storybook illustration, joyful and innocent',
      strength: 0.6,
    },
  },
  {
    id: 'muneco-3d',
    name: 'Pixar',
    tagline: 'Como de pelicula animada',
    groups: ['ninos', 'familia'],
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
      style:
        'Pixar 3D animated movie character style, stylized big head proportions, ' +
        'soft rounded shapes, subsurface skin shading, glossy expressive eyes, ' +
        'warm cinematic lighting, high quality animation studio render, colorful ' +
        'simple background, wholesome and funny',
      strength: 0.58,
    },
  },
  {
    id: 'super-heroes',
    name: 'Super Heroes',
    tagline: 'Capa y ciudad al fondo',
    reference: '/styles/super-heroes.jpg',
    groups: ['ninos'],
    swatch: ['#e63946', '#2b6cff', '#ffd400'],
    local: LOOKS.vivo({ bg: '#2b6cff', title: '#fffbe6', foot: '#ffd400' }),
    ai: {
      style:
          'photorealistic cinematic portrait of the child from the provided reference photo as a young superhero, ' +
          'preserve the child’s exact facial features, identity, skin tone, hairstyle, body proportions, and overall appearance from the reference image, ' +
          'wearing a realistic superhero-inspired outfit with a colorful cape gently flowing in the wind, no logos or recognizable emblems, ' +
          'standing confidently in a natural heroic pose, hands on hips, overlooking a realistic city skyline during golden hour, ' +
          'warm sunset light, natural shadows, realistic fabric textures, cinematic depth of field, subtle wind movement, ' +
          'professional movie-style photography, highly detailed, realistic skin texture and natural facial expression, ' +
          'empowering and cheerful atmosphere, believable real-world environment, ' +
          'avoid cartoon, comic book illustration, bold outlines, exaggerated action lines, animated appearance, or unrealistic proportions',
      strength: 0.62,
    },
  },
  {
    id: 'dino-aventura',
    name: 'Dinosaurios',
    tagline: 'Aventura en la jungla',
    reference: '/styles/dino-aventura.jpg',
    groups: ['ninos'],
    swatch: ['#3aa86b', '#ffd400', '#8a5a2b'],
    local: LOOKS.vivo({ bg: '#3aa86b', title: '#fffbe6', foot: '#ffd400' }),
    ai: {
      style:
        'friendly cartoon dinosaur jungle adventure, big goofy smiling dinosaurs ' +
        'peeking from lush green ferns, volcano and waterfall in the distance, ' +
        'warm sunlight through leaves, playful childrens book illustration, ' +
        'rounded shapes and bright colors, adventurous but never scary',
      strength: 0.62,
    },
  },
];

/*
 * El prompt final = instruccion (que depende del grupo) + descripcion del
 * estilo. Se arma en getPrompt() y no se guarda en el objeto: el mismo
 * estilo genera un prompt distinto para una pareja que para una familia.
 */

/** Los estilos que tienen sentido para ese grupo de personas. */
export function stylesForGroup(groupId) {
  return PHOTO_STYLES.filter((s) => s.groups.includes(groupId));
}

/**
 * Prompt completo, listo para el modelo.
 * Se compone en un solo lugar para que sea IMPOSIBLE mandar un prompt sin
 * la instruccion: si se escribiera a mano en cada estilo, tarde o temprano
 * se olvida en uno y ese estilo devuelve la cara de otra persona.
 */
export function getPrompt(style, group) {
  return `${buildInstruction(group)} Style: ${style.ai.style}`;
}

/** Lo que se manda al backend sobre el estilo elegido. */
export function styleFields(style, group) {
  if (!style || !group) return {};
  return {
    styleId: style.id,
    styleMode: 'image-to-image',
    stylePrompt: getPrompt(style, group),
    styleNegative: NEGATIVE_PROMPT,
    styleStrength: style.ai.strength,
    groupId: group.id,
  };
}

export function getStyle(id) {
  return PHOTO_STYLES.find((s) => s.id === id) ?? PHOTO_STYLES[0];
}

/** El que se usa si algo se pierde por el camino (timeout, recarga...). */
export const DEFAULT_STYLE = PHOTO_STYLES[0];
