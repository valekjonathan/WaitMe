import React from 'react';

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
    console.error('React crash:', error, info);
  }

  render() {
    if (this.state.hasError) {
      const { error } = this.state;
      const isDev = import.meta.env.DEV;
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
              }}
            >
              {error?.message || String(error)}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
