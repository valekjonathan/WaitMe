/**
 * Item de conversación demo (WaitMe aceptados).
 */

import { Navigation, X, TrendingUp } from 'lucide-react';

export default function DemoChatListItem({
  dc,
  demoConvs,
  clearDemoUnread,
  removeDemoConv,
  navigateToDemoChat,
}) {
  const buyerFirstName = (dc.buyer_name || 'Usuario').split(' ')[0];
  const buyerPhoto =
    dc.buyer_photo ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(dc.buyer_name || 'U')}&background=7c3aed&color=fff&size=128`;
  const carLabel = `${dc.brand || ''} ${dc.model || ''}`.trim() || 'Sin datos';
  const hasUnread = (dc.unread || 0) > 0;

  const handleClick = () => {
    clearDemoUnread(dc, demoConvs);
    navigateToDemoChat(dc);
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    removeDemoConv(dc, demoConvs);
  };

  return (
    <div
      className={`bg-gray-900 rounded-xl p-2.5 border-2 ${hasUnread ? 'border-purple-400/70' : 'border-purple-500/30'} cursor-pointer`}
      onClick={handleClick}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-shrink-0 w-[95px] h-7 bg-purple-500/20 text-purple-300 border border-purple-400/50 font-bold text-xs rounded-md flex items-center justify-center">
          Te reservó:
        </div>
        <div className="flex-1" />
        <div className="bg-black/40 border border-purple-500/30 rounded-full px-2 py-0.5 flex items-center gap-1 h-7">
          <Navigation className="w-3 h-3 text-purple-400" />
          <span className="text-white font-bold text-xs">300m</span>
        </div>
        <div className="bg-green-500/15 border border-green-400/40 rounded-lg px-2 py-0.5 flex items-center gap-1 h-7">
          <TrendingUp className="w-4 h-4 text-green-400" />
          <span className="text-green-400 font-bold text-sm">{dc.price || 3}€</span>
        </div>
        <button
          onClick={handleRemove}
          className="w-7 h-7 rounded-lg bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 flex items-center justify-center transition-colors"
        >
          <X className="w-3.5 h-3.5 text-red-400" />
        </button>
      </div>
      <div className="border-t border-gray-700/80 mb-2" />
      <div className="flex gap-2.5 mb-2">
        <div className="w-[95px] h-[85px] rounded-lg overflow-hidden border-2 border-purple-500/40 bg-gray-900 flex-shrink-0">
          <img src={buyerPhoto} alt={buyerFirstName} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 h-[85px] flex flex-col">
          <p className="font-bold text-xl text-white leading-none">{buyerFirstName}</p>
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
                  {dc.plate || '0000 XXX'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-gray-700/80 pt-2">
        <div className="flex justify-between items-center mb-1">
          <p
            className={`text-xs font-bold ${hasUnread ? 'text-purple-400' : 'text-purple-400/70'}`}
          >
            Últimos mensajes:
          </p>
          {hasUnread && (
            <div className="w-6 h-6 bg-red-500/20 border-2 border-red-500/30 rounded-full flex items-center justify-center">
              <span className="text-red-400 text-xs font-bold">
                {dc.unread > 9 ? '9+' : dc.unread}
              </span>
            </div>
          )}
        </div>
        <p className={`text-xs ${hasUnread ? 'text-gray-300' : 'text-gray-500'}`}>
          {dc.first_message || 'Sin mensajes'}
        </p>
      </div>
    </div>
  );
}
