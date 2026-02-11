import React from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Timer,
  TrendingUp,
  AlertCircle,
  MessageCircle
} from "lucide-react";

export default function Notifications() {
  const navigate = useNavigate();

  const notifications = [
    {
      id: 1,
      type: "incoming_waitme",
      title: "WAITME ENTRANTE",
      text: "Sofía te ha enviado un WaitMe.",
      fromName: "Sofía"
    },
    {
      id: 2,
      type: "reservation_accepted",
      title: "RESERVA ACEPTADA",
      text: "Marco ha aceptado tu reserva.",
      fromName: "Marco"
    },
    {
      id: 3,
      type: "reservation_rejected",
      title: "RESERVA RECHAZADA",
      text: "Laura rechazó tu solicitud.",
      fromName: "Laura"
    },
    {
      id: 4,
      type: "buyer_nearby",
      title: "COMPRADOR CERCA",
      text: "El comprador está llegando.",
      fromName: "Carlos"
    },
    {
      id: 5,
      type: "prorroga_request",
      title: "PRÓRROGA SOLICITADA",
      text: "Te piden +1€ por 5 minutos extra.",
      fromName: "Elena"
    },
    {
      id: 6,
      type: "payment_completed",
      title: "PAGO COMPLETADO",
      text: "Has recibido 3€ correctamente.",
      fromName: "Sistema"
    },
    {
      id: 7,
      type: "time_expired",
      title: "TIEMPO AGOTADO",
      text: "La operación expiró.",
      fromName: "Sistema"
    },
    {
      id: 8,
      type: "cancellation",
      title: "CANCELACIÓN",
      text: "Alguien canceló la operación.",
      fromName: "Sistema"
    }
  ];

  const iconMap = {
    incoming_waitme: <Bell className="w-5 h-5 text-purple-400" />,
    reservation_accepted: <CheckCircle className="w-5 h-5 text-green-400" />,
    reservation_rejected: <XCircle className="w-5 h-5 text-red-400" />,
    buyer_nearby: <MapPin className="w-5 h-5 text-blue-400" />,
    prorroga_request: <Timer className="w-5 h-5 text-orange-400" />,
    payment_completed: <TrendingUp className="w-5 h-5 text-green-400" />,
    time_expired: <AlertCircle className="w-5 h-5 text-red-400" />,
    cancellation: <XCircle className="w-5 h-5 text-gray-400" />
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Header title="Notificaciones" showBackButton backTo="Home" />

      <main className="pt-[60px] pb-24 px-4 space-y-4">

        {notifications.map((n) => (
          <div
            key={n.id}
            className="rounded-xl border-2 border-purple-500/40 bg-gradient-to-br from-gray-800 to-gray-900 p-4"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-purple-500/20">
                {iconMap[n.type]}
              </div>

              <div className="flex-1">
                <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/50 text-xs font-bold mb-2">
                  {n.title}
                </Badge>

                <p className="text-sm font-medium">{n.text}</p>

                <p className="text-xs text-gray-400 mt-1">
                  De: <span className="text-purple-300">{n.fromName}</span>
                </p>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <Button
                size="sm"
                className="flex-1"
                onClick={() =>
                  navigate(createPageUrl("Chats"))
                }
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Ver chat
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="flex-1 border-gray-600"
              >
                Acción
              </Button>
            </div>
          </div>
        ))}

      </main>

      <BottomNav />
    </div>
  );
}