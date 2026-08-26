import Screen from '../components/Screen.jsx';

/** Se ve unas decimas mientras el canvas dibuja la caricatura. */
export default function ProcessingScreen() {
  return (
    <Screen className="screen--processing">
      <div className="ink-splat">🖌️</div>
      <h2 className="title">Dibujando tu caricatura</h2>
      <div className="dots">
        <span />
        <span />
        <span />
      </div>
    </Screen>
  );
}
