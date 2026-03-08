/**
 * Cabecera de sección: Activas / Finalizadas.
 */

import { SectionTag } from '@/components/history/HistoryItem';

export default function HistorySellerHeader({ variant, text }) {
  return <SectionTag variant={variant} text={text} />;
}
