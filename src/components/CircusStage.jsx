/**
 * ============================================================
 *  ESCENARIO DE CIRCO  (solo en la pantalla de bienvenida)
 * ------------------------------------------------------------
 *  Un totem quieto en una feria es invisible. Compite con musica,
 *  luces y puestos de comida, y la gente pasa de largo. Esta capa
 *  existe para que se vea el movimiento desde diez metros.
 *
 *  Va SOLO en la bienvenida. En las demas pantallas la persona ya
 *  esta haciendo algo y las animaciones estorban.
 *
 *  Todo se anima con `transform` y `opacity`, que la GPU resuelve
 *  sola. Nada anima colores, sombras ni tamanos de fondo: eso
 *  obliga al navegador a repintar y en el Jetson se nota.
 *
 *  Todo esto se apaga solo si el sistema pide menos movimiento
 *  (regla global de prefers-reduced-motion en styles.css).
 * ============================================================ */

/**
 * Bombillas de la marquesina. Van en cuatro tiras (arriba, abajo y los
 * dos lados) porque una sola fila con wrap se queda toda arriba: para
 * que enmarque la pantalla hay que colocarlas por lado.
 */
const BULBS = { horizontal: 16, vertical: 9 };

/** Globos que suben. Cada uno con su color, su carril y su ritmo. */
const BALLOONS = [
  { color: 'var(--red)', left: '6%', delay: '0s', dur: '13s', size: 1 },
  { color: 'var(--mustard)', left: '22%', delay: '4s', dur: '16s', size: 0.75 },
  { color: 'var(--teal)', left: '74%', delay: '2s', dur: '14s', size: 0.9 },
  { color: 'var(--blue)', left: '90%', delay: '7s', dur: '17s', size: 0.7 },
];

/** Confeti cayendo. Pocos y grandes: muchos y chicos se ven como ruido. */
const CONFETTI = Array.from({ length: 14 }, (_, i) => ({
  left: `${(i * 7.3 + 3) % 100}%`,
  delay: `${(i * 0.9) % 8}s`,
  dur: `${7 + (i % 5) * 1.6}s`,
  color: ['var(--red)', 'var(--mustard)', 'var(--teal)', 'var(--blue)'][i % 4],
  tilt: `${(i * 37) % 360}deg`,
}));

export default function CircusStage() {
  return (
    <div className="circus" aria-hidden="true">
      {/* Rayos girando despacio: es lo que da la sensacion de carpa. */}
      <div className="circus__rays" />

      {/* Marquesina que enmarca la pantalla por los cuatro lados. */}
      {['top', 'bottom', 'left', 'right'].map((lado) => (
        <div className={`circus__marquee circus__marquee--${lado}`} key={lado}>
          {Array.from(
            { length: lado === 'top' || lado === 'bottom' ? BULBS.horizontal : BULBS.vertical },
            (_, i) => (
              // El desfase hace que la luz "corra" en vez de parpadear todo a la vez.
              <span key={i} style={{ animationDelay: `${(i % 6) * 0.18}s` }} />
            ),
          )}
        </div>
      ))}

      {BALLOONS.map((b, i) => (
        <span
          key={`balloon-${i}`}
          className="circus__balloon"
          style={{
            left: b.left,
            background: b.color,
            animationDelay: b.delay,
            animationDuration: b.dur,
            scale: b.size,
          }}
        />
      ))}

      {CONFETTI.map((c, i) => (
        <span
          key={`confetti-${i}`}
          className="circus__confetti"
          style={{
            left: c.left,
            background: c.color,
            animationDelay: c.delay,
            animationDuration: c.dur,
            rotate: c.tilt,
          }}
        />
      ))}
    </div>
  );
}
