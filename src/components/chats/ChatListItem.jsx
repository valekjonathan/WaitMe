/**
 * Item de conversación real (no demo).
 */

import { Navigation, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import MarcoCard from '@/components/cards/MarcoCard';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  getRoleBoxClasses,
  formatMMSS,
  getChatStatusLabel,
  isFinalChatStatus,
  shouldEnableIR,
  hasLatLon,
} from '@/hooks/chats/useChatsData';

const PURPLE_ACTIVE_TEXT = 'text-purple-400';
const PURPLE_ACTIVE_TEXT_DIM = 'text-purple-400/70';

const TrendingUpIcon = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const TrendingDownIcon = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
    <polyline points="17 18 23 18 23 12" />
  </svg>
);

const PricePill = ({ direction = 'up', amount = 0 }) => {
  const isUp = direction === 'up';
  const wrapCls = isUp
    ? 'bg-green-500/15 border border-green-400/40'
    : 'bg-red-500/15 border border-red-400/40';
  const textCls = isUp ? 'text-green-400' : 'text-red-400';
  return (
    <div className={`${wrapCls} rounded-lg px-2 py-1 flex items-center gap-1 h-7`}>
      {isUp ? (
        <TrendingUpIcon className={`w-4 h-4 ${textCls}`} />
      ) : (
        <TrendingDownIcon className={`w-4 h-4 ${textCls}`} />
      )}
      <span className={`font-bold text-sm ${textCls}`}>{Math.floor(amount || 0)}€</span>
    </div>
  );
};

const PHOTO_URLS = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
  'https://randomuser.me/api/portraits/women/68.jpg',
  'https://randomuser.me/api/portraits/men/32.jpg',
  'https://randomuser.me/api/portraits/women/44.jpg',
  'https://randomuser.me/api/portraits/men/75.jpg',
];

export default function ChatListItem({
  conv,
  alert,
  index,
  unreadCount,
  hasUnread,
  isBuyer,
  isSeller,
  otherUserName,
  otherUserPhoto,
  distanceText,
  remainingMs,
  nowTs,
  openDirectionsToAlert,
  navigateToChat,
  onCloseClick,
}) {
  const countdownText = formatMMSS(remainingMs);
  const remainingMinutes = Math.max(0, Math.ceil((remainingMs ?? 0) / 60000));
  const waitUntilText = format(new Date(nowTs + (remainingMs ?? 0)), 'HH:mm', { locale: es });
  const finalLabel = getChatStatusLabel(alert?.status);
  const isFinal = isFinalChatStatus(alert?.status) && !!finalLabel;
  const canIR = shouldEnableIR({ status: alert?.status, isSeller, isFinal });
  const statusBoxText = isFinal ? finalLabel : countdownText;

  const resolvedPhoto =
    otherUserPhoto || PHOTO_URLS[String(conv.id || '').charCodeAt(0) % PHOTO_URLS.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <div
        className={`bg-gradient-to-br ${
          hasUnread ? 'from-gray-800 to-gray-900' : 'from-gray-900/50 to-gray-900/50'
        } rounded-xl p-2.5 transition-all border-2 ${
          hasUnread ? 'border-purple-400/70' : 'border-purple-500/30'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-shrink-0 w-[95px]">
              <Badge
                className={getRoleBoxClasses({
                  status: alert?.status,
                  isSeller,
                  isBuyer,
                })}
              >
                {isBuyer ? 'Reservaste a:' : isSeller ? 'Te reservo:' : 'Info usuario'}
              </Badge>
            </div>
            <div className="flex-1"></div>
            <div className="bg-black/40 backdrop-blur-sm border border-purple-500/30 rounded-full px-2 py-0.5 flex items-center gap-1 h-7">
              <Navigation className="w-3 h-3 text-purple-400" />
              <span className="text-white font-bold text-xs">{distanceText}</span>
            </div>
            <PricePill direction={isSeller ? 'up' : 'down'} amount={alert?.price} />
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCloseClick?.(e);
              }}
              className="w-7 h-7 rounded-lg bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 flex items-center justify-center transition-colors"
            >
              <X className="w-3.5 h-3.5 text-red-400" />
            </button>
          </div>

          <div className="border-t border-gray-700/80 mb-1.5 pt-2">
            <MarcoCard
              photoUrl={resolvedPhoto}
              name={otherUserName}
              carLabel={`${alert.brand || ''} ${alert.model || ''}`.trim()}
              plate={alert.plate}
              carColor={alert.color || 'gris'}
              address={alert.address}
              timeLine={
                isSeller ? (
                  <span className="text-white leading-5">
                    Te vas en {remainingMinutes} min · Debes esperar hasta las{' '}
                    <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{waitUntilText}</span>
                  </span>
                ) : isBuyer ? (
                  <span className="text-white leading-5">
                    Se va en {remainingMinutes} min · Te espera hasta las{' '}
                    <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{waitUntilText}</span>
                  </span>
                ) : (
                  <span className={hasUnread ? 'text-white' : 'text-gray-400'}>
                    Tiempo para llegar:
                  </span>
                )
              }
              onChat={navigateToChat}
              statusText={statusBoxText}
              phoneEnabled={alert.allow_phone_calls}
              onCall={() =>
                alert.allow_phone_calls &&
                alert?.phone &&
                (window.location.href = `tel:${alert.phone}`)
              }
              dimmed={!hasUnread}
              role={isSeller ? 'seller' : 'buyer'}
            />

            {hasLatLon(alert) && (
              <div className="mt-2">
                <Button
                  disabled={!canIR}
                  className={`w-full border-2 ${
                    canIR
                      ? 'bg-blue-600 hover:bg-blue-700 border-blue-400/70'
                      : 'bg-blue-600/30 text-white/50 border-blue-500/30'
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (isSeller || isFinal) return;
                    openDirectionsToAlert(alert);
                  }}
                >
                  <span className="flex items-center justify-center gap-2">
                    <Navigation className="w-4 h-4" />
                    IR
                  </span>
                </Button>
              </div>
            )}
          </div>

          <div
            className="border-t border-gray-700/80 mt-2 pt-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={navigateToChat}
          >
            <div className="flex justify-between items-center">
              <p
                className={`text-xs font-bold ${hasUnread ? PURPLE_ACTIVE_TEXT : PURPLE_ACTIVE_TEXT_DIM}`}
              >
                Últimos mensajes:
              </p>
              {unreadCount > 0 && (
                <div className="w-6 h-6 bg-red-500/20 border-2 border-red-500/30 rounded-full flex items-center justify-center relative top-[10px]">
                  <span className="text-red-400 text-xs font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                </div>
              )}
            </div>
            <p className={`text-xs ${hasUnread ? 'text-gray-300' : 'text-gray-500'} mt-1`}>
              {conv.last_message_text || 'Sin mensajes'}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
