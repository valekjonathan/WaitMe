/**
 * Estado vacío para reservas activas y finalizadas.
 */

import { motion } from 'framer-motion';

export default function HistoryBuyerEmptyState({ text, className }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <p className="text-gray-500 font-semibold">{text}</p>
    </motion.div>
  );
}
