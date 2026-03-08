/**
 * Diálogo de prórroga cuando expira el tiempo.
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function ProrrogaDialog({
  open,
  onOpenChange,
  currentExpiredAlert,
  selectedProrroga,
  setSelectedProrroga,
  onProrroga,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {currentExpiredAlert?.isBuyer
              ? '⏱️ No te has presentado'
              : '⏱️ Usuario no se ha presentado'}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {currentExpiredAlert?.isBuyer
              ? 'No te has presentado, se te devolverá tu importe menos la comisión de WaitMe!'
              : 'Usuario no se ha presentado, se te ingresará el 33% del importe de la operación como compensación por tu espera'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-sm text-gray-300 font-semibold">PRORROGAR</p>

          <div className="space-y-2">
            <button
              onClick={() => setSelectedProrroga({ minutes: 5, price: 1 })}
              className={`w-full p-3 rounded-lg border-2 transition-all ${
                selectedProrroga?.minutes === 5
                  ? 'bg-purple-600/20 border-purple-500 text-white'
                  : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-purple-500/50'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-semibold">5 minutos más</span>
                <span className="text-purple-300 font-bold">1€</span>
              </div>
            </button>

            <button
              onClick={() => setSelectedProrroga({ minutes: 10, price: 3 })}
              className={`w-full p-3 rounded-lg border-2 transition-all ${
                selectedProrroga?.minutes === 10
                  ? 'bg-purple-600/20 border-purple-500 text-white'
                  : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-purple-500/50'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-semibold">10 minutos más</span>
                <span className="text-purple-300 font-bold">3€</span>
              </div>
            </button>

            <button
              onClick={() => setSelectedProrroga({ minutes: 15, price: 5 })}
              className={`w-full p-3 rounded-lg border-2 transition-all ${
                selectedProrroga?.minutes === 15
                  ? 'bg-purple-600/20 border-purple-500 text-white'
                  : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-purple-500/50'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-semibold">15 minutos más</span>
                <span className="text-purple-300 font-bold">5€</span>
              </div>
            </button>
          </div>
        </div>

        <DialogFooter className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 border-gray-700"
          >
            {currentExpiredAlert?.isBuyer ? 'ACEPTAR DEVOLUCIÓN' : 'ACEPTAR COMPENSACIÓN'}
          </Button>
          <Button
            onClick={onProrroga}
            className="flex-1 bg-purple-600 hover:bg-purple-700"
            disabled={!selectedProrroga}
          >
            PRORROGAR
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
