/**
 * Vista seller del historial. Orquestador ligero.
 */

import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { noScrollBar } from '@/hooks/history/buildHistoryContexts';
import { useHistorySellerData } from '@/hooks/historySeller/useHistorySellerData';
import { useHistorySellerActions } from '@/hooks/historySeller/useHistorySellerActions';
import HistorySellerHeader from '@/components/historySeller/HistorySellerHeader';
import HistorySellerCard, {
  HistorySellerFinalCard,
} from '@/components/historySeller/HistorySellerCard';
import HistorySellerEmptyState from '@/components/historySeller/HistorySellerEmptyState';

function HistorySellerView({ sellerContext = {} }) {
  const data = useHistorySellerData(sellerContext);
  const actions = useHistorySellerActions(sellerContext);

  return (
    <TabsContent value="alerts" className={`space-y-3 pt-1 pb-6 ${noScrollBar}`}>
      <HistorySellerHeader variant="green" text="Activas" />

      {data.mergedItems.map((entry) => (
        <HistorySellerCard
          key={
            entry.__type === 'thinking' ? `thinking-${entry.item?.id}` : `active-${entry.item?.id}`
          }
          entry={entry}
          ctx={sellerContext}
          actions={actions}
          index={entry.index}
        />
      ))}

      {data.isEmptyActivas && (
        <HistorySellerEmptyState
          text="No tienes ninguna alerta activa."
          className="bg-gray-900 rounded-xl p-2 border-2 border-purple-500/50 h-[160px] flex items-center justify-center"
        />
      )}

      <div className="pt-2">
        <HistorySellerHeader variant="red" text="Finalizadas" />
      </div>

      {data.isEmptyFinalizadas ? (
        <HistorySellerEmptyState
          text="No tienes alertas finalizadas"
          className="bg-gray-900 rounded-xl p-2 border-2 border-gray-700/80 h-[160px] flex items-center justify-center"
        />
      ) : (
        <div className="space-y-[20px]">
          {data.finalItems.map((item, index) => (
            <HistorySellerFinalCard key={item.id} item={item} ctx={sellerContext} index={index} />
          ))}
        </div>
      )}
    </TabsContent>
  );
}

export default React.memo(HistorySellerView);
