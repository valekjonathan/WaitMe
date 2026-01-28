export default function History({ alerts = [], user }) {

  // ====== HELPERS ======
  const now = Date.now();

  const isActive = (a) =>
    a.user_id === user?.id &&
    (a.status === 'created' || a.status === 'active' || a.status === 'reserved');

  const isFinished = (a) =>
    a.user_id === user?.id &&
    !isActive(a);

  const timeLeft = (end) => {
    if (!end) return null;
    const diff = new Date(end).getTime() - now;
    if (diff <= 0) return '00:00';
    const m = Math.floor(diff / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // ====== RENDER TARJETA (UNA SOLA) ======
  const AlertCard = ({ a }) => (
    <div className="rounded-xl bg-gray-900 border border-purple-700 p-4 mb-3">
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-300">
          {a.address}
        </span>
        <span className="text-sm font-bold text-white">
          {a.price?.toFixed(2)}€
        </span>
      </div>

      {isActive(a) && (
        <div className="mt-2 text-green-400 font-semibold">
          ⏳ {timeLeft(a.ends_at)}
        </div>
      )}

      {!isActive(a) && (
        <div className="mt-2 text-red-400 font-semibold">
          Finalizada
        </div>
      )}
    </div>
  );

  // ====== LISTAS ======
  const activeAlerts = alerts.filter(isActive);
  const finishedAlerts = alerts.filter(isFinished);

  return (
    <div className="min-h-screen bg-black text-white px-4 pt-[56px] pb-20">

      <h1 className="text-lg font-bold mb-4">Tus alertas</h1>

      {/* ===== ACTivas ===== */}
      <div className="mb-6">
        <div className="inline-block bg-green-600 text-white px-3 py-1 rounded-full text-sm mb-3">
          Activas
        </div>

        {activeAlerts.length === 0 && (
          <div className="text-gray-400 text-sm">
            No tienes ninguna alerta activa.
          </div>
        )}

        {activeAlerts.map((a) => (
          <AlertCard key={a.id} a={a} />
        ))}
      </div>

      {/* ===== FINALIZADAS ===== */}
      <div>
        <div className="inline-block bg-red-600 text-white px-3 py-1 rounded-full text-sm mb-3">
          Finalizadas
        </div>

        {finishedAlerts.map((a) => (
          <AlertCard key={a.id} a={a} />
        ))}
      </div>

    </div>
  );
}