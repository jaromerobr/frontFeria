import Screen from '../components/Screen.jsx';
import BigButton from '../components/BigButton.jsx';
import { BRAND } from '../config.js';

export default function Welcome({ onStart }) {
  return (
    <Screen className="screen--welcome">
      <p className="welcome__kicker">Bienvenido a la</p>
      <h1 className="brand">{BRAND.title}</h1>
      <p className="brand__sub">{BRAND.subtitle}</p>

      <p className="lead">
        Ponte frente a la camara y llevate
        <br />
        tu caricatura de la feria
      </p>

      <BigButton onClick={onStart} pulse>
        Comenzar
      </BigButton>

      <p className="welcome__foot">Presentado por {BRAND.footer}</p>
    </Screen>
  );
}
