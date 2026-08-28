import { useEffect, useRef, useState } from 'react';
import BigButton from './BigButton.jsx';
import OnScreenKeyboard from './OnScreenKeyboard.jsx';
import { CONSENT_TEXT, PRIVACY_TEXT } from '../config.js';

const FIELDS = {
  name: { label: 'Nombre', layout: 'text' },
  email: { label: 'Correo electronico', layout: 'email' },
  phone: { label: 'Celular', layout: 'tel' },
};

const FIELD_KEYS = Object.keys(FIELDS);

/**
 * Formulario de datos.
 *
 * Validacion minima a proposito: en un totem publico cada friccion
 * extra pierde usuarios. Lo unico que se exige de verdad es el
 * consentimiento, que no es friccion sino obligacion.
 *
 * El teclado en pantalla es parte del formulario, no un adorno:
 * en el totem no hay teclado fisico.
 */
export default function UserForm({ onSubmit, onBack, onTypingChange }) {
  const [values, setValues] = useState({ name: '', email: '', phone: '' });
  const [errors, setErrors] = useState({});
  const [consent, setConsent] = useState(false);
  const [active, setActive] = useState(null); // campo con el teclado abierto

  /**
   * Avisa a la pantalla que se abrio el teclado. Con el teclado
   * desplegado no cabe todo, asi que la pantalla esconde la foto:
   * mientras escribes no la estas mirando.
   */
  const focusField = (key) => {
    setActive(key);
    onTypingChange?.(true);
  };

  const closeKeyboard = () => {
    setActive(null);
    onTypingChange?.(false);
  };

  const type = (char) => {
    if (!active) return;
    setValues((v) => ({ ...v, [active]: v[active] + char }));
    setErrors((e) => ({ ...e, [active]: null }));
  };

  const backspace = () => {
    if (!active) return;
    setValues((v) => ({ ...v, [active]: v[active].slice(0, -1) }));
  };

  /**
   * TECLADO FISICO.
   *
   * En el totem no hay ninguno, pero puede aparecer: alguien conecta uno
   * por USB para probar, o para llenar el formulario mas rapido en una
   * demo. Como los campos son <div> y no <input>, el navegador no escribe
   * nada solo; hay que escuchar las teclas a mano.
   *
   * Si nadie ha tocado un campo todavia, la primera tecla escrita salta
   * al primer campo vacio: quien tiene teclado espera poder escribir de
   * una, sin tocar la pantalla primero.
   */
  const stateRef = useRef({ active, values });
  stateRef.current = { active, values };

  useEffect(() => {
    const onKeyDown = (event) => {
      // Atajos del sistema (Ctrl+C, Alt+Tab...): no son escritura.
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      const { active: activeField, values: currentValues } = stateRef.current;
      let field = activeField;

      if (event.key === 'Escape') {
        closeKeyboard();
        return;
      }

      if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
        const index = FIELD_KEYS.indexOf(field);
        const next = FIELD_KEYS[index + 1];
        if (next) focusField(next);
        else closeKeyboard();
        return;
      }

      if (event.key === 'Backspace') {
        if (!field) return;
        event.preventDefault();
        // Se borra aqui y no con backspace(): esa funcion lee `active`
        // del render en que se creo, que al montar el efecto era null.
        // El campo bueno es el de stateRef.
        setValues((v) => ({ ...v, [field]: v[field].slice(0, -1) }));
        return;
      }

      // Una tecla imprimible: letras, numeros, simbolos, espacio.
      if (event.key.length !== 1) return;
      event.preventDefault();

      if (!field) {
        field = FIELD_KEYS.find((k) => !currentValues[k]) ?? FIELD_KEYS[0];
        focusField(field);
      }

      setValues((v) => ({ ...v, [field]: v[field] + event.key }));
      setErrors((e) => ({ ...e, [field]: null }));
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // Las funciones de arriba no cambian de identidad entre renders de
    // forma relevante: el estado se lee siempre desde stateRef.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    closeKeyboard();

    const found = validate(values, consent);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }
    onSubmit({
      name: values.name.trim(),
      email: values.email.trim().toLowerCase(),
      phone: values.phone.trim(),
      consent: true,
      consentText: `${CONSENT_TEXT} ${PRIVACY_TEXT}`,
      consentAt: new Date().toISOString(),
    });
  };

  return (
    <form className="user-form" onSubmit={handleSubmit} noValidate>
      <div className="user-form__fields">
        {Object.entries(FIELDS).map(([key, field]) => (
          <Field
            key={key}
            label={field.label}
            value={values[key]}
            error={errors[key]}
            active={active === key}
            onFocus={() => focusField(key)}
          />
        ))}

        <label className="consent">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => {
              setConsent(e.target.checked);
              setErrors((prev) => ({ ...prev, consent: null }));
            }}
          />
          <span className="consent__box" aria-hidden="true">
            {consent ? '✓' : ''}
          </span>
          <span className="consent__text">
            {CONSENT_TEXT}
            <small className="consent__legal">{PRIVACY_TEXT}</small>
          </span>
        </label>
        {errors.consent && <span className="field__error">{errors.consent}</span>}

        <div className="button-row">
          <BigButton variant="secondary" onClick={onBack}>
            Volver
          </BigButton>
          <button className="big-button big-button--primary" type="submit">
            Enviar foto
          </button>
        </div>
      </div>

      {active && (
        <OnScreenKeyboard
          layout={FIELDS[active].layout}
          onKey={type}
          onBackspace={backspace}
          onClose={closeKeyboard}
        />
      )}
    </form>
  );
}

/**
 * El campo es un <div>, no un <input>.
 *
 * En el totem se escribe solo con el teclado en pantalla, y un input
 * real abriria ademas el teclado del sistema (si lo hubiera) y dejaria
 * un cursor parpadeando que en tactil confunde. Asi el unico camino
 * de entrada es el nuestro y se ve siempre igual.
 */
function Field({ label, value, error, active, onFocus }) {
  return (
    <div className="field">
      <span className="field__label">{label}</span>
      <div
        className={`field__input ${error ? 'is-invalid' : ''} ${active ? 'is-active' : ''}`}
        onPointerDown={onFocus}
        role="textbox"
        tabIndex={0}
        aria-label={label}
      >
        {value || <span className="field__placeholder">Toca para escribir</span>}
        {active && <span className="field__caret" />}
      </div>
      {error && <span className="field__error">{error}</span>}
    </div>
  );
}

/** Reglas basicas. Si el backend pide mas validacion, se ajusta aqui. */
function validate({ name, email, phone }, consent) {
  const errors = {};
  if (name.trim().length < 2) errors.name = 'Escribe tu nombre';
  if (!/^\S+@\S+\.\S+$/.test(email.trim())) errors.email = 'Correo no valido';
  if (phone.replace(/\D/g, '').length < 7) errors.phone = 'Numero no valido';
  if (!consent) errors.consent = 'Necesitamos tu permiso para enviarte la foto';
  return errors;
}
