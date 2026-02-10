import { createPageUrl } from '@/utils';

export function openChat(navigate, {
  demo = true,
  conversationId,
  name,
  photo,
  carLabel,
  plate,
  address,
  price,
  role
}) {
  const qs = new URLSearchParams();

  if (demo) qs.set('demo', 'true');
  if (conversationId) qs.set('conversationId', conversationId);
  if (name) qs.set('otherName', name);
  if (photo) qs.set('otherPhoto', photo);
  if (carLabel) qs.set('carLabel', carLabel);
  if (plate) qs.set('plate', plate);
  if (address) qs.set('address', address);
  if (price != null) qs.set('price', String(price));
  if (role) qs.set('role', role);

  navigate(createPageUrl('Chat') + `?${qs.toString()}`);
}