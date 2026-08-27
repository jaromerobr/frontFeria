import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import Screen from '../components/Screen.jsx';
import BigButton from '../components/BigButton.jsx';
import { publishForDownload } from '../services/api.js';
import { DELIVERY_SECONDS } from '../config.js';
import { playError, playSuccess } from '../services/sound.js';

/**
 * Entrega por codigo QR.
 *
 * La persona escanea, y en SU celular descarga la foto y deja sus
 * datos. En una feria esto gana por goleada al formulario del totem:
 *
 *   - nadie escribe un correo con un teclado en pantalla, que es donde
 *     mas se equivoca la gente y donde mas se atasca la fila
 *   - cada quien teclea en el teclado al que esta acostumbrado
 *   - el totem queda libre para el siguiente en cuanto ve el QR
 *
 * El QR se genera aqui, en el momento, porque el enlace lo devuelve el
 * backend recien cuando sube la foto: no puede estar hecho de antes.
 */
export default function DeliveryScreen({ photo, style, group, onDone }) {
  const [estado, setEstado] = useState('subiendo'); // subiendo | listo | error
  const [qr, setQr] = useState(null);
  const [error, setError] = useState('');
  const [left, setLeft] = useState(DELIVERY_SECONDS);

  useEffect(() => {
    let cancelado = false;

    (async () => {
      try {
        const { url } = await publishForDownload({ photo, style, group });
        // Nivel M y buen margen: el codigo se escanea de pie, a medio
        // metro, y a veces con reflejos del sol en la pantalla.
        const dataUrl = await QRCode.toDataURL(url, {
          margin: 2,
          width: 720,
          errorCorrectionLevel: 'M',
          color: { dark: '#181410', light: '#ffffff' },
        });
        if (cancelado) return;
        setQr(dataUrl);
        setEstado('listo');
        playSuccess();
      } catch (err) {
        if (cancelado) return;
        setError(err.message || 'No se pudo preparar la descarga.');
        setEstado('error');
        playError();
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [photo, style, group]);

  /**
   * Cuenta atras propia, mas larga que el timeout normal de sesion:
   * escanear y descargar toma su tiempo y seria absurdo reiniciar el
   * totem justo mientras la persona apunta el celular.
   */
  useEffect(() => {
    if (estado !== 'listo') return undefined;
    const id = setInterval(() => setLeft((v) => v - 1), 1000);
    return () => clearInterval(id);
  }, [estado]);

  useEffect(() => {
    if (left <= 0) onDone();
  }, [left, onDone]);

  if (estado === 'subiendo') {
    return (
      <Screen className="screen--delivery">
        <h2 className="title">Preparando tu descarga</h2>
        <div className="dots">
          <span />
          <span />
          <span />
        </div>
      </Screen>
    );
  }

  if (estado === 'error') {
    return (
      <Screen className="screen--delivery">
        <div className="error__icon">⚠️</div>
        <h2 className="title">No pudimos preparar la descarga</h2>
        <p className="lead">{error}</p>
        <BigButton onClick={onDone}>Salir</BigButton>
      </Screen>
    );
  }

  return (
    <Screen className="screen--delivery">
      <h2 className="title">Escanea y llevate tu foto</h2>
      <p className="lead lead--small">
        Apunta con la camara de tu celular. Ahi la descargas y dejas tus datos.
      </p>

      <div className="delivery">
        <img className="delivery__qr" src={qr} alt="Codigo para descargar tu foto" />
        <img className="delivery__thumb" src={photo.dataUrl} alt="Tu foto" />
      </div>

      <p className="hint">Este codigo desaparece en {Math.max(left, 0)}s</p>

      <BigButton onClick={onDone}>Listo</BigButton>
    </Screen>
  );
}
