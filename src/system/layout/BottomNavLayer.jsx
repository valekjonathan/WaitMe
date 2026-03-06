/**
 * Capa del menú inferior. Responsable solo del BottomNav.
 * position: absolute, left/right/bottom: 0
 * z-index: 30
 */
export default function BottomNavLayer({ children, className = '', style = {}, ...rest }) {
  return (
    <div
      className={`absolute left-0 right-0 bottom-0 z-30 pointer-events-auto ${className}`.trim()}
      style={style}
      {...rest}
    >
      {children}
    </div>
  );
}
