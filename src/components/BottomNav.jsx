import React from 'react';

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-700 px-4 py-2 flex justify-center gap-6">
      <button
        onClick={() => window.dispatchEvent(new Event('waitme:goLogo'))}
        className="text-purple-400 font-bold"
      >
        Mapa
      </button>
    </nav>
  );
}
