/**
 * ============================================================
 *  TECLADO EN PANTALLA
 * ------------------------------------------------------------
 *  El totem es tactil y NO tiene teclado fisico. Chromium en Linux
 *  tampoco muestra un teclado virtual por su cuenta, asi que sin
 *  esto el formulario es imposible de llenar en el hardware real.
 *
 *  Se hace dentro de la app a proposito, no con el teclado del
 *  sistema: asi no depende de que alguien haya instalado onboard
 *  o squeekboard en el Jetson, y el estilo combina con el totem.
 *
 *  Detalle importante: cada tecla usa `onPointerDown` con
 *  preventDefault(). Si se usara `onClick`, el input perderia el
 *  foco al tocar la tecla y el teclado se cerraria solo.
 * ============================================================
 */

import { useState } from 'react';

const LETTERS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ñ'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm', '.', '_', '-'],
];

const DIGITS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['0'],
];

/** Dominios que cubren casi todos los correos en una feria de Ecuador. */
const DOMAINS = ['@gmail.com', '@hotmail.com', '@outlook.com', '@yahoo.com'];

/**
 * @param {'text'|'email'|'tel'} layout  que teclado mostrar
 * @param {(char: string) => void} onKey       agregar un caracter
 * @param {() => void} onBackspace             borrar el ultimo
 * @param {() => void} onClose                 esconder el teclado
 */
export default function OnScreenKeyboard({ layout, onKey, onBackspace, onClose }) {
  const [caps, setCaps] = useState(false);

  // Evita que el input pierda el foco al tocar una tecla.
  const press = (fn) => (event) => {
    event.preventDefault();
    fn();
  };

  if (layout === 'tel') {
    return (
      <div className="keyboard keyboard--numeric" role="group" aria-label="Teclado numerico">
        <div className="keyboard__pad">
          {DIGITS.flat().map((d) => (
            <Key key={d} onPress={press(() => onKey(d))} wide={d === '0'}>
              {d}
            </Key>
          ))}
          <Key onPress={press(onBackspace)} variant="warn">
            ⌫
          </Key>
          <Key onPress={press(onClose)} variant="ok">
            Listo
          </Key>
        </div>
      </div>
    );
  }

  const isEmail = layout === 'email';

  return (
    <div className="keyboard" role="group" aria-label="Teclado">
      {isEmail && (
        <div className="keyboard__row keyboard__row--shortcuts">
          <Key onPress={press(() => onKey('@'))}>@</Key>
          {DOMAINS.map((d) => (
            <Key key={d} onPress={press(() => onKey(d))} variant="hint">
              {d}
            </Key>
          ))}
        </div>
      )}

      {LETTERS.map((row, i) => (
        <div className="keyboard__row" key={i}>
          {i === 2 && (
            <Key onPress={press(() => setCaps((c) => !c))} variant={caps ? 'on' : 'mod'}>
              ⇧
            </Key>
          )}
          {row.map((letter) => (
            <Key
              key={letter}
              onPress={press(() => {
                onKey(caps ? letter.toUpperCase() : letter);
                if (caps) setCaps(false); // mayuscula de una sola letra
              })}
            >
              {caps ? letter.toUpperCase() : letter}
            </Key>
          ))}
          {i === 2 && (
            <Key onPress={press(onBackspace)} variant="warn">
              ⌫
            </Key>
          )}
        </div>
      ))}

      <div className="keyboard__row">
        {!isEmail && (
          <Key onPress={press(() => onKey(' '))} variant="space">
            espacio
          </Key>
        )}
        {isEmail && (
          <Key onPress={press(() => onKey('.'))} variant="space">
            punto
          </Key>
        )}
        <Key onPress={press(onClose)} variant="ok">
          Listo
        </Key>
      </div>
    </div>
  );
}

function Key({ children, onPress, variant = '', wide = false }) {
  return (
    <button
      type="button"
      className={`key ${variant ? `key--${variant}` : ''} ${wide ? 'key--wide' : ''}`}
      onPointerDown={onPress}
    >
      {children}
    </button>
  );
}
