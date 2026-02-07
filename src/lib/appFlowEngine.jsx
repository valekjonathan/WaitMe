// src/lib/appFlowEngine.jsx
import React, { useEffect, useRef, useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { demoFlow } from "@/lib/demoFlow";

// Motor global: cada 20s (aprox) dispara UN evento coherente.
// Push informativas = toasts. Accionables = pantalla Notificaciones.
const TICK_MS = 20_000;

function getDemoEnabled() {
  const s = demoFlow.getState();
  return !!s?.demoEnabled;
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function systemMessage(text) {
  return {
    id: `sys_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    type: "system",
    sender_id: "system",
    sender_name: "WaitMe!",
    sender_photo: null,
    message: text,
    created_date: new Date().toISOString(),
    read: true,
  };
}

function userMessage(user, text) {
  return {
    id: `msg_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    type: "message",
    sender_id: user.id,
    sender_name: user.name,
    sender_photo: user.photo,
    message: text,
    created_date: new Date().toISOString(),
    read: false,
  };
}

export default function AppFlowEngine() {
  const timerRef = useRef(null);
  const [enabled, setEnabled] = useState(getDemoEnabled());

  useEffect(() => {
    // escuchar cambios del toggle
    return demoFlow.subscribe((s) => setEnabled(!!s.demoEnabled));
  }, []);

  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      return;
    }

    // primer empujón (ligero)
    timerRef.current = setInterval(() => {
      const s = demoFlow.getState();
      if (!s?.demoEnabled) return;

      // cola de eventos por pasos (sin spam)
      const step = (s.step || 0) % 8;

      const convs = s.conversations || [];
      const users = s.users || {};

      // Selección de conversación activa para simular
      const active = convs.find(c => c.status === "activa") || convs[0];
      const other = active ? users[active.otherUserId] : users.marco;

      // secuencia coherente básica
      switch (step) {
        case 0: {
          // Nueva solicitud (accionable)
          demoFlow.addActionableNotification({
            kind: "reservation_request",
            title: `${other?.name || "Usuario"} quiere un WaitMe!`,
            subtitle: "Solicitud de reserva",
            conversationId: active?.id,
            amount: 3,
            fromUserId: other?.id,
          });
          toast({
            title: "🔔 Nueva solicitud",
            description: `${other?.name || "Usuario"} quiere un WaitMe!`,
            duration: rand(6000, 8000),
          });
          break;
        }
        case 1: {
          // "Me lo pienso" (accionable)
          demoFlow.addActionableNotification({
            kind: "me_lo_pienso",
            title: `Operación en espera`,
            subtitle: `${other?.name || "Usuario"}: “Me lo pienso”`,
            conversationId: active?.id,
          });
          toast({
            title: "⏳ En espera",
            description: `${other?.name || "Usuario"} se lo está pensando…`,
            duration: rand(6000, 8000),
          });
          break;
        }
        case 2: {
          // Aceptada (push)
          demoFlow.enqueuePush({
            title: "✅ Aceptado",
            description: `${other?.name || "Usuario"} ha aceptado tu WaitMe!`,
            conversationId: active?.id,
          });
          toast({
            title: "✅ Aceptado",
            description: `${other?.name || "Usuario"} ha aceptado tu WaitMe!`,
            duration: rand(6000, 8000),
          });
          // mensaje de sistema en chat
          if (active?.id) demoFlow.appendMessage(active.id, systemMessage("✅ Reserva aceptada."));
          break;
        }
        case 3: {
          // mensaje del otro
          if (active?.id && other) {
            demoFlow.appendMessage(active.id, userMessage(other, "Ey gracias por aceptar mi WaitMe! Llegaré lo antes posible."));
            demoFlow.bumpUnread(active.id, 1);
            toast({
              title: "💬 Nuevo mensaje",
              description: `${other.name}: Llegaré lo antes posible`,
              duration: rand(6000, 8000),
            });
          }
          break;
        }
        case 4: {
          // comprador cerca
          if (active?.id && other) {
            demoFlow.appendMessage(active.id, systemMessage("📍 Estáis cerca. El pago se libera a 5 metros."));
            toast({
              title: "📍 Cerca",
              description: "El pago se liberará cuando estéis a 5 metros.",
              duration: rand(6000, 8000),
            });
          }
          break;
        }
        case 5: {
          // prórroga (accionable)
          demoFlow.addActionableNotification({
            kind: "prorroga_offer",
            title: "⏱️ Prórroga",
            subtitle: "5 min +1€ · 10 min +3€ · 15 min +5€",
            conversationId: active?.id,
            options: [
              { label: "5 min · +1€", extraMin: 5, extraAmount: 1 },
              { label: "10 min · +3€", extraMin: 10, extraAmount: 3 },
              { label: "15 min · +5€", extraMin: 15, extraAmount: 5 },
            ],
          });
          toast({
            title: "⏱️ Prórroga",
            description: "Te han propuesto una prórroga (1 min para decidir).",
            duration: rand(6000, 8000),
          });
          if (active?.id) demoFlow.appendMessage(active.id, systemMessage("⏱️ Se ha propuesto una prórroga."));
          break;
        }
        case 6: {
          // pago completado
          if (active?.id) {
            demoFlow.appendMessage(active.id, systemMessage("💰 Pago completado. Has ganado 2€."));
            demoFlow.setConversationFinal(active.id, "COMPLETADA");
            toast({
              title: "💰 Pago completado",
              description: "Has ganado 2€.",
              duration: rand(6000, 8000),
            });
          }
          break;
        }
        case 7: {
          // operación finalizada (sin spam)
          if (active?.id) {
            demoFlow.enqueuePush({
              title: "📦 Operación finalizada",
              description: "Se ha movido a Finalizadas.",
              conversationId: active.id,
            });
            toast({
              title: "📦 Operación finalizada",
              description: "Se ha movido a Finalizadas.",
              duration: rand(6000, 8000),
            });
          }
          break;
        }
      }

      // avanza step
      const st = demoFlow.getState();
      demoFlow.setStep((st.step || 0) + 1);
    }, TICK_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [enabled]);

  return null;
}
