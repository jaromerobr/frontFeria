/** Fila de banderines de feria. Decorativo, va fijo arriba de todo. */
export default function Bunting({ count = 16 }) {
  return (
    <div className="bunting" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <span key={i} />
      ))}
    </div>
  );
}
