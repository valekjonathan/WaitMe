/**
 * Tarjeta del buyer: activa, finalizada alert, finalizada transaction.
 */

import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createPageUrl } from '@/utils';
import { CardHeaderRow, MoneyChip, MarcoContent } from '@/components/history/HistoryItem';
import HistoryBuyerActions from './HistoryBuyerActions';

export default function HistoryBuyerActiveCard({ alert, ctx, index, onCancel }) {
  const {
    nowTs,
    getCreatedTs,
    getWaitUntilTs,
    formatRemaining,
    hiddenKeys,
    autoFinalizedReservationsRef,
    formatCardDate,
    formatPriceInt,
    reservationMoneyModeFromStatus,
    badgePhotoWidth,
    labelNoClick,
    formatAddress,
  } = ctx;

  const key = `res-active-${alert.id}`;
  if (hiddenKeys?.has(key)) return null;

  const createdTs = getCreatedTs(alert) || nowTs;
  const waitUntilTs = getWaitUntilTs(alert);
  const hasExpiry = typeof waitUntilTs === 'number' && waitUntilTs > createdTs;
  const remainingMs = hasExpiry ? Math.max(0, waitUntilTs - nowTs) : null;
  const waitUntilLabel = hasExpiry
    ? new Date(waitUntilTs).toLocaleString('es-ES', {
        timeZone: 'Europe/Madrid',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
    : '--:--';

  const countdownText =
    remainingMs === null
      ? '--:--'
      : remainingMs > 0
        ? formatRemaining(remainingMs)
        : 'Reserva finalizada';

  const isMock = String(alert.id).startsWith('mock-');

  if (alert.status === 'reserved' && hasExpiry && remainingMs !== null && remainingMs <= 0) {
    if (!isMock) {
      if (!autoFinalizedReservationsRef?.current?.has(alert.id)) {
        autoFinalizedReservationsRef?.current?.add(alert.id);
      }
    }
    return null;
  }

  const carLabel = `${alert.brand || ''} ${alert.model || ''}`.trim();
  const phoneEnabled = Boolean(alert.phone && alert.allow_phone_calls !== false);
  const dateText = formatCardDate(createdTs);
  const moneyMode = reservationMoneyModeFromStatus('reserved');

  return (
    <motion.div
      key={key}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-gray-900 rounded-xl p-2 border-2 border-purple-500/50 relative"
    >
      <CardHeaderRow
        left={
          <Badge
            className={`bg-purple-500/20 text-purple-300 border border-purple-400/50 ${badgePhotoWidth} ${labelNoClick}`}
          >
            Expirada
          </Badge>
        }
        dateText={dateText}
        dateClassName="text-white"
        right={
          <div className="flex items-center gap-1">
            {moneyMode === 'paid' ? (
              <MoneyChip mode="red" showDownIcon amountText={formatPriceInt(alert.price)} />
            ) : (
              <MoneyChip mode="neutral" amountText={formatPriceInt(alert.price)} />
            )}
            <button
              onClick={() => onCancel(alert, key)}
              className="w-7 h-7 rounded-lg bg-red-500/20 border border-red-500/50 flex items-center justify-center text-red-400 hover:bg-red-500/30 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        }
      />

      <div className="border-t border-gray-700/80 mb-2" />

      <MarcoContent
        bright={true}
        photoUrl={alert.user_photo}
        name={alert.user_name}
        carLabel={carLabel || 'Sin datos'}
        plate={alert.plate}
        carColor={alert.color}
        address={alert.address}
        timeLine={
          <span className="text-white leading-5">
            Se va en {alert.available_in_minutes} min · Te espera hasta las{' '}
            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{waitUntilLabel}</span>
          </span>
        }
        onChat={() =>
          (window.location.href = createPageUrl(
            `Chat?alertId=${alert.id}&userId=${alert.user_email || alert.user_id}`
          ))
        }
        statusText={countdownText}
        statusEnabled={true}
        phoneEnabled={phoneEnabled}
        onCall={() => phoneEnabled && (window.location.href = `tel:${alert.phone}`)}
      />

      <HistoryBuyerActions address={alert.address} formatAddress={formatAddress} />
    </motion.div>
  );
}

export function HistoryBuyerFinalCard({ item, ctx, index, onDelete }) {
  const {
    nowTs,
    toMs,
    getWaitUntilTs,
    formatCardDate,
    formatPriceInt,
    reservationMoneyModeFromStatus,
    statusLabelFrom,
    badgePhotoWidth,
    labelNoClick,
  } = ctx;

  const key = item.id;
  if (ctx.hiddenKeys?.has(key)) return null;

  const finalizedCardClass = 'bg-gray-900 rounded-xl p-2 border-2 border-gray-700/80 relative';

  if (item.type === 'alert') {
    const a = item.data;
    const ts = toMs?.(a.created_date) || nowTs;
    const dateText = ts ? formatCardDate(ts) : '--';

    const waitUntilTs = getWaitUntilTs(a);
    const hasExpiry = typeof waitUntilTs === 'number' && waitUntilTs > ts;
    const waitUntilLabel = hasExpiry
      ? new Date(waitUntilTs).toLocaleString('es-ES', {
          timeZone: 'Europe/Madrid',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      : '--:--';

    const carLabel = `${a.brand || ''} ${a.model || ''}`.trim();
    const phoneEnabled = Boolean(a.phone && a.allow_phone_calls !== false);
    const mode = reservationMoneyModeFromStatus(a.status);

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
          dateClassName="text-white"
          right={
            <div className="flex items-center gap-1">
              {mode === 'paid' ? (
                <MoneyChip mode="red" showDownIcon amountText={formatPriceInt(a.price)} />
              ) : (
                <MoneyChip mode="neutral" amountText={formatPriceInt(a.price)} />
              )}
              <button
                onClick={() => onDelete(item, key)}
                className="w-7 h-7 rounded-lg bg-red-500/20 border border-red-500/50 flex items-center justify-center text-red-400 hover:bg-red-500/30 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          }
        />

        <div className="border-t border-gray-700/80 mb-2" />

        <MarcoContent
          photoUrl={a.user_photo}
          name={a.user_name}
          carLabel={carLabel || 'Sin datos'}
          plate={a.plate}
          carColor={a.color}
          address={a.address}
          timeLine={
            <span className="text-white leading-5">
              Se iba en {a.available_in_minutes ?? '--'} min · Te esperaba hasta las{' '}
              <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{waitUntilLabel}</span>
            </span>
          }
          onChat={() =>
            (window.location.href = createPageUrl(
              `Chat?alertId=${a.id}&userId=${a.user_email || a.user_id}`
            ))
          }
          statusText={statusLabelFrom(a.status)}
          phoneEnabled={phoneEnabled}
          onCall={() => phoneEnabled && (window.location.href = `tel:${a.phone}`)}
          statusEnabled={String(a.status || '').toLowerCase() === 'completed'}
          dimIcons={true}
        />
      </motion.div>
    );
  }

  const tx = item.data;
  const ts = toMs?.(tx.created_date);
  const dateText = ts ? formatCardDate(ts) : '--';

  const sellerName = tx.seller_name || 'Usuario';
  const sellerPhoto = tx.seller_photo_url || tx.sellerPhotoUrl || '';
  const sellerCarLabel =
    tx.seller_car || tx.sellerCar || `${tx.seller_brand || ''} ${tx.seller_model || ''}`.trim();
  const sellerPlate = tx.seller_plate || tx.sellerPlate || tx.plate || '';
  const sellerColor = tx.seller_color || tx.sellerColor || tx.color || '';
  const txPaid = String(tx.status || '').toLowerCase() === 'completed';

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
            {txPaid ? (
              <MoneyChip mode="red" showDownIcon amountText={formatPriceInt(tx.amount)} />
            ) : (
              <MoneyChip mode="neutral" amountText={formatPriceInt(tx.amount)} />
            )}
            <Button
              size="icon"
              className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-2 py-1 h-7 w-7 border-2 border-gray-500"
              onClick={() => onDelete(item, key)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        }
      />

      <div className="border-t border-gray-700/80 mb-2" />

      <MarcoContent
        photoUrl={sellerPhoto}
        name={sellerName}
        carLabel={sellerCarLabel || 'Sin datos'}
        plate={sellerPlate}
        carColor={sellerColor}
        address={tx.address}
        timeLine={`Transacción completada · ${
          ts
            ? new Date(ts).toLocaleString('es-ES', {
                timeZone: 'Europe/Madrid',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              })
            : '--:--'
        }`}
        onChat={() =>
          (window.location.href = createPageUrl(
            `Chat?alertId=${tx.alert_id}&userId=${tx.seller_id}`
          ))
        }
        statusText="COMPLETADA"
        statusEnabled={true}
        dimIcons={true}
      />
    </motion.div>
  );
}
