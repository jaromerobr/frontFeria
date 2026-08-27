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
(`buildInstruction()` en [photoStyles.js](src/photoStyles.js)) y que dice tres cosas:

1. Que la imagen adjunta es una **foto tomada en vivo por la camara del totem, ahora
   mismo**. Sin esa frase los modelos la tratan como una referencia de estilo mas y
   devuelven a otra persona.
2. Que esa foto es la **unica referencia** de quien aparece.
3. **Cuanta gente hay** (segun el grupo) y que no agregue ni quite a nadie, que es la falla
   favorita de los modelos en fotos de grupo.

Al probar a mano: **adjunta la foto** y usa el modo img2img / "editar imagen" / "referencia
de imagen". Pegar solo el texto no sirve de nada.

### 2. Cuatro estilos nombran marcas

`Dragon Ball`, `Los Simpson`, `Disney` y `Pixar` nombran la franquicia en el prompt. Es
una **decision del cliente**, tomada porque sin nombrarlas el modelo no acierta el estilo:
descrito como genero ("anime de peleas de los 90") el resultado no se parece.

Queda anotado porque es un evento publico con auspiciantes y esas marcas estan
registradas. Si algun dia hay que quitarlas, son esas cuatro y se cambia su `ai.style`.

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

**Los 16 estilos tienen su imagen de ejemplo** en `public/styles/<id>.jpg`, reducidas a
720 px (los originales quedan en `refs/`, fuera del repositorio).

Para cambiar una: generar la imagen con su prompt y guardarla con el mismo nombre.
Aparece sola, sin tocar codigo.

---


## 🙋 Solo — `personal`

Cuenta regresiva: **10 s**. La IA recibe: *"one single person"*.

| Estilo | id | Strength |
|---|---|---|
| Mundial 2026 | `mundial-2026` | 0.45 |
| Dragon Ball | `anime-90` | 0.62 |
| Astronauta | `astronauta` | 0.5 |
| Cabezon | `cabezon` | 0.6 |

### Mundial 2026 — `mundial-2026`

Tu cromo de la seleccion. Strength **0.45**.

```
The attached image is a live photograph that was just taken by this photo booth kiosk
camera. Use that photograph as the base image and as the only reference for who appears. It
shows one single person. Redraw the same real person from that photograph in the style
described below, keeping their identity, face shape, hair, skin tone, glasses and clothing
clearly recognizable, and keeping the same pose, the same number of people and the same
framing. Do not add or remove people, do not replace anyone with a different face, and do
not add any text. Style: modern football collectible sticker portrait, glossy trading card
look, wearing a bright yellow Ecuador national football jersey with navy blue collar, vivid
turquoise and yellow graphic background with bold abstract shapes, flag colors of Ecuador,
crisp modern sports studio lighting, high saturation, clean vector shapes, no text anywhere
in the image
```

### Dragon Ball — `anime-90`

Aura de energia. Strength **0.62**.

```
The attached image is a live photograph that was just taken by this photo booth kiosk
camera. Use that photograph as the base image and as the only reference for who appears. It
shows one single person. Redraw the same real person from that photograph in the style
described below, keeping their identity, face shape, hair, skin tone, glasses and clothing
clearly recognizable, and keeping the same pose, the same number of people and the same
framing. Do not add or remove people, do not replace anyone with a different face, and do
not add any text. Style: Dragon Ball Z anime art style by Akira Toriyama, 1990s cel
animation, spiky windblown hair, glowing golden energy aura surrounding the body, dramatic
speed lines, cracked rocky battlefield, stormy sky with lightning, bold cel shading with
hard shadows, intense determined expression, vibrant saturated colors
```

### Astronauta — `astronauta`

Al espacio desde Loja. Strength **0.5**.

```
The attached image is a live photograph that was just taken by this photo booth kiosk
camera. Use that photograph as the base image and as the only reference for who appears. It
shows one single person. Redraw the same real person from that photograph in the style
described below, keeping their identity, face shape, hair, skin tone, glasses and clothing
clearly recognizable, and keeping the same pose, the same number of people and the same
framing. Do not add or remove people, do not replace anyone with a different face, and do
not add any text. Style: astronaut portrait, wearing a white space suit with the visor open,
orbital station interior behind, Earth visible through a round window, cinematic space
photography lighting, crisp detail, deep blue and white palette with warm orange accents
```

### Cabezon — `cabezon`

Cabeza gigante, cuerpo chiquito. Strength **0.6**.

```
The attached image is a live photograph that was just taken by this photo booth kiosk
camera. Use that photograph as the base image and as the only reference for who appears. It
shows one single person. Redraw the same real person from that photograph in the style
described below, keeping their identity, face shape, hair, skin tone, glasses and clothing
clearly recognizable, and keeping the same pose, the same number of people and the same
framing. Do not add or remove people, do not replace anyone with a different face, and do
not add any text. Style: funny caricature, oversized head on a small cartoon body,
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
| Paris | `paris` | 0.58 |
| Montaña Rusa | `montana-rusa` | 0.6 |
| Cine | `escena-cine` | 0.5 |
| Rubber Hose | `rubber-hose` | 0.62 |
| Feria de Loja | `feria-loja` | 0.6 |

### San Valentin — `san-valentin`

Postal de enamorados. Strength **0.58**.

```
The attached image is a live photograph that was just taken by this photo booth kiosk
camera. Use that photograph as the base image and as the only reference for who appears. It
shows a couple of exactly two people standing together. Redraw the same real people from
that photograph in the style described below, keeping their identity, face shape, hair, skin
tone, glasses and clothing clearly recognizable, and keeping the same pose, the same number
of people and the same framing. Do not add or remove people, do not replace anyone with a
different face, and do not add any text. Style: romantic valentine postcard illustration,
soft watercolor and gouache, floating paper hearts and rose petals, warm pink and red
palette, golden bokeh lights, tender affectionate mood, hand painted vintage greeting card
look
```

### Paris — `paris`

Bajo la torre Eiffel. Strength **0.58**.

```
The attached image is a live photograph that was just taken by this photo booth kiosk
camera. Use that photograph as the base image and as the only reference for who appears. It
shows a couple of exactly two people standing together. Redraw the same real people from
that photograph in the style described below, keeping their identity, face shape, hair, skin
tone, glasses and clothing clearly recognizable, and keeping the same pose, the same number
of people and the same framing. Do not add or remove people, do not replace anyone with a
different face, and do not add any text. Style: vintage travel postcard illustration of
Paris, Eiffel tower in the background, cobblestone street with a cafe terrace, soft
watercolor wash with ink linework, warm golden hour light, dusty blue and cream palette,
romantic european holiday mood
```

### Montaña Rusa — `montana-rusa`

La foto de la caida. Strength **0.6**.

```
The attached image is a live photograph that was just taken by this photo booth kiosk
camera. Use that photograph as the base image and as the only reference for who appears. It
shows a couple of exactly two people standing together. Redraw the same real people from
that photograph in the style described below, keeping their identity, face shape, hair, skin
tone, glasses and clothing clearly recognizable, and keeping the same pose, the same number
of people and the same framing. Do not add or remove people, do not replace anyone with a
different face, and do not add any text. Style: hilarious amusement park roller coaster drop
photo, wind blowing hair straight back, exaggerated screaming and laughing faces, motion
blur streaks, bright carnival colors, blue sky, colorful roller coaster track, cartoon
comedy energy, family friendly fun
```

### Cine — `escena-cine`

Como una pelicula. Strength **0.5**.

```
The attached image is a live photograph that was just taken by this photo booth kiosk
camera. Use that photograph as the base image and as the only reference for who appears. It
shows a couple of exactly two people standing together. Redraw the same real people from
that photograph in the style described below, keeping their identity, face shape, hair, skin
tone, glasses and clothing clearly recognizable, and keeping the same pose, the same number
of people and the same framing. Do not add or remove people, do not replace anyone with a
different face, and do not add any text. Style: cinematic romantic movie still, anamorphic
wide shot, dramatic teal and orange color grading, shallow depth of field, warm rim
lighting, rain slicked city street at night with glowing signs, film grain, emotional
storytelling frame, no text or title cards
```

### Rubber Hose — `rubber-hose`

Caricatura de los anos 30. Strength **0.62**.

```
The attached image is a live photograph that was just taken by this photo booth kiosk
camera. Use that photograph as the base image and as the only reference for who appears. It
shows a couple of exactly two people standing together. Redraw the same real people from
that photograph in the style described below, keeping their identity, face shape, hair, skin
tone, glasses and clothing clearly recognizable, and keeping the same pose, the same number
of people and the same framing. Do not add or remove people, do not replace anyone with a
different face, and do not add any text. Style: 1930s rubber hose cartoon group portrait,
cream and vermillion two color print, thick black ink outlines, round pie-cut eyes, big
friendly smiles, white gloves aesthetic, looping curved limbs, hand inked vintage animation
cel, aged paper with light speckles, warm and family friendly
```

### Feria de Loja — `feria-loja`

La feria de fondo. Strength **0.6**.

```
The attached image is a live photograph that was just taken by this photo booth kiosk
camera. Use that photograph as the base image and as the only reference for who appears. It
shows a couple of exactly two people standing together. Redraw the same real people from
that photograph in the style described below, keeping their identity, face shape, hair, skin
tone, glasses and clothing clearly recognizable, and keeping the same pose, the same number
of people and the same framing. Do not add or remove people, do not replace anyone with a
different face, and do not add any text. Style: Create a realistic candid photograph of the
family from the provided reference image visiting the Feria de Loja in Loja, Ecuador.
Preserve the exact identity, facial features, body proportions, skin tones, and overall
appearance of every person from the reference image. The scene should look like a genuine
photograph taken spontaneously during their visit to the real Feria de Loja, not a staged
promotional image. Show the family naturally walking through the fairgrounds, talking,
laughing, looking around, or casually enjoying the event instead of standing in a perfectly
posed group. Use an authentic fair environment with realistic crowds, exhibition areas,
colorful stalls, event lights, decorations, and recognizable details of a large Ecuadorian
fair. Capture the atmosphere naturally, as if a professional photographer happened to take
the photo while the family was visiting the Feria de Loja. Use realistic late afternoon or
early evening lighting, natural shadows, authentic skin tones, documentary-style
photography, subtle cinematic quality, and realistic depth of field. Avoid illustration,
cartoon, animation, folk-art style, artificial posing, exaggerated colors, overly perfect
backgrounds, or generic amusement park scenery. The final image must look like an authentic
real-life photograph of this specific family spending time at the Feria de Loja.
```

---

## 👨‍👩‍👧‍👦 En familia — `familia`

Cuenta regresiva: **15 s**. La IA recibe: *"a family group of several people of different ages"*.

| Estilo | id | Strength |
|---|---|---|
| Rubber Hose | `rubber-hose` | 0.62 |
| Los Simpson | `caricatura-amarilla` | 0.65 |
| Feria de Loja | `feria-loja` | 0.6 |
| NASA | `nasa` | 0.5 |
| Disney | `parque-magico` | 0.6 |
| Pixar | `muneco-3d` | 0.58 |

### Rubber Hose — `rubber-hose`

Caricatura de los anos 30. Strength **0.62**.

```
The attached image is a live photograph that was just taken by this photo booth kiosk
camera. Use that photograph as the base image and as the only reference for who appears. It
shows a family group of several people of different ages. Redraw the same real people from
that photograph in the style described below, keeping their identity, face shape, hair, skin
tone, glasses and clothing clearly recognizable, and keeping the same pose, the same number
of people and the same framing. Do not add or remove people, do not replace anyone with a
different face, and do not add any text. Style: 1930s rubber hose cartoon group portrait,
cream and vermillion two color print, thick black ink outlines, round pie-cut eyes, big
friendly smiles, white gloves aesthetic, looping curved limbs, hand inked vintage animation
cel, aged paper with light speckles, warm and family friendly
```

### Los Simpson — `caricatura-amarilla`

La familia amarilla. Strength **0.65**.

```
The attached image is a live photograph that was just taken by this photo booth kiosk
camera. Use that photograph as the base image and as the only reference for who appears. It
shows a family group of several people of different ages. Redraw the same real people from
that photograph in the style described below, keeping their identity, face shape, hair, skin
tone, glasses and clothing clearly recognizable, and keeping the same pose, the same number
of people and the same framing. Do not add or remove people, do not replace anyone with a
different face, and do not add any text. Style: Create an original 2D cartoon illustration
of a family in the style of The Simpsons by Matt Groening. Use a very bright, saturated,
unmistakably yellow skin color for all human characters, similar to a vivid golden yellow.
The skin must look clearly yellow, not tan, brown, beige, orange, peach, or realistic human
skin tones. Avoid muted or dark yellow tones. Use bold black outlines, large round
expressive eyes, simple geometric shapes, exaggerated facial expressions, and clean flat
coloring. The characters must keep the faces, hairstyles, clothing and expressions of the
real people in the attached photograph, redrawn in that cartoon style so that each person is
still recognizable. High-quality digital illustration, vibrant colors, clean composition,
and consistent bright yellow skin across all characters.
```

### Feria de Loja — `feria-loja`

La feria de fondo. Strength **0.6**.

```
The attached image is a live photograph that was just taken by this photo booth kiosk
camera. Use that photograph as the base image and as the only reference for who appears. It
shows a family group of several people of different ages. Redraw the same real people from
that photograph in the style described below, keeping their identity, face shape, hair, skin
tone, glasses and clothing clearly recognizable, and keeping the same pose, the same number
of people and the same framing. Do not add or remove people, do not replace anyone with a
different face, and do not add any text. Style: Create a realistic candid photograph of the
family from the provided reference image visiting the Feria de Loja in Loja, Ecuador.
Preserve the exact identity, facial features, body proportions, skin tones, and overall
appearance of every person from the reference image. The scene should look like a genuine
photograph taken spontaneously during their visit to the real Feria de Loja, not a staged
promotional image. Show the family naturally walking through the fairgrounds, talking,
laughing, looking around, or casually enjoying the event instead of standing in a perfectly
posed group. Use an authentic fair environment with realistic crowds, exhibition areas,
colorful stalls, event lights, decorations, and recognizable details of a large Ecuadorian
fair. Capture the atmosphere naturally, as if a professional photographer happened to take
the photo while the family was visiting the Feria de Loja. Use realistic late afternoon or
early evening lighting, natural shadows, authentic skin tones, documentary-style
photography, subtle cinematic quality, and realistic depth of field. Avoid illustration,
cartoon, animation, folk-art style, artificial posing, exaggerated colors, overly perfect
backgrounds, or generic amusement park scenery. The final image must look like an authentic
real-life photograph of this specific family spending time at the Feria de Loja.
```

### NASA — `nasa`

Listos para despegar. Strength **0.5**.

```
The attached image is a live photograph that was just taken by this photo booth kiosk
camera. Use that photograph as the base image and as the only reference for who appears. It
shows a family group of several people of different ages. Redraw the same real people from
that photograph in the style described below, keeping their identity, face shape, hair, skin
tone, glasses and clothing clearly recognizable, and keeping the same pose, the same number
of people and the same framing. Do not add or remove people, do not replace anyone with a
different face, and do not add any text. Style: realistic cinematic photograph of a space
agency crew inside a spacecraft traveling through outer space, everyone wearing matching
orange flight suits, naturally positioned inside the spacecraft cabin, interacting with
control panels, navigation systems, and each other, large spacecraft windows showing the
Earth, stars, and deep space outside, subtle zero-gravity atmosphere with small objects
gently floating, realistic spacecraft interior with advanced technology and illuminated
control panels, candid documentary-style moment as if the crew was photographed during an
actual space mission, not a posed promotional portrait, natural expressions and authentic
interactions, cinematic realistic lighting coming from the spacecraft windows and control
panels, highly detailed photorealistic editorial photography, realistic skin tones, natural
body proportions, dramatic but believable space environment, avoid cartoon, illustration,
artificial heroic poses, launch pad, rocket exterior, or studio portrait appearance
```

### Disney — `parque-magico`

Castillo y fuegos artificiales. Strength **0.6**.

```
The attached image is a live photograph that was just taken by this photo booth kiosk
camera. Use that photograph as the base image and as the only reference for who appears. It
shows a family group of several people of different ages. Redraw the same real people from
that photograph in the style described below, keeping their identity, face shape, hair, skin
tone, glasses and clothing clearly recognizable, and keeping the same pose, the same number
of people and the same framing. Do not add or remove people, do not replace anyone with a
different face, and do not add any text. Style: Disney animation style, standing in front of
the Disneyland castle at night, tall fairytale castle with glowing turrets, fireworks
bursting in the purple sky, floating sparkles, pastel lavender and pink palette, wide eyed
wonder, dreamy storybook illustration, joyful and innocent
```

### Pixar — `muneco-3d`

Como de pelicula animada. Strength **0.58**.

```
The attached image is a live photograph that was just taken by this photo booth kiosk
camera. Use that photograph as the base image and as the only reference for who appears. It
shows a family group of several people of different ages. Redraw the same real people from
that photograph in the style described below, keeping their identity, face shape, hair, skin
tone, glasses and clothing clearly recognizable, and keeping the same pose, the same number
of people and the same framing. Do not add or remove people, do not replace anyone with a
different face, and do not add any text. Style: Pixar 3D animated movie character style,
stylized big head proportions, soft rounded shapes, subsurface skin shading, glossy
expressive eyes, warm cinematic lighting, high quality animation studio render, colorful
simple background, wholesome and funny
```

---

## 🧒 Ninos — `ninos`

Cuenta regresiva: **12 s**. La IA recibe: *"one or more children"*.

| Estilo | id | Strength |
|---|---|---|
| Cabezon | `cabezon` | 0.6 |
| Montaña Rusa | `montana-rusa` | 0.6 |
| Feria de Loja | `feria-loja` | 0.6 |
| Disney | `parque-magico` | 0.6 |
| Pixar | `muneco-3d` | 0.58 |
| Super Heroes | `super-heroes` | 0.62 |
| Dinosaurios | `dino-aventura` | 0.62 |

### Cabezon — `cabezon`

Cabeza gigante, cuerpo chiquito. Strength **0.6**.

```
The attached image is a live photograph that was just taken by this photo booth kiosk
camera. Use that photograph as the base image and as the only reference for who appears. It
shows one or more children. Redraw the same real children from that photograph in the style
described below, keeping their identity, face shape, hair, skin tone, glasses and clothing
clearly recognizable, and keeping the same pose, the same number of people and the same
framing. Do not add or remove people, do not replace anyone with a different face, and do
not add any text. Style: funny caricature, oversized head on a small cartoon body,
exaggerated friendly features, big expressive eyes and huge smile, smooth cel shading,
bright saturated colors, modern cartoon illustration, theme park caricature artist style,
playful and flattering, family friendly
```

### Montaña Rusa — `montana-rusa`

La foto de la caida. Strength **0.6**.

```
The attached image is a live photograph that was just taken by this photo booth kiosk
camera. Use that photograph as the base image and as the only reference for who appears. It
shows one or more children. Redraw the same real children from that photograph in the style
described below, keeping their identity, face shape, hair, skin tone, glasses and clothing
clearly recognizable, and keeping the same pose, the same number of people and the same
framing. Do not add or remove people, do not replace anyone with a different face, and do
not add any text. Style: hilarious amusement park roller coaster drop photo, wind blowing
hair straight back, exaggerated screaming and laughing faces, motion blur streaks, bright
carnival colors, blue sky, colorful roller coaster track, cartoon comedy energy, family
friendly fun
```

### Feria de Loja — `feria-loja`

La feria de fondo. Strength **0.6**.

```
The attached image is a live photograph that was just taken by this photo booth kiosk
camera. Use that photograph as the base image and as the only reference for who appears. It
shows one or more children. Redraw the same real children from that photograph in the style
described below, keeping their identity, face shape, hair, skin tone, glasses and clothing
clearly recognizable, and keeping the same pose, the same number of people and the same
framing. Do not add or remove people, do not replace anyone with a different face, and do
not add any text. Style: Create a realistic candid photograph of the family from the
provided reference image visiting the Feria de Loja in Loja, Ecuador. Preserve the exact
identity, facial features, body proportions, skin tones, and overall appearance of every
person from the reference image. The scene should look like a genuine photograph taken
spontaneously during their visit to the real Feria de Loja, not a staged promotional image.
Show the family naturally walking through the fairgrounds, talking, laughing, looking
around, or casually enjoying the event instead of standing in a perfectly posed group. Use
an authentic fair environment with realistic crowds, exhibition areas, colorful stalls,
event lights, decorations, and recognizable details of a large Ecuadorian fair. Capture the
atmosphere naturally, as if a professional photographer happened to take the photo while the
family was visiting the Feria de Loja. Use realistic late afternoon or early evening
lighting, natural shadows, authentic skin tones, documentary-style photography, subtle
cinematic quality, and realistic depth of field. Avoid illustration, cartoon, animation,
folk-art style, artificial posing, exaggerated colors, overly perfect backgrounds, or
generic amusement park scenery. The final image must look like an authentic real-life
photograph of this specific family spending time at the Feria de Loja.
```

### Disney — `parque-magico`

Castillo y fuegos artificiales. Strength **0.6**.

```
The attached image is a live photograph that was just taken by this photo booth kiosk
camera. Use that photograph as the base image and as the only reference for who appears. It
shows one or more children. Redraw the same real children from that photograph in the style
described below, keeping their identity, face shape, hair, skin tone, glasses and clothing
clearly recognizable, and keeping the same pose, the same number of people and the same
framing. Do not add or remove people, do not replace anyone with a different face, and do
not add any text. Style: Disney animation style, standing in front of the Disneyland castle
at night, tall fairytale castle with glowing turrets, fireworks bursting in the purple sky,
floating sparkles, pastel lavender and pink palette, wide eyed wonder, dreamy storybook
illustration, joyful and innocent
```

### Pixar — `muneco-3d`

Como de pelicula animada. Strength **0.58**.

```
The attached image is a live photograph that was just taken by this photo booth kiosk
camera. Use that photograph as the base image and as the only reference for who appears. It
shows one or more children. Redraw the same real children from that photograph in the style
described below, keeping their identity, face shape, hair, skin tone, glasses and clothing
clearly recognizable, and keeping the same pose, the same number of people and the same
framing. Do not add or remove people, do not replace anyone with a different face, and do
not add any text. Style: Pixar 3D animated movie character style, stylized big head
proportions, soft rounded shapes, subsurface skin shading, glossy expressive eyes, warm
cinematic lighting, high quality animation studio render, colorful simple background,
wholesome and funny
```

### Super Heroes — `super-heroes`

Capa y ciudad al fondo. Strength **0.62**.

```
The attached image is a live photograph that was just taken by this photo booth kiosk
camera. Use that photograph as the base image and as the only reference for who appears. It
shows one or more children. Redraw the same real children from that photograph in the style
described below, keeping their identity, face shape, hair, skin tone, glasses and clothing
clearly recognizable, and keeping the same pose, the same number of people and the same
framing. Do not add or remove people, do not replace anyone with a different face, and do
not add any text. Style: photorealistic cinematic portrait of the child from the provided
reference photo as a young superhero, preserve the child’s exact facial features, identity,
skin tone, hairstyle, body proportions, and overall appearance from the reference image,
wearing a realistic superhero-inspired outfit with a colorful cape gently flowing in the
wind, no logos or recognizable emblems, standing confidently in a natural heroic pose, hands
on hips, overlooking a realistic city skyline during golden hour, warm sunset light, natural
shadows, realistic fabric textures, cinematic depth of field, subtle wind movement,
professional movie-style photography, highly detailed, realistic skin texture and natural
facial expression, empowering and cheerful atmosphere, believable real-world environment,
avoid cartoon, comic book illustration, bold outlines, exaggerated action lines, animated
appearance, or unrealistic proportions
```

### Dinosaurios — `dino-aventura`

Aventura en la jungla. Strength **0.62**.

```
The attached image is a live photograph that was just taken by this photo booth kiosk
camera. Use that photograph as the base image and as the only reference for who appears. It
shows one or more children. Redraw the same real children from that photograph in the style
described below, keeping their identity, face shape, hair, skin tone, glasses and clothing
clearly recognizable, and keeping the same pose, the same number of people and the same
framing. Do not add or remove people, do not replace anyone with a different face, and do
not add any text. Style: friendly cartoon dinosaur jungle adventure, big goofy smiling
dinosaurs peeking from lush green ferns, volcano and waterfall in the distance, warm
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
