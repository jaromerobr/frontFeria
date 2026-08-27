import { useState } from 'react';

/**
 * Muestra la foto dentro de un marco que se ajusta a ELLA.
 *
 * La imagen puede venir vertical (lo normal en el totem) u horizontal
 * (si el modelo devuelve otra proporcion, o si algun dia se usa una
 * camara apaisada). Con un marco de tamano fijo, una de las dos
 * siempre queda con franjas vacias a los lados o recortada.
 *
 * Por eso el marco no impone una caja: ENVUELVE a la imagen. La imagen
 * se limita por alto y por ancho, y el marco toma el tamano que le
 * quede. Asi no hay franjas vacias ni recortes, venga como venga.
 *
 * La clase is-landscape / is-portrait solo sirve para ajustar cuanto
 * puede crecer cada una: una foto apaisada necesita menos alto y mas
 * ancho que una vertical.
 */
export default function PhotoPreview({ src }) {
  const [ratio, setRatio] = useState(null);

  return (
    <div className={`photo-frame ${ratio && ratio > 1 ? 'is-landscape' : 'is-portrait'}`}>
      <img
        className="photo-frame__img"
        src={src}
        alt="Foto capturada"
        onLoad={(e) => setRatio(e.target.naturalWidth / e.target.naturalHeight)}
      />
    </div>
  );
}
