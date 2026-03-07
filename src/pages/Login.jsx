import { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { getSupabase } from '@/lib/supabaseClient';
import appLogo from '@/assets/d2ae993d3_WaitMe.png';

const OAUTH_REDIRECT_WEB = import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin;
// Supabase recomienda path para deep linking: com.app://auth/callback
const OAUTH_REDIRECT_CAPACITOR =
  import.meta.env.VITE_OAUTH_REDIRECT_IOS || 'com.waitme.app://auth/callback';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleOAuthLogin = async (provider) => {
    setError('');
    setLoading(true);
    try {
      const supabase = getSupabase();
      if (!supabase) {
        setError('Supabase no configurado. Revisa .env');
        return;
      }
      const isNative = Capacitor.isNativePlatform();

      if (isNative) {
        const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: OAUTH_REDIRECT_CAPACITOR,
            skipBrowserRedirect: true,
          },
        });
        if (oauthError) throw oauthError;
        if (data?.url) {
          await Browser.open({ url: data.url });
        } else {
          setError('No se pudo obtener la URL de login');
        }
      } else {
        await supabase.auth.signInWithOAuth({
          provider,
          options: { redirectTo: OAUTH_REDIRECT_WEB },
        });
      }
    } catch (err) {
      if (provider === 'apple') {
        alert('Apple no está configurado todavía.');
      } else {
        setError(err?.message || 'Error al iniciar sesión con Google');
      }
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

        {error && <p className="text-red-400 text-sm text-center mb-4">{error}</p>}

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => handleOAuthLogin('google')}
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-3"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" aria-hidden="true">
              <path
                fill="#fff"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#fff"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#fff"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              />
              <path
                fill="#fff"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continuar con Google
          </button>

          <button
            type="button"
            onClick={() => handleOAuthLogin('apple')}
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-3"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 flex-shrink-0"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
            Continuar con Apple
          </button>
        </div>
      </div>
    </div>
  );
}
