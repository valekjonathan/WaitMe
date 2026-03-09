import React from 'react';
import { bootLog, flushToServer } from '@/lib/bootLogger';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    this.setState({ info });
    const msg = error?.message || String(error);
    const stack = info?.componentStack || '';
    bootLog('[BOOT 4] error boundary triggered', msg, stack.slice(0, 200));
    flushToServer();
    console.error('React crash:', error, info);
  }

  render() {
    if (this.state.hasError) {
      const { error, info } = this.state;
      const isDev = import.meta.env.DEV;
      const stack = info?.componentStack;
      return (
        <div
          style={{
            background: '#0B0B0F',
            color: 'white',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            fontFamily: 'system-ui',
          }}
        >
          {typeof __SHOW_BUILD_MARKER__ !== 'undefined' && __SHOW_BUILD_MARKER__ && (
            <p
              style={{
                position: 'absolute',
                top: 8,
                left: 0,
                right: 0,
                textAlign: 'center',
                fontSize: 10,
                color: '#22d3ee',
                fontFamily: 'monospace',
              }}
            >
              WAITME RUNTIME CHECK — BUILD:{' '}
              {typeof __BUILD_TIMESTAMP__ !== 'undefined' ? __BUILD_TIMESTAMP__ : '?'}
            </p>
          )}
          <p style={{ fontSize: 18, marginBottom: 16 }}>Error cargando WaitMe</p>
          {isDev && error && (
            <pre
              style={{
                fontSize: 12,
                color: '#94a3b8',
                maxWidth: '100%',
                overflow: 'auto',
                padding: 12,
                background: '#1a1a1a',
                borderRadius: 8,
                marginBottom: 16,
              }}
            >
              {error?.message || String(error)}
            </pre>
          )}
          {isDev && stack && (
            <pre
              style={{
                fontSize: 11,
                color: '#64748b',
                maxWidth: '100%',
                overflow: 'auto',
                padding: 12,
                background: '#1a1a1a',
                borderRadius: 8,
                marginBottom: 16,
                whiteSpace: 'pre-wrap',
              }}
            >
              {stack}
            </pre>
          )}
          <a
            href="?VITE_SAFE_MODE=true"
            style={{ color: '#a78bfa', textDecoration: 'underline', fontSize: 14 }}
          >
            Abrir en modo seguro
          </a>
        </div>
      );
    }

    return this.props.children;
  }
}
