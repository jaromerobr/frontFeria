import Screen from '../components/Screen.jsx';
import BigButton from '../components/BigButton.jsx';

/**
 * Pantalla de error. Nunca se deja al usuario atascado:
 * siempre hay "Reintentar" y "Salir".
 */
export default function ErrorScreen({ message, onRetry, onCancel, onSaveForLater = null }) {
  return (
    <Screen className="screen--error">
      <div className="error__icon">⚠️</div>
      <h2 className="title">Algo salio mal</h2>
      <p className="lead">{message || 'No pudimos enviar tu foto.'}</p>
      <div className="button-row">
        <BigButton variant="secondary" onClick={onCancel}>
          Salir
        </BigButton>
        {/* Si ya hay foto y datos, nadie tiene por que esperar al wifi. */}
        {onSaveForLater && (
          <BigButton variant="secondary" onClick={onSaveForLater}>
            Enviar mas tarde
          </BigButton>
        )}
        <BigButton onClick={onRetry}>Reintentar</BigButton>
      </div>
    </Screen>
  );
}
