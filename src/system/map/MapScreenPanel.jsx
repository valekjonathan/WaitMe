/**
 * FUENTE ÚNICA DE VERDAD para posicionamiento de paneles flotantes.
 * Controla: anchura, separación respecto al menú inferior, safe area.
 * Usado por CreateAlertCard y UserAlertCard (search).
 *
 * paddingBottom = 20px (gap) + --bottom-nav-h
 */
export default function MapScreenPanel({ children, className = '', style = {}, ...rest }) {
  return (
    <div
      className={`absolute left-0 right-0 bottom-0 flex justify-center pointer-events-none z-20 ${className}`.trim()}
      style={{
        paddingBottom: 'calc(20px + var(--bottom-nav-h, 64px))',
        ...style,
      }}
      data-map-screen-panel
      {...rest}
    >
      <div
        className="w-[92%] max-w-[460px] pointer-events-auto min-h-[200px]"
        style={{
          transform: 'translateY(0)',
          maxHeight: 'min(55vh, 340px)',
          overflowY: 'auto',
        }}
      >
        {children}
      </div>
    </div>
  );
}
