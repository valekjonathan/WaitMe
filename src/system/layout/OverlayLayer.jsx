/**
 * Capa de overlays. Responsable de todas las tarjetas flotantes.
 * position: absolute, left/right/bottom: 0
 * padding-bottom: calc(env(safe-area-inset-bottom) + 70px)
 * z-index: 20
 */
export default function OverlayLayer({ children, className = '', style = {}, ...rest }) {
  return (
    <div
      className={`absolute inset-0 z-20 pointer-events-none ${className}`.trim()}
      style={{
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 70px)',
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
