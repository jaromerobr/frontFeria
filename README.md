# Totem de Fotos — FERIA DE LOJA

Aplicacion de kiosco (totem) en **React + Vite**. Una sola pagina, navegacion por
estados, sin router, sin librerias de UI. Toma una foto con la camara, la convierte
en **ilustracion** segun el estilo que elija la persona, le pone el marco de la feria, y
la envia a su correo.

Funciona **completa sin backend** (modo `fake`) y **sin camara** (modo `demo`).

> **¿Primera vez aqui?** Empieza por **[CONTEXTO.md](CONTEXTO.md)**: que es el proyecto,
> como esta hoy y que falta, en dos minutos de lectura.
>
> **Backend:** todo lo que hace falta para conectarlo esta en **[INTEGRACION.md](INTEGRACION.md)**.
> Es un solo documento, no hay que leer el resto del proyecto.
> El generador de imagenes (`POST /image-generation/upload`) **ya esta implementado**
> contra el contrato real; falta el endpoint del envio por correo.

---

## 1. Arranque rapido

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # genera /dist para produccion
npm run preview  # sirve /dist tal como quedara en el totem
npm run qr       # regenera los codigos QR de las redes de NODO
```

Al abrirlo funciona ya en **modo demo**: la cuenta regresiva termina y aparece una
foto de prueba (`public/demo-photo.svg`); el envio es simulado (2 s) y siempre da exito.

---

## 2. Flujo de pantallas

```
WELCOME ──> GRUPO ──> ESTILO ──> COUNTDOWN ──0──> PROCESSING ──> PREVIEW ──> FORM
                        ▲   ▲                                    │   │          │
                        │   └────────── REPETIR ─────────────────┘   │       ENVIAR
                        └───────────── OTRO ESTILO ──────────────────┘
                                                             │
                                                             ▼
                                     WELCOME <──5 s── SUCCESS <── SENDING
                                                                    │ falla
                                                                    ▼
                                                                  ERROR
                                                          (Reintentar / Salir)
```

Todo vive en [App.jsx](src/App.jsx): un `useState` con el nombre de la pantalla y un
`switch` que decide que renderizar. No hay rutas ni URLs; en un totem no sirven.

---

## 3. Estructura

```
src/
├── config.js              <- TODAS las variables ajustables (leer primero)
├── photoGroups.js         <- solo / pareja / familia / ninos
├── photoStyles.js         <- los 16 estilos y sus prompts
├── social.js              <- web y redes de NODO (los QR salen de aqui)
├── sponsors.js            <- logos de la banda inferior
├── kiosk.js               <- pantalla completa, bloqueo de F5/menu contextual
├── App.jsx                <- maquina de estados + reset de sesion
├── styles.css             <- estilos (escalan con clamp a cualquier monitor)
│
├── services/
│   ├── camera.js          <- UNICO punto que toca el hardware
│   ├── ai.js              <- generacion de la imagen (Gemini via backend)
│   ├── photoEffect.js     <- ilustracion + marco (canvas puro, sin IA)
│   └── api.js             <- UNICO punto que habla con el backend
│
├── hooks/
│   ├── useCountdown.js    <- cuenta regresiva reusable
│   └── useIdleTimeout.js  <- timeout de sesion del totem
│
├── components/            <- piezas reutilizables (boton, campo, marco de foto...)
└── screens/               <- una pantalla del flujo cada uno
```

Regla de oro: **ninguna pantalla llama a `fetch` ni a `getUserMedia`.** Todo pasa por
`services/`. Por eso conectar la camara real o el backend real no obliga a tocar la UI.

---

## 4. Variables de configuracion

Se editan en [config.js](src/config.js) o, mejor, en un archivo `.env`
(copiar `.env.example` a `.env`). **Vite exige el prefijo `VITE_` y reiniciar `npm run dev`
despues de cambiarlo.**

| Variable | Default | Para que sirve |
|---|---|---|
| `VITE_COUNTDOWN_SECONDS` | `10` | Segundos de cuenta regresiva |
| `VITE_SUCCESS_SECONDS` | `5` | Cuanto dura la pantalla final antes de volver al inicio |
| `VITE_SESSION_TIMEOUT_MS` | `60000` | Inactividad antes de reiniciar la sesion |
| `VITE_SESSION_WARNING_SECONDS` | `15` | Cuando aparece el aviso "Sigues ahi?" |
| `VITE_BRAND_TITLE` / `VITE_BRAND_SUBTITLE` | FERIA DE LOJA / Photo Booth | Textos de portada |
| `VITE_BRAND_FOOTER` | NODO | Marca en la banda inferior de la foto |
| `VITE_MIRROR_CAMERA` | `true` | Efecto espejo del preview **y de la foto guardada** |
| `VITE_AI_MODE` | `off` | `off` (filtro local) / `real` (se lo pide al backend) |
| `VITE_AI_TIMEOUT_MS` | `60000` | Espera maxima a la IA antes de usar el filtro local |
| `VITE_PROCESSING_MIN_MS` | `1400` | Minimo que se ve la pantalla de espera |
| `VITE_PROCESSING_SLOW_SECONDS` | `18` | Cuando avisa que la generacion va lenta |
| `VITE_PHOTO_EFFECT` | `cartoon` | `cartoon` (caricatura) / `none` (foto normal) |
| `VITE_PHOTO_FRAME` | `true` | Marco de papel + banda con la marca |
| `VITE_FACE_CX/CY/W/H` | `.5/.42/.3/.46` | Posicion del ovalo guia de encuadre |
| `VITE_CAMERA_MODE` | `demo` | `demo` / `webcam` / `service` |
| `VITE_DEMO_PHOTO` | `/demo-photo.svg` | Imagen usada en modo demo |
| `VITE_CAMERA_SERVICE_URL` | `http://localhost:5000` | Servicio local de camara |
| `VITE_API_MODE` | `fake` | `fake` (simulado) / `real` |
| `VITE_API_BASE_URL` | `http://localhost:8080` | Backend del companero |
| `VITE_UPLOAD_STRATEGY` | `multipart` | `multipart` / `base64` / `two-step` |
| `VITE_API_TIMEOUT_MS` | `30000` | Espera maxima del envio |

---

## 5. CONEXION CON EL BACKEND — lo que hay que acordar

Todo el contacto con el backend esta en **un solo archivo**: [api.js](src/services/api.js).
La UI unicamente llama:

```js
await sendPhoto({ name, email, phone, photo })
// photo = { dataUrl: "data:image/jpeg;base64,...", blob: Blob }
```

Ya estan implementadas las **tres opciones** posibles. Cuando el backend decida cual usa,
se cambia **solo** `VITE_UPLOAD_STRATEGY`. Nada mas.

### Opcion A — `multipart` (recomendada, es la que esta por defecto)

```http
POST {API_BASE_URL}/api/photos
Content-Type: multipart/form-data

name=James
email=james@email.com
phone=0999999999
photo=<archivo photo.jpg>
```

Respuesta esperada: `200 OK`, JSON opcional `{ "id": "..." }`.

> El navegador pone el `boundary` solo. El backend **no** debe exigir un `Content-Type` fijo.

### Opcion B — `base64`

```http
POST {API_BASE_URL}/api/photos
Content-Type: application/json

{
  "name": "James",
  "email": "james@email.com",
  "phone": "0999999999",
  "image": "data:image/jpeg;base64,/9j/4AAQ..."
}
```

Ojo: el cuerpo pesa ~33 % mas que la imagen. Hay que subir el limite del servidor
(`client_max_body_size` en nginx, `MAX_CONTENT_LENGTH` en Flask, etc.).

### Opcion C — `two-step`

```http
1) POST {API_BASE_URL}/api/photos/upload   (multipart, campo "photo")
   -> 200 { "photoUrl": "https://..." }

2) POST {API_BASE_URL}/api/send            (application/json)
   { "name": "...", "email": "...", "phone": "...", "photoUrl": "..." }
   -> 200
```

### Contrato de errores

El frontend considera error cualquier respuesta con status distinto de 2xx y muestra la
pantalla de error con boton **Reintentar**. Si el backend puede devolver un mensaje
legible para el usuario, que lo mande en el body:

```json
{ "message": "El correo ya recibio una foto hoy" }
```

### CORS

El frontend corre en `http://localhost:5173` (dev) o en el origen del totem (prod).
El backend debe permitir ese origen y los metodos `POST, OPTIONS`. Si no, todo falla
con "No hay conexion con el servidor" aunque el servidor este vivo.

### Cambiar del backend falso al real

```env
VITE_API_MODE=real
VITE_API_BASE_URL=http://192.168.1.50:8080
VITE_UPLOAD_STRATEGY=multipart
```

Para probar la pantalla de error sin backend, descomentar el `throw` dentro de
`sendPhotoFake()` en [api.js](src/services/api.js).

---

## 6. CONEXION CON LA CAMARA

Tambien en **un solo archivo**: [camera.js](src/services/camera.js). La UI solo llama
`startCamera()`, `capturePhoto()` y `stopCamera()`.

| `VITE_CAMERA_MODE` | Que hace | Cuando usarlo |
|---|---|---|
| `demo` | Devuelve la imagen de `/public` | Desarrollo y pruebas sin hardware |
| `webcam` | `getUserMedia` del navegador + preview en vivo | Webcam USB con Chromium en el Jetson |
| `service` | `POST http://localhost:5000/capture` -> jpeg | Camara controlada por Python/OpenCV |

### Modo `webcam`

Funciona directo, pero el navegador **exige contexto seguro**: `localhost` o `https`.
Si se abre el totem por IP (`http://192.168.x.x:5173`) el navegador **bloquea la camara**.
En el Jetson, abrir siempre por `localhost`.

### Modo `service` (recomendado para el Jetson)

Desacopla React del hardware: da igual si la camara es USB, CSI, RTSP o una DSLR.

Contrato que debe cumplir el servicio local:

```http
POST http://localhost:5000/capture
-> 200, Content-Type: image/jpeg, body = imagen binaria
```

Si prefieren devolver JSON (`{"image": "data:image/jpeg;base64,..."}`), se ajusta
`captureFromService()` en [camera.js](src/services/camera.js) — son 3 lineas.

---

## 7. Comportamiento propio de un totem

Cosas que ya estan implementadas y que conviene no romper:

- **Reset de sesion por inactividad** (`SESSION_TIMEOUT_MS`, 60 s). Si alguien se va a la
  mitad, el totem vuelve solo a WELCOME. Con aviso visible 15 s antes.
- **Borrado de datos**: `resetSession()` en [App.jsx](src/App.jsx) pone `photo = null` y
  `userData = null`, y apaga la camara. La siguiente persona nunca ve datos de la anterior.
- **Pantalla completa** al pulsar *Comenzar* (los navegadores solo lo permiten dentro de un
  gesto del usuario, por eso no se puede hacer al cargar).
- **Guardas de kiosco** en [kiosk.js](src/kiosk.js): sin menu contextual, sin seleccion de
  texto, sin F5 / Ctrl+R / Ctrl+P.
- **Cursor oculto** (`cursor: none` en el `body`) — es una pantalla tactil.
- **Sin scroll** y todo escalado con `clamp()`: sirve igual en 1920x1080 horizontal que en
  un monitor vertical de totem.
- **Pantalla de error siempre con salida**: Reintentar o Salir. Nunca se deja al usuario
  atascado frente a una pantalla muerta.

### Arrancar en modo kiosco real

```bash
npm run build
npm run preview -- --port 5173
```

Y lanzar el navegador asi (Linux/Jetson):

```bash
chromium-browser --kiosk --noerrdialogs --disable-infobars \
  --disable-session-crashed-bubble --autoplay-policy=no-user-gesture-required \
  http://localhost:5173
```

---

## 8. Como probar el flujo completo hoy (sin camara ni backend)

1. `npm run dev`
2. **Comenzar** -> cuenta 10...1 -> aparece la foto de prueba.
3. **Repetir** -> vuelve a la cuenta regresiva.
4. **Aceptar** -> formulario. Probar validaciones: nombre vacio, correo sin `@`, celular corto.
5. **Enviar foto** -> pantalla "Enviando" 2 s -> exito -> vuelve al inicio a los 5 s.
6. **Timeout**: entrar al formulario y no tocar nada 60 s -> aviso a los 15 s -> reinicio solo.
   Para probarlo mas rapido, poner `VITE_SESSION_TIMEOUT_MS=10000`.
7. **Error**: descomentar el `throw` en `sendPhotoFake()` -> probar Reintentar y Salir.
8. **Camara real en el portatil**: `VITE_CAMERA_MODE=webcam` y reiniciar el dev server;
   se ve el video en vivo detras de la cuenta regresiva.

---

## 9. Checklist de integracion (pendientes de acordar con el equipo)

- [ ] Estrategia de subida: `multipart` / `base64` / `two-step` -> fijar `VITE_UPLOAD_STRATEGY`
- [ ] URL e IP del backend en el Jetson -> `VITE_API_BASE_URL`
- [ ] CORS habilitado para el origen del totem
- [ ] Formato de error del backend (`{ "message": "..." }`)
- [ ] Modo de camara definitivo -> `VITE_CAMERA_MODE`
- [ ] Si es `service`: confirmar que devuelve `image/jpeg` en `POST /capture`
- [ ] Reemplazar `public/demo-photo.svg` por una foto real de prueba si se quiere
- [ ] Logo de la marca en `public/` y meterlo en la pantalla de bienvenida
- [ ] Definir si el correo lo envia el backend o un servicio externo

---

## 10. El efecto de caricatura

Esta en [photoEffect.js](src/services/photoEffect.js). **Canvas puro: sin librerias, sin
internet y sin IA** — por eso corre en el Jetson y no depende de ningun servicio.

Pasos que aplica a cada foto:

0. **Deformacion chistosa** (solo los estilos que la piden) — una lente de aumento sobre
   la cara: agranda la cabeza (Cabezon). Va **antes** que
   todo lo demas: si se deformara despues del posterizado, las manchas planas se
   estirarian dejando escalones.
1. **Saturacion** — sube el color para que parezca dibujo, no fotografia.
2. **Posterizado** — reduce a `posterize` tonos por canal: manchas planas de color,
   que es lo que hace que se vea "animada".
3. **Contorno de tinta** — detector de bordes Sobel; donde el borde supera
   `edge` oscurece el pixel. Eso dibuja las lineas negras del estilo cartoon.
4. **Tinte calido + vineta** — le da el aire de papel viejo.
5. **Marco + marcas** — dos tipos: `paper` (borde de papel con banda de color, para los
   estilos dibujados) y `panini` (cromo de album completo: borde blanco de sticker,
   escudo con la bandera, franja con "2026" y placa roja), que usa Mundial 2026.

### Para que sirve el ovalo guia

No hay reconocimiento facial (costaria una libreria pesada y CPU del Jetson). El **ovalo
guia** lo reemplaza: mientras cuenta, la pantalla le pide a la persona centrarse en el.
Si lo hace, ya sabemos donde esta su cara.

`FACE_GUIDE` (en [config.js](src/config.js)) es **un solo dato** para dos cosas: dibuja el
ovalo en pantalla y le dice al estilo Cabezon donde agrandar. Si mueves el ovalo, la
deformacion se mueve con el.

Tambien le conviene a la IA: caras centradas y del mismo tamano en todas las fotos hacen
que el modelo devuelva resultados parecidos entre si, en vez de depender de si la persona
se paro cerca o lejos de la camara.

> Para que esto funcione, la foto guardada debe ser **exactamente el recorte que la persona
> vio**. Por eso `captureFromWebcam()` recorta el video igual que el `object-fit: cover`
> de la pantalla, en vez de guardar el cuadro completo de la camara.

### Ajustes tipicos en feria

Cada estilo trae sus propios numeros en [photoStyles.js](src/photoStyles.js) (campo `local`),
porque un cromo del mundial y una caricatura no pueden usar los mismos:

| Sintoma | Que tocar |
|---|---|
| Se ve poco caricatura | Bajar `posterize` del estilo a `4` |
| Muchas lineas negras / ruido | Subir `edge` a `70-90` |
| Faltan lineas | Bajar `edge` a `40` |
| Foto nitida, sin contornos | `edge: 999` (asi funciona Mundial 2026) |
| La deformacion es exagerada | Bajar `bulge.strength` (`0.55` -> `0.35`) |
| Agranda la parte equivocada | Mover `bulge.dy` y `bulge.radius` |
| La gente sale muy abajo | Subir `VITE_FACE_CY` (ej. `0.46`) |
| Sin efecto, foto normal | `VITE_PHOTO_EFFECT=none` |

---

## 11. Estilo visual (para no romperlo)

El estilo es **rubber hose / cartel de feria**, deliberadamente lo contrario al look
"tech generico". Las reglas estan escritas arriba de [styles.css](src/styles.css):

1. Fondo de **papel crema** con rayos de cartel y trama de puntos. Nunca degradados
   oscuros morados/azules.
2. Todo lleva **contorno de tinta grueso** (`--line`) y **sombra dura sin blur**.
   Nada de sombras difuminadas ni vidrio esmerilado.
3. **Colores planos** de la paleta (`--red`, `--mustard`, `--teal`, `--blue`).
   Sin gradientes en botones ni textos.
4. Las cosas van **ligeramente inclinadas** y se mueven (banderines, botones que respiran).
   La simetria perfecta es justo lo que hace que algo se vea generado.
5. Tipografia **Bungee** (titulos) + **Baloo 2** (texto), empaquetadas con `@fontsource`,
   asi que **funcionan sin internet** en el totem.

> Nota de pruebas: el boton principal tiene animacion infinita (`--pulse`), asi que
> Playwright espera a que "se quede quieto" y falla. En pruebas automatizadas hay que
> hacer click con `{ force: true }`.

---

## 12. Imagenes y assets — que hace falta

Lo que hay ahora es todo **SVG generado, sin fotos reales**:

| Archivo | Que es | Reemplazar por |
|---|---|---|
| `public/styles/rubber-hose.jpg` | referencia del estilo (del cliente) | ya esta |
| `public/styles/mundial-2026.jpg` | referencia del estilo (del cliente) | ya esta |
| `public/styles/cabezon.jpg` | **falta** | referencia del estilo cabezon |
| `public/styles/muneco-3d.jpg` | **falta** | referencia del estilo muneco 3D |
| `public/demo-photo.svg` | foto de prueba del modo demo | **una foto real de una cara** |
| `public/logo.webp` | logo oficial de NODO | ya esta |

El logo de NODO (`public/logo.webp`) aparece en tres sitios a la vez: el boton de inicio,
la esquina de cada foto y la banda de auspiciantes. Para cambiarlo, reemplazar el archivo
con el mismo nombre. Si no existiera, el codigo lo ignora y no se rompe nada.

Recomendacion para el material grafico:

- **Iconos y logos**: SVG, no PNG. Escalan a cualquier monitor y pesan nada.
- **Fondos**: mejor generados con CSS (como ahora) que fotos. Una foto de fondo se ve
  pixelada en un monitor de totem y pesa megas.
- **Logos**: SVG con fondo transparente. Si solo hay PNG, que sea de al menos 1000 px
  de ancho.
- **Fotos de la feria**: solo tienen sentido en la pantalla de bienvenida como collage.
  Si se usan, comprimir a WebP y ninguna de mas de 300 KB — el totem debe arrancar
  al instante.

---

## 13. Con quien sale la foto, y los estilos

Antes del estilo, el totem pregunta **quien sale en la foto**: solo, en pareja, en familia
o ninos ([photoGroups.js](src/photoGroups.js)). No es una pregunta decorativa, cambia tres
cosas de verdad:

1. **Que estilos se ofrecen.** Un cromo de futbol no funciona con cinco personas y una
   postal de San Valentin no funciona con una sola. Cada estilo declara en que grupos
   aparece; varios estan en mas de uno.
2. **El encuadre.** La guia en pantalla se ensancha segun cuanta gente entra. En el grupo
   de ninos ademas **baja**, porque los ninos son mas bajos y con el ovalo de adulto salen
   cortados por abajo.
3. **La cuenta regresiva.** 10 s solo, 12 s en pareja o ninos, 15 s en familia. Una familia
   de cinco tarda mas en acomodarse, y 10 segundos que le sobran a uno son pocos para cinco.

Ademas se le dice a la IA cuanta gente hay, y se le prohibe agregar o quitar personas: es
la falla favorita de los modelos en fotos de grupo.

Cuenta regresiva: **5 s** solo, **6 s** en pareja, familia y ninos. Mas que eso, en una
feria con fila, se hace eterno y la gente se distrae justo antes del disparo.

| Grupo | Estilos |
|---|---|
| **Solo** | Mundial 2026, Dragon Ball, Astronauta, Cabezon |
| **En pareja** | San Valentin, Paris, Montana Rusa, Cine, Rubber Hose, Feria de Loja |
| **En familia** | Rubber Hose, Los Simpson, Feria de Loja, NASA, Disney, Pixar |
| **Ninos** | Cabezon, Montana Rusa, Feria de Loja, Disney, Pixar, Super Heroes, Dinosaurios |

Los 16 tienen su **imagen de ejemplo** en `public/styles/<id>.jpg`.

> **Marcas registradas:** cuatro estilos (Dragon Ball, Los Simpson, Disney, Pixar) nombran
> la franquicia en el prompt. Es una decision del cliente, tomada porque sin nombrarlas el
> modelo no acierta el estilo. Queda anotado porque es un evento publico con auspiciantes:
> si algun dia hay que quitarlas, son esas cuatro y se cambia su `ai.style`.

---

## 14. Selector de estilos

Cada tarjeta muestra **dos cosas distintas segun el momento**, y es a proposito:

- **Antes de la foto** -> la imagen de **referencia** del estilo, con la etiqueta
  "Ejemplo". Todavia no hay foto de la persona, asi que lo util es ensenar a que
  aspira el estilo. Las referencias son las que paso el cliente (`/refs`), reducidas
  a 720 px en `public/styles/`.
- **Despues de la foto** ("Otro estilo") -> **la cara de la propia persona** pasada por
  cada filtro. Ya no interesa el ejemplo: interesa como quedo ella.

Convencion de archivos: **`public/styles/<id>.jpg`**. Si el archivo no existe, la tarjeta
cae sola a la miniatura generada, asi que se pueden agregar referencias despues sin tocar
codigo. Hoy faltan `cabezon.jpg` y `muneco-3d.jpg`.

Despues de elegir el grupo aparecen **solo los estilos de ese grupo**. Las miniaturas **no son
imagenes guardadas**: se generan en el momento aplicando el filtro real, asi que si
cambias un estilo, la tarjeta cambia sola.

Desde la vista previa hay un boton **"🎨 Otro estilo"** que vuelve al selector, pero ahi
las miniaturas usan **la cara de la propia persona** — y al elegir, **no se vuelve a tomar
la foto**: se reprocesa la original que quedo guardada en `rawShot`. Es la parte que mas
engancha y la que mas fila hace avanzar, porque no repite la cuenta regresiva.

Los estilos estan en [photoStyles.js](src/photoStyles.js). Cada uno trae dos cosas:

- `local` — el filtro de canvas que corre **hoy**, sin internet ni IA.
- `ai` — la descripcion del estilo para el modelo de imagenes. El prompt final se compone
  solo, pegandole delante la instruccion de **imagen a imagen** (usar la foto como base y
  devolver a la misma persona), asi ningun estilo puede quedarse sin ella.

Los prompts, como probarlos a mano y que recibe el backend estan en **[PROMPTS.md](PROMPTS.md)**.

---

## 15. Barra de auspiciantes

Banda inferior que se desplaza sin parar, **visible en todas las pantallas**
([SponsorBar.jsx](src/components/SponsorBar.jsx)).

Para agregar un logo:

1. Deja el archivo en `public/sponsors/` (SVG o PNG con fondo transparente).
2. Agrega la linea en [sponsors.js](src/sponsors.js):
   ```js
   { name: 'ACME', logo: '/sponsors/acme.svg' },
   ```

Mientras el archivo no exista, la banda muestra **el nombre en un recuadro punteado**.
Eso es a proposito: el espacio ya esta reservado con el tamano final, asi que cuando
lleguen los logos definitivos no se descuadra nada.

- La velocidad se cambia con `SPONSOR_SCROLL_SECONDS` en el mismo archivo.
- La lista se pinta dos veces y la animacion recorre la mitad: por eso el bucle no salta.
- El logo de NODO es `public/logo.webp`. Reemplazarlo con el mismo nombre de archivo y
  cambia en los tres sitios donde aparece.

---

## 16. Teclado, consentimiento, sonido y cola de reintentos

Cuatro cosas que no se ven en una demo pero deciden si el totem aguanta un dia
de feria.

### Teclado en pantalla — [OnScreenKeyboard.jsx](src/components/OnScreenKeyboard.jsx)

El totem es tactil y **no tiene teclado fisico**. Chromium en Linux tampoco muestra uno
solo, asi que sin esto el formulario es imposible de llenar en el hardware real.

- Esta hecho **dentro de la app**, no con el teclado del sistema: no depende de que
  alguien haya instalado `onboard` o `squeekboard` en el Jetson.
- Tres distribuciones segun el campo: texto, correo (con `@`, los cuatro dominios mas
  comunes y la tecla "punto") y numerica para el celular.
- **Numeros siempre visibles** y una segunda capa de simbolos (`?#$`): muchos correos
  llevan numeros, y obligar a cambiar de capa para escribir un 1 es una molestia.
- Los campos son `<div>`, no `<input>`: asi no aparece ningun cursor del sistema ni un
  segundo teclado, y la unica entrada posible es la nuestra.
- Cada tecla usa `onPointerDown` con `preventDefault()`. Con `onClick` el campo perderia
  el foco al tocar la tecla y el teclado se cerraria solo.
- Con el teclado abierto la pantalla **esconde la foto** y compacta todo, porque si no la
  ultima fila de teclas queda fuera de la pantalla y no se puede ni cerrar el teclado.
  En vertical el teclado se ancla abajo, donde cae la mano.

**Tambien funciona un teclado fisico**, por si alguien conecta uno por USB para una demo o
para llenar el formulario mas rapido. Como los campos son `<div>`, el navegador no escribe
solo: [UserForm.jsx](src/components/UserForm.jsx) escucha las teclas a mano.

| Tecla | Que hace |
|---|---|
| Cualquier caracter | Escribe en el campo activo. **Si no hay ninguno activo, salta al primer campo vacio**: quien tiene teclado espera escribir de una, sin tocar la pantalla antes |
| `Backspace` | Borra el ultimo caracter |
| `Enter` / `Tab` | Pasa al siguiente campo; en el ultimo, cierra el teclado |
| `Escape` | Cierra el teclado |

Verificado en 1280x800, 1920x1080 y **1080x1920** (el caso real del totem).

### Consentimiento

Se piden correo y celular a personas en la calle, asi que hay un checkbox obligatorio.
Al backend no se le manda solo `consent: true`, tambien **el texto exacto que la persona
acepto y la fecha** (`consentText`, `consentAt`): si algun dia alguien pregunta a que dio
permiso, la respuesta tiene que estar guardada con la foto.

El texto se cambia con `VITE_CONSENT_TEXT`.

### Sonido — [sound.js](src/services/sound.js)

Pitido por segundo (mas agudo en los ultimos tres), obturador al disparar, y notas de
exito o error. En una feria con musica, sin sonido la gente no sabe cuando fue la foto y
sale mirando a otro lado.

Los sonidos se **generan** con Web Audio: no hay archivos que descargar y funciona sin
internet. El navegador no deja sonar nada hasta que el usuario toca la pantalla, por eso
`initSound()` se llama dentro del boton *Comenzar*. Se apaga con `VITE_SOUND_ENABLED=false`.

### Cola de envios pendientes — [queue.js](src/services/queue.js)

Si el wifi se cae justo en el envio, la pantalla de error ofrece **"Enviar mas tarde"**:
la foto se guarda en el equipo y se reintenta sola cada 45 s (y cuando el navegador avisa
que volvio la conexion). La persona ya se fue, pero su foto igual le llega.

Privacidad: ahi quedan datos personales guardados en el totem, asi que cada envio se borra
apenas entra, hay un maximo de elementos y caducan a las 12 horas. `clearQueue()` deja el
equipo limpio al terminar el evento.

---

## 17. La espera mientras se genera la imagen

Generar con Gemini tarda entre 5 y 20 segundos, y la persona esta parada mirando la
pantalla. Un "Cargando..." ahi se hace eterno, asi que
[ProcessingScreen.jsx](src/screens/ProcessingScreen.jsx) hace tres cosas:

1. **Le muestra su propia foto revelandose**, de gris a color, con una linea de luz que la
   recorre como en un cuarto oscuro. Es lo mas importante: confirma que la foto salio bien
   y le da algo suyo que mirar, no un circulito girando.
2. **Mensajes que van cambiando** cada 2,6 s ("Mezclando la tinta...", "Afilando los
   lapices..."), para que se note que algo avanza.
3. **Una barra que se acerca al 94 % y se frena.** Nadie sabe cuanto va a tardar el modelo,
   asi que prometer un porcentaje exacto seria mentira. El 100 % lo pone la foto al
   aparecer, no el reloj.

Pasados `VITE_PROCESSING_SLOW_SECONDS` (18 s) admite que va lenta y pide que no se vaya.
Una espera larga molesta mucho menos cuando alguien te dice que sabe que es larga.

`VITE_PROCESSING_MIN_MS` obliga a que la pantalla se vea al menos 1,4 s: sin IA el filtro
local tarda ~200 ms y la pantalla apareceria como un parpadeo que se siente como un error.

### Si la IA falla, el totem no se detiene

[ai.js](src/services/ai.js) captura cualquier fallo — timeout, error del servidor, Gemini
caido — y **cae solo al filtro local**. La persona igual se lleva su foto y la fila sigue
avanzando. Una feria con fotos menos bonitas es mejor que una feria detenida.

---

## 18. La bienvenida se mueve, y por que

Un totem quieto en una feria es invisible: compite con musica, luces y puestos de comida,
y la gente pasa de largo. [CircusStage.jsx](src/components/CircusStage.jsx) existe para que
se note desde diez metros:

- **rayos de carpa** girando despacio (90 s por vuelta),
- **50 bombillas** de marquesina enmarcando la pantalla, encendiendose en cadena. Las
  tiras verticales usan `space-evenly` y no `space-between`: con `space-between` la primera
  y la ultima caian justo en las esquinas, encima de las que ya pone la tira horizontal, y
  se veian dos bombillas pisadas. Comprobado midiendo todas contra todas: **0 pares
  superpuestos** en las cinco resoluciones, con una separacion minima de 57 px frente a
  bombillas de 10-16 px,
- **banderines** colgados de una cuerda, ondeando como una ola: cada uno con su desfase y su
  duracion, moviendose en tres ejes a la vez (giro, estiron e inclinacion). Con un solo eje
  se ve como un parpadeo; con los tres parece viento,
- **globos** que suben con balanceo,
- **confeti** cayendo y girando,
- el **titulo** balanceandose como un cartel colgado.

Tres decisiones que conviene no deshacer:

1. **Va solo en la bienvenida.** En las demas pantallas la persona esta haciendo algo y las
   animaciones estorban.
2. **Todo se anima con `transform` y `opacity`**, que la GPU resuelve sola. Nada anima
   colores, sombras ni tamanos de fondo: eso obliga al navegador a repintar y en el Jetson
   se nota. Medido: **~100 fps con 90 animaciones corriendo a la vez**.
3. **La capa no recibe toques** (`pointer-events: none`), asi que el confeti nunca se come
   un toque destinado al boton.

Todo se apaga solo si el sistema pide menos movimiento (`prefers-reduced-motion`).

---

## 19. Conoce NODO: la web y las redes

Los cinco codigos QR estan **a la vista en la bienvenida**
([SocialStrip.jsx](src/components/SocialStrip.jsx)), no escondidos detras de un boton: el
totem esta en una feria, la gente pasa caminando, y **lo que no se ve no existe**. Quien
quiera puede escanear sin llegar a usar el totem.

Al tocar la tira se abre la pantalla completa
([SocialScreen.jsx](src/screens/SocialScreen.jsx)) con los codigos mas grandes, para quien
prefiera acercarse con calma. Y el QR de la web esta tambien en la pantalla de exito, que
es el mejor momento: la persona acaba de recibir algo que le gusto y todavia tiene el
celular en la mano.

**Son codigos QR, no botones.** En un totem un boton a Facebook abre la red dentro del
navegador del kiosco y deja a la persona atrapada en una pagina que no es la nuestra; al
siguiente le toca encontrarse eso abierto. Con el QR se lo lleva en su celular, el totem
no se mueve de su sitio, y **el contacto queda despues de la feria**, que es lo que de
verdad le interesa a NODO.

Los QR estan **generados como SVG** en `public/qr/` y viven en el repositorio, porque el
totem tiene que funcionar sin internet: pedirle la imagen a un servicio externo es
exactamente lo que falla el dia del evento.

Para cambiar un enlace: editar [social.js](src/social.js) y correr

```bash
npm run qr
```

Detalle que importa: el QR va sobre **fondo blanco**, no sobre el papel crema. Algunos
lectores fallan con poco contraste, y un QR que no se lee es un QR que no existe.

### Tamanos medidos

| Resolucion | QR de la bienvenida | Boton Comenzar | Titulo |
|---|---|---|---|
| 768x1366 (totem chico) | 122 px | 271x88 | 589 px de ancho |
| 900x1600 (totem mediano) | 137 px | 318x103 | 690 px |
| 1080x1920 (totem) | 164 px | 380x122 | 828 px |
| 1200x1920 (totem ancho) | 182 px | 423x138 | 920 px |
| 1440x2560 (totem QHD) | 213 px | 457x154 | 1033 px |
| 1920x1080 (monitor) | 120 px | 310x103 | 654 px |

El QR nunca baja de **122 px en un totem**, que se escanea de pie a medio metro sin
agacharse. Es la medida que manda en la bienvenida: si el QR no se lee, la tira sobra.

En vertical **todo se escala con el ancho (`vw`), no con `vmin`**. Con `vmin` una pantalla
de 1080x1920 usa el lado corto y el contenido queda diminuto en el centro con medio metro
de fondo vacio alrededor. Es el error clasico al pasar de monitor horizontal a totem.

---

## 20. La bienvenida: quien la hizo, y como recibe la foto la gente

### Empresas creadoras rotando

Donde estaba el titulo del evento van ahora **las empresas que hicieron el totem**, una a
la vez y grande ([CreatorsSlider.jsx](src/components/CreatorsSlider.jsx)). Una sola a la
vez y no todas juntas: en una feria la pantalla se mira dos segundos de reojo, y cinco
logos pequenos no los lee nadie.

Hoy son dos: **NODO** y **REDY**. Se agregan en [creators.js](src/creators.js):

```js
{ name: 'REDY', logo: '/creators/redy.svg' },
```

El logo se mide **por ancho y no por alto**: los logotipos suelen ser letreros anchos y
bajos (el de NODO es 198x50), y limitandolos por alto salen diminutos al lado de un
nombre escrito en Bungee.

Mientras el logo no exista, se muestra **el nombre en texto grande**, asi que se puede ver
como queda antes de tener los archivos. Los logos van en `public/creators/`.

### La foto se entrega por QR

Al aceptar la foto, el totem sube la imagen y muestra un **codigo QR grande**: la persona
escanea, y en su celular descarga la foto y deja sus datos
([DeliveryScreen.jsx](src/screens/DeliveryScreen.jsx)).

Es lo practico en una feria: nadie escribe un correo con el teclado en pantalla —que es
donde mas se equivoca la gente y donde mas se atasca la fila—, cada quien teclea en el
teclado al que esta acostumbrado, y el totem queda libre para el siguiente en cuanto ve el
codigo.

El QR se genera **en el momento**, porque el enlace lo devuelve el backend recien cuando
sube la foto: no puede estar hecho de antes.

El formulario dentro del totem **sigue completo** y se vuelve a activar con
`VITE_DELIVERY=form`, por si el backend no llega a tener la pagina de descarga.

---

## 21. Salidas y puntero

**Boton de inicio.** Arriba a la izquierda, con el logo de NODO, en todas las pantallas
menos tres: la de inicio (ya es el inicio), la de envio (hay datos viajando y cortar ahi
deja la foto a medio mandar) y la de exito (vuelve sola en 5 segundos).

En un totem la gente se pierde: entra a un estilo que no queria, se arrepiente, o
simplemente no sabe como salir. Sin una salida visible empiezan a tocar todo hasta que
alguien del estand va a rescatarlos. Va arriba a la izquierda, **lejos de los botones de
accion**, para que nadie lo toque por error justo cuando iba a aceptar su foto.

Reinicia la sesion: borra la foto y los datos de quien estaba antes. Eso no es un efecto
secundario, es parte del punto.

**Los banderines desaparecen en la cuenta regresiva.** Es la unica pantalla donde la
camara ocupa todo y la persona se esta mirando para acomodarse: los banderines le tapaban
justo la parte de arriba, que es donde esta su cara. En vertical, ademas, el boton de
cancelar se va arriba a la derecha, porque abajo esta la banda del contador.

**El puntero del raton** esta oculto en todo el fondo y **solo aparece encima de lo que se
puede tocar** (botones, campos, casillas). En un totem tactil un puntero flotando se ve
como un error, pero si se conecta un raton para configurar o probar hace falta ver donde
se esta apuntando.

---

## 22. Cuanto cuesta cada foto (y como no gastar de mas)

Cada imagen generada con Gemini **se paga**. El totem esta hecho para pedir
**exactamente las que la persona quiso ver, ni una mas**:

| Momento | Generaciones |
|---|---|
| Ver la lista de estilos | **0** |
| Tomar la foto | **1** (solo el estilo elegido) |
| "Otro estilo" con uno nuevo | **1** |
| "Otro estilo" volviendo a uno ya visto | **0** (se reusa) |
| Repetir la foto | **1** |

Tres cosas lo garantizan:

1. **Nunca se genera "por si acaso".** Al abrir el selector no se pide nada: solo se
   genera el estilo que la persona toco.
2. **Las miniaturas del selector son filtro local**, canvas puro. No tocan la IA ni cuando
   muestran la cara de la persona en los 6 o 7 estilos del grupo.
3. **Lo ya generado se guarda** mientras dure esa foto (`generatedByStyle` en
   [App.jsx](src/App.jsx)). Pasa constantemente: la persona mira Rubber Hose, prueba Pixar,
   no le gusta y vuelve a Rubber Hose. Sin esto son tres llamadas para dos imagenes.
   La memoria se vacia con cada foto nueva, porque un resultado solo vale para la foto con
   la que se hizo.

Verificado con un backend simulado que cuenta las llamadas: recorrido de foto + dos
estilos + volver a los dos anteriores + repetir foto = **3 generaciones**, que son
exactamente las tres imagenes distintas que se pidieron.

Si algun dia se quiere abaratar mas, la palanca es `styleStrength` y el tamano de la foto
que se manda, no el flujo.

---

## 23. Responsive: como se comprueba

En un totem **no hay scroll ni forma de mover la vista**. Un boton que se sale de la
pantalla es un boton que no existe, y la persona se queda atascada. Por eso el responsive
no se mira "a ojo": hay un audit que recorre todas las pantallas en seis resoluciones y
falla si algo queda fuera.

Se comprueban cuatro cosas por pantalla:

- que el documento no desborde ni a lo ancho ni a lo alto,
- que ningun boton, tarjeta, campo o foto quede fuera del area visible,
- que las teclas y botones tengan un tamano que se acierte con el dedo,
- que la ultima fila del teclado quede siempre por encima de la banda de auspiciantes.

Resoluciones cubiertas, pensadas para un totem mediano y sus vecinas:

| Resolucion | Que es |
|---|---|
| 768x1366 | totem chico |
| 900x1600 | totem mediano |
| 1080x1920 | totem estandar (el caso real) |
| 1200x1920 | totem ancho |
| 1440x2560 | totem QHD |
| 1920x1080 | monitor horizontal |
| 1366x768 | portatil de pruebas |

Pantallas recorridas en cada una: bienvenida, redes, grupos, estilos (el grupo de ninos,
que es el de mas tarjetas), cuenta regresiva, vista previa, formulario y formulario con el
teclado abierto.

Las seis resoluciones de totem pasan limpias. La unica marca es en el portatil de 768 px de
alto, donde las teclas bajan a 36 px, que es deliberado y esta explicado abajo.

Tamanos reales en el totem vertical (1080x1920): teclas de **56 px**, campos de 59 px,
botones de 76 px. En QHD suben a 72 y 85 px.

> En portatiles de menos de 880 px de alto el teclado se aprieta y las teclas bajan a
> 36 px. Es deliberado: ahi hay raton, y la alternativa era que la fila de "Listo" quedara
> fuera de la pantalla. En el totem, que es vertical, nunca se aplica ese modo.

Las pantallas que mas cuesta encajar son dos: el **selector de estilos de ninos** (7
tarjetas) y el **formulario con el teclado de correo abierto** (fila de dominios + fila de
numeros + 3 filas de letras). Si vas a tocar CSS, prueba esas dos primero.

---

## 24. Que falta para tener el frontend completo

### Hecho

- [x] Teclado en pantalla
- [x] Consentimiento de datos
- [x] Sonido de cuenta regresiva, obturador y confirmacion
- [x] Cola de reintento si se cae la red
- [x] Imagenes de ejemplo de los 16 estilos
- [x] Layout auditado en 6 resoluciones (ver abajo)
- [x] Imagenes de referencia de los 4 estilos en el selector
- [x] Documento de integracion para el backend ([INTEGRACION.md](INTEGRACION.md))

### Falta

- [ ] **Logos de las empresas creadoras** (NODO ya esta; faltan QUOHUB y las demas).
      Van en `public/creators/` y se anaden en [creators.js](src/creators.js).
- [ ] **Pagina de descarga** a la que apunta el QR: la levanta el backend. Mientras no
      exista, el totem funciona en modo simulado o con el formulario (`VITE_DELIVERY=form`).

- [ ] **Probarlo en el monitor fisico del totem.** El layout esta verificado a la
      resolucion real, pero no sobre el vidrio: falta comprobar tamano real de las teclas
      con el dedo, brillo y reflejos.
- [ ] **Codigo QR con la foto.** Mucha gente no quiere teclear su correo en un totem
      publico. Necesita que el backend exponga una URL publica de la foto.
- [ ] **Pantalla de ajustes oculta** (5 toques en una esquina): cambiar duracion del
      conteo, modo de camara y URL del backend sin recompilar.
- [ ] Reemplazar `public/demo-photo.svg` por **una foto real de una cara**: hoy las
      miniaturas de los estilos sin referencia se generan sobre un dibujo morado.
- [ ] Logos reales de los auspiciantes (el de NODO ya esta).
- [ ] Autoarranque y watchdog en el Jetson: que el totem se levante solo si se reinicia.

### Ojo con esto

`public/styles/mundial-2026.jpg` es un cromo **Panini con marcas de FIFA y de la FEF**.
Sirve perfecto como referencia interna, pero se muestra en pantalla y esta subido al
repositorio. Antes de la feria conviene reemplazarlo por una imagen propia generada con el
prompt del estilo. El marco que dibuja el totem ya evita esas marcas: usa solo los colores
de la bandera.
