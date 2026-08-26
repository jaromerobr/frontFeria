/**
 * Utilidades de modo totem.
 * Todo lo que evita que el usuario "se salga" de la aplicacion.
 */

/** Entra a pantalla completa. Debe llamarse dentro de un gesto del usuario. */
export function enterFullscreen() {
  const el = document.documentElement;
  if (!document.fullscreenElement && el.requestFullscreen) {
    el.requestFullscreen().catch(() => {});
  }
}

/** Bloquea menu contextual, seleccion de texto, zoom por pellizco y F5/Ctrl+R. */
export function installKioskGuards() {
  const prevent = (e) => e.preventDefault();

  document.addEventListener('contextmenu', prevent);
  document.addEventListener('selectstart', prevent);
  document.addEventListener('dragstart', prevent);
  document.addEventListener('gesturestart', prevent);

  const onKey = (e) => {
    const blocked =
      e.key === 'F5' ||
      ((e.ctrlKey || e.metaKey) && ['r', 'p', 's', 'f'].includes(e.key.toLowerCase()));
    if (blocked) e.preventDefault();
  };
  document.addEventListener('keydown', onKey);

  return () => {
    document.removeEventListener('contextmenu', prevent);
    document.removeEventListener('selectstart', prevent);
    document.removeEventListener('dragstart', prevent);
    document.removeEventListener('gesturestart', prevent);
    document.removeEventListener('keydown', onKey);
  };
}
