import * as alerts from '@/data/alerts';
import { X, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CarIconProfile, PlateProfile } from '@/components/history/HistoryItem';
import { formatAddress } from '@/components/history/historyItemUtils';
import { getCarFill } from '@/utils/carUtils';

export default function ExpiredReservationModal({
  alert,
  getWaitUntilTs,
  avatarFor,
  onClose,
  setExpiredAlertExtend,
  setExpiredAlertModalId,
  queryClient,
}) {
  if (!alert) return null;

  const waitUntilTs = getWaitUntilTs(alert);
  const waitUntilLabel = waitUntilTs
    ? new Date(waitUntilTs).toLocaleString('es-ES', {
        timeZone: 'Europe/Madrid',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
    : '--:--';

  const reservedByPhoto =
    alert.reserved_by_photo ||
    avatarFor(alert.reserved_by_name) ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(alert.reserved_by_name || 'U')}&background=7c3aed&color=fff&size=128`;
  const carLabel = alert.reserved_by_car || 'Sin datos';
  const carColor = alert.reserved_by_car_color || 'gris';
  const plate = alert.reserved_by_plate || '';

  const handleExtend = (addMins) => {
    setExpiredAlertExtend?.((prev) => {
      const n = { ...prev };
      delete n[alert.id];
      return n;
    });
    setExpiredAlertModalId?.(null);
    const newMins = (Number(alert.available_in_minutes) || 0) + addMins;
    alerts.updateAlert(alert.id, { available_in_minutes: newMins }).then(() => {
      queryClient.invalidateQueries({ queryKey: ['myAlerts'] });
    });
  };

  const handleMeVoy = () => {
    setExpiredAlertExtend?.((prev) => {
      const n = { ...prev };
      delete n[alert.id];
      return n;
    });
    setExpiredAlertModalId?.(null);
    alerts.updateAlert(alert.id, { status: 'cancelled' }).then(() => {
      queryClient.invalidateQueries({ queryKey: ['myAlerts'] });
      try {
        window.dispatchEvent(new Event('waitme:badgeRefresh'));
      } catch (error) {
        console.error('[WaitMe Error]', error);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4">
      <div className="bg-gray-900 border-2 border-purple-500/60 rounded-xl w-full max-w-sm p-3 relative">
        <button
          className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-red-600 hover:bg-red-700 flex items-center justify-center text-white z-10"
          onClick={onClose}
        >
          <X className="w-4 h-4" />
        </button>
        <div className="flex justify-center mb-3">
          <div className="px-4 py-1.5 rounded-lg bg-purple-700/60 border border-purple-500/60">
            <span className="text-white font-semibold text-sm">Tiempo expirado</span>
          </div>
        </div>
        <div className="flex gap-2.5 mb-2">
          <div className="w-[95px] h-[85px] rounded-lg overflow-hidden border-2 border-purple-500/40 bg-gray-900 flex-shrink-0">
            <img
              src={reservedByPhoto}
              alt={alert.reserved_by_name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 h-[85px] flex flex-col">
            <p className="font-bold text-xl text-white leading-none min-h-[22px]">
              {(alert.reserved_by_name || 'Usuario').split(' ')[0]}
            </p>
            <p className="text-sm font-medium text-gray-200 leading-none flex-1 flex items-center truncate relative top-[6px]">
              {carLabel}
            </p>
            <div className="flex items-end gap-2 mt-1 min-h-[28px]">
              <div className="flex-shrink-0">
                <PlateProfile plate={plate} />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="flex-shrink-0 relative -top-[1px]">
                  <CarIconProfile color={getCarFill(carColor)} size="w-16 h-10" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-700/80 mb-2 pt-1.5 space-y-1.5">
          <div className="flex items-start gap-1.5 text-xs">
            <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-purple-400" />
            <span className="text-gray-200 leading-5 line-clamp-1">
              {formatAddress(alert.address)}
            </span>
          </div>
          <div className="flex items-start gap-1.5 text-xs">
            <Clock className="w-4 h-4 flex-shrink-0 mt-0.5 text-purple-400" />
            <span className="text-white leading-5">
              Te vas en {alert.available_in_minutes} min · Te espera hasta las:{' '}
              <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{waitUntilLabel}</span>
            </span>
          </div>
        </div>
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
              onClick={() => handleExtend(opt.addMins)}
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
          onClick={handleMeVoy}
        >
          Me voy
        </Button>
      </div>
    </div>
  );
}
