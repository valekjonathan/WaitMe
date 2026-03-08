import {
  X,
  MessageCircle,
  PhoneOff,
  Phone,
  Navigation,
  MapPin,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import { getCarFill, formatPlate } from '@/utils/carUtils';
import { formatAddress, formatPriceInt } from '@/components/history/historyItemUtils';
import ExpiredBlock from '@/components/history/ExpiredBlock';

export default function ReservedByContent({
  alert,
  waitUntilLabel,
  countdownText,
  onNavigateClick,
  onCancelClick,
  expiredAlertExtend,
  setExpiredAlertExtend,
  setExpiredAlertModalId,
  avatarFor,
  queryClient,
  stampFinalizedAt,
}) {
  const reservedByName = alert.reserved_by_name || 'Usuario';
  const reservedByPhoto =
    alert.reserved_by_photo ||
    avatarFor(reservedByName) ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(reservedByName)}&background=7c3aed&color=fff&size=128`;
  const phoneEnabled = Boolean(alert.phone && alert.allow_phone_calls !== false);
  const isExpired = expiredAlertExtend[alert.id];
  const carLabel = alert.reserved_by_car || 'Sin datos';
  const carColor = alert.reserved_by_car_color || 'gris';
  const plate = alert.reserved_by_plate || '';
  const carFill = getCarFill(carColor);
  const stUpper = String(countdownText || '')
    .trim()
    .toUpperCase();
  const isCountdownLike = /^\d{2}:\d{2}(?::\d{2})?$/.test(stUpper);
  const statusBoxCls = isCountdownLike
    ? 'border-purple-400/70 bg-purple-600/25'
    : 'border-purple-500/30 bg-purple-600/10';
  const statusTextCls = isCountdownLike ? 'text-purple-100' : 'text-purple-300';

  return (
    <>
      <div className="bg-gray-800/60 rounded-xl p-2 border border-purple-500">
        <div className="flex items-center justify-between mb-2">
          <div className="bg-purple-500/20 text-purple-300 border border-purple-400/50 font-bold text-xs rounded-md px-3 py-1">
            Te reservó:
          </div>
          <div className="flex items-center gap-1">
            <div className="bg-black/40 border border-purple-500/30 rounded-full px-2 py-0.5 flex items-center gap-1 h-7">
              <Navigation className="w-3 h-3 text-purple-400" />
              <span className="text-white font-bold text-xs">300m</span>
            </div>
            <div className="bg-green-500/20 border border-green-500/30 rounded-lg px-2 py-0.5 flex items-center gap-1 h-7">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-green-400 font-bold text-sm">
                {formatPriceInt(alert.price)}
              </span>
            </div>
            {onCancelClick && (
              <button
                onClick={onCancelClick}
                className="w-7 h-7 rounded-lg bg-red-500/20 border border-red-500/50 flex items-center justify-center text-red-400 hover:bg-red-500/30 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        <div className="border-t border-gray-700/80 mb-2" />
        <div className="flex gap-2.5">
          <div className="w-[95px] h-[85px] rounded-lg overflow-hidden border-2 border-purple-500/40 bg-gray-900 flex-shrink-0">
            <img
              src={reservedByPhoto}
              alt={reservedByName}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 h-[85px] flex flex-col">
            <p className="font-bold text-xl text-white leading-none">
              {String(reservedByName).split(' ')[0]}
            </p>
            <p className="text-sm font-medium text-gray-200 flex-1 flex items-center truncate relative top-[6px]">
              {carLabel}
            </p>
            <div className="flex items-end gap-2 mt-1 min-h-[28px]">
              <div className="flex-shrink-0">
                <div className="bg-white rounded-md flex items-center overflow-hidden border-2 border-gray-400 h-7">
                  <div className="bg-blue-600 h-full w-5 flex items-center justify-center">
                    <span className="text-white text-[8px] font-bold">E</span>
                  </div>
                  <span className="px-1.5 text-black font-mono font-bold text-sm tracking-wider">
                    {formatPlate(plate)}
                  </span>
                </div>
              </div>
              <div className="flex-1 flex justify-center">
                <div className="flex-shrink-0 relative top-[2px]">
                  <svg viewBox="0 0 48 24" className="w-16 h-10" fill="none">
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
        <div className="pt-1.5 border-t border-gray-700/80 mt-2 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs min-h-[20px]">
            <MapPin className="w-4 h-4 flex-shrink-0 text-purple-400" />
            <span className="text-gray-200 line-clamp-1 leading-none">
              {formatAddress(alert.address)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] min-h-[20px]">
            <Clock className="w-4 h-4 flex-shrink-0 text-purple-400" />
            <span className="leading-none">
              <span className="text-white">Te vas en {alert.available_in_minutes} min · </span>
              <span className="text-purple-400">Debes esperar hasta las:</span>{' '}
              <span className="text-white font-bold" style={{ fontSize: '14px' }}>
                {waitUntilLabel}
              </span>
            </span>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <Button
            size="icon"
            className="h-8 bg-green-500 hover:bg-green-600 text-white rounded-lg border-2 border-green-400"
            style={{ width: '46px', flexShrink: 0 }}
            onClick={() =>
              (window.location.href = createPageUrl(
                `Chat?alertId=${alert.id}&userId=${alert.reserved_by_email || alert.reserved_by_id}`
              ))
            }
          >
            <MessageCircle className="w-4 h-4" />
          </Button>
          {phoneEnabled ? (
            <Button
              size="icon"
              className="h-8 bg-white hover:bg-gray-200 text-black rounded-lg border-2 border-gray-300"
              style={{ width: '46px', flexShrink: 0 }}
              onClick={() => alert.phone && (window.location.href = `tel:${alert.phone}`)}
            >
              <Phone className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              size="icon"
              className="h-8 border-2 border-white/30 bg-white/10 text-white rounded-lg opacity-70"
              style={{ width: '46px', flexShrink: 0 }}
              disabled
            >
              <PhoneOff className="w-4 h-4" />
            </Button>
          )}
          <Button
            size="icon"
            className={`h-8 rounded-lg border-2 flex items-center justify-center ${
              onNavigateClick
                ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-400 animate-pulse shadow-lg shadow-blue-500/50'
                : 'bg-blue-600/40 text-blue-300 border-blue-400/30 opacity-50 cursor-not-allowed'
            }`}
            style={{ width: '46px', flexShrink: 0 }}
            disabled={!onNavigateClick}
            onClick={onNavigateClick || undefined}
          >
            <Navigation className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <div
              className={`w-full h-8 rounded-lg border-2 flex items-center justify-center ${statusBoxCls}`}
            >
              <span className={`font-mono font-extrabold text-sm ${statusTextCls}`}>
                {countdownText}
              </span>
            </div>
          </div>
        </div>
      </div>
      {isExpired && (
        <ExpiredBlock
          alert={alert}
          setExpiredAlertExtend={setExpiredAlertExtend}
          setExpiredAlertModalId={setExpiredAlertModalId}
          queryClient={queryClient}
          stampFinalizedAt={stampFinalizedAt}
        />
      )}
    </>
  );
}
