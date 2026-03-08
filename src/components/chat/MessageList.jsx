/**
 * Lista de mensajes con scroll automático.
 */

import MessageItem from './MessageItem';

export default function MessageList({ messages, messagesEndRef }) {
  return (
    <div className="max-w-3xl mx-auto space-y-4 py-4">
      {messages.map((msg, idx) => {
        const showDate =
          idx === 0 ||
          new Date(msg.created_date).getTime() -
            new Date(messages[idx - 1].created_date).getTime() >
            300000;

        return <MessageItem key={msg.id} msg={msg} showDate={showDate} />;
      })}

      <div ref={messagesEndRef} />
    </div>
  );
}
