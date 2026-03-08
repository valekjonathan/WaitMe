/**
 * Tarjeta de solicitud entrante "Usuario quiere tu WaitMe!".
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import UserAlertCard from '@/components/cards/UserAlertCard';

export default function NotificationIncomingRequest({ request, alert, onAccept, onReject }) {
  const buyer = request?.buyer || {};
  const status = String(request?.status || 'pending');
  const statusText =
    status === 'rejected' ? 'RECHAZADA' : status === 'accepted' ? 'ACEPTADA' : 'PENDIENTE';

  const fakeAlert = {
    user_name: buyer?.name || 'Usuario',
    user_photo: buyer?.photo || null,
    brand: '',
    model: `${buyer?.brand || ''} ${buyer?.model || ''}`.trim() || 'Sin datos',
    color: buyer?.color || 'gris',
    plate: buyer?.plate || '',
    address: alert?.address || '',
    available_in_minutes:
      typeof alert?.available_in_minutes === 'number' ? alert.available_in_minutes : null,
    price: alert?.price,
    phone: buyer?.phone || null,
    allow_phone_calls: false,
    latitude: null,
    longitude: null,
  };

  return (
    <div className="rounded-xl border-2 border-purple-500/50 bg-gray-900 p-0 overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-3 pt-3 pb-2">
        <div className="text-white text-[15px] font-semibold">
          Usuario quiere tu Wait<span className="text-purple-500">Me!</span>
        </div>
        <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/50 font-bold text-xs">
          {statusText}
        </Badge>
      </div>

      <div className="px-2 pb-2">
        <UserAlertCard
          alert={fakeAlert}
          isEmpty={false}
          onBuyAlert={status === 'pending' ? () => onAccept(request) : undefined}
          onChat={() => {}}
          onCall={() => buyer?.phone && (window.location.href = `tel:${buyer.phone}`)}
          isLoading={false}
          userLocation={null}
          buyLabel="Aceptar"
          hideBuy={status !== 'pending'}
        />
        {status === 'pending' && (
          <div className="mt-2">
            <Button variant="destructive" className="w-full" onClick={() => onReject(request)}>
              Rechazar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
