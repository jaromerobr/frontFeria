# Despliegue en nodo.com.ec/feria

Todo lo que hay que hacer para publicar. Son cuatro pasos y ninguno tiene truco.

---

## 1. Configurar el `.env`

Copiar `.env.example` a `.env` y dejar estas cuatro lineas:

```env
VITE_PUBLIC_BASE_URL=https://nodo.com.ec/feria   # lo que va dentro del QR
VITE_API_BASE_URL=https://nodo.com.ec            # donde responde el backend
VITE_AI_MODE=real                                # generar con IA
VITE_API_MODE=real                               # subir la foto de verdad
```

> `VITE_PUBLIC_BASE_URL` **tiene que ser publica**. El celular de la persona esta con
> datos moviles, no en el wifi del totem: con `localhost` o `192.168.x.x` el QR no abre
> nada. Es el error que hunde estos montajes.

## 2. Construir

```bash
npm install
npm run build
```

Queda todo en la carpeta **`dist/`**.

## 3. Subir

Sube **el contenido de `dist/`** a la carpeta `feria` del servidor:

```
nodo.com.ec/feria/index.html
nodo.com.ec/feria/assets/...
nodo.com.ec/feria/qr/...
nodo.com.ec/feria/styles/...
```

Se sirve como archivos estaticos. **No hace falta Node ni nada corriendo**: es una SPA,
el build es HTML, CSS, JS e imagenes.

Si algun dia se publica en otra carpeta que no sea `/feria/`, se cambia `base` en
[vite.config.js](vite.config.js) y se vuelve a construir. Nada mas.

## 4. Abrir en el totem

```bash
chromium-browser --kiosk --noerrdialogs --disable-infobars \
  --disable-session-crashed-bubble --autoplay-policy=no-user-gesture-required \
  https://nodo.com.ec/feria/
```

> **La camara necesita HTTPS.** Por `https://nodo.com.ec/feria/` funciona. Por IP o por
> `http://` el navegador la bloquea sin avisar claramente.

---

## Las dos direcciones, un solo build

| URL | Que sale |
|---|---|
| `https://nodo.com.ec/feria/` | El totem |
| `https://nodo.com.ec/feria/?f=AB12CD` | La pagina de descarga, en el celular |

Lo decide [main.jsx](src/main.jsx) mirando la URL: si trae id de foto, es alguien que
escaneo el QR; si no, es el totem. Sin router y sin una segunda aplicacion que mantener.

La forma `?f=AB12CD` funciona en **cualquier hosting sin configurar nada**. Si prefieres
la URL bonita `https://nodo.com.ec/feria/f/AB12CD`, la pagina tambien la entiende, pero
el servidor tiene que mandar las rutas desconocidas al `index.html`:

```nginx
# nginx
location /feria/ {
  try_files $uri $uri/ /feria/index.html;
}
```

```apache
# Apache, en .htaccess dentro de /feria
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /feria/index.html [L]
```

---

## Probar antes de subir

```bash
npm run build
npm run preview          # http://localhost:4173/feria/
```

Y para ver la pagina del celular sin backend, con `VITE_API_MODE=fake`:

```
http://localhost:4173/feria/?f=CUALQUIERCOSA
```

Sale una foto de prueba y el formulario completo, para revisar como se ve antes de que el
backend exista.

---

## Lo unico que depende del backend

Cuatro endpoints. Estan detallados en [INTEGRACION.md](INTEGRACION.md), y en el codigo
arriba de [downloadApi.js](src/download/downloadApi.js):

| Endpoint | Quien lo llama |
|---|---|
| `POST /image-generation/upload` | El totem, para generar la imagen |
| `POST /feria/photos` | El totem, para subir la foto y recibir el `id` |
| `GET /feria/photos/:id` | El celular, para ver la foto |
| `POST /feria/photos/:id/claim` | El celular, para dejar los datos y descargar |

Mientras no existan, el totem funciona igual con `VITE_AI_MODE=off` y
`VITE_API_MODE=fake`: genera con el filtro local y simula el envio.
