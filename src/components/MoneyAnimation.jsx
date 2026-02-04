import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function MoneyAnimation({ amount, onComplete }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 0, scale: 0.5 }}
          animate={{ 
            opacity: [0, 1, 1, 0],
            y: [-20, -60],
            scale: [0.5, 1.2, 1, 0.8]
          }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2, ease: 'easeOut' }}
          className="fixed top-20 right-6 z-[9999] pointer-events-none"
        >
          <div className="bg-green-500/90 backdrop-blur-sm border-2 border-green-400 rounded-full px-6 py-3 shadow-2xl">
            <span className="text-white font-black text-2xl">
              +{amount.toFixed(2)}€
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}