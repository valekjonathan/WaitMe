/**
 * Pantalla Chat — orquestador.
 */

import { useEffect, useRef, useState } from 'react';
import { useChatMessages } from '@/hooks/chat/useChatMessages';
import { useChatActions } from '@/hooks/chat/useChatActions';
import ChatHeader from '@/components/chat/ChatHeader';
import MessageList from '@/components/chat/MessageList';
import ChatInput from '@/components/chat/ChatInput';

export default function Chat() {
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const attachMenuRef = useRef(null);

  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  const data = useChatMessages(messagesEndRef);
  const formSetters = { setMessage, setAttachments, setShowAttachMenu };
  const actions = useChatActions(data, formSetters);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showAttachMenu && attachMenuRef.current && !attachMenuRef.current.contains(e.target)) {
        setShowAttachMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAttachMenu]);

  const handleSend = () => actions.handleSend(message, attachments);
  const handleFileUpload = (e, setAtt, setShow) => actions.handleFileUpload(e, setAtt, setShow);

  return (
    <div className="min-h-[100dvh] bg-black flex flex-col">
      <ChatHeader otherUser={data.otherUser} />

      {data.cardInfo && (
        <div className="fixed top-[112px] left-0 right-0 z-30 bg-black border-b border-gray-700 px-4 py-2 text-xs text-gray-300">
          <div className="flex items-center gap-3">
            <div className="flex-1 truncate">
              {data.cardInfo.car && (
                <span className="font-semibold text-white">{data.cardInfo.car}</span>
              )}
              {data.cardInfo.plate && (
                <span className="ml-2 text-gray-400">({data.cardInfo.plate})</span>
              )}
            </div>
            {Number.isFinite(data.cardInfo.price) && (
              <div className="text-purple-400 font-bold">{data.cardInfo.price}€</div>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto pt-[156px] pb-[160px] px-4">
        <MessageList messages={data.displayMessages} messagesEndRef={messagesEndRef} />
      </div>

      <ChatInput
        message={message}
        setMessage={setMessage}
        attachments={attachments}
        setAttachments={setAttachments}
        showAttachMenu={showAttachMenu}
        setShowAttachMenu={setShowAttachMenu}
        attachMenuRef={attachMenuRef}
        fileInputRef={fileInputRef}
        cameraInputRef={cameraInputRef}
        handleSend={handleSend}
        handleFileUpload={handleFileUpload}
      />
    </div>
  );
}
