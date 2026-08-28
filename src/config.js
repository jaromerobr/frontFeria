/**
 * ============================================================
 *  CONFIGURACION CENTRAL DEL TOTEM
 * ------------------------------------------------------------
 *  TODO lo que se puede necesitar cambiar en feria esta aqui.
 *  No hay numeros magicos repartidos por el codigo.
 *  Se puede sobreescribir sin tocar codigo usando el archivo .env
 *  (ver .env.example).
 * ============================================================
 */

const env = import.meta.env;

/** Segundos de la cuenta regresiva antes de disparar la foto. */
export const COUNTDOWN_SECONDS = Number(env.VITE_COUNTDOWN_SECONDS ?? 6);

/** Segundos que se muestra la pantalla de exito antes de volver al inicio. */
export const SUCCESS_SCREEN_SECONDS = Number(env.VITE_SUCCESS_SECONDS ?? 5);

/**
 * Milisegundos sin interaccion antes de reiniciar la sesion.
 * Protege al siguiente usuario de ver los datos del anterior.
 * No aplica en WELCOME (ya esta en reposo) ni en SENDING (esta trabajando).
 */
export const SESSION_TIMEOUT_MS = Number(env.VITE_SESSION_TIMEOUT_MS ?? 60_000);

/** Segundos antes del timeout en que se avisa "Sigues ahi?". */
export const SESSION_WARNING_SECONDS = Number(env.VITE_SESSION_WARNING_SECONDS ?? 15);

/**
 * Modo de camara:
 *   'demo'    -> devuelve una imagen fija de /public (no toca hardware)
 *   'webcam'  -> getUserMedia del navegador (webcam USB, funciona en Jetson con Chromium)
 *   'service' -> pide la foto a un servicio local (OpenCV/Python) por HTTP
 */
export const CAMERA_MODE = env.VITE_CAMERA_MODE ?? 'webcam';

/** Imagen usada cuando CAMERA_MODE === 'demo'. */
export const DEMO_PHOTO_URL = env.VITE_DEMO_PHOTO ?? '/demo-photo.svg';

/** URL del servicio local de camara (solo para CAMERA_MODE === 'service'). */
export const CAMERA_SERVICE_URL = env.VITE_CAMERA_SERVICE_URL ?? 'http://localhost:5000';

/**
 * Modo de envio al backend:
 *   'fake' -> simula el POST (no hay red). Sirve para demos sin backend.
 *   'real' -> usa API_BASE_URL de verdad.
 */
export const API_MODE = env.VITE_API_MODE ?? 'fake';

/** Base del backend del companero. Ej: http://192.168.1.50:8080 */
export const API_BASE_URL = env.VITE_API_BASE_URL ?? 'http://localhost:3000';

/**
 * Estrategia de envio de la foto. Acordar con backend.
 *   'multipart' -> POST /api/photos  (FormData: name,email,phone,photo)
 *   'base64'    -> POST /api/photos  (JSON con la imagen en dataURL)
 *   'two-step'  -> POST /api/photos/upload -> {photoUrl} -> POST /api/send
 * Cambiar SOLO esta variable cuando el backend defina su contrato.
 */
export const UPLOAD_STRATEGY = env.VITE_UPLOAD_STRATEGY ?? 'multipart';

/** Milisegundos maximos de espera del envio antes de dar error. */
export const API_TIMEOUT_MS = Number(env.VITE_API_TIMEOUT_MS ?? 30_000);

/** Textos de marca, para no buscarlos por los componentes. */
export const BRAND = {
  title: env.VITE_BRAND_TITLE ?? 'FERIA DE LOJA',
  subtitle: env.VITE_BRAND_SUBTITLE ?? 'Photo Booth',
  /** Va en la banda inferior de la foto, junto al logo. */
  footer: env.VITE_BRAND_FOOTER ?? 'NODO',
};

/* ============================================================
   GENERACION CON IA  (services/ai.js)
   ============================================================ */

/**
 * 'off'  -> la imagen la hace el filtro local del totem (funciona hoy)
 * 'real' -> se le pide al backend, que llama a Gemini
 *
 * Si esta en 'real' y falla, el totem NO se detiene: cae al filtro local.
 */
export const AI_MODE = env.VITE_AI_MODE ?? 'off';

/**
 * Cuanto se espera a la IA antes de rendirse y usar el filtro local.
 * Generar suele tardar entre 5 y 20 segundos; 60 da margen sin dejar a
 * nadie parado un minuto y medio frente a la pantalla.
 */
export const AI_TIMEOUT_MS = Number(env.VITE_AI_TIMEOUT_MS ?? 60_000);

/** Ruta del generador en el backend (la que paso el equipo). */
export const AI_ENDPOINT = env.VITE_AI_ENDPOINT ?? '/image-generation/upload';

/** Motor que usa el backend: 'gemini' o 'qwen'. Vacio = que decida el. */
export const AI_PROVIDER = env.VITE_AI_PROVIDER ?? '';

/** Modelo concreto, ej. 'qwen-image-3.0'. Vacio = el que tenga por defecto. */
export const AI_MODEL = env.VITE_AI_MODEL ?? '';

/**
 * Resolucion que se le pide al modelo.
 *
 * 768x1024 y no 1024x1365: es 3:4 (la proporcion del totem vertical),
 * se ve perfecto en pantalla, pesa poco y **se genera bastante mas
 * rapido**. Subirla es la forma mas facil de que la espera pase de 5 a
 * 15 segundos sin que nadie note la diferencia en la foto.
 */
export const AI_SIZE = env.VITE_AI_SIZE ?? '768*1024';

/**
 * Lado mayor de la foto que se SUBE al backend.
 *
 * La camara da hasta 1920 px y subir eso por el wifi de una feria son
 * segundos perdidos antes de que el modelo empiece siquiera. A 1024 el
 * modelo ve lo mismo (las caras siguen nitidas) y el viaje es 3 o 4
 * veces mas corto.
 */
export const AI_UPLOAD_MAX_PX = Number(env.VITE_AI_UPLOAD_MAX_PX ?? 1024);

/**
 * Mandar tambien styleId y groupId.
 *
 * Apagado por defecto: el DTO del backend no los tiene, y NestJS con
 * `forbidNonWhitelisted` rechaza con 400 cualquier campo de mas. Se
 * enciende solo si el backend confirma que los acepta y los quiere para
 * sus estadisticas.
 */
export const AI_SEND_METADATA = (env.VITE_AI_SEND_METADATA ?? 'false') === 'true';

/**
 * Segundos tras los cuales la pantalla de espera admite que va lenta.
 * El objetivo es que una foto salga en menos de 5 s; a los 10 ya hay
 * que decirle algo a la persona en vez de dejarla mirando una barra.
 */
export const PROCESSING_SLOW_SECONDS = Number(env.VITE_PROCESSING_SLOW_SECONDS ?? 10);

/**
 * Tiempo minimo que se muestra la pantalla de espera.
 * Sin IA el filtro tarda ~200 ms y la pantalla apareceria como un
 * parpadeo molesto. Con esto siempre se ve la animacion completa.
 */
export const PROCESSING_MIN_MS = Number(env.VITE_PROCESSING_MIN_MS ?? 900);

/* ============================================================
   COMO RECIBE LA PERSONA SU FOTO
   ============================================================ */

/**
 * 'qr'   -> el totem muestra un codigo QR y la persona descarga la foto
 *           y deja sus datos en SU celular. Es lo practico en una feria:
 *           no hay que escribir un correo con el teclado en pantalla, la
 *           fila avanza mucho mas rapido y los datos los teclea cada uno
 *           en su teclado de siempre.
 * 'form'  -> el formulario de nombre, correo y celular dentro del totem.
 *           Sigue funcionando entero por si el backend no llega a tener
 *           la pagina de descarga.
 */
export const DELIVERY_MODE = env.VITE_DELIVERY ?? 'qr';

/** Donde el totem sube la foto para obtener el enlace de descarga. */
export const DOWNLOAD_ENDPOINT = env.VITE_DOWNLOAD_ENDPOINT ?? '/feria/photos';

/**
 * Direccion publica de esta misma app, la que va dentro del QR.
 *
 * Tiene que ser PUBLICA: el celular de la persona esta con datos
 * moviles, no en el wifi del totem. Con una IP local (192.168.x.x) o
 * localhost, el QR no abre nada. Es el error que hunde estos montajes.
 */
export const PUBLIC_BASE_URL = env.VITE_PUBLIC_BASE_URL ?? 'https://nodo.com.ec/feria';

/** Prefijo de los endpoints que usa la pagina de descarga. */
export const DOWNLOAD_API_PATH = env.VITE_DOWNLOAD_API_PATH ?? '/feria';

/** Nombre del campo del archivo al subir la foto (lo fija el backend). */
export const DOWNLOAD_FILE_FIELD = env.VITE_DOWNLOAD_FILE_FIELD ?? 'image';

/** Segundos que se queda el QR de descarga antes de volver al inicio. */
export const DELIVERY_SECONDS = Number(env.VITE_DELIVERY_SECONDS ?? 60);

/* ============================================================
   DATOS PERSONALES Y CONSENTIMIENTO
   ============================================================ */

/**
 * Texto que la persona acepta antes de enviar. Se guarda junto con la
 * fecha y se manda al backend, para que quede constancia de QUE acepto
 * exactamente, no solo de que marco una casilla.
 * Ajustar con lo que diga la empresa; si hay politica de privacidad
 * publicada, mencionarla aqui.
 */
export const CONSENT_TEXT =
  env.VITE_CONSENT_TEXT ??
  'Acepto que se use mi correo y celular unicamente para enviarme esta foto.';

/* ============================================================
   COLA DE ENVIOS PENDIENTES (services/queue.js)
   ============================================================ */

/** Cuantos envios fallidos se guardan como maximo en el equipo. */
export const QUEUE_MAX_ITEMS = Number(env.VITE_QUEUE_MAX_ITEMS ?? 12);

/** Despues de estas horas, un pendiente se descarta. */
export const QUEUE_MAX_AGE_HOURS = Number(env.VITE_QUEUE_MAX_AGE_HOURS ?? 12);

/** Cada cuanto se reintenta la cola, en milisegundos. */
export const QUEUE_RETRY_MS = Number(env.VITE_QUEUE_RETRY_MS ?? 45_000);

/* ============================================================
   SONIDO (services/sound.js)
   ============================================================ */

/** Pitidos de la cuenta regresiva, obturador y confirmacion. */
export const SOUND_ENABLED = (env.VITE_SOUND_ENABLED ?? 'true') === 'true';

/** Imagen que usan las miniaturas del selector de estilos. */
export const STYLE_SAMPLE_PHOTO = env.VITE_STYLE_SAMPLE ?? '/demo-photo.svg';

/* ============================================================
   EFECTO DE LA FOTO  (src/services/photoEffect.js)
   ============================================================ */

/** 'cartoon' = caricatura rubber hose | 'none' = foto tal cual. */
export const PHOTO_EFFECT = env.VITE_PHOTO_EFFECT ?? 'cartoon';

/** Marco de papel + banda con la marca. */
export const PHOTO_FRAME = (env.VITE_PHOTO_FRAME ?? 'true') === 'true';

/*
 * NOTA: el posterizado y el contorno ya NO se configuran aqui.
 * Cada estilo trae los suyos en src/photoStyles.js, porque un cromo
 * del mundial y una caricatura no pueden usar los mismos numeros.
 */

/**
 * GUIA DE ROSTRO. Es el ovalo que se dibuja sobre el video en la cuenta
 * regresiva, en fracciones del ancho/alto del cuadro.
 *
 * Sirve para DOS cosas a la vez:
 *   1. que la persona se centre sola, y salga bien encuadrada
 *   2. saber donde esta la cara para deformarla (estilo Cabezon) sin
 *      necesidad de deteccion de rostro
 *
 * Tambien le conviene a la IA: una cara centrada y del mismo tamano en
 * todas las fotos hace que el modelo devuelva resultados parecidos entre
 * si, en vez de depender de si la persona se paro cerca o lejos.
 */
export const FACE_GUIDE = {
  cx: Number(env.VITE_FACE_CX ?? 0.5),
  cy: Number(env.VITE_FACE_CY ?? 0.42),
  w: Number(env.VITE_FACE_W ?? 0.3),
  h: Number(env.VITE_FACE_H ?? 0.46),
};

/** Espeja la imagen (efecto espejo tipo selfie). Solo visual. */
export const MIRROR_CAMERA = (env.VITE_MIRROR_CAMERA ?? 'true') === 'true';
