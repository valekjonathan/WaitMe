import React from 'react';
import { Button } from '@/components/ui/button';

export function SearchAlertCard() {
  return (
    <div className="bg-gray-900 border border-gray-800 p-4 rounded-2xl shadow-lg">
      <h3 className="text-white font-bold mb-2">Buscando aparcamiento</h3>
      <p className="text-gray-400 text-sm mb-4">Te avisaremos cuando alguien deje un sitio cerca de ti.</p>
      <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">Configurar Alerta</Button>
    </div>
  );
}