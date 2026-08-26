import { FACE_GUIDE } from '../config.js';

/**
 * Ovalo guia sobre el video.
 *
 * No es decoracion: encuadra la cara siempre igual. Eso sirve para dos
 * cosas: la deformacion del estilo Cabezon sabe donde esta la cabeza sin
 * deteccion de rostro, y la IA recibe fotos parecidas entre si, en vez de
 * depender de si la persona se paro cerca o lejos.
 *
 * Usa el MISMO FACE_GUIDE que photoEffect.js: es un solo dato.
 */
export default function FaceGuide() {
  const { cx, cy, w, h } = FACE_GUIDE;

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
