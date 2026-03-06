/**
 * TEMPORAL: bypass para aislar pantalla blanca/negra.
 * Solo renderiza div mínimo. Sin AuthProvider, Router, Layout, Home.
 */
export default function App() {
  return (
    <div
      style={{
        background: '#111',
        color: '#fff',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px',
      }}
    >
      WAITME APP ROOT OK
    </div>
  );
}
