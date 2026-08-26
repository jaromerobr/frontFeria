/** Aviso flotante antes de que expire la sesion por inactividad. */
export default function IdleWarning({ secondsLeft }) {
  if (secondsLeft == null) return null;
  return (
    <div className="idle-warning" role="status">
      Sigues ahi? La sesion se reiniciara en {secondsLeft}s
    </div>
  );
}
