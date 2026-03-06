/**
 * AppDeviceFrame — Fuente única de verdad para el viewport visual móvil en web.
 *
 * Responsabilidades (solo en web, no en iOS nativo):
 * - Ancho visual máximo 430px (iPhone moderno)
 * - Altura real 100dvh
 * - Centrado horizontal
 * - Fondo exterior neutro para distinguir "marco" de "pantalla"
 * - Overflow controlado
 *
 * En iOS (Capacitor): passthrough, sin wrapper.
 * Mantiene la misma geometría base que iPhone físico y Simulator.
 */
import { Capacitor } from '@capacitor/core';

const DEVICE_MAX_WIDTH = 430;

export default function AppDeviceFrame({ children }) {
  if (Capacitor.isNativePlatform()) {
    return <>{children}</>;
  }

  return (
    <div
      className="min-h-[100dvh] w-full flex justify-center"
      style={{ backgroundColor: '#1a1a1a' }}
      data-app-device-frame
    >
      <div
        className="w-full min-h-[100dvh] flex flex-col overflow-x-hidden"
        style={{
          maxWidth: `${DEVICE_MAX_WIDTH}px`,
          backgroundColor: '#0B0B0F',
        }}
      >
        {children}
      </div>
    </div>
  );
}
