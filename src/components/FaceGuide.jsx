import { FACE_GUIDE } from '../config.js';

/**
 * Ovalo guia sobre el video.
 *
 * No es decoracion: encuadra la cara siempre igual. Eso sirve para dos
 * cosas: la deformacion del estilo Cabezon sabe donde esta la cabeza sin
 * deteccion de rostro, y la IA recibe fotos parecidas entre si, en vez de
 * depender de si la persona se paro cerca o lejos.
 *
 * La guia viene del grupo elegido (solo, pareja, familia, ninos): con mas
 * gente se ensancha, y con ninos baja, porque si no salen cortados.
 * Es el mismo dato que usa photoEffect.js para deformar.
 */
export default function FaceGuide({ guide = FACE_GUIDE }) {
  const { cx, cy, w, h } = guide;

  return (
    <svg className="face-guide" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <ellipse
        cx={cx * 100}
        cy={cy * 100}
        rx={(w / 2) * 100}
        ry={(h / 2) * 100}
        className="face-guide__oval"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
