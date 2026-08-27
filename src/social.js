/**
 * ============================================================
 *  REDES DE NODO
 * ------------------------------------------------------------
 *  En un totem NO se ponen botones a Facebook o Instagram: abrir
 *  una red social en el navegador del kiosco deja a la persona
 *  atrapada dentro de una pagina que no es la nuestra, y al
 *  siguiente le toca encontrarse eso.
 *
 *  Por eso son codigos QR: la persona se lleva el enlace en su
 *  celular, el totem no se mueve de su sitio, y ademas queda el
 *  contacto despues de la feria, que es lo que de verdad
 *  interesa.
 *
 *  Los QR estan generados como SVG en public/qr/, asi que
 *  funcionan sin internet. Para regenerarlos despues de cambiar
 *  un enlace:
 *
 *      npm run qr
 * ============================================================
 */

export const SOCIAL_LINKS = [
  {
    id: 'web',
    name: 'Nuestra web',
    handle: 'nodo.com.ec',
    url: 'https://nodo.com.ec/home',
    color: '#e0403a',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    handle: '@nodocia',
    url: 'https://www.facebook.com/nodocia/',
    color: '#1877f2',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    handle: '@nodocia',
    url: 'https://www.instagram.com/nodocia/',
    color: '#c13584',
  },
  {
    id: 'x',
    name: 'X',
    handle: '@nodo_cia',
    url: 'https://x.com/nodo_cia',
    color: '#181410',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    handle: 'NODO',
    url: 'https://www.youtube.com/channel/UChcGqbh04N9MgZSKRmPlPGA',
    color: '#ff0000',
  },
];

/** El de la web, que es el que se muestra suelto en otras pantallas. */
export const MAIN_LINK = SOCIAL_LINKS[0];

export function qrPath(id) {
  return `/qr/${id}.svg`;
}
