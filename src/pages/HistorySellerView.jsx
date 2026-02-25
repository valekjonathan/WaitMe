import { motion } from 'framer-motion';
import {
  X,
  MessageCircle,
  Phone,
  PhoneOff,
  Navigation,
  MapPin,
  Clock,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TabsContent } from '@/components/ui/tabs';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function HistorySellerView({
  noScrollBar,
  SectionTag,
  thinkingRequests,
  setThinkingRequests,
  visibleActiveAlerts,
  nowTs,
  formatRemaining,
  getCreatedTs,
  getWaitUntilTs,
  hiddenKeys,
  hideKey,
  formatCardDate,
  formatPriceInt,
  formatAddress,
  getCarFill,
  getCarFillThinking,
  CarIconProfile,
  PlateProfile,
  badgePhotoWidth,
  labelNoClick,
  cancelAlertMutation,
  queryClient,
  ReservedByContent,
  CardHeaderRow,
  MoneyChip,
  CountdownButton,
  finalItems,
  statusLabelFrom,
  MarcoContent,
  deleteAlertSafe,
  user,
  setCancelReservedAlert,
  setCancelReservedOpen,
  expiredAlertExtend,
  setExpiredAlertExtend,
  setExpiredAlertModalId,
  ExpiredBlock,
  toMs,
  avatarFor,
  formatPlate,
  reservationMoneyModeFromStatus,
}) {
  return (
          <TabsContent value="alerts" className={`space-y-3 pt-1 pb-6 ${noScrollBar}`}>
                <SectionTag variant="green" text="Activas" />

                {/* Merged active alerts and thinking requests sorted by time */}
                {(() => {
                  const thinkingItems = thinkingRequests.map(item => ({
                    __type: 'thinking',
                    __ts: item.alert?.created_date ? new Date(item.alert.created_date).getTime() : 0,
                    item
                  }));
                  const activeItems = visibleActiveAlerts.map((a, idx) => ({
                    __type: 'active',
                    __ts: toMs(a.created_date) || 0,
                    item: a,
                    index: idx
                  }));
                  const merged = [...thinkingItems, ...activeItems]
                    .sort((a, b) => b.__ts - a.__ts)
                    .slice(0, 1); // Only show the most recent one

                  return merged.map(entry => {
                    if (entry.__type === 'thinking') {
                      const item = entry.item;
                      const req = item.request;
                      const alt = item.alert;
                      const buyer = req?.buyer || {};
                      const firstName = (buyer?.name || 'Usuario').split(' ')[0];
                      const carLabel = String(buyer?.car_model || 'Sin datos').trim();
                      const plate = buyer?.plate || '';
                      const carFillColor = getCarFillThinking(buyer?.car_color || 'gris');
                      const photo = buyer?.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(buyer?.name||'U')}&background=7c3aed&color=fff&size=128`;
                      const mins = Number(alt?.available_in_minutes) || 0;
                      const altCreatedTs = alt?.created_date ? new Date(alt.created_date).getTime() : Date.now();
                      const waitUntilTsT = altCreatedTs + mins * 60 * 1000;
                      const waitUntilLabelT = new Date(waitUntilTsT).toLocaleTimeString('es-ES', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit', hour12: false });
                      const remainingMsT = Math.max(0, waitUntilTsT - nowTs);
                      const remSecT = Math.floor(remainingMsT / 1000);
                      const mmT = String(Math.floor(remSecT / 60)).padStart(2, '0');
                      const ssT = String(remSecT % 60).padStart(2, '0');
                      const countdownT = `${mmT}:${ssT}`;
                      const isCountdownT = remainingMsT > 0;
                      const phoneEnabled = Boolean(buyer?.phone);
                      const tKey = `thinking-${item.id}`;

                      const acceptThinking = () => {
                        const payload = {
                          status: 'reserved',
                          reserved_by_id: buyer?.id || 'buyer',
                          reserved_by_name: buyer?.name || 'Usuario',
                          reserved_by_photo: buyer?.photo || null,
                          reserved_by_car: String(buyer?.car_model || '').trim(),
                          reserved_by_car_color: buyer?.car_color || 'gris',
                          reserved_by_plate: buyer?.plate || '',
                        };
                        try {
                          setThinkingRequests([]);
                          localStorage.setItem('waitme:thinking_requests', JSON.stringify([]));
                          window.dispatchEvent(new Event('waitme:thinkingUpdated'));
                        } catch {}
                        queryClient.setQueryData(['myAlerts'], (old = []) =>
                          old.map(a => a.id === req.alertId ? { ...a, ...payload } : a)
                        );
                        base44.entities.ParkingAlert.update(req.alertId, payload).then(() => {
                          queryClient.invalidateQueries({ queryKey: ['myAlerts'] });
                        });
                      };

                      const rejectThinking = () => {
                        try {
                          const updated = thinkingRequests.filter(r => r.id !== item.id);
                          setThinkingRequests(updated);
                          localStorage.setItem('waitme:thinking_requests', JSON.stringify(updated));
                          const rejected = JSON.parse(localStorage.getItem('waitme:rejected_requests') || '[]');
                          rejected.push(item);
                          localStorage.setItem('waitme:rejected_requests', JSON.stringify(rejected));
                        } catch {}
                      };

                      const dismissThinking = () => {
                        try {
                          const updated = thinkingRequests.filter(r => r.id !== item.id);
                          setThinkingRequests(updated);
                          localStorage.setItem('waitme:thinking_requests', JSON.stringify(updated));
                        } catch {}
                      };

                      return (
                    <motion.div key={tKey} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                      className="w-full bg-gray-900 rounded-2xl border-2 border-purple-500 overflow-hidden">
                      <div className="flex items-center justify-between px-4 pt-4 pb-2">
                        <p className="text-white font-semibold text-lg">
                          {firstName} quiere un <span className="text-2xl font-bold">Wait</span>
                          <span className="text-purple-400 text-2xl font-bold">Me!</span>
                        </p>
                        <button onClick={dismissThinking}
                          className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/50 flex items-center justify-center text-red-400 hover:bg-red-500/30 transition-colors">
                          <X className="w-5 h-5"/>
                        </button>
                      </div>
                      <div className="px-3 pb-3">
                        <div className="bg-gray-800/60 rounded-xl p-2 border border-purple-500">
                          <div className="flex items-center justify-between mb-2">
                            <div className="bg-purple-500/20 text-purple-300 border border-purple-400/50 font-bold text-xs rounded-md px-3 py-1">
                              Te reservó:
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="bg-black/40 border border-purple-500/30 rounded-full px-2 py-0.5 flex items-center gap-1 h-7">
                                <Navigation className="w-3 h-3 text-purple-400"/>
                                <span className="text-white font-bold text-xs">300m</span>
                              </div>
                              <div className="bg-green-500/20 border border-green-500/30 rounded-lg px-2 py-0.5 flex items-center gap-1 h-7">
                                <TrendingUp className="w-4 h-4 text-green-400"/>
                                <span className="text-green-400 font-bold text-sm">{formatPriceInt(alt?.price)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="border-t border-gray-700/80 mb-2"/>
                          <div className="flex gap-2.5">
                            <div className="w-[95px] h-[85px] rounded-lg overflow-hidden border-2 border-purple-500/40 bg-gray-900 flex-shrink-0">
                              <img src={photo} alt={firstName} className="w-full h-full object-cover"/>
                            </div>
                            <div className="flex-1 h-[85px] flex flex-col">
                              <p className="font-bold text-xl text-white leading-none">{firstName}</p>
                              <p className="text-sm font-medium text-gray-200 flex-1 flex items-center truncate relative top-[6px]">{carLabel}</p>
                              <div className="flex items-end gap-2 mt-1 min-h-[28px]">
                                <div className="flex-shrink-0">
                                  <div className="bg-white rounded-md flex items-center overflow-hidden border-2 border-gray-400 h-7">
                                    <div className="bg-blue-600 h-full w-5 flex items-center justify-center">
                                      <span className="text-white text-[8px] font-bold">E</span>
                                    </div>
                                    <span className="px-1.5 text-black font-mono font-bold text-sm tracking-wider">{plate}</span>
                                  </div>
                                </div>
                                <div className="flex-1 flex justify-center">
                                  <div className="flex-shrink-0 relative top-[2px]">
                                    <CarIconProfile color={carFillColor} size="w-16 h-10"/>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="pt-1.5 border-t border-gray-700/80 mt-2 space-y-1.5">
                            <div className="flex items-center gap-1.5 text-xs min-h-[20px]">
                              <MapPin className="w-4 h-4 flex-shrink-0 text-purple-400"/>
                              <span className="text-gray-200 line-clamp-1 leading-none">{alt?.address || 'Ubicación marcada'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] min-h-[20px]">
                              <Clock className="w-4 h-4 flex-shrink-0 text-purple-400"/>
                              <span className="leading-none">
                                <span className="text-white">Te vas en {mins} min · </span>
                                <span className="text-purple-400">Debes esperar hasta las:</span>
                                {' '}<span className="text-white font-bold" style={{fontSize:'14px'}}>{waitUntilLabelT}</span>
                              </span>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <Button size="icon" className="h-8 bg-green-500 hover:bg-green-600 text-white rounded-lg" style={{width:'46px',flexShrink:0}}>
                              <MessageCircle className="w-4 h-4"/>
                            </Button>
                            {phoneEnabled ? (
                              <Button size="icon" className="h-8 bg-white hover:bg-gray-200 text-black rounded-lg" style={{width:'46px',flexShrink:0}}>
                                <Phone className="w-4 h-4"/>
                              </Button>
                            ) : (
                              <Button size="icon" className="h-8 border-white/30 bg-white/10 text-white rounded-lg opacity-70" style={{width:'46px',flexShrink:0}} disabled>
                                <PhoneOff className="w-4 h-4"/>
                              </Button>
                            )}
                            <Button size="icon" className="h-8 rounded-lg bg-blue-600 text-white opacity-40 flex items-center justify-center" style={{width:'46px',flexShrink:0}} disabled>
                              <Navigation className="w-4 h-4"/>
                            </Button>
                            <div className="flex-1">
                              <div className={`w-full h-8 rounded-lg border-2 flex items-center justify-center ${isCountdownT ? 'border-purple-400/70 bg-purple-600/25' : 'border-purple-500/30 bg-purple-600/10'}`}>
                                <span className={`font-mono font-extrabold text-sm ${isCountdownT ? 'text-purple-100' : 'text-purple-300'}`}>{countdownT}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="px-3 pb-4 grid grid-cols-3 gap-2">
                        <Button className="bg-purple-600 hover:bg-purple-700 font-semibold" onClick={acceptThinking}>Aceptar</Button>
                        <Button variant="outline" className="border-gray-600 text-white font-semibold" onClick={dismissThinking}>Me lo pienso</Button>
                        <Button className="bg-red-600/80 hover:bg-red-700 font-semibold" onClick={rejectThinking}>Rechazar</Button>
                      </div>
                      </motion.div>
                      );
                      }

                      const alert = entry.item;
                      const index = entry.index;
                      const createdTs = getCreatedTs(alert);
                      const waitUntilTs = getWaitUntilTs(alert);
                      const remainingMs = waitUntilTs && createdTs ? Math.max(0, waitUntilTs - nowTs) : 0;
                      const waitUntilLabel = waitUntilTs ? new Date(waitUntilTs).toLocaleString('es-ES', { 
                        timeZone: 'Europe/Madrid', 
                        hour: '2-digit', 
                        minute: '2-digit', 
                        hour12: false 
                      }) : '--:--';
                      const countdownText = remainingMs > 0 ? formatRemaining(remainingMs) : formatRemaining(0);
                      const cardKey = `active-${alert.id}`;
                      if (hiddenKeys.has(cardKey)) return null;

                      return (
                        <motion.div
                          key={cardKey}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={alert.status === 'reserved' && (alert.reserved_by_name || alert.user_name)
                            ? ""
                            : "bg-gray-900 rounded-xl p-2 border-2 border-purple-500/50 relative"}
                        >
                          {alert.status === 'reserved' && (alert.reserved_by_name || alert.user_name) ? (
                            <>
                              <ReservedByContent
                                alert={alert}
                                waitUntilLabel={waitUntilLabel}
                                countdownText={countdownText}
                                onNavigateClick={() => { window.location.hash = createPageUrl('Navigate') + '?alertId=' + encodeURIComponent(alert.id); }}
                                onCancelClick={() => { setCancelReservedAlert(alert); setCancelReservedOpen(true); }}
                              />
                            </>
                          ) : (
                            <>
                              <CardHeaderRow
                                left={
                                  <div className={`bg-green-500/20 text-green-300 border border-green-400/50 font-bold text-xs h-7 px-3 flex items-center justify-center rounded-md ${badgePhotoWidth} ${labelNoClick}`}>
                                    Activa
                                  </div>
                                }
                                dateText={formatCardDate(createdTs)}
                                dateClassName="text-white"
                                right={
                                  <div className="flex items-center gap-1">
                                    <MoneyChip
                                      mode="green"
                                      showUpIcon
                                      amountText={formatPriceInt(alert.price)}
                                    />
                                    <button
                                      onClick={() => {
                                        hideKey(cardKey);
                                        cancelAlertMutation.mutate(alert.id, {
                                          onSuccess: () => {
                                            queryClient.invalidateQueries(['myAlerts']);
                                          }
                                        });
                                      }}
                                      disabled={cancelAlertMutation.isPending}
                                      className="w-7 h-7 rounded-lg bg-red-500/20 border border-red-500/50 flex items-center justify-center text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                }
                              />

                              <div className="border-t border-gray-700/80 mb-2" />

                              <div className="flex items-center gap-1.5 text-xs mb-2 min-h-[20px]">
                                <MapPin className="w-4 h-4 flex-shrink-0 text-purple-400" />
                                <span className="text-white leading-none">
                                  {formatAddress(alert.address) || 'Ubicación marcada'}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 text-xs overflow-hidden min-h-[20px]">
                                <Clock className="w-4 h-4 flex-shrink-0 text-purple-400" />
                                <span className="leading-none">
                                  <span className="text-white">Te vas en {alert.available_in_minutes} min · </span>
                                  <span className="text-purple-400">Debes esperar hasta las:</span>
                                  {' '}<span className="text-white font-bold" style={{ fontSize: '15px' }}>{waitUntilLabel}</span>
                                </span>
                              </div>

                              <div className="mt-2">
                                <CountdownButton text={countdownText} dimmed={false} />
                              </div>
                            </>
                          )}
                        </motion.div>
                      );
                      });
                      })()}

                      {visibleActiveAlerts.length === 0 && thinkingRequests.length === 0 && (
                      <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gray-900 rounded-xl p-2 border-2 border-purple-500/50 h-[160px] flex items-center justify-center"
                      >
                      <p className="text-gray-500 font-semibold">No tienes ninguna alerta activa.</p>
                      </motion.div>
                      )}

                      <div className="pt-2">
                      <SectionTag variant="red" text="Finalizadas" />
                      </div>

                      {/* ── Finalizadas: pre-ordenado en History.jsx → sólo .map() ── */}
                      {finalItems.length === 0 ? (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-gray-900 rounded-xl p-2 border-2 border-gray-700/80 h-[160px] flex items-center justify-center"
                        >
                          <p className="text-gray-500 font-semibold">No tienes alertas finalizadas</p>
                        </motion.div>
                      ) : (
                      <div className="space-y-[20px]">
                      {finalItems.map((item, index) => {
                    if (item.type === 'rejected') {
                      const rKey = item.id;
                      const req = item.data.request;
                      const alt = item.data.alert;
                      const buyer = req?.buyer || {};
                      const firstName = (buyer?.name || 'Usuario').split(' ')[0];
                      const carLabel = String(buyer?.car_model || 'Sin datos').trim();
                      const plate = buyer?.plate || '';
                      const carFillColor = getCarFillThinking(buyer?.car_color || 'gris');
                      const photo = buyer?.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(buyer?.name||'U')}&background=7c3aed&color=fff&size=128`;
                      const ts = item.data.savedAt || item.created_date || Date.now();
                      const dateText = formatCardDate(ts);
                      const mins = Number(alt?.available_in_minutes) || 0;
                      const altCreatedTs = alt?.created_date ? new Date(alt.created_date).getTime() : Date.now();
                      const waitUntilTsR = altCreatedTs + mins * 60 * 1000;
                      const waitUntilLabelR = new Date(waitUntilTsR).toLocaleTimeString('es-ES', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit', hour12: false });
                      return (
                        <motion.div key={rKey} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                          className="w-full bg-gray-900 rounded-2xl border-2 border-gray-700/80 overflow-hidden">
                          <div className="flex items-center justify-between px-4 pt-4 pb-2">
                            <p className="text-white font-semibold text-lg">
                              {firstName} quiere un <span className="text-2xl font-bold">Wait</span>
                              <span className="text-purple-400 text-2xl font-bold">Me!</span>
                            </p>
                            <button onClick={() => hideKey(rKey)}
                              className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/50 flex items-center justify-center text-red-400 hover:bg-red-500/30 transition-colors">
                              <X className="w-5 h-5"/>
                            </button>
                          </div>
                          <div className="px-3 pb-3">
                            <div className="bg-gray-800/60 rounded-xl p-2 border border-gray-600/60">
                              <div className="flex items-center justify-between mb-2">
                                <div className="bg-red-500/20 text-red-300 border border-red-500/30 font-bold text-xs rounded-md px-3 py-1">
                                  Rechazada
                                </div>
                                <div className="flex items-center gap-1">
                                  <div className="bg-black/40 border border-purple-500/30 rounded-full px-2 py-0.5 flex items-center gap-1 h-7">
                                    <Navigation className="w-3 h-3 text-purple-400"/>
                                    <span className="text-white font-bold text-xs">300m</span>
                                  </div>
                                  <div className="bg-gray-500/20 border border-gray-600/40 rounded-lg px-2 py-0.5 flex items-center gap-1 h-7">
                                    <TrendingUp className="w-4 h-4 text-gray-400"/>
                                    <span className="text-gray-400 font-bold text-sm">{formatPriceInt(alt?.price)}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="border-t border-gray-700/80 mb-2"/>
                              <div className="flex gap-2.5">
                                <div className="w-[95px] h-[85px] rounded-lg overflow-hidden border-2 border-gray-600/40 bg-gray-900 flex-shrink-0">
                                  <img src={photo} alt={firstName} className="w-full h-full object-cover opacity-40 grayscale"/>
                                </div>
                                <div className="flex-1 h-[85px] flex flex-col">
                                  <p className="font-bold text-xl text-gray-300 leading-none opacity-70">{firstName}</p>
                                  <p className="text-sm font-medium text-gray-400 leading-none opacity-70 flex-1 flex items-center truncate relative top-[6px]">{carLabel}</p>
                                  <div className="flex items-end gap-2 mt-1 min-h-[28px]">
                                    <div className="opacity-45 flex-shrink-0">
                                      <div className="bg-white rounded-md flex items-center overflow-hidden border-2 border-gray-400 h-7">
                                        <div className="bg-blue-600 h-full w-5 flex items-center justify-center">
                                          <span className="text-white text-[8px] font-bold">E</span>
                                        </div>
                                        <span className="px-1.5 text-black font-mono font-bold text-sm tracking-wider">{plate}</span>
                                      </div>
                                    </div>
                                    <div className="flex-1 flex justify-center">
                                      <div className="opacity-45 flex-shrink-0 relative top-[2px]">
                                        <svg viewBox="0 0 48 24" className="w-16 h-10" fill="none">
                                          <path d="M8 16 L10 10 L16 8 L32 8 L38 10 L42 14 L42 18 L8 18 Z" fill={carFillColor} stroke="white" strokeWidth="1.5"/>
                                          <path d="M16 9 L18 12 L30 12 L32 9 Z" fill="rgba(255,255,255,0.3)" stroke="white" strokeWidth="0.5"/>
                                          <circle cx="14" cy="18" r="4" fill="#333" stroke="white" strokeWidth="1"/>
                                          <circle cx="14" cy="18" r="2" fill="#666"/>
                                          <circle cx="36" cy="18" r="4" fill="#333" stroke="white" strokeWidth="1"/>
                                          <circle cx="36" cy="18" r="2" fill="#666"/>
                                        </svg>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="pt-1.5 border-t border-gray-700/80 mt-2 space-y-1.5 opacity-80">
                                <div className="flex items-center gap-1.5 text-xs min-h-[20px]">
                                  <MapPin className="w-4 h-4 flex-shrink-0 text-gray-500"/>
                                  <span className="text-gray-300 leading-none line-clamp-1">{alt?.address || 'Ubicación marcada'}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[11px] min-h-[20px]">
                                  <Clock className="w-4 h-4 flex-shrink-0 text-gray-500"/>
                                  <span className="leading-none text-gray-400">
                                    <span>Te ibas en {mins} min · </span>
                                    <span>Debías esperar hasta las:</span>
                                    {' '}<span className="font-bold" style={{fontSize:'14px'}}>{waitUntilLabelR}</span>
                                  </span>
                                </div>
                              </div>
                              <div className="mt-2 flex items-center gap-2">
                                <Button size="icon" className="h-8 bg-green-500 hover:bg-green-600 text-white rounded-lg border-2 border-green-400" style={{width:'46px',flexShrink:0}}>
                                  <MessageCircle className="w-4 h-4"/>
                                </Button>
                                {Boolean(buyer?.phone && req?.allow_phone_calls !== false) ? (
                                  <Button size="icon" className="h-8 bg-white hover:bg-gray-200 text-black rounded-lg border-2 border-gray-300" style={{width:'46px',flexShrink:0}}
                                    onClick={()=>window.location.href=`tel:${buyer.phone}`}>
                                    <Phone className="w-4 h-4"/>
                                  </Button>
                                ) : (
                                  <Button size="icon" className="h-8 border-2 border-white/20 bg-white/10 text-white rounded-lg opacity-50 cursor-not-allowed" style={{width:'46px',flexShrink:0}} disabled>
                                    <PhoneOff className="w-4 h-4"/>
                                  </Button>
                                )}
                                <Button size="icon" className="h-8 rounded-lg bg-blue-600/40 text-white opacity-40 border-2 border-blue-400/30 cursor-not-allowed" style={{width:'46px',flexShrink:0}} disabled>
                                  <Navigation className="w-4 h-4"/>
                                </Button>
                                <div className="flex-1">
                                  <div className="w-full h-8 rounded-lg border-2 border-purple-500/30 bg-purple-600/10 flex items-center justify-center">
                                    <span className="font-mono font-extrabold text-sm text-gray-400/70">RECHAZADA</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    }

                    // finalized alert/transaction (pre-filtered, pre-sorted by History.jsx)
                      const finalizedCardClass =
                        'bg-gray-900 rounded-xl p-2 border-2 border-gray-700/80 relative';
                      const key = item.id;

                      if (item.type === 'alert') {
  const a = item.data;

  const ts = toMs(item.created_date) || toMs(a.created_date);
  const dateText = ts ? formatCardDate(ts) : '--';
  const waitUntilTs = getWaitUntilTs(a);
  const hasExpiry = typeof waitUntilTs === 'number' && waitUntilTs > (ts || 0);
  const waitUntilLabel = hasExpiry
    ? new Date(waitUntilTs).toLocaleString('es-ES', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit', hour12: false })
    : '--:--';
  const carLabel = `${a.car_brand || ''} ${a.car_model || ''}`.trim();
  const mode = reservationMoneyModeFromStatus(a.status);

  // Si fue cancelada porque el vendedor se fue ("Me voy") y había reserva, mostrar tarjeta completa ReservedByContent
  const isMeFui = a.status === 'cancelled' && a.cancel_reason === 'me_fui' && a.reserved_by_name;

  if (isMeFui) {
    const reservedByName = a.reserved_by_name || 'Usuario';
    const reservedByPhoto =
      a.reserved_by_photo ||
      avatarFor(reservedByName) ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(reservedByName)}&background=7c3aed&color=fff&size=128`;
    const rCarLabel = a.reserved_by_car || 'Sin datos';
    const rCarColor = a.reserved_by_car_color || 'gris';
    const rPlate = a.reserved_by_plate || '';
    const rCarFill = getCarFill(rCarColor);
    const rPhoneEnabled = Boolean(a.phone && a.allow_phone_calls !== false);
    const rChatUrl = createPageUrl(`Chat?alertId=${a.id}&userId=${a.reserved_by_email || a.reserved_by_id}`);
    return (
      <motion.div key={key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
        <div className="bg-gray-800/60 rounded-xl p-2 border border-gray-600/60 relative">
          {/* X para eliminar */}
          <button
            onClick={async () => { hideKey(key); await deleteAlertSafe(a.id); queryClient.invalidateQueries({ queryKey: ['myAlerts'] }); }}
            className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-red-500/20 border border-red-500/50 flex items-center justify-center text-red-400 hover:bg-red-500/30 transition-colors z-10"
          ><X className="w-4 h-4"/></button>

          {/* Header */}
          <div className="flex items-center justify-between mb-2 pr-9">
            <div className="bg-red-500/20 text-red-300 border border-red-500/30 font-bold text-xs rounded-md px-3 py-1">Finalizada</div>
            <div className="flex items-center gap-1">
              <div className="bg-black/40 border border-purple-500/30 rounded-full px-2 py-0.5 flex items-center gap-1 h-7">
                <Navigation className="w-3 h-3 text-purple-400"/>
                <span className="text-white font-bold text-xs">300m</span>
              </div>
              <div className="bg-gray-500/20 border border-gray-600/40 rounded-lg px-2 py-0.5 flex items-center gap-1 h-7">
                <TrendingUp className="w-4 h-4 text-gray-400"/>
                <span className="text-gray-400 font-bold text-sm">{formatPriceInt(a.price)}</span>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700/80 mb-2"/>

          {/* Foto + nombre + coche */}
          <div className="flex gap-2.5">
            <div className="w-[95px] h-[85px] rounded-lg overflow-hidden border-2 border-gray-600/40 bg-gray-900 flex-shrink-0">
              <img src={reservedByPhoto} alt={reservedByName} className="w-full h-full object-cover opacity-40 grayscale"/>
            </div>
            <div className="flex-1 h-[85px] flex flex-col">
              <p className="font-bold text-xl text-gray-300 leading-none opacity-70">{String(reservedByName).split(' ')[0]}</p>
              <p className="text-sm font-medium text-gray-400 leading-none opacity-70 flex-1 flex items-center truncate relative top-[6px]">{rCarLabel}</p>
              <div className="flex items-end gap-2 mt-1 min-h-[28px]">
                <div className="opacity-45 flex-shrink-0">
                  <div className="bg-white rounded-md flex items-center overflow-hidden border-2 border-gray-400 h-7">
                    <div className="bg-blue-600 h-full w-5 flex items-center justify-center"><span className="text-white text-[8px] font-bold">E</span></div>
                    <span className="px-1.5 text-black font-mono font-bold text-sm tracking-wider">{formatPlate(rPlate)}</span>
                  </div>
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="opacity-45 flex-shrink-0 relative top-[2px]">
                    <svg viewBox="0 0 48 24" className="w-16 h-10" fill="none">
                      <path d="M8 16 L10 10 L16 8 L32 8 L38 10 L42 14 L42 18 L8 18 Z" fill={rCarFill} stroke="white" strokeWidth="1.5"/>
                      <path d="M16 9 L18 12 L30 12 L32 9 Z" fill="rgba(255,255,255,0.3)" stroke="white" strokeWidth="0.5"/>
                      <circle cx="14" cy="18" r="4" fill="#333" stroke="white" strokeWidth="1"/><circle cx="14" cy="18" r="2" fill="#666"/>
                      <circle cx="36" cy="18" r="4" fill="#333" stroke="white" strokeWidth="1"/><circle cx="36" cy="18" r="2" fill="#666"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dirección y tiempo */}
          <div className="pt-1.5 border-t border-gray-700/80 mt-2 space-y-1.5 opacity-80">
            <div className="flex items-center gap-1.5 text-xs min-h-[20px]">
              <MapPin className="w-4 h-4 flex-shrink-0 text-gray-500"/>
              <span className="text-gray-300 leading-none line-clamp-1">{formatAddress(a.address)}</span>
            </div>
            {dateText && dateText !== '--' && (
              <div className="flex items-center gap-1.5 text-[11px] min-h-[20px]">
                <span className="leading-none text-gray-500">{dateText}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-[11px] min-h-[20px]">
              <Clock className="w-4 h-4 flex-shrink-0 text-gray-500"/>
              <span className="leading-none text-gray-400">Te ibas en {a.available_in_minutes} min · Debías esperar hasta las: <span className="font-bold" style={{fontSize:'14px'}}>{waitUntilLabel}</span></span>
            </div>
          </div>

          {/* Botones: chat y llamada encendidos, navegar desactivado */}
          <div className="mt-2 flex items-center gap-2">
            <Button size="icon" className="h-8 bg-green-500 hover:bg-green-600 text-white rounded-lg border-2 border-green-400" style={{width:'46px',flexShrink:0}}
              onClick={() => { window.location.href = rChatUrl; }}>
              <MessageCircle className="w-4 h-4"/>
            </Button>
            {rPhoneEnabled ? (
              <Button size="icon" className="h-8 bg-white hover:bg-gray-200 text-black rounded-lg border-2 border-gray-300" style={{width:'46px',flexShrink:0}}
                onClick={() => { window.location.href = `tel:${a.phone}`; }}>
                <Phone className="w-4 h-4"/>
              </Button>
            ) : (
              <Button size="icon" className="h-8 border-2 border-white/20 bg-white/10 text-white rounded-lg opacity-50 cursor-not-allowed" style={{width:'46px',flexShrink:0}} disabled><PhoneOff className="w-4 h-4"/></Button>
            )}
            <Button size="icon" className="h-8 rounded-lg bg-blue-600/40 text-blue-300 opacity-40 border-2 border-blue-400/30 cursor-not-allowed" style={{width:'46px',flexShrink:0}} disabled><Navigation className="w-4 h-4"/></Button>
            <div className="flex-1">
              <div className="w-full h-8 rounded-lg border-2 border-purple-500/30 bg-purple-600/10 flex items-center justify-center">
                <span className="font-mono font-extrabold text-sm text-gray-400/70">ME FUI</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

                        return (
                          <motion.div
                            key={key}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={finalizedCardClass}
                          >
                            <CardHeaderRow
                              left={
                                <Badge
                                  className={`bg-red-500/20 text-red-400 border border-red-500/30 ${badgePhotoWidth} ${labelNoClick}`}
                                >
                                  Finalizada
                                </Badge>
                              }
                              dateText={dateText}
                              dateClassName="text-gray-600"
                              right={
                                <div className="flex items-center gap-1">
                                  {mode === 'paid' ? (
                                    <MoneyChip mode="red" showDownIcon amountText={formatPriceInt(a.price)} />
                                  ) : (
                                    <MoneyChip mode="neutral" amountText={formatPriceInt(a.price)} />
                                  )}
                                  <button
                                    onClick={async () => {
                                      hideKey(key);
                                      await deleteAlertSafe(a.id);
                                      queryClient.invalidateQueries({ queryKey: ['myAlerts'] });
                                    }}
                                    className="w-7 h-7 rounded-lg bg-red-500/20 border border-red-500/50 flex items-center justify-center text-red-400 hover:bg-red-500/30 transition-colors"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              }
                            />

                            <div className="border-t border-gray-700/80 mb-2" />

                            {/* Tarjeta finalizada: misma estructura que activa */}
                            <div className="flex items-center gap-1.5 text-xs mb-2 min-h-[20px]">
                              <MapPin className="w-4 h-4 flex-shrink-0 text-gray-500" />
                              <span className="text-gray-300 leading-none line-clamp-1">{formatAddress(a.address) || 'Ubicación marcada'}</span>
                            </div>
                            {dateText !== '--' && (
                              <div className="text-xs text-gray-400 mt-1">
                                {dateText}
                              </div>
                            )}

                            <div className="flex items-center gap-1.5 text-xs overflow-hidden mb-2 min-h-[20px]" style={{ marginTop: '-1px' }}>
                              <Clock className="w-4 h-4 flex-shrink-0 text-gray-500" />
                              <span className="leading-none text-gray-400">
                                Te ibas en {a.available_in_minutes ?? '--'} min · Debías esperar hasta las:{' '}
                                <span className="font-bold" style={{ fontSize: '15px' }}>{waitUntilLabel}</span>
                              </span>
                            </div>

                            <CountdownButton text={statusLabelFrom(a.status, a)} dimmed={true} />
                          </motion.div>
                        );
                      }

                      const tx = item.data;
                      const isSeller = tx.seller_id === user?.id;

                      const buyerName = tx.buyer_name || 'Usuario';
                      const buyerPhoto = tx.buyer_photo_url || tx.buyerPhotoUrl || '';
                      const buyerCarLabel =
                        tx.buyer_car ||
                        tx.buyerCar ||
                        tx.buyer_car_label ||
                        tx.buyerCarLabel ||
                        (tx.buyer_car_brand
                          ? `${tx.buyer_car_brand || ''} ${tx.buyer_car_model || ''}`.trim()
                          : '');
                      const buyerPlate =
                        tx.buyer_plate ||
                        tx.buyerPlate ||
                        tx.buyer_car_plate ||
                        tx.buyerCarPlate ||
                        tx.car_plate ||
                        tx.carPlate ||
                        '';
                      const buyerColor =
                        tx.buyer_car_color || tx.buyerCarColor || tx.car_color || tx.carColor || '';

                      const ts = toMs(tx.created_date);
                      const dateText = ts ? formatCardDate(ts) : '--';

                      return (
                        <motion.div
                          key={key}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={finalizedCardClass}
                        >
                          <CardHeaderRow
                            left={
                              <Badge
                                className={`bg-red-500/20 text-red-400 border border-red-500/30 ${badgePhotoWidth} ${labelNoClick}`}
                              >
                                Finalizada
                              </Badge>
                            }
                            dateText={dateText}
                            dateClassName="text-gray-600"
                            right={
                              <div className="flex items-center gap-1">
                                <MoneyChip
                                  mode="green"
                                  showUpIcon
                                  amountText={formatPriceInt(tx.amount)}
                                />
                                <button
                                  onClick={() => hideKey(key)}
                                  className="w-7 h-7 rounded-lg bg-red-500/20 border border-red-500/50 flex items-center justify-center text-red-400 hover:bg-red-500/30 transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            }
                          />

                          <div className="border-t border-gray-700/80 mb-2" />

                          <div className="mb-1.5">
                            <MarcoContent
                              photoUrl={buyerPhoto}
                              name={buyerName}
                              carLabel={buyerCarLabel || 'Sin datos'}
                              plate={buyerPlate}
                              carColor={buyerColor}
                              address={tx.address}
                              timeLine={`Transacción completada · ${
                                ts ? format(new Date(ts), 'HH:mm', { locale: es }) : '--:--'
                              }`}
                              onChat={() =>
                                (window.location.href = createPageUrl(
                                  `Chat?alertId=${tx.alert_id}&userId=${tx.buyer_id}`
                                ))
                              }
                              statusText="COMPLETADA"
                              dimIcons={true}
                            />
                          </div>
                        </motion.div>
                      );
                  })}
                      </div>
                      )}

                  </TabsContent>
  );
}
