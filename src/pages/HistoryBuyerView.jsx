/**
 * Vista buyer del historial. Orquestador ligero.
 */

import { TabsContent } from '@/components/ui/tabs';
import { noScrollBar } from '@/hooks/history/buildHistoryContexts';
import { useHistoryBuyerData } from '@/hooks/historyBuyer/useHistoryBuyerData';
import { useHistoryBuyerActions } from '@/hooks/historyBuyer/useHistoryBuyerActions';
import HistoryBuyerHeader from '@/components/historyBuyer/HistoryBuyerHeader';
import HistoryBuyerCard, {
  HistoryBuyerFinalCard,
} from '@/components/historyBuyer/HistoryBuyerCard';
import HistoryBuyerEmptyState from '@/components/historyBuyer/HistoryBuyerEmptyState';

export default function HistoryBuyerView({ buyerContext = {} }) {
  const data = useHistoryBuyerData(buyerContext);
  const actions = useHistoryBuyerActions(buyerContext);

  return (
    <TabsContent value="reservations" className={`space-y-3 pt-1 pb-6 ${noScrollBar}`}>
      <HistoryBuyerHeader variant="green" text="Activas" />

      {data.isEmptyActivas ? (
        <HistoryBuyerEmptyState
          text="No tienes ninguna reserva activa."
          className="bg-gray-900 rounded-xl p-2 border-2 border-purple-500/50 h-[160px] flex items-center justify-center"
        />
      ) : (
        <div className="space-y-[20px]">
          {data.reservationsActiveAll.map((alert, index) => (
            <HistoryBuyerCard
              key={`res-active-${alert.id}`}
              alert={alert}
              ctx={buyerContext}
              index={index}
              onCancel={actions.cancelReservation}
            />
          ))}
        </div>
      )}

      <div className="pt-2">
        <HistoryBuyerHeader variant="red" text="Finalizadas" />
      </div>

      {data.isEmptyFinalizadas ? (
        <HistoryBuyerEmptyState
          text="No tienes ninguna reserva finalizada."
          className="bg-gray-900 rounded-xl p-2 border-2 border-gray-700/80 h-[160px] flex items-center justify-center"
        />
      ) : (
        <div className="space-y-[20px]">
          {data.visibleFinalItems.map((item, index) => (
            <HistoryBuyerFinalCard
              key={item.id}
              item={item}
              ctx={buyerContext}
              index={index}
              onDelete={actions.deleteFinalized}
            />
          ))}
        </div>
      )}
    </TabsContent>
  );
}
