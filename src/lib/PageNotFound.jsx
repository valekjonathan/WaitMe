import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function PageNotFound() {
  return (
    <div className="min-h-[100dvh] bg-black flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-purple-500">404</h1>
        <p className="text-2xl text-white mt-4 mb-8">Página no encontrada</p>
        <Link
          to={createPageUrl('Home')}
          className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}