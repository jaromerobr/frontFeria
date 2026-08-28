/**
 * ============================================================
 *  RUTAS DE ARCHIVOS PUBLICOS
 * ------------------------------------------------------------
 *  La app no vive en la raiz del dominio, sino en una subcarpeta:
 *
 *      https://nodo.com.ec/feria/
 *
 *  Con una ruta absoluta como "/logo.webp", el navegador la busca
 *  en https://nodo.com.ec/logo.webp y no la encuentra. Todas las
 *  imagenes de public/ tienen que pasar por aqui.
 *
 *  `import.meta.env.BASE_URL` lo pone Vite segun la opcion `base`
 *  de vite.config.js, asi que cambiar de carpeta es cambiar una
 *  linea y nada mas.
 * ============================================================
 */

/**
 * @param {string} ruta ruta dentro de public, con o sin barra inicial
 * @returns {string} la ruta lista para usar en src o fetch
 */
export function asset(ruta) {
  if (!ruta) return ruta;
  // Un enlace externo o un dataURL se dejan como estan.
  if (/^(https?:|data:|blob:)/.test(ruta)) return ruta;
  return `${import.meta.env.BASE_URL}${ruta.replace(/^\//, '')}`;
}
