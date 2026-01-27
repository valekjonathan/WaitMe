// ===== Home.jsx =====
import React, { useState, useEffect, useMemo } from 'react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Car, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import ParkingMap from '@/components/map/ParkingMap';
import UserAlertCard from '@/components/cards/UserAlertCard';
import CreateAlertCard from '@/components/cards/CreateAlertCard';
import MapFilters from '@/components/map/MapFilters';
import BottomNav from '@/components/BottomNav';
import NotificationManager from '@/components/NotificationManager';
import Header from '@/components/Header';

/* ---------- TODO TU CÓDIGO DE FUNCIONES (buildDemoAlerts, etc.) ---------- */
/* ⚠️ NO TOCO NADA DE ESO, ES EXACTAMENTE IGUAL AL TUYO */

/* ……………… */
/* PEGA AQUÍ TODO TU CÓDIGO TAL CUAL HASTA EL return() */
/* ……………… */

export default function Home() {
  /* TODO TU ESTADO Y LÓGICA ES IGUAL */
  /* NO TOCADO */

  /* ====================== */
  /* ======= RETURN ======= */
  /* ====================== */

  return (
    <div className="min-h-screen bg-black text-white">
      <NotificationManager user={user} />

      <Header
        title="WaitMe!"
        unreadCount={unreadCount}
        showBackButton={!!mode}
        onBack={() => {
          setMode(null);
          setSelectedAlert(null);
        }}
      />

      {/* 🔥 MAPA PERSISTENTE (NUNCA SE DESMONTA) */}
      <div
        className="fixed inset-0"
        style={{
          top: '60px',
          bottom: '88px',
          display: mode ? 'block' : 'none',
          zIndex: 0
        }}
      >
        <ParkingMap
          alerts={mode === 'search' ? searchAlerts : []}
          onAlertClick={setSelectedAlert}
          userLocation={userLocation}
          selectedAlert={selectedAlert}
          showRoute={!!selectedAlert}
          isSelecting={mode === 'create'}
          selectedPosition={selectedPosition}
          setSelectedPosition={setSelectedPosition}
          zoomControl={true}
          className="h-full"
        />
      </div>

      <main className="fixed inset-0">
        <AnimatePresence mode="wait">
          {/* HOME PRINCIPAL */}
          {!mode && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden"
            >
              {/* MAPA FONDO (DEMO) */}
              <div className="absolute inset-0 opacity-20 pointer-events-none">
                <ParkingMap
                  alerts={homeMapAlerts}
                  userLocation={userLocation}
                  className="absolute inset-0 w-full h-full"
                  zoomControl={false}
                />
              </div>

              <div className="absolute inset-0 bg-purple-900/40 pointer-events-none"></div>

              {/* TODO TU CONTENIDO VISUAL IGUAL */}
              {/* BOTONES + LOGO IGUAL */}
            </motion.div>
          )}

          {/* SEARCH */}
          {mode === 'search' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 top-[60px] bottom-[88px] flex flex-col"
            >
              {/* SOLO CARDS, EL MAPA YA ESTÁ ARRIBA */}
              {/* TU CÓDIGO IGUAL */}
            </motion.div>
          )}

          {/* CREATE */}
          {mode === 'create' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 top-[60px] bottom-[88px] flex flex-col"
            >
              {/* SOLO FORM, EL MAPA YA ESTÁ ARRIBA */}
              {/* TU CÓDIGO IGUAL */}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <BottomNav />

      {/* DIALOG CONFIRMAR → IGUAL */}
    </div>
  );
}