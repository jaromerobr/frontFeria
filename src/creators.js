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
 *    1. Deja el logo en public/
 *    2. Agrega una linea aqui:
 *         { name: 'QUOHUB', logo: '/quohub.svg' }
 *
 *  Si el logo no existe todavia, se muestra el nombre en texto
 *  grande. Asi se puede ver como queda antes de tener los logos.
 *
 *  SOBRE `scale`:
 *  Los logos se miden por ANCHO, porque son letreros anchos y bajos.
 *  Pero cada uno tiene su proporcion: el de NODO es 198x50 (casi 4:1)
 *  y el de REDY 287x98 (3:1). Con el mismo ancho, REDY saldria un
 *  35 % mas alto y se veria mas grande. `scale` corrige eso para que
 *  los dos se vean del mismo tamano. 1 es la referencia (NODO).
 *
 *  Medido en el totem: con scale 0.76 los dos quedan en ~195 px de
 *  alto. Si se cambia un logo, la forma de ajustarlo es esa: mirar
 *  cuanto mide en pantalla y buscar que coincida con el otro.
 * ============================================================
 */

export const CREATORS = [
  { name: 'NODO', logo: '/logo.webp', scale: 1 },
  // 287x98: mas cuadrado que el de NODO, asi que va algo mas estrecho
  // para que los dos se vean del mismo tamano en pantalla.
  { name: 'REDY', logo: '/redy.png', scale: 0.76 },
];

/** Segundos que se queda cada una en pantalla. */
export const CREATOR_SECONDS = Number(import.meta.env.VITE_CREATOR_SECONDS ?? 4);
