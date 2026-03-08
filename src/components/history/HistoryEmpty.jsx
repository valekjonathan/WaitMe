import { motion } from 'framer-motion';

/**
 * Reusable empty state for History views.
 * Same styling as in HistoryBuyerView / HistorySellerView.
 * @param {Object} props
 * @param {string} props.message - e.g. "No tienes ninguna reserva activa."
 * @param {'active'|'finalized'} [props.variant='active'] - active = purple border, finalized = gray border
 */
export default function HistoryEmpty({ message, variant = 'active' }) {
  const className =
    variant === 'finalized'
      ? 'bg-gray-900 rounded-xl p-2 border-2 border-gray-700/80 h-[160px] flex items-center justify-center'
      : 'bg-gray-900 rounded-xl p-2 border-2 border-purple-500/50 h-[160px] flex items-center justify-center';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <p className="text-gray-500 font-semibold">{message}</p>
    </motion.div>
  );
}
