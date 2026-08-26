# Prompts de los estilos — para la IA de imagenes

Este documento es para **probar los estilos a mano** en cualquier generador de imagenes
antes de que el backend los conecte, y para que quien conecte la IA sepa exactamente que
le va a llegar desde el frontend.

- Los prompts viven en [photoStyles.js](src/photoStyles.js). **Ese archivo manda**; este
  documento es la copia legible para pegar en una IA.
- Estan en **ingles** a proposito: todos los modelos de imagen responden mejor en ingles,
  incluso para temas locales como la Feria de Loja.
- El frontend **no ejecuta ninguna IA**. Solo manda `styleId` + `stylePrompt` al backend.
- Imagenes de referencia del cliente: carpeta **`/refs`**, solo en el equipo local
  (esta en `.gitignore`: son pesadas y de terceros). Las versiones reducidas que la app
  muestra en el selector estan en `public/styles/`.

---

## Lo primero: esto es IMAGEN A IMAGEN, no texto a imagen

El modelo **no tiene que inventar una persona**. Tiene que agarrar la foto que le mandamos
y devolver a **esa misma persona** dibujada. Si no se le dice explicitamente, casi todos
los modelos generan una cara cualquiera con el estilo pedido, y la persona no se reconoce
—que es lo unico que importa en un totem.

Por eso **todos** los prompts empiezan con esta instruccion, que el codigo pega solo
delante de cada estilo (`IMAGE_INSTRUCTION` en [photoStyles.js](src/photoStyles.js)):

```
Use the provided photograph as the base image. Redraw the same real person from that
photo in the style described below. Keep their identity, face shape, hair, skin tone,
glasses and clothing recognizable, and keep the same pose and framing. Do not invent a
different person and do not add any text.
```

Se compone en un solo lugar a proposito: si se escribiera a mano en cada estilo, tarde o
temprano se olvida en uno y ese estilo devuelve la cara de otro.

Al probar a mano: **adjunta la foto** y usa el modo img2img / "editar imagen" / "referencia
de imagen" del generador. Pegar solo el texto no sirve para nada.

---

## Los 4 estilos

| Estilo | Que es | Referencia |
|---|---|---|
| Rubber Hose | Caricatura de los anos 30, crema y rojo | `refs/rubber-hose.jpg` |
| Mundial 2026 | Cromo de album de la seleccion de Ecuador | `refs/mundial.jpg` |
| Cabezon | Cabeza gigante, cuerpo chiquito | falta |
| Muneco 3D | Personaje de pelicula animada | falta |

Las referencias tambien se muestran en el selector del totem, con la etiqueta "Ejemplo".
Para agregar las que faltan: generar la imagen con su prompt y guardarla como
`public/styles/cabezon.jpg` y `public/styles/muneco-3d.jpg` (720 px de ancho basta).
Aparecen solas, sin tocar codigo.

Solo **Rubber Hose** es retro. Los otros tres son actuales a proposito.

---

## Sin nombres en la imagen

El totem pide el nombre **despues** de la foto, asi que cuando la IA genera la imagen
todavia no existe ningun nombre. Por eso:

- Ningun prompt pide placas, carteles ni leyendas.
- El negativo bloquea `text, letters, words, names, captions, name plate`.
- El cromo del mundial lleva su placa roja, pero **la dibuja el totem** con el nombre del
  evento (FERIA DE LOJA / NODO), no la IA y no el nombre de la persona.

Un modelo de imagenes escribiendo texto casi siempre produce letras deformes. Es la falla
que mas arruina una foto de feria.

---

## Como probar un estilo ahora mismo

1. Tomate una selfie normal, de frente, con la cara centrada.
2. Abre un generador que acepte **imagen + prompt** (img2img):
   ChatGPT/DALL·E, Midjourney (imagen adjunta + `--iw`), Stable Diffusion WebUI,
   Leonardo, Krea, Flux.
3. **Adjunta la foto** y pega el prompt completo (instruccion + estilo) y el negativo.
4. Usa el valor de **strength / denoise** de cada estilo:
   - Muy bajo (0.3) → casi no cambia, sigue pareciendo foto.
   - Muy alto (0.85) → queda lindo pero **ya no se parece a la persona**.
   - Los valores de aqui son el punto medio.
5. Anota cual te gusto y con que numero. Ese numero va a `photoStyles.js` en `ai.strength`.

> Consejo de feria: prueba cada prompt con **tres caras distintas** (piel clara, piel
> oscura, alguien con lentes). Un prompt que solo funciona con una cara falla la mayoria
> de las veces en el estand.

---

## Negativo comun a todos los estilos

```
different person, face swap, photorealistic, extra faces, extra limbs, deformed face,
distorted eyes, blurry, low quality, watermark, nsfw, text, letters, words, names,
captions, name plate, typography, signature, mean spirited caricature, ugly, grotesque,
creepy, scary, insulting exaggeration
```

Tres grupos, los tres necesarios:

- **`different person, face swap`** — la falla numero uno: devolver a otra persona.
- **`text, letters, names, ...`** — no hay nombre que escribir, y las letras salen mal.
- **`mean spirited, grotesque, ...`** — es una feria familiar. Sin esto los modelos se
  pasan de la raya con narices y dientes, y la gente se molesta.

---

## 1. Rubber Hose — `rubber-hose`

Caricatura de los anos 30, dos tintas (crema y rojo). Es el estilo por defecto y el unico
retro. Referencia: `refs/rubber-hose.jpg`.

**Strength: 0.62**

```
1930s rubber hose cartoon portrait, cream and vermillion two color print, thick black ink
outlines, round pie-cut eyes, big friendly smile, white gloves aesthetic, looping curved
limbs, hand inked vintage animation cel, aged paper with light speckles, warm and family
friendly
```

> La referencia es un retrato **de familia**. Si la IA va a procesar grupos, cambiar
> `portrait` por `group portrait`.

---

## 2. Mundial 2026 — `mundial-2026`

Cromo de album de la seleccion de Ecuador, **actual, nada de serigrafia retro**.
Referencia: `refs/mundial.jpg`.

**Strength: 0.45** (el mas bajo de todos: aqui la cara debe seguir siendo una foto nitida,
lo que cambia es la ropa y el fondo)

```
modern football collectible sticker portrait, glossy trading card look, the person wearing
a bright yellow Ecuador national football jersey with navy blue collar, vivid turquoise and
yellow graphic background with bold abstract shapes, flag colors of Ecuador, crisp modern
sports studio lighting, high saturation, clean vector shapes, no text anywhere in the image
```

**Sin IA ya funciona:** este estilo no es un filtro de dibujo, es un **marco**. El totem
mantiene la foto nitida y le dibuja encima el cromo completo (borde blanco de sticker,
escudo con la bandera, franja turquesa con "2026" y placa roja con el nombre del evento).
Lo unico que la IA agrega es la **camiseta amarilla** y el fondo, que no se pueden inventar
sin modelo.

> Ojo legal: los escudos de la FEF, el logo de FIFA y la marca Panini **no** se usan.
> Solo los colores de la bandera y una tipografia deportiva. Si el evento consigue permiso
> de alguna de esas marcas, se agrega despues.

---

## 3. Cabezon — `cabezon`

Cabeza gigante, cuerpo chiquito. El clasico de feria.

**Strength: 0.60**

```
funny caricature portrait, oversized head on a small cartoon body, exaggerated friendly
features, big expressive eyes and huge smile, smooth cel shading, bright saturated colors,
modern cartoon illustration, theme park caricature artist style, playful and flattering,
family friendly
```

**Sin IA ya funciona a medias:** el totem agranda la cabeza de verdad con una lente de
aumento sobre el ovalo guia (`bulge` en `photoStyles.js`). No dibuja un cuerpo chiquito
—eso solo lo puede hacer la IA— pero el efecto ya se nota y da risa.

---

## 4. Muneco 3D — `muneco-3d`

Como personaje de pelicula animada. El mas "familiar" de los cuatro.

**Strength: 0.58**

```
cute 3d animated movie character portrait, stylized big head proportions, soft rounded
shapes, subsurface skin shading, glossy expressive eyes, warm cinematic lighting, modern
animation studio render, colorful simple background, wholesome and funny
```

> Este es el que mas depende de la IA: sin modelo, el totem solo puede suavizar y
> agrandar un poco la cabeza. Si en las pruebas no convence, es el primer candidato a
> reemplazar.

---

## Que recibe el backend

Cuando la persona envia la foto, el frontend agrega estos campos al POST
(ademas de `name`, `email`, `phone`, `photo`). Van en las tres estrategias de subida
—multipart, base64 y two-step— sin que haya que cambiar nada:

| Campo | Ejemplo | Que es |
|---|---|---|
| `styleId` | `mundial-2026` | Identificador del estilo elegido |
| `styleMode` | `image-to-image` | La foto adjunta es la **base**, no se genera desde cero |
| `stylePrompt` | `Use the provided photograph as the base image... Style: modern football...` | Prompt completo, ya trae la instruccion |
| `styleNegative` | `different person, face swap, ...` | Negativo comun |
| `styleStrength` | `0.45` | Cuanto respetar la foto original (0 a 1) |

El backend decide que hacer con eso:

- **Opcion 1 (la de hoy):** ignorarlo. La foto ya llega ilustrada por el propio totem
  (filtro de canvas, ver seccion 10 del [README](README.md)). Funciona sin internet y
  sin GPU.
- **Opcion 2:** usar `stylePrompt` + la foto como imagen base, y mandar la generada al
  correo.

> Importante para quien conecte la IA: si la generacion tarda mas de ~20 segundos, hay que
> avisarlo, porque el totem muestra "Enviando" y la gente se cansa. Lo razonable es que el
> backend responda rapido (`202 Aceptado`) y genere la imagen despues, ya que el resultado
> igual llega por correo, no por pantalla.

---

## Agregar o cambiar un estilo

No hay que tocar codigo de pantallas. Solo `STYLE_DEFS` en `photoStyles.js`:

```js
{
  id: 'mi-estilo',
  name: 'Nombre corto',               // lo que se ve en la tarjeta
  tagline: 'Una linea de gancho',
  swatch: ['#aaa', '#bbb', '#ccc'],   // colores mientras carga la miniatura
  local: {
    posterize: 6,                     // tonos por canal (menos = mas dibujo)
    edge: 55,                         // umbral del contorno (999 = sin lineas)
    saturation: 1.4,
    tint: [1.05, 1, 0.95],            // multiplicadores r, g, b
    bulge: { radius: 1.2, strength: 0.5, dy: 0 },  // o null
    frame: { kind: 'paper', bg: '#f00', title: '#fff', foot: '#ff0' },
  },
  ai: {
    style: 'solo la descripcion del estilo, sin la instruccion',
    strength: 0.6,
  },
}
```

`IMAGE_INSTRUCTION` se pega delante solo. La tarjeta nueva aparece sola en el selector,
con su miniatura generada en vivo.
