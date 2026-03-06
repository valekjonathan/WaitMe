/**
 * Pin central tipo Uber — elemento UI fijo, no parte del mapa.
 * Posicionado exactamente entre StreetSearch y CreateAlertCard cuando top es medido.
 * El mapa se mueve por debajo; este pin NO se mueve.
 * @param {number} [top] — top en px (medido con ResizeObserver). Si no se pasa, usa calc(50% - 60px).
 * @param {string} [className] — clases adicionales (ej. pointer-events-none).
 */
export default function CenterPin({ top, className = '' }) {
  return (
    <div
      className={`absolute z-10 pointer-events-none flex flex-col items-center ${className}`.trim()}
      style={{
        left: '50%',
        transform: 'translateX(-50%)',
        top: typeof top === 'number' ? `${top}px` : 'calc(50% - 60px)',
        width: 18,
      }}
    >
      <div
        className="w-[18px] h-[18px] rounded-full bg-purple-500"
        style={{ boxShadow: '0 0 15px rgba(168,85,247,0.8)' }}
      />
      <div className="w-0.5 h-9 bg-purple-500" />
    </div>
  );
}
