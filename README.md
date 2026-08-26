# Totem de Fotos — FERIA DE LOJA

Aplicacion de kiosco (totem) en **React + Vite**. Una sola pagina, navegacion por
estados, sin router, sin librerias de UI. Toma una foto con la camara, la convierte
en **caricatura estilo rubber hose**, le pone accesorios y marco de la feria, y la
envia al correo de la persona.

Funciona **completa sin backend** (modo `fake`) y **sin camara** (modo `demo`).

> **Backend:** todo lo que hace falta para conectarlo esta en **[INTEGRACION.md](INTEGRACION.md)**.
> Es un solo documento, no hay que leer el resto del proyecto.

---

## 1. Arranque rapido

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # genera /dist para produccion
npm run preview  # sirve /dist tal como quedara en el totem
```

Al abrirlo funciona ya en **modo demo**: la cuenta regresiva termina y aparece una
foto de prueba (`public/demo-photo.svg`); el envio es simulado (2 s) y siempre da exito.

---

## 2. Flujo de pantallas

```
WELCOME ──COMENZAR──> COUNTDOWN ──0──> PROCESSING ──> PREVIEW ──ACEPTAR──> FORM
                          ▲                                 │                 │
                          └────────── REPETIR ──────────────┘              ENVIAR
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
├── kiosk.js               <- pantalla completa, bloqueo de F5/menu contextual
├── App.jsx                <- maquina de estados + reset de sesion
├── styles.css             <- estilos (escalan con clamp a cualquier monitor)
│
├── services/
│   ├── camera.js          <- UNICO punto que toca el hardware
│   ├── photoEffect.js     <- caricatura + accesorios + marco (canvas puro)
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
| `VITE_PHOTO_EFFECT` | `cartoon` | `cartoon` (caricatura) / `none` (foto normal) |
| `VITE_PHOTO_PROPS` | `true` | Accesorios chistosos sobre la cara |
| `VITE_PHOTO_FRAME` | `true` | Marco de papel + banda con la marca |
| `VITE_FACE_CX/CY/W/H` | `.5/.42/.3/.46` | Posicion del ovalo guia (y de los accesorios) |
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
5. **Accesorios** — sombrero de paja, gafas, bigote o corona, elegidos al azar.
6. **Marco + marcas** — dos tipos: `paper` (borde de papel con banda de color, para los
   estilos dibujados) y `panini` (cromo de album completo: borde blanco de sticker,
   escudo con la bandera, franja con "2026" y placa roja), que usa Mundial 2026.

### Como se colocan los accesorios sin deteccion de rostro

No hay reconocimiento facial (costaria una libreria pesada y CPU del Jetson). El truco es
el **ovalo guia**: mientras cuenta, la pantalla le pide a la persona centrarse en el ovalo.
Si lo hace, ya sabemos donde esta su cara.

`FACE_GUIDE` (en [config.js](src/config.js)) es **el mismo dato** para las dos cosas:
dibuja el ovalo en pantalla y posiciona los accesorios en la foto. Si mueves el ovalo,
los accesorios se mueven con el.

> Para que esto funcione, la foto guardada debe ser **exactamente el recorte que la persona
> vio**. Por eso `captureFromWebcam()` recorta el video igual que el `object-fit: cover`
> de la pantalla, en vez de guardar el cuadro completo de la camara. Si tocas ese codigo,
> los accesorios se descuadran.

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
| El sombrero queda alto/bajo | `PROP_LAYOUT` en [photoEffect.js](src/services/photoEffect.js) |
| La gente sale muy abajo | Subir `VITE_FACE_CY` (ej. `0.46`) |
| Sin efecto, foto normal | `VITE_PHOTO_EFFECT=none` |

### Agregar accesorios nuevos

1. Poner el SVG en `public/props/` (contorno negro grueso, fondo transparente,
   con atributos `width` y `height` explicitos — sin ellos el canvas no sabe su tamano).
2. Agregarlo a `PROP_LAYOUT` con su `scale` y `dy`.
3. Agregar la combinacion a `PROP_SETS`.

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
| `public/props/*.svg` | sombrero, gafas, bigote, corona | versiones ilustradas de verdad |
| `public/styles/rubber-hose.jpg` | referencia del estilo (del cliente) | ya esta |
| `public/styles/mundial-2026.jpg` | referencia del estilo (del cliente) | ya esta |
| `public/styles/cabezon.jpg` | **falta** | referencia del estilo cabezon |
| `public/styles/muneco-3d.jpg` | **falta** | referencia del estilo muneco 3D |
| `public/demo-photo.svg` | foto de prueba del modo demo | **una foto real de una cara** |
| `public/logo.svg` | **no existe todavia** | logo de NODO (se dibuja solo si existe) |

Si pones un `public/logo.svg`, aparece automaticamente en la esquina de la foto. Si no
existe, no pasa nada: el codigo lo ignora.

Recomendacion para el material grafico:

- **Iconos y accesorios**: SVG, no PNG. Escalan a cualquier monitor y pesan nada.
- **Fondos**: mejor generados con CSS (como ahora) que fotos. Una foto de fondo se ve
  pixelada en un monitor de totem y pesa megas.
- **Logos**: SVG con fondo transparente. Si solo hay PNG, que sea de al menos 1000 px
  de ancho.
- **Fotos de la feria**: solo tienen sentido en la pantalla de bienvenida como collage.
  Si se usan, comprimir a WebP y ninguna de mas de 300 KB — el totem debe arrancar
  al instante.

---

## 13. Selector de estilos

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

Despues de *Comenzar* aparece una pantalla con **4 estilos**: Rubber Hose (el unico
retro), Mundial 2026 (cromo de la seleccion de Ecuador), Cabezon y Muneco 3D. Las miniaturas **no son
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

## 14. Barra de auspiciantes

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
- El logo `public/logo.svg` (NODO) es **provisional**, dibujado a mano en SVG. Reemplazarlo
  por el oficial **con el mismo nombre de archivo** y aparece solo en la banda de
  auspiciantes y en la esquina de cada foto.

---

## 15. Teclado, consentimiento, sonido y cola de reintentos

Cuatro cosas que no se ven en una demo pero deciden si el totem aguanta un dia
de feria.

### Teclado en pantalla — [OnScreenKeyboard.jsx](src/components/OnScreenKeyboard.jsx)

El totem es tactil y **no tiene teclado fisico**. Chromium en Linux tampoco muestra uno
solo, asi que sin esto el formulario es imposible de llenar en el hardware real.

- Esta hecho **dentro de la app**, no con el teclado del sistema: no depende de que
  alguien haya instalado `onboard` o `squeekboard` en el Jetson.
- Tres distribuciones segun el campo: texto, correo (con `@` y los cuatro dominios mas
  comunes) y numerica para el celular.
- Los campos son `<div>`, no `<input>`: asi no aparece ningun cursor del sistema ni un
  segundo teclado, y la unica entrada posible es la nuestra.
- Cada tecla usa `onPointerDown` con `preventDefault()`. Con `onClick` el campo perderia
  el foco al tocar la tecla y el teclado se cerraria solo.
- Con el teclado abierto la pantalla **esconde la foto** y compacta todo, porque si no la
  ultima fila de teclas queda fuera de la pantalla y no se puede ni cerrar el teclado.
  En vertical el teclado se ancla abajo, donde cae la mano.

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

## 16. Que falta para tener el frontend completo

### Hecho

- [x] Teclado en pantalla
- [x] Consentimiento de datos
- [x] Sonido de cuenta regresiva, obturador y confirmacion
- [x] Cola de reintento si se cae la red
- [x] Layout verificado en 1080x1920 (vertical), 1920x1080 y 1280x800
- [x] Imagenes de referencia de los 4 estilos en el selector
- [x] Documento de integracion para el backend ([INTEGRACION.md](INTEGRACION.md))

### Falta

- [ ] **Probarlo en el monitor fisico del totem.** El layout esta verificado a la
      resolucion real, pero no sobre el vidrio: falta comprobar tamano real de las teclas
      con el dedo, brillo y reflejos.
- [ ] **Codigo QR con la foto.** Mucha gente no quiere teclear su correo en un totem
      publico. Necesita que el backend exponga una URL publica de la foto.
- [ ] **Pantalla de ajustes oculta** (5 toques en una esquina): cambiar duracion del
      conteo, modo de camara y URL del backend sin recompilar.
- [ ] Reemplazar `public/demo-photo.svg` por **una foto real de una cara**: hoy las
      miniaturas de los estilos sin referencia se generan sobre un dibujo morado.
- [ ] Logos reales de auspiciantes y logo oficial de NODO.
- [ ] Autoarranque y watchdog en el Jetson: que el totem se levante solo si se reinicia.

### Ojo con esto

`public/styles/mundial-2026.jpg` es un cromo **Panini con marcas de FIFA y de la FEF**.
Sirve perfecto como referencia interna, pero se muestra en pantalla y esta subido al
repositorio. Antes de la feria conviene reemplazarlo por una imagen propia generada con el
prompt del estilo. El marco que dibuja el totem ya evita esas marcas: usa solo los colores
de la bandera.
