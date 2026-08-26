# Prompts de los estilos — para la IA de imagenes

Para **probar los estilos a mano** en cualquier generador antes de que el backend los
conecte, y para que quien conecte Gemini sepa exactamente que le va a llegar.

- Los prompts viven en [photoStyles.js](src/photoStyles.js). **Ese archivo manda**; este
  documento se genera desde el, asi que si se cambia un estilo hay que regenerarlo.
- Estan en **ingles** a proposito: los modelos responden mejor en ingles, incluso para
  temas locales como la Feria de Loja.
- El frontend **no ejecuta ninguna IA**. Solo manda el prompt al backend.

---

## Antes que nada: dos decisiones que explican todo

### 1. Es IMAGEN A IMAGEN, no texto a imagen

El modelo no tiene que inventar gente: tiene que agarrar la foto que le mandamos y
devolver a **esas mismas personas** dibujadas. Si no se le dice, casi todos generan caras
cualquiera con el estilo pedido, y nadie se reconoce — que es lo unico que importa en un
totem.

Por eso todos los prompts empiezan con la misma instruccion, que el codigo pega solo
(`buildInstruction()` en [photoStyles.js](src/photoStyles.js)) y que **cambia segun el
grupo**: le dice cuanta gente hay y le prohibe agregar o quitar personas, que es la falla
favorita de los modelos en fotos de grupo.

Al probar a mano: **adjunta la foto** y usa el modo img2img / "editar imagen" / "referencia
de imagen". Pegar solo el texto no sirve de nada.

### 2. Ningun prompt nombra marcas

Nada de Dragon Ball, los Simpson, Disney o Mickey Mouse. Estan escritos como
**descripciones de genero** ("anime de peleas de los 90", "caricatura amarilla de sitcom
americana", "parque de fantasia con castillo") por dos razones:

- Es un evento publico con auspiciantes, y esas marcas estan registradas.
- Los modelos **rechazan o degradan** los prompts con personajes protegidos, asi que el
  resultado sale peor justo cuando los nombras.

El aire es el mismo. Si NODO decide asumir el riesgo, cambiar un prompt es una linea.

---

## Los 4 grupos

Primero se elige **con quien** se toma la foto, y de eso depende que estilos se ofrecen.
Un cromo de futbol no funciona con cinco personas y una postal de San Valentin no funciona
con una sola.

| Grupo | Cuenta | Estilos |
|---|---|---|
| Solo | 10 s | 4 |
| En pareja | 12 s | 6 |
| En familia | 15 s | 6 |
| Ninos | 12 s | 7 |

Varios estilos aparecen en mas de un grupo (Rubber Hose sirve para pareja y familia, "En
la Feria" para casi todos). El **prompt cambia** segun el grupo aunque el estilo sea el
mismo.

---

## Negativo comun a todos los estilos

```
different person, face swap, photorealistic, extra people, missing people, extra faces,
extra limbs, deformed face, distorted eyes, blurry, low quality, watermark, nsfw, text,
letters, words, names, captions, name plate, typography, signature, mean spirited
caricature, ugly, grotesque, creepy, scary, insulting exaggeration
```

Cuatro grupos, los cuatro necesarios:

- **`different person, face swap`** — la falla numero uno: devolver a otra persona.
- **`extra people, missing people`** — en fotos de grupo los modelos agregan o borran
  gente con una facilidad asombrosa.
- **`text, letters, names...`** — el totem no pide el nombre antes de la foto, y las letras
  generadas salen deformes.
- **`mean spirited, grotesque...`** — es una feria familiar. Sin esto los modelos se pasan
  de la raya y la gente se molesta.

---

## Como probar un estilo

1. Una foto de frente, con la cara (o las caras) centradas.
2. Un generador que acepte **imagen + prompt**: Gemini, ChatGPT/DALL·E, Midjourney,
   Stable Diffusion, Leonardo, Krea, Flux.
3. Adjunta la foto, pega el prompt completo y el negativo.
4. Usa el **strength** de cada estilo. Bajo (0.45) deja la cara reconocible; alto (0.85)
   queda bonito pero ya no se parece a la persona.

> Consejo de feria: prueba cada prompt con **tres caras distintas** (piel clara, piel
> oscura, alguien con lentes) y, en los de grupo, con **una foto de verdad de varias
> personas**. Un prompt que solo funciona con una cara falla la mayoria de las veces en el
> estand.

---

## Imagenes de ejemplo del selector

Solo cuatro estilos tienen imagen de referencia: `rubber-hose`, `mundial-2026`, `cabezon`
y `muneco-3d`. El resto muestra la miniatura generada por el filtro local.

Para agregar las que faltan: generar la imagen con su prompt y guardarla como
`public/styles/<id>.jpg` (720 px de ancho basta). Aparece sola, sin tocar codigo.

---

## 🙋 Solo — `personal`

Cuenta regresiva: **10 s**. La IA recibe: *"one single person"*.

| Estilo | id | Strength |
|---|---|---|
| Mundial 2026 | `mundial-2026` | 0.45 |
| Guerrero Anime | `anime-90` | 0.62 |
| Astronauta | `astronauta` | 0.5 |
| Cabezon | `cabezon` | 0.6 |

### Mundial 2026 — `mundial-2026`

Tu cromo de la seleccion. Strength **0.45**.

```
Use the provided photograph as the base image. It shows one single person. Redraw the same
real person from that photo in the style described below. Keep their identity, face shape,
hair, skin tone, glasses and clothing recognizable, and keep the same pose, the same number
of people and the same framing. Do not add or remove people, do not invent different faces,
and do not add any text. Style: modern football collectible sticker portrait, glossy trading
card look, wearing a bright yellow Ecuador national football jersey with navy blue collar,
vivid turquoise and yellow graphic background with bold abstract shapes, flag colors of
Ecuador, crisp modern sports studio lighting, high saturation, clean vector shapes, no text
anywhere in the image
```

### Guerrero Anime — `anime-90`

Aura de energia y pelo al viento. Strength **0.62**.

```
Use the provided photograph as the base image. It shows one single person. Redraw the same
real person from that photo in the style described below. Keep their identity, face shape,
hair, skin tone, glasses and clothing recognizable, and keep the same pose, the same number
of people and the same framing. Do not add or remove people, do not invent different faces,
and do not add any text. Style: 1990s Japanese fighting anime cel style, spiky windblown
hair, glowing golden energy aura surrounding the body, dramatic speed lines, cracked rocky
battlefield, stormy sky with lightning, bold cel shading with hard shadows, intense
determined expression, vibrant saturated colors
```

### Astronauta — `astronauta`

Al espacio desde Loja. Strength **0.5**.

```
Use the provided photograph as the base image. It shows one single person. Redraw the same
real person from that photo in the style described below. Keep their identity, face shape,
hair, skin tone, glasses and clothing recognizable, and keep the same pose, the same number
of people and the same framing. Do not add or remove people, do not invent different faces,
and do not add any text. Style: astronaut portrait, wearing a white space suit with the
visor open, orbital station interior behind, Earth visible through a round window, cinematic
space photography lighting, crisp detail, deep blue and white palette with warm orange
accents
```

### Cabezon — `cabezon`

Cabeza gigante, cuerpo chiquito. Strength **0.6**.

```
Use the provided photograph as the base image. It shows one single person. Redraw the same
real person from that photo in the style described below. Keep their identity, face shape,
hair, skin tone, glasses and clothing recognizable, and keep the same pose, the same number
of people and the same framing. Do not add or remove people, do not invent different faces,
and do not add any text. Style: funny caricature, oversized head on a small cartoon body,
exaggerated friendly features, big expressive eyes and huge smile, smooth cel shading,
bright saturated colors, modern cartoon illustration, theme park caricature artist style,
playful and flattering, family friendly
```

---

## 💞 En pareja — `pareja`

Cuenta regresiva: **12 s**. La IA recibe: *"a couple of exactly two people standing together"*.

| Estilo | id | Strength |
|---|---|---|
| San Valentin | `san-valentin` | 0.58 |
| En Paris | `paris` | 0.58 |
| Montana Rusa | `montana-rusa` | 0.6 |
| Escena de Cine | `escena-cine` | 0.5 |
| Rubber Hose | `rubber-hose` | 0.62 |
| En la Feria | `feria-loja` | 0.6 |

### San Valentin — `san-valentin`

Postal de enamorados. Strength **0.58**.

```
Use the provided photograph as the base image. It shows a couple of exactly two people
standing together. Redraw the same real people from that photo in the style described below.
Keep their identity, face shape, hair, skin tone, glasses and clothing recognizable, and
keep the same pose, the same number of people and the same framing. Do not add or remove
people, do not invent different faces, and do not add any text. Style: romantic valentine
postcard illustration, soft watercolor and gouache, floating paper hearts and rose petals,
warm pink and red palette, golden bokeh lights, tender affectionate mood, hand painted
vintage greeting card look
```

### En Paris — `paris`

Bajo la torre Eiffel. Strength **0.58**.

```
Use the provided photograph as the base image. It shows a couple of exactly two people
standing together. Redraw the same real people from that photo in the style described below.
Keep their identity, face shape, hair, skin tone, glasses and clothing recognizable, and
keep the same pose, the same number of people and the same framing. Do not add or remove
people, do not invent different faces, and do not add any text. Style: vintage travel
postcard illustration of Paris, Eiffel tower in the background, cobblestone street with a
cafe terrace, soft watercolor wash with ink linework, warm golden hour light, dusty blue and
cream palette, romantic european holiday mood
```

### Montana Rusa — `montana-rusa`

La foto de la caida. Strength **0.6**.

```
Use the provided photograph as the base image. It shows a couple of exactly two people
standing together. Redraw the same real people from that photo in the style described below.
Keep their identity, face shape, hair, skin tone, glasses and clothing recognizable, and
keep the same pose, the same number of people and the same framing. Do not add or remove
people, do not invent different faces, and do not add any text. Style: hilarious amusement
park roller coaster drop photo, wind blowing hair straight back, exaggerated screaming and
laughing faces, motion blur streaks, bright carnival colors, blue sky, colorful roller
coaster track, cartoon comedy energy, family friendly fun
```

### Escena de Cine — `escena-cine`

Como una pelicula. Strength **0.5**.

```
Use the provided photograph as the base image. It shows a couple of exactly two people
standing together. Redraw the same real people from that photo in the style described below.
Keep their identity, face shape, hair, skin tone, glasses and clothing recognizable, and
keep the same pose, the same number of people and the same framing. Do not add or remove
people, do not invent different faces, and do not add any text. Style: cinematic romantic
movie still, anamorphic wide shot, dramatic teal and orange color grading, shallow depth of
field, warm rim lighting, rain slicked city street at night with glowing signs, film grain,
emotional storytelling frame, no text or title cards
```

### Rubber Hose — `rubber-hose`

Caricatura de los anos 30. Strength **0.62**.

```
Use the provided photograph as the base image. It shows a couple of exactly two people
standing together. Redraw the same real people from that photo in the style described below.
Keep their identity, face shape, hair, skin tone, glasses and clothing recognizable, and
keep the same pose, the same number of people and the same framing. Do not add or remove
people, do not invent different faces, and do not add any text. Style: 1930s rubber hose
cartoon group portrait, cream and vermillion two color print, thick black ink outlines,
round pie-cut eyes, big friendly smiles, white gloves aesthetic, looping curved limbs, hand
inked vintage animation cel, aged paper with light speckles, warm and family friendly
```

### En la Feria — `feria-loja`

La Feria de Loja de fondo. Strength **0.6**.

```
Use the provided photograph as the base image. It shows a couple of exactly two people
standing together. Redraw the same real people from that photo in the style described below.
Keep their identity, face shape, hair, skin tone, glasses and clothing recognizable, and
keep the same pose, the same number of people and the same framing. Do not add or remove
people, do not invent different faces, and do not add any text. Style: lively andean fair
illustration, colorful market stalls with fabric awnings, strings of triangular bunting
flags and warm string lights, carousel and ferris wheel in the distance, mountains of
southern Ecuador at sunset, straw hats and embroidered textiles, festive folk art poster
style with flat saturated colors and ink outlines
```

---

## 👨‍👩‍👧‍👦 En familia — `familia`

Cuenta regresiva: **15 s**. La IA recibe: *"a family group of several people of different ages"*.

| Estilo | id | Strength |
|---|---|---|
| Rubber Hose | `rubber-hose` | 0.62 |
| Caricatura Amarilla | `caricatura-amarilla` | 0.65 |
| En la Feria | `feria-loja` | 0.6 |
| Mision Espacial | `nasa` | 0.5 |
| Parque Magico | `parque-magico` | 0.6 |
| Muneco 3D | `muneco-3d` | 0.58 |

### Rubber Hose — `rubber-hose`

Caricatura de los anos 30. Strength **0.62**.

```
Use the provided photograph as the base image. It shows a family group of several people of
different ages. Redraw the same real people from that photo in the style described below.
Keep their identity, face shape, hair, skin tone, glasses and clothing recognizable, and
keep the same pose, the same number of people and the same framing. Do not add or remove
people, do not invent different faces, and do not add any text. Style: 1930s rubber hose
cartoon group portrait, cream and vermillion two color print, thick black ink outlines,
round pie-cut eyes, big friendly smiles, white gloves aesthetic, looping curved limbs, hand
inked vintage animation cel, aged paper with light speckles, warm and family friendly
```

### Caricatura Amarilla — `caricatura-amarilla`

Familia de dibujos animados. Strength **0.65**.

```
Use the provided photograph as the base image. It shows a family group of several people of
different ages. Redraw the same real people from that photo in the style described below.
Keep their identity, face shape, hair, skin tone, glasses and clothing recognizable, and
keep the same pose, the same number of people and the same framing. Do not add or remove
people, do not invent different faces, and do not add any text. Style: american prime time
cartoon family style, flat bright yellow skin, simple thick black outlines, large round
white eyes with small pupils, overbite smiles, flat solid colors with no gradients, suburban
living room with a couch in the background, cheerful satirical sitcom look
```

### En la Feria — `feria-loja`

La Feria de Loja de fondo. Strength **0.6**.

```
Use the provided photograph as the base image. It shows a family group of several people of
different ages. Redraw the same real people from that photo in the style described below.
Keep their identity, face shape, hair, skin tone, glasses and clothing recognizable, and
keep the same pose, the same number of people and the same framing. Do not add or remove
people, do not invent different faces, and do not add any text. Style: lively andean fair
illustration, colorful market stalls with fabric awnings, strings of triangular bunting
flags and warm string lights, carousel and ferris wheel in the distance, mountains of
southern Ecuador at sunset, straw hats and embroidered textiles, festive folk art poster
style with flat saturated colors and ink outlines
```

### Mision Espacial — `nasa`

Tripulacion lista para despegar. Strength **0.5**.

```
Use the provided photograph as the base image. It shows a family group of several people of
different ages. Redraw the same real people from that photo in the style described below.
Keep their identity, face shape, hair, skin tone, glasses and clothing recognizable, and
keep the same pose, the same number of people and the same framing. Do not add or remove
people, do not invent different faces, and do not add any text. Style: space agency crew
portrait, everyone wearing matching orange flight suits, standing in front of a rocket on
the launch pad at sunrise, mission control gantry behind, proud heroic poses, crisp
editorial photography, clean blue and orange palette
```

### Parque Magico — `parque-magico`

Castillo y fuegos artificiales. Strength **0.6**.

```
Use the provided photograph as the base image. It shows a family group of several people of
different ages. Redraw the same real people from that photo in the style described below.
Keep their identity, face shape, hair, skin tone, glasses and clothing recognizable, and
keep the same pose, the same number of people and the same framing. Do not add or remove
people, do not invent different faces, and do not add any text. Style: magical fairytale
theme park at night, tall fantasy castle with turrets glowing in the background, fireworks
bursting in the purple sky, floating sparkles, pastel lavender and pink palette, wide eyed
wonder, dreamy storybook illustration, joyful and innocent
```

### Muneco 3D — `muneco-3d`

Como de pelicula animada. Strength **0.58**.

```
Use the provided photograph as the base image. It shows a family group of several people of
different ages. Redraw the same real people from that photo in the style described below.
Keep their identity, face shape, hair, skin tone, glasses and clothing recognizable, and
keep the same pose, the same number of people and the same framing. Do not add or remove
people, do not invent different faces, and do not add any text. Style: cute 3d animated
movie character style, stylized big head proportions, soft rounded shapes, subsurface skin
shading, glossy expressive eyes, warm cinematic lighting, modern animation studio render,
colorful simple background, wholesome and funny
```

---

## 🧒 Ninos — `ninos`

Cuenta regresiva: **12 s**. La IA recibe: *"one or more children"*.

| Estilo | id | Strength |
|---|---|---|
| Cabezon | `cabezon` | 0.6 |
| Montana Rusa | `montana-rusa` | 0.6 |
| En la Feria | `feria-loja` | 0.6 |
| Parque Magico | `parque-magico` | 0.6 |
| Muneco 3D | `muneco-3d` | 0.58 |
| Super Heroes | `super-heroes` | 0.62 |
| Aventura Dino | `dino-aventura` | 0.62 |

### Cabezon — `cabezon`

Cabeza gigante, cuerpo chiquito. Strength **0.6**.

```
Use the provided photograph as the base image. It shows one or more children. Redraw the
same real children from that photo in the style described below. Keep their identity, face
shape, hair, skin tone, glasses and clothing recognizable, and keep the same pose, the same
number of people and the same framing. Do not add or remove people, do not invent different
faces, and do not add any text. Style: funny caricature, oversized head on a small cartoon
body, exaggerated friendly features, big expressive eyes and huge smile, smooth cel shading,
bright saturated colors, modern cartoon illustration, theme park caricature artist style,
playful and flattering, family friendly
```

### Montana Rusa — `montana-rusa`

La foto de la caida. Strength **0.6**.

```
Use the provided photograph as the base image. It shows one or more children. Redraw the
same real children from that photo in the style described below. Keep their identity, face
shape, hair, skin tone, glasses and clothing recognizable, and keep the same pose, the same
number of people and the same framing. Do not add or remove people, do not invent different
faces, and do not add any text. Style: hilarious amusement park roller coaster drop photo,
wind blowing hair straight back, exaggerated screaming and laughing faces, motion blur
streaks, bright carnival colors, blue sky, colorful roller coaster track, cartoon comedy
energy, family friendly fun
```

### En la Feria — `feria-loja`

La Feria de Loja de fondo. Strength **0.6**.

```
Use the provided photograph as the base image. It shows one or more children. Redraw the
same real children from that photo in the style described below. Keep their identity, face
shape, hair, skin tone, glasses and clothing recognizable, and keep the same pose, the same
number of people and the same framing. Do not add or remove people, do not invent different
faces, and do not add any text. Style: lively andean fair illustration, colorful market
stalls with fabric awnings, strings of triangular bunting flags and warm string lights,
carousel and ferris wheel in the distance, mountains of southern Ecuador at sunset, straw
hats and embroidered textiles, festive folk art poster style with flat saturated colors and
ink outlines
```

### Parque Magico — `parque-magico`

Castillo y fuegos artificiales. Strength **0.6**.

```
Use the provided photograph as the base image. It shows one or more children. Redraw the
same real children from that photo in the style described below. Keep their identity, face
shape, hair, skin tone, glasses and clothing recognizable, and keep the same pose, the same
number of people and the same framing. Do not add or remove people, do not invent different
faces, and do not add any text. Style: magical fairytale theme park at night, tall fantasy
castle with turrets glowing in the background, fireworks bursting in the purple sky,
floating sparkles, pastel lavender and pink palette, wide eyed wonder, dreamy storybook
illustration, joyful and innocent
```

### Muneco 3D — `muneco-3d`

Como de pelicula animada. Strength **0.58**.

```
Use the provided photograph as the base image. It shows one or more children. Redraw the
same real children from that photo in the style described below. Keep their identity, face
shape, hair, skin tone, glasses and clothing recognizable, and keep the same pose, the same
number of people and the same framing. Do not add or remove people, do not invent different
faces, and do not add any text. Style: cute 3d animated movie character style, stylized big
head proportions, soft rounded shapes, subsurface skin shading, glossy expressive eyes, warm
cinematic lighting, modern animation studio render, colorful simple background, wholesome
and funny
```

### Super Heroes — `super-heroes`

Capa y ciudad al fondo. Strength **0.62**.

```
Use the provided photograph as the base image. It shows one or more children. Redraw the
same real children from that photo in the style described below. Keep their identity, face
shape, hair, skin tone, glasses and clothing recognizable, and keep the same pose, the same
number of people and the same framing. Do not add or remove people, do not invent different
faces, and do not add any text. Style: kid superhero illustration, colorful cape flowing in
the wind, confident hands on hips hero pose, city skyline at golden hour below, comic book
color palette with bold outlines and dynamic action lines, empowering and cheerful, no logos
or emblems
```

### Aventura Dino — `dino-aventura`

Con dinosaurios amigables. Strength **0.62**.

```
Use the provided photograph as the base image. It shows one or more children. Redraw the
same real children from that photo in the style described below. Keep their identity, face
shape, hair, skin tone, glasses and clothing recognizable, and keep the same pose, the same
number of people and the same framing. Do not add or remove people, do not invent different
faces, and do not add any text. Style: friendly cartoon dinosaur jungle adventure, big goofy
smiling dinosaurs peeking from lush green ferns, volcano and waterfall in the distance, warm
sunlight through leaves, playful childrens book illustration, rounded shapes and bright
colors, adventurous but never scary
```

---

## Que recibe el backend

Con cada foto, ademas de `photo`, van estos campos (los arma `styleFields()` en
[photoStyles.js](src/photoStyles.js), y son **los mismos** al generar y al enviar):

| Campo | Ejemplo |
|---|---|
| `styleId` | `feria-loja` |
| `groupId` | `familia` |
| `styleMode` | `image-to-image` |
| `stylePrompt` | el prompt completo de arriba |
| `styleNegative` | el negativo comun |
| `styleStrength` | `0.6` |

El contrato completo de los endpoints esta en [INTEGRACION.md](INTEGRACION.md).

---

## Agregar o cambiar un estilo

Solo `STYLE_DEFS` en [photoStyles.js](src/photoStyles.js):

```js
{
  id: 'mi-estilo',
  name: 'Nombre corto',                    // lo que se ve en la tarjeta
  tagline: 'Una linea de gancho',
  groups: ['pareja', 'familia'],           // en que grupos aparece
  swatch: ['#aaa', '#bbb', '#ccc'],        // colores mientras carga la miniatura
  reference: '/styles/mi-estilo.jpg',      // opcional
  local: LOOKS.vivo({ bg: '#f00', title: '#fff', foot: '#ff0' }),
  ai: {
    style: 'solo la descripcion del estilo, sin la instruccion',
    strength: 0.6,
  },
}
```

La instruccion de imagen a imagen se pega sola. La tarjeta aparece en los grupos que
digas, con su miniatura generada en vivo.
