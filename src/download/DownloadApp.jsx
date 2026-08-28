import { useEffect, useRef, useState } from 'react';
import { claimPhoto, fetchPhoto, readPhotoId } from './downloadApi.js';
import { BRAND, CONSENT_TEXT, PRIVACY_TEXT } from '../config.js';
import { asset } from '../assets.js';

/**
 * ============================================================
 *  PAGINA DE DESCARGA  (esto corre en el CELULAR)
 * ------------------------------------------------------------
 *  La persona escanea el QR del totem y llega aqui. Ve su foto,
 *  deja sus datos y se la descarga.
 *
 *  Tres cosas pensadas para un celular, de pie, en una feria:
 *
 *   1. La foto se ve PRIMERO, antes de pedir nada. Nadie llena un
 *      formulario para algo que no ha visto.
 *   2. Los campos son de verdad (<input>), no como en el totem:
 *      aqui la persona usa su propio teclado, el que conoce.
 *   3. Un solo toque para descargar al terminar, y ademas le llega
 *      al correo por si pierde la pagina.
 * ============================================================
 */

export default function DownloadApp() {
  const [id] = useState(readPhotoId);
  const [estado, setEstado] = useState('cargando'); // cargando|listo|enviando|hecho|error
  const [foto, setFoto] = useState(null);
  const [descarga, setDescarga] = useState(null);
  const [error, setError] = useState('');

  const [datos, setDatos] = useState({ name: '', email: '', phone: '' });
  const [acepta, setAcepta] = useState(false);
  const [fallos, setFallos] = useState({});

  /**
   * En un celular la foto ocupa toda la pantalla y el formulario queda
   * debajo de la linea de flote: mucha gente no se da cuenta de que hay
   * que bajar y se queda mirando su foto sin descargarla.
   *
   * El aviso desaparece en cuanto la persona baja, para no repetir algo
   * que ya entendio.
   */
  const [haBajado, setHaBajado] = useState(false);
  const tarjeta = useRef(null);

  useEffect(() => {
    const alBajar = () => {
      if (window.scrollY > 40) setHaBajado(true);
    };
    window.addEventListener('scroll', alBajar, { passive: true });
    return () => window.removeEventListener('scroll', alBajar);
  }, []);

  useEffect(() => {
    if (!id) {
      setError('El enlace esta incompleto. Vuelve a escanear el codigo del totem.');
      setEstado('error');
      return;
    }

    fetchPhoto(id)
      .then((data) => {
        setFoto(data);
        setEstado('listo');
      })
      .catch((err) => {
        setError(err.message);
        setEstado('error');
      });
  }, [id]);

  const enviar = async (event) => {
    event.preventDefault();

    const encontrados = validar(datos, acepta);
    if (Object.keys(encontrados).length > 0) {
      setFallos(encontrados);
      return;
    }

    setEstado('enviando');
    try {
      const { downloadUrl } = await claimPhoto(id, {
        name: datos.name.trim(),
        email: datos.email.trim().toLowerCase(),
        phone: datos.phone.trim(),
      });
      setDescarga(downloadUrl);
      setEstado('hecho');
      // El boton de descarga aparece donde estaba el formulario, que
      // puede quedar fuera de la vista tras cerrarse el teclado. Se
      // lleva la vista hasta el, o la persona cree que no paso nada.
      setTimeout(() => {
        tarjeta.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    } catch (err) {
      setError(err.message);
      setEstado('listo'); // se queda en el formulario para reintentar
    }
  };

  return (
    <div className="dl">
      <header className="dl__head">
        <img className="dl__logo" src={asset('/logo.webp')} alt={BRAND.footer} />
        <p className="dl__event">{BRAND.title}</p>
      </header>

      {estado === 'cargando' && <p className="dl__msg">Cargando tu foto...</p>}

      {estado === 'error' && (
        <div className="dl__card">
          <p className="dl__icon">⚠️</p>
          <p className="dl__msg">{error}</p>
        </div>
      )}

      {foto && estado !== 'error' && (
        <>
          <img className="dl__photo" src={foto.previewUrl} alt="Tu foto de la feria" />

          {estado !== 'hecho' && !haBajado && (
            <p className="dl__bajar">Baja para descargar tu foto</p>
          )}

          {estado === 'hecho' ? (
            <div className="dl__card" ref={tarjeta}>
              <h1 className="dl__title">Listo, es tuya</h1>
              <p className="dl__msg">Tambien te la enviamos al correo.</p>
              <a className="dl__button" href={descarga} download="feria-de-loja.jpg">
                Descargar foto
              </a>
            </div>
          ) : (
            <form className="dl__card" onSubmit={enviar} noValidate ref={tarjeta}>
              <h1 className="dl__title">Completa para descargar</h1>

              <Campo
                label="Nombre"
                value={datos.name}
                error={fallos.name}
                onChange={(v) => setDatos({ ...datos, name: v })}
                autoComplete="name"
              />
              <Campo
                label="Correo electronico"
                type="email"
                inputMode="email"
                value={datos.email}
                error={fallos.email}
                onChange={(v) => setDatos({ ...datos, email: v })}
                autoComplete="email"
              />
              <Campo
                label="Celular"
                type="tel"
                inputMode="tel"
                value={datos.phone}
                error={fallos.phone}
                onChange={(v) => setDatos({ ...datos, phone: v })}
                autoComplete="tel"
              />

              {/* Sin esta casilla no se envia nada ni se descarga la
                  foto: son datos personales de alguien que esta en la
                  calle, no un tramite de formulario. */}
              <label className={`dl__consent ${fallos.consent ? 'is-invalid' : ''}`}>
                <input
                  type="checkbox"
                  checked={acepta}
                  onChange={(e) => setAcepta(e.target.checked)}
                />
                <span>{CONSENT_TEXT}</span>
              </label>
              {fallos.consent && <span className="dl__error">{fallos.consent}</span>}

              <details className="dl__legal">
                <summary>Como usamos tus datos</summary>
                <p>{PRIVACY_TEXT}</p>
              </details>

              {error && <span className="dl__error">{error}</span>}

              <button className="dl__button" type="submit" disabled={estado === 'enviando'}>
                {estado === 'enviando' ? 'Enviando...' : 'Descargar mi foto'}
              </button>
            </form>
          )}
        </>
      )}

      <footer className="dl__foot">{BRAND.footer}</footer>
    </div>
  );
}

function Campo({ label, value, error, onChange, ...props }) {
  return (
    <label className="dl__field">
      <span>{label}</span>
      <input
        className={error ? 'is-invalid' : ''}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...props}
      />
      {error && <span className="dl__error">{error}</span>}
    </label>
  );
}

/** Los tres campos son obligatorios, como se pidio. */
function validar({ name, email, phone }, acepta) {
  const errores = {};
  if (name.trim().length < 2) errores.name = 'Escribe tu nombre';
  if (!/^\S+@\S+\.\S+$/.test(email.trim())) errores.email = 'Correo no valido';
  if (phone.replace(/\D/g, '').length < 7) errores.phone = 'Numero no valido';
  if (!acepta) errores.consent = 'Necesitamos tu permiso para enviarte la foto';
  return errores;
}
