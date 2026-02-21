import React from 'react';
import { Navigation } from 'lucide-react';

/**
 * Botón ancho (tipo "navegación") pegado al BottomNav.
 * - No toca tu UI existente: se pinta encima, centrado.
 * - Parpadeo tipo "radar" para representar que alguien viene hacia ti.
 */
export default function NavPillButton({
  onClick,
  visible = true,
  label = 'Navegación'
}) {
  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="
        absolute left-1/2 -translate-x-1/2 -top-[20px]
        w-[78%] max-w-[420px] h-[46px]
        z-[60]
        text-white font-semibold
        focus:outline-none
      "
      aria-label={label}
    >
      {/* Radar glow */}
      <span className="absolute inset-0 rounded-2xl blur-[10px] bg-purple-600/35" />
      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] rounded-2xl bg-purple-500/15 animate-pulse" />

      {/* Picos laterales (clip-path) */}
      <span
        className="
          absolute inset-0
          bg-gradient-to-r from-purple-700/70 via-purple-600/70 to-purple-700/70
          border border-purple-400/60
          shadow-[0_10px_30px_rgba(0,0,0,0.55)]
        "
        style={{
          clipPath:
            'polygon(3% 50%, 9% 10%, 92% 10%, 97% 50%, 92% 90%, 9% 90%)',
          borderRadius: '18px'
        }}
      />

      {/* Contenido */}
      <span className="relative h-full w-full flex items-center justify-center gap-2">
        <span className="relative">
          {/* Anillos radar */}
          <span className="absolute -inset-2 rounded-full border border-purple-300/40 animate-ping" />
          <span className="absolute -inset-1 rounded-full border border-purple-200/30 animate-ping [animation-delay:450ms]" />
          <Navigation className="w-5 h-5 text-white" />
        </span>
        <span className="text-[13px] tracking-wide">{label}</span>
      </span>
    </button>
  );
}
