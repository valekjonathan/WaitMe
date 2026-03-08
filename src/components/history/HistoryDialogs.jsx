import * as alerts from '@/data/alerts';
import { Clock, MapPin, Euro, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  CarIconProfile,
  PlateProfile,
  CardHeaderRow,
  MoneyChip,
  CountdownButton,
  formatAddress,
} from '@/components/history/HistoryItem';
import { getCarFill } from '@/utils/carUtils';

export default function HistoryDialogs({
  cancelReservedOpen,
  setCancelReservedOpen,
  cancelReservedAlert,
  setCancelReservedAlert,
  cancelConfirmOpen,
  setCancelConfirmOpen,
  cancelConfirmAlert,
  setCancelConfirmAlert,
  expirePromptOpen,
  setExpirePromptOpen,
  expirePromptAlert,
  setExpirePromptAlert,
  expiredAlertModalId,
  setExpiredAlertModalId,
  hideKey,
  queryClient,
  stampFinalizedAt,
  formatCardDate,
  formatPriceInt,
  getCreatedTs,
  getWaitUntilTs,
  nowTs,
  cancelAlertMutation,
  expireAlertMutation,
  repeatAlertMutation,
  visibleActiveAlerts,
  avatarFor,
  badgePhotoWidth,
  labelNoClick,
  setExpiredAlertExtend,
}) {
  const alert = expiredAlertModalId
    ? visibleActiveAlerts.find((a) => a.id === expiredAlertModalId)
    : null;

  return (
    <>
      {cancelReservedOpen && (
        <div
          className="fixed inset-0 z-[9999] flex flex-col"
          style={{ backgroundColor: '#0b0b0b' }}
        >
          <div className="h-1.5 w-full bg-purple-500 flex-shrink-0" />
          <div className="flex-1 flex flex-col items-center justify-center px-5">
            <div className="w-full max-w-sm relative mb-6">
              <button
                onClick={() => {
                  setCancelReservedOpen(false);
                  setCancelReservedAlert(null);
                }}
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
                  {cancelReservedAlert?.reserved_by_name?.split(' ')[0] || 'el comprador'}
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
                  onClick={() => {
                    if (!cancelReservedAlert?.id) return;
                    const a = cancelReservedAlert;
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
                    alerts
                      .updateAlert(a.id, { status: 'cancelled', cancel_reason: 'me_fui' })
                      .then(() => {
                        queryClient.invalidateQueries({ queryKey: ['myAlerts'] });
                        try {
                          window.dispatchEvent(new Event('waitme:badgeRefresh'));
                        } catch (error) {
                          console.error('[WaitMe Error]', error);
                        }
                      });
                    setCancelReservedOpen(false);
                    setCancelReservedAlert(null);
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-700 h-12 text-base font-semibold"
                >
                  Me voy
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setCancelReservedOpen(false);
                    setCancelReservedAlert(null);
                  }}
                  className="flex-1 border-gray-600 text-white h-12 text-base font-semibold bg-gray-800 hover:bg-gray-700"
                >
                  Volver
                </Button>
              </div>
            </div>
          </div>
          <div className="h-1.5 w-full bg-purple-500 flex-shrink-0" />
        </div>
      )}

      <Dialog
        open={cancelConfirmOpen}
        onOpenChange={(open) => {
          setCancelConfirmOpen(open);
          if (!open) setCancelConfirmAlert(null);
        }}
      >
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              Vas a cancelar tu alerta publicada
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Confirma para moverla a finalizadas como cancelada.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-purple-400" />
              <span className="text-gray-200">{cancelConfirmAlert?.address || ''}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-purple-400" />
              <span className="text-gray-200">
                {cancelConfirmAlert?.available_in_minutes ?? ''} Minutos
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Euro className="w-4 h-4 text-purple-400" />
              <span className="text-gray-200">{cancelConfirmAlert?.price ?? ''}€</span>
            </div>
          </div>
          <DialogFooter className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setCancelConfirmOpen(false);
                setCancelConfirmAlert(null);
              }}
              className="flex-1 border-gray-700"
            >
              Rechazar
            </Button>
            <Button
              onClick={() => {
                if (!cancelConfirmAlert?.id) return;
                cancelAlertMutation.mutate(cancelConfirmAlert.id);
                setCancelConfirmOpen(false);
                setCancelConfirmAlert(null);
              }}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              Aceptar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={expirePromptOpen}
        onOpenChange={(open) => {
          setExpirePromptOpen(open);
          if (!open) setExpirePromptAlert(null);
        }}
      >
        <DialogContent
          hideClose
          className="bg-gray-900 border border-gray-800 text-white max-w-sm border-t-2 border-b-2 border-purple-500 max-h-[85vh] overflow-y-auto data-[state=open]:slide-in-from-left-0 data-[state=open]:slide-in-from-top-0 data-[state=closed]:slide-out-to-left-0 data-[state=closed]:slide-out-to-top-0"
        >
          <div className="flex justify-center mb-3">
            <div className="px-4 py-2 rounded-lg bg-purple-700/60 border border-purple-500/60">
              <span className="text-white font-semibold text-sm">Tu alerta ha expirado</span>
            </div>
          </div>
          {expirePromptAlert &&
            (() => {
              const a = expirePromptAlert;
              const createdTs = getCreatedTs(a) || nowTs;
              const waitUntilTs = getWaitUntilTs(a);
              const waitUntilLabel = waitUntilTs
                ? new Date(waitUntilTs).toLocaleString('es-ES', {
                    timeZone: 'Europe/Madrid',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  })
                : '--:--';
              return (
                <div className="bg-gray-900 rounded-xl p-2 border-2 border-purple-500/50 relative">
                  <CardHeaderRow
                    left={
                      <Badge
                        className={`bg-purple-700/60 text-white border border-purple-500/60 ${badgePhotoWidth} ${labelNoClick}`}
                      >
                        Expirada
                      </Badge>
                    }
                    dateText={formatCardDate(createdTs)}
                    dateClassName="text-white"
                    right={
                      <div className="flex items-center gap-1">
                        <MoneyChip mode="green" showUpIcon amountText={formatPriceInt(a.price)} />
                      </div>
                    }
                  />
                  <div className="border-t border-gray-700/80 mb-2" />
                  <div className="flex items-start gap-1.5 text-xs mb-2">
                    <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-purple-400" />
                    <span className="text-white leading-5">
                      {formatAddress(a.address) || 'Ubicación marcada'}
                    </span>
                  </div>
                  <div className="flex items-start gap-1.5 text-xs">
                    <Clock className="w-4 h-4 flex-shrink-0 mt-0.5 text-purple-400" />
                    <span className="text-white leading-5">
                      Te vas en {a.available_in_minutes} min · Debes esperar hasta las{' '}
                      <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{waitUntilLabel}</span>
                    </span>
                  </div>
                  <div className="mt-2">
                    <CountdownButton text="EXPIRADA" dimmed={false} />
                  </div>
                </div>
              );
            })()}
          <DialogFooter className="flex flex-row items-center justify-center gap-3 mt-4">
            <Button
              onClick={() => {
                if (!expirePromptAlert?.id) return;
                expireAlertMutation.mutate(expirePromptAlert.id);
                setExpirePromptOpen(false);
                setExpirePromptAlert(null);
              }}
              className="w-auto px-4 py-2 bg-purple-600 hover:bg-purple-700"
            >
              Aceptar
            </Button>
            <Button
              onClick={() => {
                if (!expirePromptAlert?.id) return;
                repeatAlertMutation.mutate(expirePromptAlert);
                setExpirePromptOpen(false);
                setExpirePromptAlert(null);
              }}
              className="w-auto px-4 py-2 bg-white text-black hover:bg-gray-200"
            >
              Repetir alerta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {expiredAlertModalId &&
        alert &&
        (() => {
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
          return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4">
              <div className="bg-gray-900 border-2 border-purple-500/60 rounded-xl w-full max-w-sm p-3 relative">
                <button
                  className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-red-600 hover:bg-red-700 flex items-center justify-center text-white z-10"
                  onClick={() => setExpiredAlertModalId(null)}
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
                      <span className="text-white text-[11px] font-bold leading-none">
                        {opt.mins} ·
                      </span>
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
            </div>
          );
        })()}
    </>
  );
}
