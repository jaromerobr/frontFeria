/** Contenedor comun de pantalla: centra el contenido y aplica la transicion. */
export default function Screen({ children, className = '' }) {
  return <main className={`screen ${className}`}>{children}</main>;
}
