import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { setWaitMeRequestStatus } from '@/lib/waitmeRequests';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { MapPin, Clock, MessageCircle, Phone, PhoneOff, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function formatAddress(addr){
  const s=String(addr||'').trim();
  if(!s)return'Ubicación marcada';
  if(/oviedo/i.test(s))return s;
  return`${s}, Oviedo`;
}

function getCarFill(color){
  const map={
    blanco:'#ffffff',negro:'#1a1a1a',gris:'#9ca3af',plata:'#d1d5db',
    rojo:'#ef4444',azul:'#3b82f6',verde:'#22c55e',amarillo:'#eab308',
    naranja:'#f97316',marrón:'#92400e',morado:'#7c3aed',rosa:'#ec4899',
    beige:'#d4b483',
  };
  const key=String(color||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  return map[key]||'#9ca3af';
}

function CarIconProfile({color,size='w-16 h-10'}){
  return(
    <svg className={size} viewBox="0 0 64 40" fill="none">
      <rect x="8" y="16" width="48" height="18" rx="4" fill={color}/>
      <rect x="14" y="8" width="36" height="14" rx="3" fill={color} opacity="0.85"/>
      <rect x="17" y="10" width="13" height="9" rx="2" fill="#93c5fd" opacity="0.7"/>
      <rect x="34" y="10" width="13" height="9" rx="2" fill="#93c5fd" opacity="0.7"/>
      <circle cx="18" cy="34" r="5" fill="#1f2937"/>
      <circle cx="18" cy="34" r="3" fill="#374151"/>
      <circle cx="46" cy="34" r="5" fill="#1f2937"/>
      <circle cx="46" cy="34" r="3" fill="#374151"/>
    </svg>
  );
}

function PlateProfile({plate}){
  if(!plate)return null;
  return(
    <div className="bg-white rounded px-1.5 py-0.5 flex items-center gap-1">
      <div className="bg-blue-700 rounded-sm w-3 h-full flex items-center justify-center">
        <span className="text-white text-[7px] font-bold leading-none">E</span>
      </div>
      <span className="text-gray-900 text-[10px] font-bold tracking-wide">{plate}</span>
    </div>
  );
}

export default function IncomingRequestModal(){
  const navigate=useNavigate();
  const queryClient=useQueryClient();

  const[open,setOpen]=useState(false);
  const[request,setRequest]=useState(null);
  const[alert,setAlert]=useState(null);
  const[loading,setLoading]=useState(false);
  const[nowTs,setNowTs]=useState(Date.now());

  useEffect(()=>{
    const id=setInterval(()=>setNowTs(Date.now()),1000);
    return()=>clearInterval(id);
  },[]);

  useEffect(()=>{
    const handler=(e)=>{
      const req=e?.detail?.request||null;
      const alt=e?.detail?.alert||null;
      if(req){setRequest(req);setAlert(alt);setOpen(true);}
    };
    window.addEventListener('waitme:showIncomingRequestModal',handler);
    return()=>window.removeEventListener('waitme:showIncomingRequestModal',handler);
  },[]);

  const handleClose=()=>{setOpen(false);setRequest(null);setAlert(null);setLoading(false);};

  const acceptRequest=async()=>{
    if(!request?.alertId)return;
    setLoading(true);

    const buyer=request?.buyer||{};
    const payload={
      status:'reserved',
      reserved_by_id:buyer?.id||'buyer',
      reserved_by_email:null,
      reserved_by_name:buyer?.name||'Usuario',
      reserved_by_photo:buyer?.photo||null,
      reserved_by_car:String(buyer?.car_model||'').trim(),
      reserved_by_car_color:buyer?.car_color||'gris',
      reserved_by_plate:buyer?.plate||'',
      reserved_by_vehicle_type:buyer?.vehicle_type||'car'
    };

    setWaitMeRequestStatus(request?.id,'accepted');
    try{window.dispatchEvent(new Event('waitme:badgeRefresh'));}catch{}
    handleClose();
    navigate(createPageUrl('History'));

    try{
      await base44.entities.ParkingAlert.update(request.alertId,payload);
      queryClient.invalidateQueries({queryKey:['alerts']});
      queryClient.invalidateQueries({queryKey:['myAlerts']});
    }catch{setLoading(false);}
  };

  const handleMeLoPienso=()=>{if(request?.id)setWaitMeRequestStatus(request.id,'thinking');handleClose();};
  const handleRechazar=()=>{if(request?.id)setWaitMeRequestStatus(request.id,'rejected');handleClose();};

  if(!request)return null;

  const buyer=request.buyer||{};
  const userName=buyer?.name||'Usuario';
  const firstName=userName.split(' ')[0];
  const carLabel=String(buyer?.car_model||'Sin datos').trim();
  const plate=buyer?.plate||'';
  const carFill=getCarFill(buyer?.car_color||'gris');
  const photo=buyer?.photo||`https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=7c3aed&color=fff&size=128`;
  const phoneEnabled=Boolean(buyer?.phone);

  const mins=Number(alert?.available_in_minutes)||0;
  const createdTs=alert?.created_date?new Date(alert.created_date).getTime():Date.now();
  const waitUntilTs=createdTs+mins*60*1000;

  const waitUntilLabel=new Date(waitUntilTs).toLocaleTimeString('es-ES',{timeZone:'Europe/Madrid',hour:'2-digit',minute:'2-digit',hour12:false});

  const remainingMs=Math.max(0,waitUntilTs-nowTs);
  const remSec=Math.floor(remainingMs/1000);
  const mm=String(Math.floor(remSec/60)).padStart(2,'0');
  const ss=String(remSec%60).padStart(2,'0');
  const countdownText=`${mm}:${ss}`;
  const isCountdown=remainingMs>0;

  return(
    <AnimatePresence>
      {open&&(
        <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
          className="fixed inset-0 z-[200] flex items-center justify-center px-4"
          style={{backgroundColor:'rgba(0,0,0,0.75)'}}>

          <motion.div initial={{scale:0.9,y:30,opacity:0}} animate={{scale:1,y:0,opacity:1}}
            exit={{scale:0.9,y:30,opacity:0}} transition={{type:'spring',damping:22,stiffness:300}}
            className="w-full max-w-sm bg-gray-900 rounded-2xl border-2 border-purple-500/50 overflow-hidden">

            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <p className="text-white font-semibold text-lg">
                {firstName} quiere un <span className="text-2xl font-bold">Wait</span>
                <span className="text-purple-400 text-2xl font-bold">Me!</span>
              </p>

              <button onClick={handleMeLoPienso}
                className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/50 flex items-center justify-center text-red-400 hover:bg-red-500/30 transition-colors">
                <X className="w-5 h-5"/>
              </button>
            </div>

            <div className="px-3 pb-3">
              <div className="bg-gray-800/60 rounded-xl p-2 border border-purple-500/30">

                <div className="flex items-center justify-between mb-2">
                  <div className="bg-purple-500/20 text-purple-300 border border-purple-400/50 font-bold text-xs rounded-md px-3 py-1">
                    Te reservó:
                  </div>
                  <div className="flex gap-1 text-xs">
                    <div className="bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-white">0.3 km</div>
                    <div className="bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-white">3€</div>
                  </div>
                </div>

                <div className="border-t border-gray-700/80 mb-2"/>

                <div className="flex gap-2.5">
                  <div className="w-[95px] h-[85px] rounded-lg overflow-hidden border-2 border-purple-500/40 bg-gray-900 flex-shrink-0">
                    <img src={photo} alt={userName} className="w-full h-full object-cover" loading="eager" decoding="sync"/>
                  </div>

                  <div className="flex-1 h-[85px] flex flex-col">
                    <p className="font-bold text-xl text-white leading-none">{firstName}</p>
                    <p className="text-sm font-medium text-gray-200 flex-1 flex items-center truncate relative top-[6px]">{carLabel}</p>

                    <div className="mt-2 flex items-center gap-2">
                      <PlateProfile plate={plate}/>
                      <CarIconProfile color={carFill} size="w-14 h-9"/>
                    </div>
                  </div>
                </div>

                <div className="pt-1.5 border-t border-gray-700/80 mt-2 space-y-1.5">
                  <div className="flex items-start gap-1.5 text-xs">
                    <MapPin className="w-4 h-4 mt-0.5 text-purple-400"/>
                    <span className="text-gray-200 line-clamp-1">{formatAddress(alert?.address)}</span>
                  </div>

                  <div className="flex items-start gap-1.5 text-xs">
                    <Clock className="w-4 h-4 mt-0.5 text-purple-400"/>
                    <span className="text-white">
                      Te vas en {mins} min · Te espera hasta las <span className="text-lg font-bold">{waitUntilLabel}</span>
                    </span>
                  </div>
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <Button size="icon" className="w-14 h-8 bg-green-500 hover:bg-green-600 text-white rounded-lg">
                    <MessageCircle className="w-4 h-4"/>
                  </Button>

                  {phoneEnabled?(
                    <Button size="icon" className="w-14 h-8 bg-white hover:bg-gray-200 text-black rounded-lg"
                      onClick={()=>window.location.href=`tel:${buyer.phone}`}>
                      <Phone className="w-4 h-4"/>
                    </Button>
                  ):(
                    <Button size="icon" className="w-14 h-8 border-white/30 bg-white/10 text-white rounded-lg opacity-70" disabled>
                      <PhoneOff className="w-4 h-4"/>
                    </Button>
                  )}

                  <Button size="icon" className="w-14 h-8 rounded-lg bg-blue-600 text-white opacity-40" disabled>
                    <Navigation className="w-4 h-4"/>
                    <span className="ml-1 text-xs font-semibold">Ir</span>
                  </Button>

                  <div className="flex-1">
                    <div className={`w-full h-8 rounded-lg border-2 flex items-center justify-center ${isCountdown?'border-purple-400/70 bg-purple-600/25':'border-purple-500/30 bg-purple-600/10'}`}>
                      <span className={`font-mono font-extrabold ${isCountdown?'text-purple-100':'text-purple-300'}`}>
                        {countdownText}
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <div className="px-3 pb-4 flex gap-2">
              <Button className="flex-1 bg-purple-600 hover:bg-purple-700 font-semibold" onClick={acceptRequest} disabled={loading}>
                Aceptar
              </Button>
              <Button variant="outline" className="flex-1 border-gray-600 text-white font-semibold" onClick={handleMeLoPienso} disabled={loading}>
                Me lo pienso
              </Button>
              <Button className="flex-1 bg-red-600/80 hover:bg-red-700 font-semibold" onClick={handleRechazar} disabled={loading}>
                Rechazar
              </Button>
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}