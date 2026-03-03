import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import appLogo from '@/assets/d2ae993d3_WaitMe.png';

export default function Login() {
  const { checkUserAuth } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setError('');
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email.trim(), password);
      await checkUserAuth();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.data?.message ||
        err?.message ||
        'Credenciales incorrectas. Inténtalo de nuevo.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-black flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <img
            src={appLogo}
            alt="WaitMe!"
            width={96}
            height={96}
            className="w-24 h-24 object-contain"
          />
          <h1 className="text-3xl font-bold leading-none mt-2">
            Wait<span className="text-purple-500">Me!</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">Inicia sesión para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tucorreo@ejemplo.com"
              className="w-full bg-gray-900 border border-gray-700 focus:border-purple-500 text-white rounded-xl px-4 py-3 text-sm outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Contraseña</label>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-gray-900 border border-gray-700 focus:border-purple-500 text-white rounded-xl px-4 py-3 text-sm outline-none transition-colors"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !email.trim() || !password}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
