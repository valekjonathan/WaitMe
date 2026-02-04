import React from 'react';

export default function Layout({ children }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-950">
      {/* iPhone Frame Simulator */}
      <div className="relative w-[390px] h-[844px] bg-black rounded-[50px] shadow-2xl overflow-hidden border-8 border-gray-800">
        {/* Screen content */}
        <div className="w-full h-full bg-black overflow-hidden">
          {/* Safe area top (notch) */}
          <div className="absolute top-0 left-0 right-0 h-12 bg-black z-50"></div>
          
          {/* Safe area bottom (home indicator) */}
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-black z-50"></div>
          
          {/* Actual content */}
          <div className="w-full h-full overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}