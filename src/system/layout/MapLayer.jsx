/**
 * Capa del mapa. Responsable solo del mapa.
 * position: absolute, inset: 0, z-index: 0
 */
export default function MapLayer({ children, className = '', style = {}, ...rest }) {
  return (
    <div
      className={`absolute inset-0 z-0 ${className}`.trim()}
      style={{ ...style }}
      {...rest}
    >
      {children}
    </div>
  );
}
