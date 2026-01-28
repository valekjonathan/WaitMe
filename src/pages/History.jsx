import React, { useState, useEffect, useRef, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Clock,
  MapPin,
  TrendingUp,
  TrendingDown,
  Loader,
  X,
  MessageCircle,
  PhoneOff,
  Phone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import BottomNav from '@/components/BottomNav';
import Header from '@/components/Header';
import UserCard from '@/components/cards/UserCard';
import SellerLocationTracker from '@/components/SellerLocationTracker';
import { useAuth } from '@/components/AuthContext';

export default function History() {
  const { user } = useAuth();
  const [hiddenKeys, setHiddenKeys] = useState(new Set());
  const queryClient = useQueryClient();

  const noScrollBar =
    '[&>div::-webkit-scrollbar]:w-[0px] [&>div::-webkit-scrollbar-thumb]:rounded-lg [&>div::-webkit-scrollbar-thumb]:bg-gray-800 [&>div::-webkit-scrollbar]:bg-transparent';

  // ====== Queries ======
  const { data: myAlerts = [], isLoading: loadingAlerts, refetch } = useQuery({
    queryKey: ['myAlerts'],
    queryFn: () => base44.entities.ParkingAlert.filter({ user_id: user?.id }),
    enabled: !!user?.id,
    staleTime: 0,
    refetchInterval: false
  });

  useEffect(() => {
    refetch();
  }, [user?.id, refetch]);

  const { data: transactions = [], isLoading: loadingTransactions } = useQuery({
    queryKey: ['myTransactions', user?.id],
    queryFn: async () => {
      const [asSeller, asBuyer] = await Promise.all([
        base44.entities.Transaction.filter({ seller_id: user?.id }),
        base44.entities.Transaction.filter({ buyer_id: user?.id })
      ]);
      return [...asSeller, ...asBuyer];
    },
    enabled: !!user?.id,
    staleTime: 5000,
    refetchInterval: false
  });

  // ====== Utils ======
  const toMs = (v) => {
    if (v == null) return null;
    if (v instanceof Date) return v.getTime();
    if (typeof v === 'number') return v;
    try {
      return new Date(v).getTime();
    } catch {
      return null;
    }
  };

  const getCreatedTs = (alert) => {
    const candidates = [
      alert?.created_date,
      alert?.createdDate,
      alert?.created_at,
      alert?.createdAt,
      alert?.created
    ];
    for (const v of candidates) {
      if (v) {
        const ms = toMs(v);
        if (ms) return ms;
      }
    }
    return null;
  };
  const getWaitUntilTs = (alert) => {
    const candidates = [
      alert?.expires_at,
      alert?.expiresAt,
      alert?.due_date,
      alert?.dueDate
    ];
    for (const v of candidates) {
      if (v) {
        const ms = toMs(v);
        if (ms) return ms;
      }
    }
    return null;
  };

  // ====== Derived data ======
  const myActiveAlerts = useMemo(() => {
    const dbAlerts = myAlerts.filter((a) => {
      if (a.user_id !== user?.id) return false;
      if (a.status !== 'active' && a.status !== 'reserved') return false;
      return true;
    });
    return [...dbAlerts];
  }, [myAlerts, user?.id]);

  const myFinalizedAlerts = useMemo(() => {
    return myAlerts.filter((a) => {
      if (a.user_id !== user?.id) return false;
      // SOLO incluir si el status indica finalizada
      if (a.status === 'expired' || a.status === 'cancelled' || a.status === 'completed') {
        return true;
      }
      return false;
    });
  }, [myAlerts, user?.id]);

  const myFinalizedAlertsObjs = myFinalizedAlerts.map((a) => ({
    type: 'alert',
    id: `final-alert-${a.id}`,
    created_date: a.created_date,
    data: a
  }));
  const myFinalizedTransactionsObjs = transactions
    .filter((t) => t.seller_id === user?.id || t.buyer_id === user?.id)
    .filter((t) => t.status === 'expired' || t.status === 'cancelled' || t.status === 'completed')
    .map((t) => ({
      type: 'transaction',
      id: `final-tx-${t.id}`,
      created_date: t.created_date,
      data: t
    }));

  const myFinalizedAll = [...myFinalizedAlertsObjs, ...myFinalizedTransactionsObjs].sort(
    (a, b) => (toMs(b.created_date) || 0) - (toMs(a.created_date) || 0)
  );

  const myReservationsReal = transactions.filter(
    (t) => (t.seller_id === user?.id || t.buyer_id === user?.id) && t.status === 'active'
  );
  const nowTs = Date.now();
  const getCardKey = (item, index) => {
    // ensure unique keys for reserved final vs active, etc.
    return item.type === 'alert'
      ? `final-alert-${item.data.id}`
      : item.type === 'transaction'
      ? `final-tx-${item.data.id}`
      : `res-${item.id}`;
  };

  // ====== Countdown formatting ======
  const formatRemaining = (ms) => {
    if (ms == null) return '--:--';
    if (ms < 0) {
      return 'EXPIRADA';
    }
    const sec = Math.floor(ms / 1000);
    const ss = String(sec % 60).padStart(2, '0');
    const mm = String(Math.floor(sec / 60) % 60).padStart(2, '0');
    const hh = String(Math.floor(sec / 3600)).padStart(2, '0');
    if (hh !== '00') {
      return `${hh}:${mm}:${ss}`;
    }
    return `${mm}:${ss}`;
  };

  const formatCardDate = (ts) => {
    if (!ts) return '--';
    const date = new Date(ts);
    return format(date, 'MMM d, yyyy', { locale: es });
  };

  const hideKey = (key) => {
    setHiddenKeys((prev) => {
      const newSet = new Set(prev);
      newSet.add(key);
      return newSet;
    });
  };

  // ====== JSX ======
  return (
    <>
      <Header title="Alertas" showBackButton={true} backTo="Home" />
      <main className="pt-[56px] pb-20 px-4">
        <Tabs defaultValue="alerts" className="w-full">
          {/* FIX: sin borde negro debajo */}
          <div className="sticky top-[56px] z-40 bg-black pt-4 pb-1">
            <TabsList className="w-full bg-gray-900 border-0 shadow-none ring-0">
              <TabsTrigger value="alerts" className="flex-1 data-[state=active]:bg-purple-600">
                Tus alertas
              </TabsTrigger>
              <TabsTrigger value="reservations" className="flex-1 data-[state=active]:bg-purple-600">
                Tus reservas
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ===================== TUS ALERTAS ===================== */}
          {/* FIX: más aire abajo para que la última tarjeta se vea entera */}
          <TabsContent
            value="alerts"
            className={`space-y-1.5 pb-24 max-h-[calc(100vh-126px)] overflow-y-auto pr-0 ${noScrollBar}`}
          >
            {loadingAlerts ? (
              <div className="text-center py-12 text-gray-500">
                <Loader className="w-8 h-8 animate-spin mx-auto mb-2" />
                Cargando...
              </div>
            ) : (
              <>
                <SectionTag variant="green" text="Activas" />

                {myActiveAlerts.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-900 rounded-xl p-2 border-2 border-gray-700/80 h-[160px] flex items-center justify-center"
                  >
                    <p className="text-gray-500 font-semibold">No tienes ninguna alerta activa.</p>
                  </motion.div>
                ) : (
                  <div className="space-y-[20px]">
                    {myActiveAlerts
                      .sort((a, b) => (toMs(b.created_date) || 0) - (toMs(a.created_date) || 0))
                      .map((alert, index) => {
                        const createdTs = getCreatedTs(alert);
                        const waitUntilTs = getWaitUntilTs(alert);
                        if (!createdTs || !waitUntilTs) {
                          console.warn('Alerta sin timestamps válidos:', alert.id);
                          return null;
                        }
                        const remainingMs = Math.max(0, waitUntilTs - Date.now());
                        const countdownText = remainingMs > 0 ? formatRemaining(remainingMs) : 'EXPIRADA';
                        const cardKey = `active-${alert.id}`;

                        return (
                          <motion.div
                            key={cardKey}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-gray-900 rounded-xl p-2 border-2 border-gray-700/80 relative"
                          >
                            {alert.status === 'reserved' ? (
                              <>
                                <CardHeaderRow
                                  left={
                                    <Badge
                                      className={`bg-purple-500/20 text-purple-200 text-center ${
                                        'w-16'
                                      } ${'rounded-sm'}`}
                                    >
                                      Reservada
                                    </Badge>
                                  }
                                  dateText={formatCardDate(createdTs)}
                                  dateClassName="text-white"
                                  right={
                                    <div className="flex items-center gap-1">
                                      <Button
                                        size="icon"
                                        className="bg-gray-500 text-white rounded-lg px-2 py-1 h-7 w-7"
                                        onClick={() => {
                                          hideKey(cardKey);
                                        }}
                                      >
                                        <X className="w-4 h-4" strokeWidth={3} />
                                      </Button>
                                    </div>
                                  }
                                />
                                <div className="mt-2">
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4 flex-shrink-0 mt-0.5 text-purple-400" />
                                    <span className="text-gray-500 leading-5">
                                      Te vas en {alert.available_in_minutes} min
                                    </span>
                                  </div>
                                  <div className="mt-2">
                                    <CountdownButton text={countdownText} dimmed={countdownText === 'EXPIRADA'} />
                                  </div>
                                </div>
                              </>
                            ) : (
                              <>
                                <CardHeaderRow
                                  left={
                                    <Badge
                                      className={`bg-green-500/25 text-green-200 text-center ${
                                        'w-16'
                                      } ${'rounded-sm'}`}
                                    >
                                      Activa
                                    </Badge>
                                  }
                                  dateText={formatCardDate(createdTs)}
                                  dateClassName="text-white"
                                  right={
                                    <div className="flex items-center gap-1">
                                      <Button
                                        size="icon"
                                        className="bg-gray-500 text-white rounded-lg px-2 py-1 h-7 w-7"
                                        onClick={() => {
                                          hideKey(cardKey);
                                          cancelAlertMutation.mutate(alert.id);
                                        }}
                                        disabled={cancelAlertMutation.isPending}
                                      >
                                        <X className="w-4 h-4" strokeWidth={3} />
                                      </Button>
                                    </div>
                                  }
                                />
                                <div className="mt-2">
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4 flex-shrink-0 mt-0.5 text-purple-400" />
                                    <span className="text-gray-500 leading-5">
                                      Te vas en {alert.available_in_minutes} min
                                    </span>
                                  </div>
                                  <div className="mt-2">
                                    <CountdownButton text={countdownText} dimmed={countdownText === 'EXPIRADA'} />
                                  </div>
                                </div>
                              </>
                            )}
                          </motion.div>
                        );
                      })}
                  </div>
                )}

                <SectionTag variant="red" text="Finalizadas" />
                {myFinalizedAll.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    <p>No tienes alertas finalizadas</p>
                  </div>
                ) : (
                  <div className="space-y-[20px]">
                    {myFinalizedAll.map((item, index) => {
                      const key = getCardKey(item, index);
                      if (hiddenKeys.has(key)) return null;
                      if (item.type === 'alert') {
                        const a = item.data;
                        const ts = toMs(a.created_date);
                        const dateText = ts ? formatCardDate(ts) : '--';
                        const remainingMs = Math.max(0, getWaitUntilTs(a) - Date.now());
                        const countdownText = remainingMs > 0 ? formatRemaining(remainingMs) : 'EXPIRADA';
                        return (
                          <motion.div
                            key={key}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-gray-900 rounded-xl p-2 border-2 border-gray-700/80 relative"
                          >
                            <CardHeaderRow
                              left={
                                <Badge
                                  className={`bg-red-500/20 text-red-200 text-center ${
                                    'w-16'
                                  } ${'rounded-sm'}`}
                                >
                                  Cerrada
                                </Badge>
                              }
                              dateText={dateText}
                              dateClassName="text-white"
                              right={
                                <div className="flex items-center gap-1">
                                  <Button
                                    size="icon"
                                    className="bg-gray-500 text-white rounded-lg px-2 py-1 h-7 w-7"
                                    onClick={() => {
                                      hideKey(key);
                                    }}
                                  >
                                    <X className="w-4 h-4" strokeWidth={3} />
                                  </Button>
                                </div>
                              }
                            />
                            <div className="mt-2">
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4 flex-shrink-0 mt-0.5 text-purple-400" />
                                <span className="text-gray-500 leading-5">
                                  Te fuiste hace {a.available_in_minutes} min
                                </span>
                              </div>
                              <div className="mt-2">
                                <CountdownButton text={countdownText} dimmed={countdownText === 'EXPIRADA'} />
                              </div>
                            </div>
                          </motion.div>
                        );
                      }
                      // (Si item.type === 'transaction') -> no cambia la tarjeta
                      return (
                        <motion.div
                          key={key}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="bg-gray-900 rounded-xl p-2 border-2 border-gray-700/80 relative"
                        >
                          <CardHeaderRow
                            left={
                              <Badge
                                className={`bg-red-500/20 text-red-200 text-center ${
                                  'w-16'
                                } ${'rounded-sm'}`}
                              >
                                Reserva
                              </Badge>
                            }
                            dateText={formatCardDate(toMs(item.data.created_date))}
                            dateClassName="text-white"
                            right={
                              <div className="flex items-center gap-1">
                                <Button
                                  size="icon"
                                  className="bg-gray-500 text-white rounded-lg px-2 py-1 h-7 w-7"
                                  onClick={() => {
                                    hideKey(key);
                                  }}
                                >
                                  <X className="w-4 h-4" strokeWidth={3} />
                                </Button>
                              </div>
                            }
                          />
                          <div className="mt-2">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4 flex-shrink-0 mt-0.5 text-purple-400" />
                              <span className="text-gray-500 leading-5">
                                Reserva finalizada
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* ===================== TUS RESERVAS ===================== */}
          {/* FIX: más aire abajo para que la última tarjeta se vea entera */}
          <TabsContent
            value="reservations"
            className={`space-y-1.5 pb-24 max-h-[calc(100vh-126px)] overflow-y-auto pr-0 ${noScrollBar}`}
          >
            {loadingTransactions ? (
              <div className="text-center py-12 text-gray-500">
                <Loader className="w-8 h-8 animate-spin mx-auto mb-2" />
                Cargando...
              </div>
            ) : (
              <>
                <SectionTag variant="green" text="Activas" />
                {myReservationsReal.length === 0 ? (
                  <div className="bg-gray-900 rounded-xl p-2 border-2 border-gray-700/80">
                    <div className="h-[110px] flex items-center justify-center">
                      <p className="text-gray-500 font-semibold">No tienes reservas</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-[20px]">
                    {myReservationsReal
                      .sort((a, b) => (toMs(b.created_date) || 0) - (toMs(a.created_date) || 0))
                      .map((alert, index) => {
                        const cardKey = `res-${alert.id}`;
                        if (hiddenKeys.has(cardKey)) return null;
                        const createdTs = getCreatedTs(alert);
                        const waitUntilTs = getWaitUntilTs(alert);
                        const remainingMs = Math.max(0, waitUntilTs - nowTs);
                        const countdownText = remainingMs > 0 ? formatRemaining(remainingMs) : 'Reserva finalizada';
                        return (
                          <motion.div
                            key={cardKey}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-gray-900 rounded-xl p-2 border-2 border-gray-700/80 relative"
                          >
                            <CardHeaderRow
                              left={
                                <Badge
                                  className={`bg-green-500/25 text-green-200 text-center ${
                                    'w-16'
                                  } ${'rounded-sm'}`}
                                >
                                  Activa
                                </Badge>
                              }
                              dateText={formatCardDate(createdTs || nowTs)}
                              dateClassName="text-white"
                              right={
                                <div className="flex items-center gap-1">
                                  <Button
                                    size="icon"
                                    className="bg-gray-500 text-white rounded-lg px-2 py-1 h-7 w-7"
                                    onClick={() => {
                                      hideKey(cardKey);
                                    }}
                                  >
                                    <X className="w-4 h-4" strokeWidth={3} />
                                  </Button>
                                </div>
                              }
                            />
                            <div className="mt-2">
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4 flex-shrink-0 mt-0.5 text-purple-400" />
                                <span className="text-gray-500 leading-5">
                                  Te vas en {alert.available_in_minutes} min
                                </span>
                              </div>
                              <div className="mt-2">
                                <CountdownButton text={countdownText} dimmed={countdownText === 'Reserva finalizada'} />
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                  </div>
                )}
                <SectionTag variant="red" text="Finalizadas" />
                {transactions.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    <p>No tienes reservas finalizadas</p>
                  </div>
                ) : (
                  <div className="space-y-[20px]">
                    {[...transactions]
                      .filter((t) => t.seller_id === user?.id || t.buyer_id === user?.id)
                      .sort((a, b) => (toMs(b.created_date) || 0) - (toMs(a.created_date) || 0))
                      .map((t, index) => {
                        const key = `final-tx-${t.id}`;
                        if (hiddenKeys.has(key)) return null;
                        const ts = toMs(t.created_date);
                        const dateText = ts ? formatCardDate(ts) : '--';
                        return (
                          <motion.div
                            key={key}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-gray-900 rounded-xl p-2 border-2 border-gray-700/80 relative"
                          >
                            <CardHeaderRow
                              left={
                                <Badge
                                  className={`bg-red-500/20 text-red-200 text-center ${
                                    'w-16'
                                  } ${'rounded-sm'}`}
                                >
                                  Cerrada
                                </Badge>
                              }
                              dateText={dateText}
                              dateClassName="text-white"
                              right={
                                <div className="flex items-center gap-1">
                                  <Button
                                    size="icon"
                                    className="bg-gray-500 text-white rounded-lg px-2 py-1 h-7 w-7"
                                    onClick={() => {
                                      hideKey(key);
                                    }}
                                  >
                                    <X className="w-4 h-4" strokeWidth={3} />
                                  </Button>
                                </div>
                              }
                            />
                            <div className="mt-2">
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4 flex-shrink-0 mt-0.5 text-purple-400" />
                                <span className="text-gray-500 leading-5">
                                  Reserva finalizada
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </main>
      <BottomNav />
    </>
  );
}

const SectionTag = ({ variant, text }) => (
  <div
    className={`text-${variant === 'green' ? 'emerald' : 'rose'}-300 border-${variant === 'green' ? 'emerald' : 'rose'}-500 border-2 rounded-full inline-block px-3 py-1 font-semibold text-sm`}
  >
    {text}
  </div>
);

const CardHeaderRow = ({ left, dateText, dateClassName, right }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center space-x-2">{left}</div>
    <div className={`text-xs leading-5 ${dateClassName || 'text-gray-400'}`}>{dateText}</div>
    <div>{right}</div>
  </div>
);

const CountdownButton = ({ text, dimmed = false }) => (
  <div
    className={[
      'w-full h-9 rounded-lg border-2 flex items-center justify-center px-3',
      dimmed ? 'border-gray-600 bg-gray-800' : 'border-green-400 bg-black'
    ].join(' ')}
  >
    <span className={dimmed ? 'text-gray-500' : 'text-green-400 font-semibold'}>{text}</span>
  </div>
);