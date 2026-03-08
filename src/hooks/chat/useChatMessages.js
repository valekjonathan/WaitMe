/**
 * Datos y mensajes del chat (demo + real).
 * @module hooks/chat/useChatMessages
 */

import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import * as chat from '@/data/chat';
import {
  getDemoConversation,
  getDemoMessages,
  markDemoRead,
  demoFlow,
} from '@/components/DemoFlowManager';

export function useChatMessages(messagesEndRef) {
  const { user } = useAuth();
  const { search: locationSearch } = useLocation();
  const queryClient = useQueryClient();

  const urlParams = new URLSearchParams(locationSearch);
  const conversationId = urlParams.get('conversationId');
  const alertId = urlParams.get('alertId');
  const otherNameParam = urlParams.get('otherName');
  const otherPhotoParam = urlParams.get('otherPhoto');
  const carLabelParam = urlParams.get('carLabel');
  const plateParam = urlParams.get('plate');
  const priceParam = urlParams.get('price');
  const demoFirstMsgParam = urlParams.get('demoFirstMsg');

  const cardInfo = useMemo(() => {
    const car = carLabelParam ? decodeURIComponent(carLabelParam) : null;
    const plate = plateParam ? decodeURIComponent(plateParam) : null;
    const price = priceParam != null ? Number(priceParam) : null;
    const hasAny = !!car || !!plate || Number.isFinite(price);
    if (!hasAny) return null;
    return { car, plate, price };
  }, [carLabelParam, plateParam, priceParam]);

  const isDemo = !conversationId || urlParams.get('demo') === 'true';
  const demoSt = isDemo ? demoFlow : null;

  const demoConversationId = useMemo(() => {
    if (!isDemo) return null;
    const firstId = demoSt?.conversations?.[0]?.id || null;
    return conversationId || firstId;
  }, [isDemo, demoSt, conversationId]);

  const demoConv = isDemo && demoConversationId ? getDemoConversation(demoConversationId) : null;
  const demoMsgs = isDemo && demoConversationId ? getDemoMessages(demoConversationId) || [] : [];

  const demoOtherUser = useMemo(() => {
    if (!isDemo || !demoConv) return null;
    const otherId =
      demoConv.participant1_id === 'me' ? demoConv.participant2_id : demoConv.participant1_id;
    return (demoSt?.users || []).find((u) => u.id === otherId) || null;
  }, [isDemo, demoConv, demoSt]);

  const [localDemoMessages, setLocalDemoMessages] = useState(() => {
    if (!demoFirstMsgParam) return [];
    const firstMsg = decodeURIComponent(demoFirstMsgParam);
    if (!firstMsg) return [];

    const isMineMsg = firstMsg.includes('he enviado') || firstMsg.includes('he reservado');
    return [
      {
        id: 'demo_initial_1',
        mine: !isMineMsg,
        sender_name: otherNameParam ? decodeURIComponent(otherNameParam) : 'Usuario',
        sender_photo: otherPhotoParam ? decodeURIComponent(otherPhotoParam) : null,
        message: firstMsg,
        created_date: new Date().toISOString(),
        kind: 'text',
      },
    ];
  });

  useEffect(() => {
    if (!isDemo) return;
    if (!demoConversationId) return;
    markDemoRead(demoConversationId);
  }, [isDemo, demoConversationId]);

  const { data: conversation } = useQuery({
    queryKey: ['conversation', conversationId],
    enabled: !!conversationId && !!user?.id && !isDemo,
    queryFn: async () => {
      const { data, error } = await chat.getConversation(conversationId, user?.id);
      if (error) throw error;
      return data ?? null;
    },
    staleTime: 30000,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['chatMessages', conversationId, user?.id],
    enabled: !!conversationId && !!user?.id && !isDemo,
    queryFn: async () => {
      const { data, error } = await chat.getMessages(conversationId, user?.id);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 10000,
  });

  useEffect(() => {
    if (!conversationId || isDemo || !user?.id) return;

    const unsub = chat.subscribeMessages(conversationId, () => {
      queryClient.invalidateQueries({ queryKey: ['chatMessages', conversationId, user?.id] });
    });
    return () => unsub?.();
  }, [conversationId, isDemo, user?.id, queryClient]);

  const displayMessages = useMemo(() => {
    if (isDemo) {
      const demoMapped = (demoMsgs || []).map((m) => ({
        id: m.id,
        mine: !!m.mine,
        sender_name: m.senderName,
        sender_photo: m.senderPhoto,
        message: m.text,
        created_date: new Date(m.ts).toISOString(),
        kind: m.kind || 'text',
      }));
      const combined = [...localDemoMessages, ...demoMapped];
      const seen = new Set();
      return combined.filter((m) => {
        if (seen.has(m.id)) return false;
        seen.add(m.id);
        return true;
      });
    }

    return (messages || []).map((m) => ({
      id: m.id,
      mine: m.sender_id === user?.id,
      sender_name: m.sender_name,
      sender_photo: m.sender_photo,
      message: m.message,
      created_date: m.created_date,
      kind: m.message_type || 'user',
      attachments: m.attachments,
    }));
  }, [isDemo, demoMsgs, messages, user?.id, localDemoMessages]);

  const otherUser = useMemo(() => {
    if (otherNameParam || otherPhotoParam) {
      let decodedName = null;
      let decodedPhoto = null;

      try {
        decodedName = otherNameParam ? decodeURIComponent(otherNameParam) : null;
      } catch (e) {
        console.error('Error decodificando otherName:', e);
        decodedName = otherNameParam || null;
      }

      try {
        decodedPhoto = otherPhotoParam ? decodeURIComponent(otherPhotoParam) : null;
      } catch (e) {
        console.error('Error decodificando otherPhoto:', e);
        decodedPhoto = otherPhotoParam || null;
      }

      return {
        name: decodedName || 'Usuario',
        photo: decodedPhoto || null,
      };
    }

    if (isDemo) {
      const fallbackPhotos = [
        'https://randomuser.me/api/portraits/women/44.jpg',
        'https://randomuser.me/api/portraits/men/32.jpg',
        'https://randomuser.me/api/portraits/women/68.jpg',
        'https://randomuser.me/api/portraits/men/75.jpg',
      ];
      const seed = String(demoConversationId || alertId || 'x').charCodeAt(0) || 0;
      const fallbackPhoto = fallbackPhotos[seed % fallbackPhotos.length];

      return {
        name: demoOtherUser?.name || demoConv?.other_name || otherNameParam || 'Sofía',
        photo: demoOtherUser?.photo || demoConv?.other_photo || otherPhotoParam || fallbackPhoto,
      };
    }

    const isP1 = conversation?.participant1_id === user?.id;
    return {
      name: isP1 ? conversation?.participant2_name : conversation?.participant1_name,
      photo: isP1 ? conversation?.participant2_photo : conversation?.participant1_photo,
    };
  }, [
    isDemo,
    demoOtherUser,
    demoConv,
    conversation,
    user?.id,
    otherNameParam,
    otherPhotoParam,
    demoConversationId,
    alertId,
  ]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [displayMessages, messagesEndRef]);

  return {
    user,
    conversationId,
    alertId,
    isDemo,
    demoConversationId,
    demoFirstMsgParam,
    otherNameParam,
    otherPhotoParam,
    cardInfo,
    displayMessages,
    otherUser,
    localDemoMessages,
    setLocalDemoMessages,
    queryClient,
  };
}
