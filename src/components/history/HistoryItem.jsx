import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatPlate } from '@/utils/carUtils';

export {
  formatAddress,
  formatPriceInt,
  formatRemaining,
} from '@/components/history/historyItemUtils';
export { MarcoContent } from '@/components/history/MarcoContent';

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
