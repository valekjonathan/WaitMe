import React from 'react';

export default function Logo({ size = 'md', className = '', showText = false }) {
  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-20 h-20',
    xl: 'w-32 h-32'
  };

  const lineSizes = {
    sm: { width: 'w-4', height: 'h-0.5', gap: 'gap-1', square: 'w-1.5 h-1.5' },
    md: { width: 'w-6', height: 'h-1', gap: 'gap-1.5', square: 'w-2 h-2' },
    lg: { width: 'w-10', height: 'h-1.5', gap: 'gap-2', square: 'w-3 h-3' },
    xl: { width: 'w-16', height: 'h-2', gap: 'gap-3', square: 'w-5 h-5' }
  };

  const s = lineSizes[size];

  return (
    <div className={`flex items-center justify-center ${className}`}>
      {/* Icono cuadrado estilo iOS */}
      <div className={`${iconSizes[size]} bg-black rounded-[22%] flex flex-col items-center justify-center ${s.gap} shadow-lg`}>
        {/* Línea morada superior */}
        <div className={`${s.width} ${s.height} bg-purple-500 rounded-full`}></div>
        
        {/* Cuadradito blanco (coche entrando) */}
        <div className={`${s.square} bg-white rounded-sm`}></div>
        
        {/* Línea morada inferior */}
        <div className={`${s.width} ${s.height} bg-purple-500 rounded-full`}></div>
      </div>
      
      {/* Texto WaitMe! solo si showText es true */}
      {showText && (
        <span className="text-white font-bold ml-3 text-lg tracking-tight">
          Wait<span className="text-purple-500">Me!</span>
        </span>
      )}
    </div>
  );
}