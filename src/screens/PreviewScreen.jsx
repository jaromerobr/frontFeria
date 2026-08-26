import Screen from '../components/Screen.jsx';
import BigButton from '../components/BigButton.jsx';
import PhotoPreview from '../components/PhotoPreview.jsx';

export default function PreviewScreen({ photo, styleName, onRetake, onChangeStyle, onAccept }) {
  return (
    <Screen className="screen--preview">
      <h2 className="title">Tu foto</h2>
      <p className="lead lead--small">Estilo: {styleName}</p>

      <PhotoPreview src={photo.dataUrl} />

      <div className="button-row">
        <BigButton variant="secondary" onClick={onRetake}>
          🔄 Repetir
        </BigButton>
        {/* Cambiar de estilo NO vuelve a tomar la foto: reusa la original. */}
        <BigButton variant="secondary" onClick={onChangeStyle}>
          🎨 Otro estilo
        </BigButton>
        <BigButton onClick={onAccept}>✓ Aceptar</BigButton>
      </div>
    </Screen>
  );
}
