import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { MapPin, Clock, Euro, X } from 'lucide-react';

export default function HomeDialogs({
  oneActiveAlertOpen,
  setOneActiveAlertOpen,
  confirmPublishOpen,
  setConfirmPublishOpen,
  pendingPublishPayload,
  setPendingPublishPayload,
  createAlertMutation,
  confirmDialog,
  setConfirmDialog,
  buyAlertMutation,
}) {
  return (
    <>
      {oneActiveAlertOpen && (
        <div className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center">
          <div className="relative bg-gray-900 border-t-2 border-b-2 border-purple-500 max-w-sm w-[90%] rounded-xl p-6">
            <button
              onClick={() => setOneActiveAlertOpen(false)}
              className="absolute top-3 right-3 w-7 h-7 rounded-md bg-red-500/20 border border-red-500/50 flex items-center justify-center text-red-400 hover:bg-red-500/30 transition-colors"
              type="button"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col items-center text-center space-y-3">
              <span className="text-white font-semibold text-base">
                Ya tienes una alerta publicada.
              </span>

              <span className="text-gray-400 text-sm">No puedes tener 2 alertas activas.</span>
            </div>
          </div>
        </div>
      )}

      <Dialog
        open={confirmPublishOpen}
        onOpenChange={(open) => {
          setConfirmPublishOpen(open);
          if (!open) setPendingPublishPayload(null);
        }}
      >
        <DialogContent
          hideClose
          className="bg-gray-900 border border-gray-800 text-white max-w-sm border-t-2 border-b-2 border-purple-500"
        >
          <div className="flex justify-center">
            <div className="px-4 py-2 rounded-lg bg-purple-700/60 border border-purple-500/60">
              <span className="text-white font-semibold text-sm">Vas a publicar una alerta:</span>
            </div>
          </div>

          <div className="mt-4">
            <div className="bg-gray-900 rounded-xl p-4 border-2 border-purple-500/50">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-purple-400" />
                <span className="text-white">En:</span>
                <span className="text-purple-400 font-semibold">
                  {pendingPublishPayload?.address || ''}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm mt-2">
                <Clock className="w-4 h-4 text-purple-400" />
                <span className="text-white">Te vas en:</span>
                <span className="text-purple-400 font-semibold text-base">
                  {pendingPublishPayload?.available_in_minutes ?? ''} minutos
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm mt-2">
                <Euro className="w-4 h-4 text-purple-400" />
                <span className="text-white">Precio:</span>
                <span className="text-purple-400 font-semibold text-base">
                  {pendingPublishPayload?.price ?? ''} €
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 text-center text-purple-400 font-bold text-base">
            {(() => {
              const mins = Number(pendingPublishPayload?.available_in_minutes ?? 0);
              if (!mins) return null;
              const waitUntil = new Date(Date.now() + mins * 60 * 1000);
              const hhmm = waitUntil.toLocaleTimeString('es-ES', {
                timeZone: 'Europe/Madrid',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              });
              return (
                <>
                  <span className="text-purple-400 text-base font-normal">
                    Debes esperar hasta las:{' '}
                    <span className="text-white" style={{ fontSize: '18px', fontWeight: 'bold' }}>
                      {hhmm}
                    </span>
                  </span>
                </>
              );
            })()}
          </div>

          <p className="text-white/60 text-xs text-center mt-3 px-1 leading-snug">
            Si te vas antes de que finalice el tiempo, se suspenderá 24 horas tu servicio de
            publicación de alertas y tendrás una penalización adicional de un 33% en tu próximo
            ingreso.
          </p>

          <DialogFooter className="flex flex-row items-center justify-center gap-3 mt-3 w-full">
            <Button
              onClick={() => {
                if (!pendingPublishPayload) return;
                setConfirmPublishOpen(false);
                createAlertMutation.mutate(pendingPublishPayload);
                setPendingPublishPayload(null);
              }}
              className="w-auto px-6 min-w-[118px] bg-purple-600 hover:bg-purple-700"
            >
              Aceptar
            </Button>

            <Button
              onClick={() => {
                setConfirmPublishOpen(false);
                setPendingPublishPayload(null);
              }}
              className="w-auto px-6 min-w-[118px] bg-red-600 hover:bg-red-700 text-white"
            >
              Rechazar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ open, alert: confirmDialog.alert })}
      >
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl">Confirmar reserva</DialogTitle>
            <DialogDescription className="text-gray-400">
              Vas a enviar una solicitud de reserva por{' '}
              <span className="text-purple-400 font-bold">{confirmDialog.alert?.price}€</span> a{' '}
              <span className="text-white font-medium">{confirmDialog.alert?.user_name}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="bg-gray-800/50 rounded-xl p-4 space-y-2">
            <p className="text-sm text-gray-400">
              <span className="text-white">
                {confirmDialog.alert?.brand} {confirmDialog.alert?.model}
              </span>
            </p>
            <p className="text-sm text-gray-400">
              Matrícula: <span className="text-white font-mono">{confirmDialog.alert?.plate}</span>
            </p>
            <p className="text-sm text-gray-400">
              Se va en:{' '}
              <span className="text-purple-400">
                {confirmDialog.alert?.available_in_minutes} min
              </span>
            </p>
          </div>

          <DialogFooter className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setConfirmDialog({ open: false, alert: null })}
              className="flex-1 border-gray-700"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => buyAlertMutation.mutate(confirmDialog.alert)}
              className="w-auto px-6 min-w-[118px] bg-purple-600 hover:bg-purple-700"
            >
              Enviar solicitud
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
