import React, { useEffect } from 'react';

// Preload the logo image so it's always instant
let _logoPreloaded = false;
function preloadLogo() {
  if (_logoPreloaded || typeof window === 'undefined') return;
  _logoPreloaded = true;
  try {
    const img = new window.Image();
    img.src = '/assets/d2ae993d3_WaitMe.png';
  } catch {}
}
preloadLogo();

export default function Logo({ size = 'md', className = '', iconOnly = false }) {
  const iconSizes = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32'
  };

  const arrowSizes = {
    sm: 'w-5 h-5',
    md: 'w-7 h-7',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const squareSizes = {
    sm: 'w-2.5 h-2',
    md: 'w-3.5 h-2.5',
    lg: 'w-6 h-4',
    xl: 'w-8 h-5'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      {/* Icono cuadrado estilo iOS */}
      <div className={`${iconSizes[size]} bg-black rounded-[22%] flex items-center justify-center gap-1 shadow-lg`}>
        {/* Flechas de intercambio */}
        <svg className={`${arrowSizes[size]} text-purple-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
        
        {/* Cuadradito blanco (coche entrando) */}
        <div className={`${squareSizes[size]} bg-white rounded-sm`}></div>
      </div>
      
      {/* Texto WaitMe! solo si NO es iconOnly */}
      {!iconOnly && (
        <span className="text-white font-bold ml-3 text-xl tracking-tight">
          Wait<span className="text-purple-500">Me!</span>
        </span>
      )}
    </div>
  );
}