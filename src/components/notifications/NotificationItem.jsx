/**
 * Item individual de notificación en la lista.
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, MessageCircle, Phone, PhoneOff, Navigation } from 'lucide-react';
import { formatPlate } from '@/utils/carUtils';
import { getDemoAlertById, ensureConversationForAlert } from '@/components/DemoFlowManager';

const carColors = {
  blanco: '#FFFFFF',
  negro: '#1a1a1a',
  rojo: '#ef4444',
  azul: '#3b82f6',
  amarillo: '#facc15',
  gris: '#6b7280',
};

function normalize(s) {
  return String(s || '')
    .trim()
    .toLowerCase();
}

export default function NotificationItem({
  notification,
  onMarkRead,
  onOpenChat,
  onOpenNavigate,
  onRunAction,
}) {
  const n = notification;
  const type = n?.type || 'status_update';
  const isUnread = !n?.read;
  const alert = n?.alertId ? getDemoAlertById(n.alertId) : null;

  const otherName = alert?.user_name || n?.fromName || 'Usuario';
  const otherPhoto = alert?.user_photo || null;

  const carLabel = `${alert?.brand || ''} ${alert?.model || ''}`.trim();
  const plate = alert?.plate || '';
  const carColor = alert?.color || 'gris';
  const address = alert?.address || '';
  const phoneEnabled = !!alert?.allow_phone_calls;
  const phone = alert?.phone || null;

  const statusText = n?.title || 'ACTIVA';
  const hasLatLon = typeof alert?.latitude === 'number' && typeof alert?.longitude === 'number';

  const t = normalize(type);
  const carFill = carColors[carColor] || '#6b7280';
  const photoSrc =
    otherPhoto ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(otherName)}&background=7c3aed&color=fff&size=128`;

  const handleChatClick = (e) => {
    e?.stopPropagation();
    const convId = n?.conversationId || ensureConversationForAlert(n?.alertId)?.id;
    if (n?.id) onMarkRead(n);
    onOpenChat(convId, n?.alertId);
  };

  const handleItemClick = () => {
    const convId = n?.conversationId || ensureConversationForAlert(n?.alertId)?.id;
    if (n?.id) onMarkRead(n);
    if (convId) onOpenChat(convId, n?.alertId);
  };

  return (
    <div
      onClick={handleItemClick}
      className={`rounded-xl border-2 p-2 transition-all cursor-pointer ${
        isUnread ? 'bg-gray-900 border-purple-500/50 shadow-lg' : 'bg-gray-900 border-gray-700'
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Badge className="bg-purple-500/20 text-purple-300 border border-purple-400/50 font-bold text-xs h-7 px-3 flex items-center justify-center cursor-default select-none pointer-events-none">
          {n?.title || 'NOTIFICACIÓN'}
        </Badge>
        <div className="flex-1 text-center text-xs text-white truncate">{n?.text || '—'}</div>
        {isUnread && (
          <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse flex-shrink-0" />
        )}
      </div>

      <div className="border-t border-gray-700/80 mb-1" />

      <div className="flex gap-2.5">
        <div className="w-[95px] h-[85px] rounded-lg overflow-hidden border-2 border-purple-500/40 bg-gray-900 flex-shrink-0">
          <img
            src={photoSrc}
            alt={otherName}
            className={`w-full h-full object-cover ${!isUnread ? 'opacity-40 grayscale' : ''}`}
          />
        </div>

        <div className="flex-1 h-[85px] flex flex-col">
          <p
            className={`font-bold text-xl leading-none min-h-[22px] ${isUnread ? 'text-white' : 'text-gray-400'}`}
          >
            {(otherName || '').split(' ')[0] || 'Usuario'}
          </p>
          <p
            className={`text-sm font-medium leading-none flex-1 flex items-center truncate relative top-[6px] ${isUnread ? 'text-gray-200' : 'text-gray-500'}`}
          >
            {carLabel || 'Sin datos'}
          </p>

          <div className="flex items-end gap-2 mt-1 min-h-[28px]">
            <div className={`flex-shrink-0 ${!isUnread ? 'opacity-45' : ''}`}>
              <div className="bg-white rounded-md flex items-center overflow-hidden border-2 border-gray-400 h-7">
                <div className="bg-blue-600 h-full w-5 flex items-center justify-center">
                  <span className="text-white text-[8px] font-bold">E</span>
                </div>
                <span className="px-2 text-black font-mono font-bold text-sm tracking-wider">
                  {formatPlate(plate)}
                </span>
              </div>
            </div>
            <div className="flex-1 flex justify-center">
              <div className={`flex-shrink-0 relative -top-[1px] ${!isUnread ? 'opacity-45' : ''}`}>
                <svg
                  viewBox="0 0 48 24"
                  className="w-16 h-10"
                  fill="none"
                  style={{ transform: 'translateY(3px)' }}
                >
                  <path
                    d="M8 16 L10 10 L16 8 L32 8 L38 10 L42 14 L42 18 L8 18 Z"
                    fill={carFill}
                    stroke="white"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M16 9 L18 12 L30 12 L32 9 Z"
                    fill="rgba(255,255,255,0.3)"
                    stroke="white"
                    strokeWidth="0.5"
                  />
                  <circle cx="14" cy="18" r="4" fill="#333" stroke="white" strokeWidth="1" />
                  <circle cx="14" cy="18" r="2" fill="#666" />
                  <circle cx="36" cy="18" r="4" fill="#333" stroke="white" strokeWidth="1" />
                  <circle cx="36" cy="18" r="2" fill="#666" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-1.5 border-t border-gray-700/80 mt-1">
        <div className={`space-y-1.5 ${!isUnread ? 'opacity-80' : ''}`}>
          {address ? (
            <div className="flex items-start gap-1.5 text-xs">
              <MapPin
                className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isUnread ? 'text-purple-400' : 'text-gray-500'}`}
              />
              <span
                className={`leading-5 line-clamp-1 ${isUnread ? 'text-gray-200' : 'text-gray-400'}`}
              >
                {address}
              </span>
            </div>
          ) : null}
          <div className="flex items-start gap-1.5 text-xs">
            <Clock
              className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isUnread ? 'text-purple-400' : 'text-gray-500'}`}
            />
            <span className={`leading-5 ${isUnread ? 'text-gray-200' : 'text-gray-400'}`}>
              Operación en curso
            </span>
          </div>
        </div>
      </div>

      <div className="mt-2">
        <div className="flex gap-2">
          <Button
            size="icon"
            className="bg-green-500 hover:bg-green-600 text-white rounded-lg h-8 w-[42px]"
            onClick={handleChatClick}
          >
            <MessageCircle className="w-4 h-4" />
          </Button>

          {phoneEnabled ? (
            <Button
              size="icon"
              className="bg-white hover:bg-gray-200 text-black rounded-lg h-8 w-[42px]"
              onClick={(e) => {
                e.stopPropagation();
                phone && (window.location.href = `tel:${phone}`);
              }}
            >
              <Phone className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              variant="outline"
              size="icon"
              className="border-white/30 bg-white/10 text-white rounded-lg h-8 w-[42px] opacity-70 cursor-not-allowed"
              disabled
            >
              <PhoneOff className="w-4 h-4 text-white" />
            </Button>
          )}

          {hasLatLon && (
            <Button
              size="icon"
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg h-8 w-[42px]"
              onClick={(e) => {
                e.stopPropagation();
                if (n?.id) onMarkRead(n);
                onOpenNavigate(n?.alertId);
              }}
            >
              <Navigation className="w-4 h-4" />
            </Button>
          )}

          {t === 'incoming_waitme' ? (
            <div className="flex-1 grid grid-cols-3 gap-1" onClick={(e) => e.stopPropagation()}>
              <Button
                className="h-8 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs px-1"
                onClick={() => onRunAction(n, 'reserved')}
              >
                Aceptar
              </Button>
              <Button
                variant="outline"
                className="h-8 rounded-lg border-gray-600 text-white text-xs px-1"
                onClick={() => onRunAction(n, 'thinking')}
              >
                Pienso
              </Button>
              <Button
                variant="destructive"
                className="h-8 rounded-lg text-xs px-1"
                onClick={() => onRunAction(n, 'rejected')}
              >
                Rechazar
              </Button>
            </div>
          ) : (
            <div className="flex-1">
              <div className="w-full h-8 rounded-lg border-2 border-purple-500/30 bg-purple-600/10 flex items-center justify-center px-3">
                <span className="text-sm font-mono font-extrabold text-purple-300">
                  {statusText}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
