import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, MessageCircle, Phone, PhoneOff } from 'lucide-react';

export default function MarcoCard({
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
  conversationId,
  demoUserName,
  demoUserPhoto,
  demoAlertId,
  isDemo = false
}) {
  const navigate = useNavigate();
  const stUpper = String(statusText || '').trim().toUpperCase();
  const isCountdownLike =
    typeof statusText === 'string' && /^\d{2}:\d{2}(?::\d{2})?$/.test(String(statusText).trim());
  const isCompleted = stUpper === 'COMPLETADA';
  const isDimStatus = stUpper === 'CANCELADA' || stUpper === 'EXPIRADA';
  const statusOn = statusEnabled || isCompleted || isDimStatus || isCountdownLike;

  const photoCls = 'w-full h-full object-cover';

  const nameCls = 'font-bold text-xl text-white leading-none min-h-[22px]';

  const carCls = 'text-sm font-medium text-white leading-none flex-1 flex items-center truncate relative top-[6px]';

  const plateWrapCls = 'flex-shrink-0';
  const carIconWrapCls = 'flex-shrink-0 relative -top-[1px]';

  const lineTextCls = 'text-white leading-5';

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

  const getCarFill = (colorValue) => {
    const carColors = [
      { value: 'blanco', fill: '#FFFFFF' },
      { value: 'negro', fill: '#1a1a1a' },
      { value: 'rojo', fill: '#ef4444' },
      { value: 'azul', fill: '#3b82f6' },
      { value: 'amarillo', fill: '#facc15' },
      { value: 'gris', fill: '#6b7280' }
    ];
    const c = carColors.find((x) => x.value === (colorValue || '').toLowerCase());
    return c?.fill || '#6b7280';
  };

  const PlateProfile = ({ plate }) => {
    const formatPlate = (p) => {
      const clean = String(p || '').replace(/\s+/g, '').toUpperCase();
      if (!clean) return '0000 XXX';
      return `${clean.slice(0, 4)} ${clean.slice(4)}`.trim();
    };

    return (
      <div className="bg-white rounded-md flex items-center overflow-hidden border-2 border-gray-400 h-7">
        <div className="bg-blue-600 h-full w-5 flex items-center justify-center">
          <span className="text-white text-[8px] font-bold">E</span>
        </div>
        <span className="px-2 text-black font-mono font-bold text-sm tracking-wider">
          {formatPlate(plate)}
        </span>
      </div>
    );
  };

  const CarIconProfile = ({ color, size = 'w-16 h-10' }) => (
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

  return (
    <>
      <div className="flex gap-2.5">
        <div
          className={`w-[95px] h-[85px] rounded-lg overflow-hidden border-2 flex-shrink-0 ${
            bright ? 'border-purple-500/40 bg-gray-900' : 'border-gray-600/70 bg-gray-800/30'
          }`}
        >
          {photoUrl ? (
            <img src={photoUrl} alt={name} className={photoCls} />
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
              <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-purple-400" />
              <span className="text-white leading-5 line-clamp-1">{address ? `${address}, Oviedo` : 'Calle del Paseo, 25, Oviedo'}</span>
            </div>
          ) : null}

          {timeLine ? (
            <div className="flex items-start gap-1.5 text-xs">
              <Clock className="w-4 h-4 flex-shrink-0 mt-0.5 text-purple-400" />
              {isTimeObj ? (
                <span className={lineTextCls}>
                  <span className="text-white">{timeLine.main}</span>
                  <span className="text-purple-400">{timeLine.accent}</span>
                </span>
              ) : (
                <span className={lineTextCls}>
                  <span className="text-purple-400">{timeLine}</span>
                </span>
              )}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-2">
        <div className="flex gap-2">
          <Button
            size="icon"
            className="bg-green-500 hover:bg-green-600 text-white rounded-lg h-8 w-[42px]"
            onClick={() => {
              if (conversationId) {
                const params = new URLSearchParams({
                  conversationId,
                  ...(isDemo && { demo: 'true', userName: demoUserName, userPhoto: encodeURIComponent(demoUserPhoto), alertId: demoAlertId })
                });
                navigate(`${createPageUrl('Chat')}?${params.toString()}`);
              } else {
                onChat?.();
              }
            }}
          >
            <MessageCircle className="w-4 h-4" />
          </Button>

          {phoneEnabled ? (
            <Button
              size="icon"
              className="bg-white hover:bg-gray-200 text-black rounded-lg h-8 w-[42px]"
              onClick={onCall}
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

      <div className="border-t border-gray-700/80 mt-2 pt-1.5">
        <div 
          onClick={() => setShowChat(true)}
          className="flex items-start justify-between gap-2 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <div className="text-xs flex-1 flex flex-col gap-1">
            <span className="text-purple-400 font-bold">Ultimo mensaje:</span>
            <span className="text-white" style={{ maxWidth: '40ch' }}>{messages[messages.length - 1]?.text || 'No hay mensajes'}</span>
          </div>
          <div className="bg-red-500/20 border border-red-500/30 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">
            <span className="text-red-400 text-xs font-bold">2</span>
          </div>
        </div>
      </div>

      {showChat && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-end">
          <div className="w-full bg-gray-900 rounded-t-2xl h-[75vh] flex flex-col border-t-2 border-purple-500/50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700/80">
              <div className="flex items-center gap-2">
                {photoUrl && <img src={photoUrl} alt={name} className="w-8 h-8 rounded-lg object-cover border-2 border-purple-500" />}
                <span className="text-white font-bold">{(name || '').split(' ')[0]}</span>
              </div>
              <button
                onClick={() => setShowChat(false)}
                className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/50 flex items-center justify-center text-red-400 hover:bg-red-500/30 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              {messages.map((msg) => (
                <div key={msg.id} className="flex flex-col w-full">
                  <span className="text-xs text-gray-500 mb-1 text-center">
                      {format(msg.timestamp, 'dd MMM - HH:mm', { locale: es }).replace(/^(\d{2} )([a-z])/, (match, p1, p2) => p1 + p2.toUpperCase())}
                    </span>
                  <div className={`flex ${msg.sender === 'you' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`px-3 py-2 rounded-lg max-w-xs text-sm ${
                        msg.sender === 'you'
                          ? 'bg-purple-800/40 text-white'
                          : 'bg-gray-800 text-gray-100'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-700/80 bg-gray-800/50 flex gap-2 flex-shrink-0 relative z-10 -top-[80px]">
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
              />
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                className="hidden"
              />
              <div className="relative">
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-purple-400 hover:text-purple-300 flex-shrink-0"
                  onClick={() => setShowMediaMenu(!showMediaMenu)}
                >
                  <Paperclip className="w-5 h-5" />
                </Button>
                {showMediaMenu && (
                  <div className="absolute bottom-12 left-0 bg-gray-800 border border-gray-700 rounded-lg overflow-hidden z-50">
                    <button
                      onClick={() => {
                        cameraInputRef.current?.click();
                        setShowMediaMenu(false);
                      }}
                      className="w-full px-4 py-2 text-sm text-white hover:bg-gray-700 flex items-center gap-2 whitespace-nowrap"
                    >
                      📷 Hacer foto
                    </button>
                    <button
                      onClick={() => {
                        galleryInputRef.current?.click();
                        setShowMediaMenu(false);
                      }}
                      className="w-full px-4 py-2 text-sm text-white hover:bg-gray-700 flex items-center gap-2 whitespace-nowrap border-t border-gray-700"
                    >
                      🖼️ Subir foto
                    </button>
                  </div>
                )}
              </div>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && newMessage.trim()) {
                    setMessages([...messages, { id: messages.length + 1, sender: 'you', text: newMessage, timestamp: new Date() }]);
                    setNewMessage('');
                  }
                }}
                placeholder="Escribe un mensaje..."
                className="flex-1 bg-purple-900/30 border-2 border-purple-600/40 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500 focus:border-2"
              />
              <Button
                size="icon"
                className="bg-purple-600 hover:bg-purple-700 text-white flex-shrink-0 h-10 px-5 relative top-0"
                onClick={() => {
                  if (newMessage.trim()) {
                    setMessages([...messages, { id: messages.length + 1, sender: 'you', text: newMessage, timestamp: new Date() }]);
                    setNewMessage('');
                  }
                }}
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}