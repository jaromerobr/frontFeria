import Screen from '../components/Screen.jsx';
import BigButton from '../components/BigButton.jsx';
import CircusStage from '../components/CircusStage.jsx';
import { BRAND } from '../config.js';

export default function Welcome({ onStart, onSocial }) {
  return (
    <Screen className="screen--welcome">
      {/* Todo el movimiento vive aqui y SOLO aqui: es la pantalla que
          tiene que llamar desde lejos. En las demas la gente esta
          haciendo algo y las animaciones estorban. */}
      <CircusStage />
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

      <button className="link-button" type="button" onClick={onSocial}>
        Conoce {BRAND.footer}
      </button>

      <p className="welcome__foot">Presentado por {BRAND.footer}</p>
    </Screen>
  );
}
