/**
 * Capa de overlays. Responsable de todas las tarjetas flotantes.
 * Control único de separación sobre el menú inferior (~10px).
 * position: absolute, left/right/bottom: 0
 * display: flex, flex-direction: column, justify-content: flex-end
 * padding-bottom: calc(env(safe-area-inset-bottom) + 90px)
 * z-index: 20
 */
export default function OverlayLayer({ children, className = '', style = {}, ...rest }) {
  return (
    <div
      className={`absolute left-0 right-0 bottom-0 z-20 pointer-events-none flex flex-col justify-end ${className}`.trim()}
      style={{
        top: 0,
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 90px)',
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
