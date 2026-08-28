import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Fuentes empaquetadas en el build: el totem no depende de internet.
import '@fontsource/bungee/400.css';
import '@fontsource/baloo-2/600.css';
import '@fontsource/baloo-2/800.css';

import App from './App.jsx';
import DownloadApp from './download/DownloadApp.jsx';
import { readPhotoId } from './download/downloadApi.js';
import './styles.css';

/**
 * El MISMO build sirve dos cosas distintas:
 *
 *   https://nodo.com.ec/feria/            -> el totem
 *   https://nodo.com.ec/feria/?f=AB12CD   -> la pagina de descarga
 *
 * Se decide por la URL, sin router y sin segunda aplicacion que
 * mantener. Si hay id de foto, es alguien que escaneo el QR desde su
 * celular; si no, es el totem.
 *
 * La forma con `?f=` funciona en CUALQUIER hosting sin configurar
 * nada. La forma bonita /feria/f/AB12CD tambien se entiende, pero
 * necesita que el servidor redirija las rutas desconocidas al
 * index.html (ver INTEGRACION.md).
 */
const esDescarga = Boolean(readPhotoId());

createRoot(document.getElementById('root')).render(
  <StrictMode>{esDescarga ? <DownloadApp /> : <App />}</StrictMode>,
);
