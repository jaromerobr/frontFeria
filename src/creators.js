/**
 * ============================================================
 *  EMPRESAS QUE HICIERON ESTO
 * ------------------------------------------------------------
 *  Se muestran en la bienvenida, una a la vez, rotando.
 *
 *  Una a la vez y no todas juntas: en una feria la gente mira la
 *  pantalla dos segundos de reojo. Con cinco logos pequenos no
 *  lee ninguno; con uno grande que cambia, lee el que este.
 *
 *  COMO AGREGAR UNA:
 *    1. (Opcional) deja el logo en public/creators/
 *    2. Agrega una linea aqui:
 *         { name: 'QUOHUB', logo: '/creators/quohub.svg' }
 *
 *  Si el logo no existe todavia, se muestra el nombre en texto
 *  grande. Asi se puede ver como queda antes de tener los logos.
 * ============================================================
 */

export const CREATORS = [
  { name: 'NODO', logo: '/logo.webp' },
  // El logo de REDY todavia no llega: mientras tanto se ve el nombre
  // en texto grande. Cuando llegue, se deja el archivo en
  // public/creators/redy.svg y aparece solo.
  { name: 'REDY', logo: '/creators/redy.svg' },
];

/** Segundos que se queda cada una en pantalla. */
export const CREATOR_SECONDS = Number(import.meta.env.VITE_CREATOR_SECONDS ?? 4);
