/**
 * Fila de banderines de feria, colgados de una cuerda.
 *
 * Cada banderin se mueve con un desfase distinto, asi que la fila
 * ondea como una ola en vez de parpadear toda a la vez. El desfase se
 * calcula por posicion (no al azar) para que la ola vaya de izquierda
 * a derecha y se vea como viento, no como ruido.
 *
 * Es decorativo: va fijo arriba de todo, en todas las pantallas.
 */
export default function Bunting({ count = 16 }) {
  return (
    <div className="bunting" aria-hidden="true">
      <span className="bunting__rope" />
      {Array.from({ length: count }, (_, i) => (
        <span
          className="bunting__flag"
          key={i}
          style={{
            // La ola recorre la fila; cada 6 banderines vuelve a empezar.
            animationDelay: `${(i % 6) * 0.22}s`,
            // Duraciones ligeramente distintas: sin esto se sincronizan
            // y el conjunto se ve mecanico.
            animationDuration: `${2.4 + (i % 3) * 0.5}s`,
          }}
        />
      ))}
    </div>
  );
}
