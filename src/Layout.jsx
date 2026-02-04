import React from 'react';

export default function Layout({ children }) {
  return (
    <div className="relative min-h-screen bg-black">
      <main className="w-full">
        {children}
      </main>
    </div>
  );
}