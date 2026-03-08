/**
 * Pantalla Navigate — orquestador.
 * Navegación hacia la plaza reservada. Mapa con ubicación del vendedor y comprador.
 */

import { useCallback } from 'react';
import { useNavigateState } from '@/hooks/navigate/useNavigateState';
import { useNavigateActions } from '@/hooks/navigate/useNavigateActions';
import NavigateMap from '@/components/navigate/NavigateMap';
import NavigateHeader from '@/components/navigate/NavigateHeader';
import NavigatePanel from '@/components/navigate/NavigatePanel';
import NavigateActions from '@/components/navigate/NavigateActions';

export default function Navigate() {
  const state = useNavigateState();
  const { startTracking, stopTracking, handleCancelAlert } = useNavigateActions(state);

  const onRouteLoaded = useCallback(({ distanceKm, durationSec }) => {
    state.setRouteDistanceKm(distanceKm);
    state.setRouteDurationSec(durationSec);
  }, []);

  return (
    <div className="min-h-[100dvh] bg-black text-white flex flex-col">
      <NavigateActions
        showPaymentSuccess={state.showPaymentSuccess}
        alert={state.alert}
        showAbandonWarning={state.showAbandonWarning}
        setShowAbandonWarning={state.setShowAbandonWarning}
        showCancelWarning={state.showCancelWarning}
        setShowCancelWarning={state.setShowCancelWarning}
        sellerName={state.sellerName}
        handleCancelAlert={handleCancelAlert}
      />

      <NavigateMap
        isBrowseMode={state.isBrowseMode}
        browseAlerts={state.browseAlerts}
        displayAlertOrNearest={state.displayAlertOrNearest}
        displayAlert={state.displayAlert}
        userLocation={state.userLocation}
        sellerLocation={state.sellerLocation}
        onRouteLoaded={onRouteLoaded}
        userMapIcon={state.userMapIcon}
        sellerMapIcon={state.sellerMapIcon}
      />

      {!state.isBrowseMode && (
        <NavigateHeader distLabel={state.distLabel} etaMinutes={state.etaMinutes} />
      )}

      <NavigatePanel
        panelCollapsed={state.panelCollapsed}
        setPanelCollapsed={state.setPanelCollapsed}
        sellerName={state.sellerName}
        sellerPhoto={state.sellerPhoto}
        alertForCard={state.alertForCard}
        isBrowseMode={state.isBrowseMode}
        isSeller={state.isSeller}
        isBuyer={state.isBuyer}
        displayAlert={state.displayAlert}
        userLocation={state.userLocation}
        isTracking={state.isTracking}
        paymentReleased={state.paymentReleased}
        alertId={state.alertId}
        startTracking={startTracking}
        stopTracking={stopTracking}
        setShowCancelWarning={state.setShowCancelWarning}
        setForceRelease={state.setForceRelease}
      />
    </div>
  );
}
