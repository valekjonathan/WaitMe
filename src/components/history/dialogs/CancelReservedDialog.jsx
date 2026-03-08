import * as alerts from '@/data/alerts';
import { Button } from '@/components/ui/button';
import { stampFinalizedAt } from '@/lib/finalizedAtStore';

export default function CancelReservedDialog({ open, alert, onClose, hideKey, queryClient }) {
  if (!open) return null;

  const handleConfirm = () => {
    if (!alert?.id) return;
    const a = alert;
    hideKey(`active-${a.id}`);
    queryClient.setQueryData(['myAlerts'], (old = []) => {
      const now = Date.now();
      return Array.isArray(old)
        ? old.map((x) => {
            if (x.id !== a.id) return x;
            stampFinalizedAt(a.id);
            return {
              ...x,
              status: 'cancelled',
              cancel_reason: 'me_fui',
              finalized_at: now,
              updated_date: new Date(now).toISOString(),
            };
          })
        : old;
    });
    alerts.updateAlert(a.id, { status: 'cancelled', cancel_reason: 'me_fui' }).then(() => {
      queryClient.invalidateQueries({ queryKey: ['myAlerts'] });
      try {
        window.dispatchEvent(new Event('waitme:badgeRefresh'));
      } catch (error) {
        console.error('[WaitMe Error]', error);
      }
    });
    onClose();
  };

  const handleBack = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col" style={{ backgroundColor: '#0b0b0b' }}>
      <div className="h-1.5 w-full bg-purple-500 flex-shrink-0" />
      <div className="flex-1 flex flex-col items-center justify-center px-5">
        <div className="w-full max-w-sm relative mb-6">
          <button
            onClick={handleBack}
            className="absolute top-0 right-0 w-8 h-8 rounded-lg bg-gray-800 border border-gray-600 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <line
                x1="2"
                y1="2"
                x2="12"
                y2="12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <line
                x1="12"
                y1="2"
                x2="2"
                y2="12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <div className="flex justify-center mb-6 pt-1">
            <div className="px-6 py-2.5 rounded-xl bg-red-900/60 border-2 border-red-500/70">
              <span className="text-red-300 font-bold text-lg">⚠️ Atención</span>
            </div>
          </div>
          <p className="text-gray-200 text-sm leading-relaxed mb-8 text-center">
            Vas a cancelar la alerta que te acaba de reservar{' '}
            <span className="font-bold text-white">
              {alert?.reserved_by_name?.split(' ')[0] || 'el comprador'}
            </span>
            .<br />
            <br />
            Si cancelas,{' '}
            <span className="text-red-400 font-semibold">
              se te suspenderá el servicio de publicación de alertas durante 24 horas
            </span>{' '}
            y tendrás una{' '}
            <span className="text-red-400 font-semibold">
              penalización del 33% adicional en tu próximo ingreso
            </span>
            .
          </p>
          <div className="flex gap-3">
            <Button
              onClick={handleConfirm}
              className="flex-1 bg-red-600 hover:bg-red-700 h-12 text-base font-semibold"
            >
              Me voy
            </Button>
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex-1 border-gray-600 text-white h-12 text-base font-semibold bg-gray-800 hover:bg-gray-700"
            >
              Volver
            </Button>
          </div>
        </div>
      </div>
      <div className="h-1.5 w-full bg-purple-500 flex-shrink-0" />
    </div>
  );
}
