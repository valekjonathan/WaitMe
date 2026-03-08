import HistorySellerView from '@/pages/HistorySellerView';
import HistoryBuyerView from '@/pages/HistoryBuyerView';

/**
 * Wrapper that renders HistorySellerView + HistoryBuyerView inside Tabs,
 * receiving sellerContext and buyerContext as props.
 */
export default function HistoryList({ sellerContext, buyerContext }) {
  return (
    <>
      <div className="h-[59px]" />

      <HistorySellerView sellerContext={sellerContext} />

      <HistoryBuyerView {...buyerContext} />
    </>
  );
}
