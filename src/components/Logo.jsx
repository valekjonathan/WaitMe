import React from 'react';

export default function Logo({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'h-8',
    md: 'h-12',
    lg: 'h-20',
    xl: 'h-32'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`${sizes[size]} aspect-[3/1] bg-black rounded-xl flex items-center justify-center px-4 relative overflow-hidden`}>
        {/* Representación visual: coche saliendo y otro entrando */}
        <div className="flex items-center gap-1">
          {/* Coche saliendo (más pequeño, alejándose) */}
          <div className="w-3 h-2 bg-gray-500 rounded-sm opacity-50 transform -translate-x-1"></div>
          
          {/* Flecha de intercambio */}
          <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          
          {/* Coche entrando (más grande, llegando) */}
          <div className="w-4 h-2.5 bg-white rounded-sm"></div>
        </div>
        
        {/* Texto WaitMe! */}
        <span className="text-white font-bold ml-2 tracking-tight">
          Wait<span className="text-purple-500">Me!</span>
        </span>
      </div>
    </div>
  );
}