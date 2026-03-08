import {
  Clock,
  MapPin,
  TrendingUp,
  TrendingDown,
  MessageCircle,
  PhoneOff,
  Phone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getCarFill, formatPlate } from '@/utils/carUtils';

// ====== Pure helpers ======

/** Dirección formato: "Calle Gran Vía, n1, Oviedo" */
export function formatAddress(addr) {
  const fallback = 'Calle Gran Vía, n1, Oviedo';
  const s = String(addr || '').trim();
  if (!s) return fallback;

  const hasOviedo = /oviedo/i.test(s);
  const m = s.match(/^(.+?),\s*(?:n\s*)?(\d+)\s*(?:,.*)?$/i);
  if (m) {
    const street = m[1].trim();
    const num = m[2].trim();
    return `${street}, n${num}, Oviedo`;
  }

  if (!hasOviedo) return `${s}, Oviedo`;
  return s;
}

export function formatPriceInt(v) {
  const n = Number(v ?? 0);
  if (!Number.isFinite(n)) return '0 €';
  return `${Math.trunc(n)} €`;
}

export function formatRemaining(ms) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;

  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');

  if (h > 0) {
    const hh = String(h).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

// ====== Shared UI components ======

export const CarIconProfile = ({ color, size = 'w-16 h-10' }) => (
  <svg viewBox="0 0 48 24" className={size} fill="none" style={{ transform: 'translateY(3px)' }}>
    <path
      d="M8 16 L10 10 L16 8 L32 8 L38 10 L42 14 L42 18 L8 18 Z"
      fill={color}
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
);

export const PlateProfile = ({ plate }) => (
  <div className="bg-white rounded-md flex items-center overflow-hidden border-2 border-gray-400 h-7">
    <div className="bg-blue-600 h-full w-5 flex items-center justify-center">
      <span className="text-white text-[8px] font-bold">E</span>
    </div>
    <span className="px-2 text-black font-mono font-bold text-sm tracking-wider">
      {formatPlate(plate)}
    </span>
  </div>
);

const labelNoClick = 'cursor-default select-none pointer-events-none';

export const SectionTag = ({ variant, text }) => {
  const cls =
    variant === 'green'
      ? 'bg-green-500/20 border-green-500/30 text-green-400'
      : 'bg-red-500/20 border-red-500/30 text-red-400';
  return (
    <div className="w-full flex justify-center pt-0">
      <div
        className={`${cls} border rounded-md px-4 h-7 flex items-center justify-center font-bold text-xs text-center ${labelNoClick}`}
      >
        {text}
      </div>
    </div>
  );
};

export const CardHeaderRow = ({ left, dateText, dateClassName, right }) => (
  <div className="flex items-center gap-2 mb-2">
    <div className="flex-shrink-0">{left}</div>
    <div className={`flex-1 text-center text-xs whitespace-nowrap ${dateClassName || ''}`}>
      {dateText}
    </div>
    <div className="flex-shrink-0">{right}</div>
  </div>
);

export const MoneyChip = ({
  mode = 'neutral',
  amountText,
  showDownIcon = false,
  showUpIcon = false,
}) => {
  const isGreen = mode === 'green';
  const isRed = mode === 'red';

  const wrapCls = isGreen
    ? 'bg-green-500/20 border border-green-500/30'
    : isRed
      ? 'bg-red-500/20 border border-red-500/30'
      : 'bg-gray-500/10 border border-gray-600';

  const textCls = isGreen ? 'text-green-400' : isRed ? 'text-red-400' : 'text-gray-400';

  return (
    <div className={`${wrapCls} rounded-lg px-2 py-1 flex items-center gap-1 h-7`}>
      {showUpIcon ? <TrendingUp className={`w-4 h-4 ${textCls}`} /> : null}
      {showDownIcon ? <TrendingDown className={`w-4 h-4 ${textCls}`} /> : null}
      <span className={`font-bold text-sm ${textCls}`}>{amountText}</span>
    </div>
  );
};

export const CountdownButton = ({ text, dimmed = false }) => (
  <div
    className={[
      'w-full h-9 rounded-lg border-2 flex items-center justify-center px-3',
      dimmed ? 'border-purple-500/30 bg-purple-600/10' : 'border-purple-400/70 bg-purple-600/25',
    ].join(' ')}
  >
    <span
      className={`text-sm font-mono font-extrabold ${dimmed ? 'text-gray-400/70' : 'text-purple-100'}`}
    >
      {text}
    </span>
  </div>
);

export const MarcoContent = ({
  photoUrl,
  name,
  carLabel,
  plate,
  carColor,
  onChat,
  statusText = 'COMPLETADA',
  address,
  timeLine,
  priceChip,
  phoneEnabled = false,
  onCall,
  statusEnabled = false,
  bright = false,
  dimIcons = false,
}) => {
  const stUpper = String(statusText || '')
    .trim()
    .toUpperCase();
  const isCountdownLike =
    typeof statusText === 'string' && /^\d{2}:\d{2}(?::\d{2})?$/.test(String(statusText).trim());
  const isCompleted = stUpper === 'COMPLETADA';
  const isDimStatus = stUpper === 'CANCELADA' || stUpper === 'EXPIRADA';
  const statusOn = statusEnabled || isCompleted || isDimStatus || isCountdownLike;

  const photoCls = bright
    ? 'w-full h-full object-cover'
    : 'w-full h-full object-cover opacity-40 grayscale';

  const nameCls = bright
    ? 'font-bold text-xl text-white leading-none min-h-[22px]'
    : 'font-bold text-xl text-gray-300 leading-none opacity-70 min-h-[22px]';

  const carCls = bright
    ? 'text-sm font-medium text-gray-200 leading-none flex-1 flex items-center truncate relative top-[6px]'
    : 'text-sm font-medium text-gray-400 leading-none opacity-70 flex-1 flex items-center truncate relative top-[6px]';

  const plateWrapCls = bright ? 'flex-shrink-0' : 'opacity-45 flex-shrink-0';
  const carIconWrapCls = bright
    ? 'flex-shrink-0 relative -top-[1px]'
    : 'opacity-45 flex-shrink-0 relative -top-[1px]';

  const lineTextCls = bright ? 'text-gray-200 leading-5' : 'text-gray-300 leading-5';

  const isTimeObj =
    timeLine && typeof timeLine === 'object' && !Array.isArray(timeLine) && 'main' in timeLine;

  const statusBoxCls = statusOn
    ? isCountdownLike
      ? 'border-purple-400/70 bg-purple-600/25'
      : 'border-purple-500/30 bg-purple-600/10'
    : 'border-gray-700 bg-gray-800/60';

  const statusTextCls = statusOn
    ? isCountdownLike
      ? 'text-purple-100'
      : isDimStatus
        ? 'text-gray-400/70'
        : 'text-purple-300'
    : 'text-gray-400 opacity-70';

  return (
    <>
      <div className="flex gap-2.5">
        <div
          className={`w-[95px] h-[85px] rounded-lg overflow-hidden border-2 flex-shrink-0 ${
            bright ? 'border-purple-500/40 bg-gray-900' : 'border-gray-600/70 bg-gray-800/30'
          }`}
        >
          {photoUrl ? (
            <img src={photoUrl} alt={name} className={photoCls} loading="eager" decoding="sync" />
          ) : (
            <div
              className={`w-full h-full flex items-center justify-center text-3xl ${
                bright ? 'text-gray-300' : 'text-gray-600 opacity-40'
              }`}
            >
              👤
            </div>
          )}
        </div>

        <div className="flex-1 h-[85px] flex flex-col">
          <p className={nameCls}>{(name || '').split(' ')[0] || 'Usuario'}</p>
          <p className={carCls}>{carLabel || 'Sin datos'}</p>

          <div className="flex items-end gap-2 mt-1 min-h-[28px]">
            <div className={plateWrapCls}>
              <PlateProfile plate={plate} />
            </div>

            <div className="flex-1 flex justify-center">
              <div className={carIconWrapCls}>
                <CarIconProfile color={getCarFill(carColor)} size="w-16 h-10" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-1.5 border-t border-gray-700/80 mt-2">
        <div className={bright ? 'space-y-1.5' : 'space-y-1.5 opacity-80'}>
          {address ? (
            <div className="flex items-start gap-1.5 text-xs">
              <MapPin
                className={`w-4 h-4 flex-shrink-0 mt-0.5 ${dimIcons ? 'text-gray-500' : 'text-purple-400'}`}
              />
              <span className={lineTextCls + ' line-clamp-1'}>{formatAddress(address)}</span>
            </div>
          ) : null}

          {timeLine ? (
            <div className="flex items-start gap-1.5 text-xs">
              <Clock
                className={`w-4 h-4 flex-shrink-0 mt-0.5 ${dimIcons ? 'text-gray-500' : 'text-purple-400'}`}
              />
              {isTimeObj ? (
                <span className={lineTextCls}>
                  {timeLine.main}{' '}
                  <span className={bright ? 'text-purple-400' : lineTextCls}>
                    {timeLine.accent}
                  </span>
                </span>
              ) : (
                <span className={lineTextCls}>{timeLine}</span>
              )}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-2">
        <div className="flex justify-between gap-2">
          <Button
            size="icon"
            className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-lg h-8"
            onClick={onChat}
          >
            <MessageCircle className="w-4 h-4" />
          </Button>

          {phoneEnabled ? (
            <Button
              size="icon"
              className="flex-1 bg-white hover:bg-gray-200 text-black rounded-lg h-8"
              onClick={onCall}
            >
              <Phone className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              variant="outline"
              size="icon"
              className="flex-1 border-white/30 bg-white/10 text-white rounded-lg h-8 opacity-70 cursor-not-allowed"
              disabled
            >
              <PhoneOff className="w-4 h-4 text-white" />
            </Button>
          )}

          <div className="flex-1">
            <div
              className={`w-full h-8 rounded-lg border-2 flex items-center justify-center px-3 ${statusBoxCls}`}
            >
              <span className={`text-sm font-mono font-extrabold ${statusTextCls}`}>
                {statusText}
              </span>
            </div>
          </div>

          {priceChip ? <div className="hidden">{priceChip}</div> : null}
        </div>
      </div>
    </>
  );
};
