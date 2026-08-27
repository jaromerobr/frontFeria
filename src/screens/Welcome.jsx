import Screen from '../components/Screen.jsx';
import BigButton from '../components/BigButton.jsx';
import CircusStage from '../components/CircusStage.jsx';
import SocialStrip from '../components/SocialStrip.jsx';
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

      {/* Las redes van a la vista, no detras de un boton: en una feria
          la gente pasa caminando y lo que no se ve no existe. */}
      <SocialStrip onOpen={onSocial} />

      <p className="welcome__foot">Presentado por {BRAND.footer}</p>
    </Screen>
  );
}
