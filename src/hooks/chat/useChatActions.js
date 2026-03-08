/**
 * Acciones del chat: envío, adjuntos, auto-respuesta demo.
 * @module hooks/chat/useChatActions
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as chat from '@/data/chat';
import * as uploads from '@/data/uploads';
import { sendDemoMessage } from '@/components/DemoFlowManager';

export function useChatActions(data, formSetters) {
  const {
    user,
    conversationId,
    isDemo,
    demoConversationId,
    demoFirstMsgParam,
    otherNameParam,
    otherPhotoParam,
    setLocalDemoMessages,
    queryClient,
  } = data;

  const { setMessage, setAttachments, setShowAttachMenu } = formSetters || {};

  const autoRespond = (convId, _userMessage) => {
    const responses = {
      mock_reservaste_1: [
        'Perfecto, ya voy de camino 🚗',
        '¿A qué distancia estás?',
        'Llego en 5 minutos',
        'Gracias por esperarme 😊',
        '¿Sigues ahí?',
      ],
      mock_te_reservo_1: [
        'Estoy esperando aquí',
        '¿Cuánto tardas?',
        'Veo que te acercas en el mapa',
        'Perfecto, te espero',
        'No hay problema 👍',
      ],
      mock_reservaste_2: [
        'Ok, voy llegando',
        'Genial, aguanto',
        '¿Cuánto falta?',
        'Ya casi estoy',
        'Muchas gracias',
      ],
      mock_te_reservo_2: [
        'Estoy cerca',
        'Llego en 2 minutos',
        '¿Sigues ahí?',
        'Ya te veo',
        'Gracias por la paciencia',
      ],
    };

    const convResponses = responses[convId];
    if (!convResponses) return;

    setTimeout(
      () => {
        const randomResponse = convResponses[Math.floor(Math.random() * convResponses.length)];
        sendDemoMessage(convId, randomResponse, [], false);
      },
      1500 + Math.random() * 2000
    );
  };

  const sendMutation = useMutation({
    mutationFn: async ({ text, attachments }) => {
      const clean = String(text || '').trim();
      if (!clean && (attachments || []).length === 0) return;

      if (isDemo) {
        if (demoFirstMsgParam) {
          const myMsg = {
            id: `local_${Date.now()}`,
            mine: true,
            sender_name: 'Tú',
            sender_photo: null,
            message: clean,
            created_date: new Date().toISOString(),
            kind: 'text',
          };
          setLocalDemoMessages((prev) => [...prev, myMsg]);
          const otherName = otherNameParam ? decodeURIComponent(otherNameParam) : 'Usuario';
          const otherPhoto = otherPhotoParam ? decodeURIComponent(otherPhotoParam) : null;
          setTimeout(
            () => {
              const responses = [
                'Vale, ya voy de camino 🚗',
                '¿A qué distancia estás?',
                'Perfecto, te espero',
                'Ok!',
                'Bien, salgo en un momento 👍',
              ];
              const reply = responses[Math.floor(Math.random() * responses.length)];
              setLocalDemoMessages((prev) => [
                ...prev,
                {
                  id: `local_reply_${Date.now()}`,
                  mine: false,
                  sender_name: otherName,
                  sender_photo: otherPhoto,
                  message: reply,
                  created_date: new Date().toISOString(),
                  kind: 'text',
                },
              ]);
            },
            1500 + Math.random() * 2000
          );
          return;
        }
        if (demoConversationId) {
          sendDemoMessage(demoConversationId, clean, attachments || []);
          autoRespond(demoConversationId, clean);
        }
        return;
      }

      const { error } = await chat.sendMessage({
        conversationId,
        senderId: user?.id,
        body: clean,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setMessage?.('');
      setAttachments?.([]);
      setShowAttachMenu?.(false);
      if (!isDemo) {
        queryClient.invalidateQueries({ queryKey: ['chatMessages', conversationId, user?.id] });
        queryClient.invalidateQueries({ queryKey: ['conversations', user?.id] });
      }
    },
  });

  const handleSend = (message, attachments) => {
    if (!String(message || '').trim() && (attachments || []).length === 0) return;
    sendMutation.mutate({ text: message, attachments });
  };

  const handleFileUpload = async (e, setAttachments, setShowAttachMenu) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        alert('Archivo muy grande (máx 10MB)');
        continue;
      }

      try {
        if (isDemo) {
          setAttachments((prev) => [
            ...prev,
            { url: URL.createObjectURL(file), type: file.type, name: file.name },
          ]);
        } else {
          const safeName = (file.name || 'file').replace(/[^a-zA-Z0-9.-]/g, '_').slice(0, 50);
          const path = `chat/${user?.id || 'anon'}/${Date.now()}_${safeName}`;
          const { file_url, url, error } = await uploads.uploadFile(file, path);
          if (error) throw error;
          const attachmentUrl = file_url || url;
          if (attachmentUrl) {
            setAttachments((prev) => [
              ...prev,
              { url: attachmentUrl, type: file.type, name: file.name },
            ]);
          }
        }
      } catch (err) {
        console.error('Error subiendo archivo:', err);
      }
    }
    setShowAttachMenu(false);
  };

  return {
    sendMutation,
    handleSend,
    handleFileUpload,
  };
}
