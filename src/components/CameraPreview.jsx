import { forwardRef } from 'react';
import { MIRROR_CAMERA } from '../config.js';

/**
 * Video en vivo de la camara. Solo se monta si el modo de camara
 * soporta preview (webcam). En demo/service queda un fondo neutro.
 */
const CameraPreview = forwardRef(function CameraPreview({ live }, ref) {
  if (!live) return <div className="camera-preview camera-preview--placeholder" />;

  return (
    <video
      ref={ref}
      className={`camera-preview ${MIRROR_CAMERA ? 'is-mirrored' : ''}`}
      playsInline
      muted
      autoPlay
    />
  );
});

export default CameraPreview;
