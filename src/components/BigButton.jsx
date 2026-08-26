/** Boton de totem: grande, con area de toque generosa. */
export default function BigButton({ children, onClick, variant = 'primary', disabled, pulse }) {
  return (
    <button
      className={`big-button big-button--${variant} ${pulse ? 'big-button--pulse' : ''}`}
      onClick={onClick}
      disabled={disabled}
      type="button"
    >
      {children}
    </button>
  );
}
