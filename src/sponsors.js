/**
 * ============================================================
 *  PATROCINADORES / AUSPICIANTES
 * ------------------------------------------------------------
 *  Los logos de quienes apoyaron el proyecto. Se ven en una banda
 *  que se desplaza en la parte inferior, en TODAS las pantallas.
 *
 *  COMO AGREGAR UN LOGO:
 *    1. Deja el archivo en  public/sponsors/  (SVG o PNG transparente)
 *    2. Agrega una linea aqui:  { name: 'ACME', logo: '/sponsors/acme.svg' }
 *
 *  Si `logo` apunta a un archivo que no existe, la banda muestra el
 *  nombre en texto. Asi el espacio SIEMPRE esta reservado y nada se
 *  descuadra cuando lleguen los logos definitivos.
 * ============================================================
 */

export const SPONSORS = [
  { name: 'NODO', logo: '/logo.webp' },
  { name: 'Auspiciante 2', logo: '/sponsors/auspiciante-2.svg' },
  { name: 'Auspiciante 3', logo: '/sponsors/auspiciante-3.svg' },
  { name: 'Auspiciante 4', logo: '/sponsors/auspiciante-4.svg' },
  { name: 'Auspiciante 5', logo: '/sponsors/auspiciante-5.svg' },
  { name: 'Auspiciante 6', logo: '/sponsors/auspiciante-6.svg' },
];

/** Segundos que tarda la banda en dar una vuelta completa. */
export const SPONSOR_SCROLL_SECONDS = 28;
