import { useEffect } from 'react';
import MapboxMap from '@/components/map/MapboxMap';
import MapViewportShell from '@/system/map/MapViewportShell';
import { useHome } from '@/hooks/home/useHome';
import HomeHeader from '@/components/home/HomeHeader';
import HomeDialogs from '@/components/home/HomeDialogs';
import HomeMapPanel from '@/components/home/HomeMapPanel';
import appLogo from '@/assets/d2ae993d3_WaitMe.png';

if (typeof window !== 'undefined') {
  try {
    const _preload = new window.Image();
    _preload.src = appLogo;
  } catch (error) {
    console.error('[WaitMe Error]', error);
  }
}

const isMapDisabled = () => import.meta.env.DEV && import.meta.env.VITE_DISABLE_MAP === 'true';

export default function Home() {
  useEffect(() => {
    if (import.meta.env.DEV) {
      window.__DEV_DIAG = { ...(window.__DEV_DIAG || {}), homeMounted: true };
      return () => {
        window.__DEV_DIAG = { ...(window.__DEV_DIAG || {}), homeMounted: false };
      };
    }
  }, []);

  const api = useHome();
  const {
    mode,
    setMode,
    setSelectedAlert,
    confirmPublishOpen,
    setConfirmPublishOpen,
    pendingPublishPayload,
    setPendingPublishPayload,
    oneActiveAlertOpen,
    setOneActiveAlertOpen,
    selectedAlert,
    userLocation,
    address,
    setAddress,
    showFilters,
    setShowFilters,
    confirmDialog,
    setConfirmDialog,
    navigateViewState,
    setNavigateViewState,
    setArrivingAlertId,
    contentArea,
    mapRef,
    modeRef,
    engineLocation,
    guard,
    carsMode,
    waitMeCarBuyerLocation,
    waitMeCarColor,
    mapAlertsForNavigate,
    navigateMapAlerts,
    searchAlerts,
    arrivalMetrics,
    createAlertMutation,
    buyAlertMutation,
    handleBuyAlert,
    handleChat,
    handleCall,
    handleMapMove,
    handleMapMoveEnd,
    handleMapMoveSearch,
    handleRecenter,
    handleStreetSelect,
    getCurrentLocation,
    onCreateAlert,
    filters,
    setFilters,
  } = api;

  if (isMapDisabled()) {
    return (
      <div className="relative w-full min-h-[100dvh] overflow-hidden text-white bg-black flex items-center justify-center">
        <div className="text-center p-6 border border-purple-500/50 rounded-xl bg-gray-900/80">
          <p className="text-purple-400 font-mono text-sm">[DEV] VITE_DISABLE_MAP=true</p>
          <p className="text-gray-400 text-xs mt-2">Mapa desactivado para diagnóstico</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-[100dvh] overflow-hidden text-white">
      <MapViewportShell
        mode={mode || 'home'}
        mapNode={
          <MapboxMap
            className="w-full h-full"
            style={{ width: '100%', height: '100%' }}
            alerts={!mode || mode === 'create' ? [] : mapAlertsForNavigate}
            mapRef={mapRef}
            locationFromEngine={engineLocation ?? userLocation ?? null}
            suppressInternalWatcher
            interactive={!!mode}
            onMapLoad={(map) => {
              mapRef.current = map;
            }}
            skipAutoFlyWhenCenterPin={mode === 'create'}
            onAlertClick={(alert) => {
              setMode('search');
              setSelectedAlert(alert);
            }}
            useCenterPin={mode === 'create' || mode === 'search'}
            centerPinFromOverlay={mode === 'create' || mode === 'search'}
            centerPaddingBottom={mode === 'create' || mode === 'search' ? 280 : 0}
            onMapMove={mode === 'create' ? handleMapMove : undefined}
            onMapMoveEnd={
              mode === 'create'
                ? handleMapMoveEnd
                : mode === 'search'
                  ? handleMapMoveSearch
                  : undefined
            }
            waitMeCarMode={mode === 'create' ? carsMode : null}
            waitMeCarBuyerLocation={mode === 'create' ? waitMeCarBuyerLocation : null}
            waitMeCarColor={waitMeCarColor}
          />
        }
        panel={
          <HomeMapPanel
            mode={mode}
            address={address}
            setAddress={setAddress}
            handleRecenter={handleRecenter}
            mapRef={mapRef}
            onCreateAlert={onCreateAlert}
            createAlertMutation={createAlertMutation}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            handleStreetSelect={handleStreetSelect}
            navigateViewState={navigateViewState}
            arrivalMetrics={arrivalMetrics}
            navigateMapAlerts={navigateMapAlerts}
            searchAlerts={searchAlerts}
            selectedAlert={selectedAlert}
            handleBuyAlert={handleBuyAlert}
            handleChat={handleChat}
            handleCall={handleCall}
            setNavigateViewState={setNavigateViewState}
            setArrivingAlertId={setArrivingAlertId}
            buyAlertMutation={buyAlertMutation}
            userLocation={userLocation}
            filters={filters}
            setFilters={setFilters}
          />
        }
      />

      <div
        className={`z-10 flex flex-col ${mode ? 'h-0 overflow-hidden pointer-events-none' : 'absolute inset-0 pointer-events-none'}`}
        style={mode ? { pointerEvents: 'none' } : undefined}
      >
        <main
          className={`flex-1 flex flex-col relative overflow-hidden min-h-0 ${mode ? 'pointer-events-none' : ''}`}
        >
          <div
            data-home-content
            className="overflow-hidden"
            style={{
              display: mode ? 'none' : 'block',
              position: 'fixed',
              top: mode ? contentArea.top : 0,
              height: mode ? contentArea.height : '100%',
              left: 0,
              right: 0,
              pointerEvents: 'none',
            }}
          >
            <HomeHeader
              onSearchClick={() => setMode('search')}
              onCreateClick={() => setMode('create')}
              mapRef={mapRef}
              modeRef={modeRef}
              getCurrentLocation={getCurrentLocation}
              guard={guard}
            />
          </div>
        </main>

        <HomeDialogs
          oneActiveAlertOpen={oneActiveAlertOpen}
          setOneActiveAlertOpen={setOneActiveAlertOpen}
          confirmPublishOpen={confirmPublishOpen}
          setConfirmPublishOpen={setConfirmPublishOpen}
          pendingPublishPayload={pendingPublishPayload}
          setPendingPublishPayload={setPendingPublishPayload}
          createAlertMutation={createAlertMutation}
          confirmDialog={confirmDialog}
          setConfirmDialog={setConfirmDialog}
          buyAlertMutation={buyAlertMutation}
        />
      </div>
    </div>
  );
}
