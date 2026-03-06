/**
 * Página de diagnóstico DEV — solo accesible en desarrollo.
 * Ruta: /dev-diagnostics (o #/dev-diagnostics con HashRouter)
 */
import { useAuth } from '@/lib/AuthContext';
import { useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { Link } from 'react-router-dom';

export default function DevDiagnostics() {
  const { user, isLoadingAuth, isAuthenticated } = useAuth();
  const location = useLocation();
  const diag = typeof window !== 'undefined' ? window.__DEV_DIAG : {};

  const diagGlobal = typeof window !== 'undefined' ? window.__WAITME_DIAG__ : null;
  const lastErrors = diagGlobal?.errors?.slice(-3) || [];

  const rows = [
    { label: 'import.meta.env.DEV', value: String(import.meta.env.DEV) },
    { label: 'VITE_SAFE_MODE', value: String(import.meta.env.VITE_SAFE_MODE === 'true') },
    { label: 'VITE_DISABLE_MAP', value: String(import.meta.env.VITE_DISABLE_MAP === 'true') },
    { label: 'VITE_DISABLE_REALTIME', value: String(import.meta.env.VITE_DISABLE_REALTIME === 'true') },
    { label: 'VITE_BYPASS_AUTH', value: String(import.meta.env.VITE_BYPASS_AUTH === 'true') },
    { label: 'VITE_DEV_BYPASS_AUTH', value: String(import.meta.env.VITE_DEV_BYPASS_AUTH === 'true') },
    { label: 'Capacitor (nativo)', value: String(Capacitor.isNativePlatform()) },
    {
      label: 'Server URL',
      value: import.meta.env.VITE_CAPACITOR_SERVER_URL || '(ver capacitor.config)',
    },
    { label: 'Auth: user', value: user?.id ? `id=${user.id}` : 'null' },
    { label: 'Auth: isLoadingAuth', value: String(isLoadingAuth) },
    { label: 'Auth: isAuthenticated', value: String(isAuthenticated) },
    { label: 'Router: path', value: location.pathname || '/' },
    { label: 'Layout monta', value: String(diag?.layoutMounted ?? 'N/A') },
    { label: 'Home monta', value: String(diag?.homeMounted ?? 'N/A') },
    { label: 'MapboxMap monta', value: String(diag?.mapboxMounted ?? 'N/A') },
    { label: 'Realtime hook', value: import.meta.env.VITE_DISABLE_REALTIME === 'true' ? 'disabled' : 'active' },
    { label: 'mapRef disponible', value: String(diag?.mapRefAvailable ?? 'N/A') },
  ];

  return (
    <div className="min-h-screen bg-black text-white p-6 font-mono text-sm">
      <h1 className="text-xl font-bold text-purple-400 mb-4">Dev Diagnostics</h1>
      <Link to="/" className="text-purple-400 underline mb-4 block">
        ← Volver a Home
      </Link>
      <table className="w-full border-collapse">
        <tbody>
          {rows.map(({ label, value }) => (
            <tr key={label} className="border-b border-gray-700">
              <td className="py-2 pr-4 text-gray-400">{label}</td>
              <td className="py-2 text-purple-300">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {lastErrors.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-700">
          <h2 className="text-lg font-bold text-red-400 mb-2">Últimos errores</h2>
          {lastErrors.map((e, i) => (
            <pre
              key={i}
              className="text-xs text-red-300 bg-black/50 p-2 rounded mb-2 overflow-auto"
            >
              [{e.type}] {e.message}
              {e.stack ? `\n${e.stack}` : ''}
            </pre>
          ))}
        </div>
      )}
    </div>
  );
}
