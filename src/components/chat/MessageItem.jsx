/**
 * Item de mensaje individual.
 */

import { format } from 'date-fns';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';

export function safeParseAttachments(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function MessageItem({ msg, showDate }) {
  const isMine = !!msg.mine;
  const atts = safeParseAttachments(msg.attachments);

  return (
    <div>
      {showDate && (
        <div className="flex justify-center my-4">
          <div className="bg-gray-800/80 rounded-full px-4 py-1 text-xs text-gray-400">
            {new Date(msg.created_date)
              .toLocaleString('es-ES', {
                timeZone: 'Europe/Madrid',
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              })
              .replace(' de ', ' ')
              .replace(',', ' -')}
          </div>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex gap-2 w-full ${isMine ? 'justify-end' : 'justify-start'}`}
      >
        {!isMine && (
          <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 border border-purple-500/30">
            <img
              src={msg.sender_photo || 'https://via.placeholder.com/32'}
              alt={msg.sender_name || 'Usuario'}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className={`flex flex-col gap-1 ${isMine ? 'items-end' : 'items-start'}`}>
          <div
            className={`rounded-2xl px-4 py-2 ${
              isMine
                ? 'bg-purple-600 text-white rounded-br-sm max-w-[280px]'
                : 'bg-gray-800 text-white rounded-bl-sm max-w-[280px]'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className={`text-[10px] ${isMine ? 'text-purple-200' : 'text-gray-400'}`}>
                {format(new Date(msg.created_date), 'HH:mm')}
              </span>
              {isMine && (
                <div className="relative w-4 h-3">
                  <Check
                    className="w-3 h-3 text-blue-400 absolute top-0 left-0"
                    strokeWidth={2.5}
                  />
                  <Check
                    className="w-3 h-3 text-blue-400 absolute top-0 left-1.5"
                    strokeWidth={2.5}
                  />
                </div>
              )}
            </div>

            <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{msg.message}</p>

            {atts.map((att, i) => (
              <div key={i} className="mt-2">
                {att.type?.includes('image') ? (
                  <img src={att.url} alt="Adjunto" className="rounded-lg max-w-[200px]" />
                ) : (
                  <a
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs underline"
                  >
                    📎 {att.name}
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>

        {isMine && (
          <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 border border-purple-500/30">
            <div className="w-full h-full bg-purple-700 flex items-center justify-center text-lg">
              👤
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
