/**
 * Capa de overlays. Contenedor para paneles.
 * El posicionamiento lo controla MapScreenPanel (fuente única de verdad).
 */
export default function OverlayLayer({ children, className = '', style = {}, ...rest }) {
  return (
    <div
      className={`absolute inset-0 z-20 pointer-events-none ${className}`.trim()}
      style={style}
      {...rest}
    >
      {children}
    </div>
  );
}
