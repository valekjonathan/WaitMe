import { useEffect } from 'react';

/**
 * FUENTE ÚNICA DE VERDAD para posicionamiento de paneles flotantes.
 * Controla: anchura, separación respecto al menú inferior, safe area.
 * Usado por CreateAlertCard y UserAlertCard (search).
 *
 * paddingBottom = gapPx (gap) + --bottom-nav-h
 * Gap objetivo: 15px visual entre tarjeta y menú inferior. gapPx=22 compensa ~7px del nav.
 */
export default function MapScreenPanel({
  children,
  className = '',
  style = {},
  cardShiftUp = 0,
  overflowHidden = false,
  measureLabel,
  ...rest
}) {
  const gapPx = Math.max(0, 22 - cardShiftUp);

  useEffect(() => {
    if (!measureLabel || !import.meta.env.DEV) return;
    const raf = requestAnimationFrame(() => {
      const el = document.querySelector('[data-map-screen-panel-inner]');
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const key = measureLabel === 'create' ? 'createCardBottom' : 'navigateCardBottom';
      const prev = window.__WAITME_CARD_MEASURE || {};
      const next = { ...prev, [key]: rect.bottom };
      window.__WAITME_CARD_MEASURE = next;
      console.log(`[MapScreenPanel] ${key}=${rect.bottom.toFixed(2)}`);
      if (next.createCardBottom != null && next.navigateCardBottom != null) {
        const d = Math.abs(next.createCardBottom - next.navigateCardBottom);
        console.log(`[MapScreenPanel] difference=${d.toFixed(2)}px ${d <= 1 ? '✓' : '✗'}`);
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [measureLabel]);
  return (
    <div
      className={`absolute left-0 right-0 bottom-0 flex justify-center pointer-events-none z-20 ${className}`.trim()}
      style={{
        bottom: cardShiftUp,
        paddingBottom: `calc(${gapPx}px + var(--bottom-nav-h, calc(64px + env(safe-area-inset-bottom, 0px))))`,
        ...style,
      }}
      data-map-screen-panel
      {...rest}
    >
      <div
        data-map-screen-panel-inner
        className="w-[92%] max-w-[460px] pointer-events-auto min-h-[200px]"
        style={{
          transform: 'translateY(0)',
          ...(measureLabel === 'create' || measureLabel === 'navigate'
            ? { minHeight: 260, maxHeight: 300 }
            : { maxHeight: 'min(55vh, 340px)' }),
          overflowY: overflowHidden ? 'hidden' : 'auto',
          overscrollBehavior: overflowHidden ? 'none' : 'contain',
          touchAction: overflowHidden ? 'none' : 'pan-y',
        }}
      >
        {children}
      </div>
    </div>
  );
}
