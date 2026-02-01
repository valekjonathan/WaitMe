import React from 'react';

export default function Layout({ children }) {
  return (
    <div className="min-h-[100dvh] w-full bg-black overflow-y-auto">
      {children}
    </div>
  );
}