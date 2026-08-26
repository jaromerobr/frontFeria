/** Muestra la foto capturada dentro de un marco. */
export default function PhotoPreview({ src }) {
  return (
    <div className="photo-frame">
      <img className="photo-frame__img" src={src} alt="Foto capturada" />
    </div>
  );
}
