/**
 * Transforms puros para Home — sin efectos ni estado.
 */
export function formatAddressLocal(road, number, city) {
  let streetFormatted = (road || '').trim();
  if (streetFormatted.toLowerCase().startsWith('calle ')) {
    streetFormatted = 'C/ ' + streetFormatted.slice(6);
  } else if (streetFormatted.toLowerCase().startsWith('avenida ')) {
    streetFormatted = 'Av. ' + streetFormatted.slice(8);
  }
  const parts = [streetFormatted, number, city].filter(Boolean);
  return parts.length ? parts.join(', ') : '';
}
