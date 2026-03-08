import { MapPin, Clock, Euro } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

export default function CancelConfirmDialog({ open, alert, onOpenChange, onConfirm, onReject }) {
  const handleOpenChange = (o) => {
    onOpenChange?.(o);
    if (!o) onReject?.();
  };
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
            <span className="text-gray-200">{alert?.address || ''}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-purple-400" />
            <span className="text-gray-200">{alert?.available_in_minutes ?? ''} Minutos</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Euro className="w-4 h-4 text-purple-400" />
            <span className="text-gray-200">{alert?.price ?? ''}€</span>
          </div>
        </div>
        <DialogFooter className="flex gap-3">
          <Button variant="outline" onClick={() => onReject?.()} className="flex-1 border-gray-700">
            Rechazar
          </Button>
          <Button
            onClick={() => {
              if (alert?.id) onConfirm?.(alert.id);
            }}
            className="flex-1 bg-purple-600 hover:bg-purple-700"
          >
            Aceptar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
