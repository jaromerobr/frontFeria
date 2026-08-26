import Screen from '../components/Screen.jsx';

export default function SendingScreen() {
  return (
    <Screen className="screen--sending">
      <div className="sending__icon">📤</div>
      <h2 className="title">Enviando tu foto</h2>
      <p className="lead">Espera un momento...</p>
      <div className="dots">
        <span />
        <span />
        <span />
      </div>
    </Screen>
  );
}
