import * as alerts from '@/data/alerts';
import { Button } from '@/components/ui/button';

export default function ExpiredBlock({
  alert,
  setExpiredAlertExtend,
  setExpiredAlertModalId,
  queryClient,
  stampFinalizedAt,
}) {
  return (
    <>
      <div className="border-t border-gray-700/60 mt-2 pt-2">
        <p className="text-white text-sm font-semibold text-center mb-2">
          Usuario no se ha presentado. Puedes irte o prorrogarle:
        </p>
        <div className="flex gap-2 mb-2">
          {[
            { mins: '5 min', price: '2 €', addMins: 5 },
            { mins: '10 min', price: '3 €', addMins: 10 },
            { mins: '15 min', price: '5 €', addMins: 15 },
          ].map((opt) => (
            <button
              key={opt.addMins}
              className="flex-1 h-9 rounded-lg bg-purple-600/20 border border-purple-500/50 hover:bg-purple-600/40 transition-colors flex flex-col items-center justify-center"
              onClick={() => {
                setExpiredAlertExtend((prev) => {
                  const n = { ...prev };
                  delete n[alert.id];
                  return n;
                });
                setExpiredAlertModalId(null);
                const newMins = (Number(alert.available_in_minutes) || 0) + opt.addMins;
                alerts.updateAlert(alert.id, { available_in_minutes: newMins }).then(() => {
                  queryClient.invalidateQueries({ queryKey: ['myAlerts'] });
                });
              }}
            >
              <span className="text-white text-[11px] font-bold leading-none">{opt.mins} ·</span>
              <span className="text-purple-300 text-[11px] font-bold leading-none mt-0.5">
                {opt.price}
              </span>
            </button>
          ))}
        </div>
        <Button
          className="w-full h-9 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg"
          onClick={() => {
            setExpiredAlertExtend((prev) => {
              const n = { ...prev };
              delete n[alert.id];
              return n;
            });
            setExpiredAlertModalId(null);
            stampFinalizedAt(alert.id);
            alerts.updateAlert(alert.id, { status: 'cancelled' }).then(() => {
              queryClient.invalidateQueries({ queryKey: ['myAlerts'] });
              try {
                window.dispatchEvent(new Event('waitme:badgeRefresh'));
              } catch (error) {
                console.error('[WaitMe Error]', error);
              }
            });
          }}
        >
          Me voy
        </Button>
      </div>
    </>
  );
}
