import React, { useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { FileText } from 'lucide-react';

export default function ChatMessages({ messages, user }) {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <main className="flex-1 pt-24 pb-32 px-4 overflow-y-auto">
      <AnimatePresence>
        {messages.map((msg, index) => {
          const isMine = msg.sender_id === user?.id;
          const isSystem = msg.message_type === 'system';
          const showTimestamp = index === 0 || 
            (new Date(msg.created_date).getTime() - new Date(messages[index - 1].created_date).getTime() > 300000);

          return (
            <div key={msg.id}>
              {showTimestamp && (
                <div className="text-center text-xs text-gray-500 my-4">
                  {format(new Date(msg.created_date), "d 'de' MMMM, HH:mm", { locale: es })}
                </div>
              )}

              {isSystem ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex justify-center my-4"
                >
                  <div className="bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-2 text-sm text-gray-400 max-w-xs text-center">
                    {msg.message}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, x: isMine ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex mb-3 ${isMine ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[75%] ${isMine ? 'order-2' : 'order-1'}`}>
                    <div
                      className={`rounded-2xl px-4 py-2 ${
                        isMine
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-800 text-white'
                      }`}
                    >
                      <p className="text-sm break-words">{msg.message}</p>
                      {msg.attachments && JSON.parse(msg.attachments).map((att, idx) => (
                        <a key={idx} href={att.url} target="_blank" rel="noopener noreferrer" className="block mt-2 text-xs underline hover:opacity-80">
                          {att.type.includes('image') ? (
                            <img src={att.url} alt={att.name} className="max-w-[150px] rounded" />
                          ) : (
                            <div className="flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              {att.name}
                            </div>
                          )}
                        </a>
                      ))}
                    </div>
                    <div className={`flex items-center gap-1 mt-1 text-xs ${isMine ? 'justify-end text-purple-400' : 'text-gray-500 justify-start'}`}>
                      <span>{format(new Date(msg.created_date), 'HH:mm')}</span>
                      {isMine && (
                        <span className="font-bold">{msg.read ? '✓✓' : '✓'}</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          );
        })}
      </AnimatePresence>
      <div ref={messagesEndRef} />
    </main>
  );
}