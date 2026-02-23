import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MapPin, Clock } from 'lucide-react';
import UserAlertCard from '@/components/cards/UserAlertCard';
import { setWaitMeRequestStatus } from '@/lib/waitmeRequests';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';

function formatAddress(addr) {
  const s = String(addr || '').trim();
  if (!s) return 'Ubicación marcada';
  if (/oviedo/i.test(s)) return s;
  return `${s}, Oviedo`;
}

export default function IncomingRequestModal() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [request, setRequest] = useState(null);
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      const req = e?.detail?.request || null;
      const alt = e?.detail?.alert || null;
      if (req) {
        setRequest(req);
        setAlert(alt);
        setOpen(true);
      }
    };
    window.addEventListener('waitme:showIncomingRequestModal', handler);
    return () => window.removeEventListener('waitme:showIncomingRequestModal', handler);
  }, []);

  const handleClose = () => {
    setOpen(false);
    setRequest(null);
    setAlert(null);
    setLoading(false);
  };

  const acceptRequest = async () => {
    if (!request?.alertId) return;
    setLoading(true);
    try {
      const buyer = request?.buyer || {};
      await base44.entities.ParkingAlert.update(request.alertId, {
        status: 'reserved',
        reserved_by_id: buyer?.id || 'buyer',
        reserved_by_email: null,
        reserved_by_name: buyer?.name || 'Usuario',
        reserved_by_photo: buyer?.photo || null,
        reserved_by_car: String(buyer?.car_model || '').trim(),
        reserved_by_car_color: buyer?.car_color || 'gris',
        reserved_by_plate: buyer?.plate || '',
        reserved_by_vehicle_type: buyer?.vehicle_type || 'car'
      });
      setWaitMeRequestStatus(request?.id, 'accepted');
      await queryClient.invalidateQueries({ queryKey: ['alerts'] });
      await queryClient.invalidateQueries({ queryKey: ['myAlerts'] });
      try { window.dispatchEvent(new Event('waitme:badgeRefresh')); } catch {}
      handleClose();
      navigate(createPageUrl('History'));
    } catch {
      setLoading(false);
    }
  };

  const handleMeLoPienso = () => {
    if (request?.id) setWaitMeRequestStatus(request.id, 'thinking');
    handleClose();
  };

  const handleRechazar = () => {
    if (request?.id) setWaitMeRequestStatus(request.id, 'rejected');
    handleClose();
  };

  if (!request) return null;

  const buyer = request.buyer || {};
  const userName = buyer?.name || 'Usuario';
  const carLabel = String(buyer?.car_model || 'Sin datos').trim();
  const plate = buyer?.plate || '';
  const carColor = buyer?.car_color || 'gris';
  const address = alert?.address || '';
  const mins = Number(alert?.available_in_minutes) || 0;
  const createdTs = alert?.created_date ? new Date(alert.created_date).getTime() : Date.now();
  const waitUntilTs = createdTs + mins * 60 * 1000;
  const waitUntilLabel = new Date(waitUntilTs).toLocaleTimeString('es-ES', {
    timeZone: 'Europe/Madrid',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const fakeAlert = {
    user_name: userName,
    user_photo: buyer?.photo || null,
    car_brand: '',
    car_model: carLabel,
    car_color: carColor,
    car_plate: plate,
    address: address || '',
    available_in_minutes: mins || null,
    price: alert?.price ?? null,
    phone: buyer?.phone || null,
    allow_phone_calls: !!buyer?.phone,
    latitude: alert?.latitude ?? null,
    longitude: alert?.longitude ?? null
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent
        className="bg-gray-900 border-gray-800 text-white max-w-sm max-h-[90vh] overflow-y-auto"
        hideClose={false}
      >
        <div className="text-center mb-3">
          <p className="text-white font-semibold text-lg">
            {userName} quiere un Wait<span className="text-purple-500">Me!</span>
          </p>
        </div>
        <div className="px-0 pb-2 space-y-2">
          <UserAlertCard
            alert={fakeAlert}
            isEmpty={false}
            onBuyAlert={undefined}
            onChat={() => {}}
            onCall={() => buyer?.phone && (window.location.href = `tel:${buyer.phone}`)}
            isLoading={false}
            userLocation={null}
            hideBuy
          />
          <div className="rounded-xl border-2 border-purple-500/50 bg-gray-800/50 p-3 space-y-2">
            {address ? (
              <div className="flex items-start gap-1.5 text-xs">
                <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-purple-400" />
                <span className="text-gray-200 leading-5">{formatAddress(address)}</span>
              </div>
            ) : null}
            <div className="flex items-start gap-1.5 text-xs">
              <Clock className="w-4 h-4 flex-shrink-0 mt-0.5 text-purple-400" />
              <span className="text-gray-400 leading-5">Debes esperar hasta las </span>
              <span className="text-white text-xl font-bold leading-5">{waitUntilLabel}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-row gap-2 mt-3">
          <Button
            className="flex-1 bg-purple-600 hover:bg-purple-700"
            onClick={acceptRequest}
            disabled={loading}
          >
            Aceptar
          </Button>
          <Button
            variant="outline"
            className="flex-1 border-gray-600"
            onClick={handleMeLoPienso}
            disabled={loading}
          >
            Me lo pienso
          </Button>
          <Button variant="destructive" className="flex-1" onClick={handleRechazar} disabled={loading}>
            Rechazar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
