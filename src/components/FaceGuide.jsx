import { FACE_GUIDE } from '../config.js';

/**
 * Ovalo guia sobre el video.
 *
 * No es decoracion: es lo que hace que los accesorios (sombrero, bigote)
 * caigan en su sitio SIN deteccion de rostro. Si la persona se pone
 * dentro del ovalo, sabemos donde esta su cara.
 *
 * Usa el MISMO FACE_GUIDE que photoEffect.js, asi que mover el ovalo
 * mueve los accesorios automaticamente.
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
