import React from 'react';
import { Navigation } from 'lucide-react';

// Botón flotante estilo "radar".
// - Forma futurista con clip-path.
// - Parpadeo / radar con anillos (animate-ping).
// - Pensado para colocarse encima del BottomNav.

export default function RadarNavButton({ onClick, isActive = true, className = '' }) {
  return (
    <button
      type="button"
      onClick={isActive ? onClick : undefined}
      aria-label="Navegación"
      className={
        `relative select-none ${isActive ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'} ` +
        `focus:outline-none ${className}`
      }
    >
      {/* Radar rings */}
      <span className="absolute inset-0 -z-10 flex items-center justify-center">
        <span className="absolute w-[92px] h-[92px] rounded-full bg-purple-500/10 animate-ping" />
        <span className="absolute w-[70px] h-[70px] rounded-full bg-purple-500/10 animate-ping [animation-delay:250ms]" />
        <span className="absolute w-[52px] h-[52px] rounded-full bg-purple-500/10 animate-ping [animation-delay:500ms]" />
      </span>

      {/* Body */}
      <span
        className={
          'relative flex items-center justify-center w-[74px] h-[64px] ' +
          'bg-black/80 border border-purple-500/50 shadow-[0_0_18px_rgba(168,85,247,0.35)] ' +
          'backdrop-blur-md'
        }
        style={{
          clipPath:
            'polygon(12% 0%, 88% 0%, 100% 28%, 88% 100%, 12% 100%, 0% 28%)'
        }}
      >
        {/* Glow edge */}
        <span
          className="absolute inset-[2px] bg-gradient-to-b from-purple-500/10 to-transparent"
          style={{
            clipPath:
              'polygon(12% 0%, 88% 0%, 100% 28%, 88% 100%, 12% 100%, 0% 28%)'
          }}
        />

        {/* Icon */}
        <span className="relative flex items-center justify-center">
          <Navigation className="w-7 h-7 text-purple-300 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
        </span>
      </span>
    </button>
  );
}
