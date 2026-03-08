import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal } from 'lucide-react';
import CreateMapOverlay from '@/components/CreateMapOverlay';
import SearchMapOverlay from '@/components/SearchMapOverlay';
import MapFilters from '@/components/map/MapFilters';
import UserAlertCard from '@/components/cards/UserAlertCard';

export default function HomeMapPanel({
  mode,
  address,
  setAddress,
  handleRecenter,
  mapRef,
  onCreateAlert,
  createAlertMutation,
  showFilters,
  setShowFilters,
  handleStreetSelect,
  navigateViewState,
  arrivalMetrics,
  navigateMapAlerts,
  searchAlerts,
  selectedAlert,
  handleBuyAlert,
  handleChat,
  handleCall,
  setNavigateViewState,
  setArrivingAlertId,
  buyAlertMutation,
  userLocation,
  filters,
  setFilters,
}) {
  if (mode === 'create') {
    return (
      <CreateMapOverlay
        address={address}
        onAddressChange={setAddress}
        onRecenter={handleRecenter}
        mapRef={mapRef}
        onCreateAlert={onCreateAlert}
        isLoading={createAlertMutation.isPending}
      />
    );
  }
  if (mode === 'search') {
    return (
      <SearchMapOverlay
        onStreetSelect={handleStreetSelect}
        mapRef={mapRef}
        navigateViewState={navigateViewState}
        arrivalMetrics={arrivalMetrics}
        filtersButton={
          !showFilters && (
            <Button
              onClick={() => setShowFilters(true)}
              type="button"
              variant="secondary"
              size="icon"
              className="h-9 w-9 rounded-lg border border-purple-500/50 text-white bg-purple-600/50 hover:bg-purple-600/70"
            >
              <SlidersHorizontal className="w-5 h-5" />
            </Button>
          )
        }
        filtersContent={
          <AnimatePresence>
            {showFilters && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowFilters(false)}
                  className="fixed inset-0 z-[999] bg-black/40"
                />
                <MapFilters
                  filters={filters}
                  onFilterChange={setFilters}
                  onClose={() => setShowFilters(false)}
                  alertsCount={mode === 'search' ? navigateMapAlerts.length : searchAlerts.length}
                />
              </>
            )}
          </AnimatePresence>
        }
        alertCard={
          <UserAlertCard
            alert={selectedAlert}
            isEmpty={!selectedAlert}
            onBuyAlert={handleBuyAlert}
            onChat={handleChat}
            onCall={handleCall}
            onStartArriving={(a) => {
              setNavigateViewState('arriving');
              setArrivingAlertId(a?.id ?? null);
            }}
            isLoading={buyAlertMutation.isPending}
            userLocation={userLocation}
            showArrivingButton={navigateViewState === 'browse' && !!selectedAlert}
          />
        }
      />
    );
  }
  return null;
}
