import Screen from '../components/Screen.jsx';
import BigButton from '../components/BigButton.jsx';
import CircusStage from '../components/CircusStage.jsx';
import SocialStrip from '../components/SocialStrip.jsx';
import CreatorsSlider from '../components/CreatorsSlider.jsx';

export default function Welcome({ onStart, onSocial }) {
  return (
    <Screen className="screen--welcome">
      {/* Todo el movimiento vive aqui y SOLO aqui: es la pantalla que
          tiene que llamar desde lejos. En las demas la gente esta
          haciendo algo y las animaciones estorban. */}
      <CircusStage />
      {/* Donde estaba el titulo del evento van ahora las empresas que
          hicieron el totem, rotando una a una. */}
      <CreatorsSlider />

      <BigButton onClick={onStart} pulse>
        Comenzar
      </BigButton>

      {/* Las redes van a la vista, no detras de un boton: en una feria
          la gente pasa caminando y lo que no se ve no existe. */}
      <SocialStrip onOpen={onSocial} />

    </Screen>
  );
}
