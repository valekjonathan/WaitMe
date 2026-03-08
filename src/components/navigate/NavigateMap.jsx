/**
 * Mapa de la pantalla Navigate.
 * Browse: 20 coches mock. Con alerta: ruta y marcadores.
 */

import ParkingMap from '@/components/map/ParkingMap';

export default function NavigateMap({
  isBrowseMode,
  browseAlerts,
  displayAlertOrNearest,
  displayAlert,
  userLocation,
  sellerLocation,
  onRouteLoaded,
  userMapIcon,
  sellerMapIcon,
}) {
  return (
    <div className="fixed left-0 right-0 z-0" style={{ top: '56px', bottom: '0' }}>
      <ParkingMap
        alerts={isBrowseMode ? browseAlerts : []}
        userLocation={userLocation}
        selectedAlert={displayAlertOrNearest}
        showRoute={!isBrowseMode && !!displayAlert}
        sellerLocation={sellerLocation?.length >= 2 ? sellerLocation : [43.362, -5.849]}
        zoomControl={false}
        className="h-full w-full"
        userAsCar={false}
        showSellerMarker={!isBrowseMode}
        onRouteLoaded={onRouteLoaded}
        userPhotoHtml={userMapIcon}
        sellerPhotoHtml={sellerMapIcon}
      />
    </div>
  );
}
