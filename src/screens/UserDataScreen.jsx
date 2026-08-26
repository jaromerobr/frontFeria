import { useState } from 'react';
import Screen from '../components/Screen.jsx';
import UserForm from '../components/UserForm.jsx';

export default function UserDataScreen({ photo, onSubmit, onBack }) {
  // Con el teclado abierto no cabe la foto en una pantalla de portatil.
  // Se esconde: mientras se escribe, nadie la esta mirando.
  const [typing, setTyping] = useState(false);

  return (
    <Screen className={`screen--form ${typing ? 'is-typing' : ''}`}>
      <div className="form-layout">
        <div className="form-layout__photo">
          <img className="thumb" src={photo.dataUrl} alt="Tu foto" />
        </div>
        <div className="form-layout__fields">
          <h2 className="title">Tus datos</h2>
          <p className="lead lead--small">Te enviamos la foto a tu correo</p>
          <UserForm onSubmit={onSubmit} onBack={onBack} onTypingChange={setTyping} />
        </div>
      </div>
    </Screen>
  );
}
