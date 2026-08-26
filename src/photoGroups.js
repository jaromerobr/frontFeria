/**
 * ============================================================
 *  CON QUIEN SE TOMA LA FOTO
 * ------------------------------------------------------------
 *  Primera pregunta del totem, antes que el estilo. No es solo
 *  para filtrar estilos: cambia tres cosas de verdad.
 *
 *   1. QUE ESTILOS SE OFRECEN. Un cromo de futbol no funciona con
 *      cinco personas, y una postal de San Valentin no funciona
 *      con una sola.
 *
 *   2. EL ENCUADRE. La guia en pantalla se ensancha segun cuanta
 *      gente va a entrar, y en el grupo de ninos baja, porque los
 *      ninos son mas bajos y si no salen cortados por abajo.
 *
 *   3. CUANTO DURA LA CUENTA REGRESIVA. Una familia de cinco tarda
 *      mas en acomodarse que una persona sola. 10 segundos que le
 *      sobran a uno son pocos para cinco.
 *
 *  Ademas se le dice a la IA cuanta gente hay, para que no invente
 *  ni borre personas, que es su falla favorita en fotos de grupo.
 * ============================================================
 */

export const PHOTO_GROUPS = [
  {
    id: 'personal',
    name: 'Solo',
    tagline: 'Una persona',
    icon: '🙋',
    countdown: 10,
    /** Ovalo de encuadre, en fracciones del cuadro (ver FaceGuide). */
    guide: { cx: 0.5, cy: 0.42, w: 0.3, h: 0.46 },
    /** Lo que se le dice a la IA que hay en la foto. */
    subject: 'one single person',
    people: 'person',
  },
  {
    id: 'pareja',
    name: 'En pareja',
    tagline: 'Dos personas',
    icon: '💞',
    countdown: 12,
    guide: { cx: 0.5, cy: 0.44, w: 0.56, h: 0.46 },
    subject: 'a couple of exactly two people standing together',
    people: 'people',
  },
  {
    id: 'familia',
    name: 'En familia',
    tagline: 'Tres o mas',
    icon: '👨‍👩‍👧‍👦',
    countdown: 15,
    guide: { cx: 0.5, cy: 0.46, w: 0.82, h: 0.5 },
    subject: 'a family group of several people of different ages',
    people: 'people',
  },
  {
    id: 'ninos',
    name: 'Ninos',
    tagline: 'Para los mas pequenos',
    icon: '🧒',
    countdown: 12,
    // Mas abajo y mas ancho: los ninos son bajos y nunca vienen quietos
    // ni de a uno. Si se usa el ovalo de adulto, salen decapitados.
    guide: { cx: 0.5, cy: 0.56, w: 0.6, h: 0.44 },
    subject: 'one or more children',
    people: 'children',
  },
];

export const DEFAULT_GROUP = PHOTO_GROUPS[0];

export function getGroup(id) {
  return PHOTO_GROUPS.find((g) => g.id === id) ?? DEFAULT_GROUP;
}
