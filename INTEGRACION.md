# Integracion backend ↔ frontend

Documento para quien hace el backend. **No hace falta leer el resto del proyecto.**

El frontend ya funciona completo por su cuenta: toma la foto, la ilustra en el propio
equipo y simula el envio.

Hay **dos puntos de conexion, independientes entre si**. Se pueden hacer en cualquier
orden, y cada uno funciona sin el otro:

| | Endpoint | Cuando ocurre | Que hace |
|---|---|---|---|
| **A** | `POST /api/generate` | Justo despues de la foto | Le pide a Gemini la imagen y la devuelve para mostrarla en pantalla |
| **B** | `POST /api/photos` | Cuando la persona da sus datos | Guarda y manda la foto al correo |

No hay que tocar ninguna pantalla: solo levantar los endpoints y cambiar unas variables
en el `.env` del totem.

---

## 1. Lo unico que se cambia en el frontend

Archivo `.env` (copiar de `.env.example`):

```env
VITE_API_BASE_URL=http://192.168.1.50:8080  # donde vive tu backend

VITE_AI_MODE=real                           # activa el punto A (Gemini)
VITE_API_MODE=real                          # activa el punto B (envio)
VITE_UPLOAD_STRATEGY=multipart              # multipart | base64 | two-step
```

Reiniciar `npm run dev` despues de cambiarlo (Vite lee el `.env` al arrancar).

Las tres estrategias de subida **ya estan programadas**. Elige la que te sirva y avisa
cual: es cambiar una palabra, no codigo.

---

## 2. Punto A — generar la imagen con Gemini

```http
POST {VITE_API_BASE_URL}/api/generate
Content-Type: multipart/form-data
```

| Campo | Ejemplo | Que es |
|---|---|---|
| `photo` | archivo jpeg | La foto recien tomada, **sin filtros** |
| `styleId` | `cabezon` | Estilo elegido |
| `styleMode` | `image-to-image` | La foto es la BASE, no se genera desde cero |
| `stylePrompt` | `Use the provided photograph...` | Prompt completo, listo para el modelo |
| `styleNegative` | `different person, face swap, ...` | Lo que el modelo NO debe hacer |
| `styleStrength` | `0.6` | Cuanto respetar la foto original (0 a 1) |

Respuesta, cualquiera de las dos formas:

- `200` con `Content-Type: image/jpeg` y la imagen en el cuerpo, **o**
- `200` con JSON `{ "image": "data:image/jpeg;base64,..." }`

### Dos cosas que ya estan resueltas del lado del totem

**Si esto falla, el totem no se detiene.** Timeout, error 500, Gemini caido, lo que sea:
el totem cae solo al filtro local y la persona igual se lleva su foto. Una feria con fotos
menos bonitas es mejor que una feria detenida. Asi que **no hace falta blindar este
endpoint**; si se cae, se cae con red.

**La espera esta cubierta.** Mientras generas, la pantalla le muestra a la persona su
propia foto revelandose, con mensajes que van cambiando y una barra de progreso. Aguanta
bien hasta ~20 segundos; pasado eso avisa que va lenta. El limite duro es
`VITE_AI_TIMEOUT_MS` (60 s por defecto).

---

## 3. Punto B — guardar y enviar (estrategia `multipart`, la recomendada)

```http
POST {VITE_API_BASE_URL}/api/photos
Content-Type: multipart/form-data
```

| Campo | Tipo | Ejemplo | Que es |
|---|---|---|---|
| `name` | texto | `James` | Nombre de la persona |
| `email` | texto | `james@gmail.com` | A donde va la foto |
| `phone` | texto | `0999123456` | Celular |
| `photo` | archivo | `photo.jpg` | **La foto, ya ilustrada por el totem** |
| `styleId` | texto | `mundial-2026` | Estilo elegido |
| `styleMode` | texto | `image-to-image` | La foto es la BASE, no se genera desde cero |
| `stylePrompt` | texto | `Use the provided photograph...` | Prompt completo, listo para el modelo |
| `styleNegative` | texto | `different person, face swap, ...` | Lo que el modelo NO debe hacer |
| `styleStrength` | numero | `0.45` | Cuanto respetar la foto original (0 a 1) |
| `consent` | booleano | `true` | La persona acepto el uso de sus datos |
| `consentText` | texto | `Acepto que se use mi correo...` | El texto exacto que acepto |
| `consentAt` | fecha ISO | `2026-08-26T21:14:03.921Z` | Cuando lo acepto |
| `queued` | booleano | `true` | **Solo aparece** si el envio venia demorado (ver punto 5) |

Respuesta esperada: **`200`** o **`202`**. El cuerpo puede ser vacio o un JSON
`{ "id": "..." }`.

> El navegador pone el `boundary` del multipart solo. **No exijas un `Content-Type` fijo**
> o todos los envios van a fallar.

### Las otras dos estrategias

- **`base64`**: mismos campos pero en JSON, con la imagen en `image` como
  `data:image/jpeg;base64,...`. El cuerpo pesa ~33 % mas que la imagen: sube el limite del
  servidor (`client_max_body_size` en nginx, `MAX_CONTENT_LENGTH` en Flask).
- **`two-step`**: `POST /api/photos/upload` (multipart, campo `photo`) que devuelve
  `{ "photoUrl": "..." }`, y luego `POST /api/send` con el resto en JSON.

Todas estan implementadas en [src/services/api.js](src/services/api.js).

---

## 4. Como llamar a Gemini

El frontend **no llama a ninguna IA**. Manda la foto y el prompt; el resto es tuyo.

```
                 (A) al tomar la foto              (B) al dar los datos
Totem ──photo+prompt──> Backend ──> Gemini        Totem ──datos+foto──> Backend
      <──imagen generada──┘                                              │
                                                                         └──> correo
```

Tres cosas que importan al llamar al modelo:

1. **Es imagen a imagen.** `styleMode` viene en `image-to-image` y `stylePrompt` ya empieza
   con la instruccion de usar la foto adjunta como base y devolver a **esa misma persona**.
   Si se manda solo el texto, el modelo inventa una cara cualquiera y la gente no se
   reconoce, que es lo unico que importa en un totem.
2. **Pasa el negativo.** `styleNegative` evita las tres fallas que arruinan una foto de
   feria: que salga otra persona, que el modelo escriba texto (y las letras salgan
   deformes) y que la caricatura se pase de burlona. Si la API que uses no tiene campo de
   negativo, pegalo al final del prompt como `Avoid: ...`.
3. **`styleStrength` no es decorativo.** Bajo (0.45) mantiene la cara reconocible; alto
   (0.85) queda bonito pero ya no se parece a la persona. Los valores por estilo estan en
   [PROMPTS.md](PROMPTS.md).

Cada foto sale distinta aunque dos personas elijan el mismo estilo: el modelo genera una
imagen nueva cada vez. Las imagenes del selector son solo ejemplos.

### Si decides generar en el punto B en vez del A

Tambien vale: no activas `VITE_AI_MODE` y generas al momento de enviar. En ese caso
responde **`202` de inmediato** y genera despues, porque la persona esta esperando en la
pantalla de "Enviando" y el resultado igual le llega por correo.

La diferencia: en el punto A la persona **ve** su caricatura y puede repetirla o cambiar
de estilo; en el punto B se entera cuando abre el correo. La primera opcion es bastante
mejor para una feria, pero cuesta que el endpoint responda rapido.

---

## 5. Errores

Cualquier respuesta que no sea 2xx hace que el totem muestre la pantalla de error con un
boton de reintentar. Si puedes devolver un mensaje legible para la persona, mandalo asi:

```json
{ "message": "Ese correo ya recibio una foto hoy" }
```

Ese texto se muestra tal cual en pantalla, asi que escribelo pensando en quien lo va a
leer, no en el log.

---

## 6. Envios demorados (`queued: true`)

Si se cae el wifi, el totem guarda el envio y lo reintenta solo cada 45 segundos. Cuando
por fin entra, llega con `queued: true` y un `consentAt` de hace rato.

Eso significa que **la persona ya se fue**. No es un envio duplicado ni un ataque: es una
foto rescatada. Tratala igual que las demas.

---

## 7. CORS

El totem corre en `http://localhost:5173` (desarrollo) o en el origen del totem
(produccion). El backend tiene que permitir ese origen y los metodos `POST, OPTIONS`.

Si falta CORS, **todo falla con "No hay conexion con el servidor"** aunque el servidor
este perfectamente vivo. Es el primer sitio donde mirar.

---

## 8. Probarlo sin el totem

```bash
curl -X POST http://localhost:8080/api/photos \
  -F "name=James" \
  -F "email=james@gmail.com" \
  -F "phone=0999123456" \
  -F "photo=@foto.jpg" \
  -F "styleId=rubber-hose" \
  -F "styleMode=image-to-image" \
  -F "stylePrompt=Use the provided photograph as the base image..." \
  -F "styleStrength=0.62" \
  -F "consent=true"
```

Y al reves, para ver que manda el totem sin tener backend: dejar `VITE_API_MODE=fake`,
abrir la consola del navegador (F12) y hacer el flujo completo. Cada envio se imprime con
todos sus campos.
