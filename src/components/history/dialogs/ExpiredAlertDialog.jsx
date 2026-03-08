import { MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { CardHeaderRow, MoneyChip, CountdownButton } from '@/components/history/HistoryItem';
import { formatAddress } from '@/components/history/historyItemUtils';

const badgePhotoWidth = 'w-[95px] h-7 flex items-center justify-center text-center';
const labelNoClick = 'cursor-default select-none pointer-events-none';

export default function ExpiredAlertDialog({
  open,
  alert,
  getCreatedTs,
  getWaitUntilTs,
  nowTs,
  formatCardDate,
  formatPriceInt,
  onOpenChange,
  onAccept,
  onRepeat,
}) {
  if (!alert) return null;

  const createdTs = getCreatedTs(alert) || nowTs;
  const waitUntilTs = getWaitUntilTs(alert);
  const waitUntilLabel = waitUntilTs
    ? new Date(waitUntilTs).toLocaleString('es-ES', {
        timeZone: 'Europe/Madrid',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
    : '--:--';

  return (
    <Dialog open={open} onOpenChange={onOpenChange ?? (() => {})}>
      <DialogContent
        hideClose
        className="bg-gray-900 border border-gray-800 text-white max-w-sm border-t-2 border-b-2 border-purple-500 max-h-[85vh] overflow-y-auto data-[state=open]:slide-in-from-left-0 data-[state=open]:slide-in-from-top-0 data-[state=closed]:slide-out-to-left-0 data-[state=closed]:slide-out-to-top-0"
      >
        <div className="flex justify-center mb-3">
          <div className="px-4 py-2 rounded-lg bg-purple-700/60 border border-purple-500/60">
            <span className="text-white font-semibold text-sm">Tu alerta ha expirado</span>
          </div>
        </div>
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
                <MoneyChip mode="green" showUpIcon amountText={formatPriceInt(alert.price)} />
              </div>
            }
          />
          <div className="border-t border-gray-700/80 mb-2" />
          <div className="flex items-start gap-1.5 text-xs mb-2">
            <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-purple-400" />
            <span className="text-white leading-5">
              {formatAddress(alert.address) || 'Ubicación marcada'}
            </span>
          </div>
          <div className="flex items-start gap-1.5 text-xs">
            <Clock className="w-4 h-4 flex-shrink-0 mt-0.5 text-purple-400" />
            <span className="text-white leading-5">
              Te vas en {alert.available_in_minutes} min · Debes esperar hasta las{' '}
              <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{waitUntilLabel}</span>
            </span>
          </div>
          <div className="mt-2">
            <CountdownButton text="EXPIRADA" dimmed={false} />
          </div>
        </div>
        <DialogFooter className="flex flex-row items-center justify-center gap-3 mt-4">
          <Button
            onClick={() => onAccept?.(alert.id)}
            className="w-auto px-4 py-2 bg-purple-600 hover:bg-purple-700"
          >
            Aceptar
          </Button>
          <Button
            onClick={() => onRepeat?.(alert)}
            className="w-auto px-4 py-2 bg-white text-black hover:bg-gray-200"
          >
            Repetir alerta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
