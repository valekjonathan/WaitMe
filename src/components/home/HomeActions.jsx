import { Button } from '@/components/ui/button';
import { getMapLayoutPadding } from '@/lib/mapLayoutPadding';

const CarIconProfile = ({ color, size = 'w-16 h-10' }) => (
  <svg viewBox="0 0 48 24" className={size} fill="none">
    <path
      d="M8 16 L10 10 L16 8 L32 8 L38 10 L42 14 L42 18 L8 18 Z"
      fill={color}
      stroke="white"
      strokeWidth="1.5"
    />
    <path
      d="M16 9 L18 12 L30 12 L32 9 Z"
      fill="rgba(255,255,255,0.3)"
      stroke="white"
      strokeWidth="0.5"
    />
    <circle cx="14" cy="18" r="4" fill="#333" stroke="white" strokeWidth="1" />
    <circle cx="14" cy="18" r="2" fill="#666" />
    <circle cx="36" cy="18" r="4" fill="#333" stroke="white" strokeWidth="1" />
    <circle cx="36" cy="18" r="2" fill="#666" />
  </svg>
);

const MagnifierIconProfile = ({ color = '#8b5cf6', size = 'w-14 h-14' }) => (
  <svg viewBox="0 0 48 48" className={size} fill="none">
    <circle cx="20" cy="20" r="12" fill={color} stroke="white" strokeWidth="1.5" />
    <path
      d="M15 16 C16 13, 18 12, 21 12"
      stroke="rgba(255,255,255,0.45)"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path d="M28 28 L38 38" stroke="white" strokeWidth="4" strokeLinecap="round" />
    <path
      d="M36.8 36.8 L40.8 40.8"
      stroke="white"
      strokeWidth="6"
      strokeLinecap="round"
      opacity="0.9"
    />
  </svg>
);

export default function HomeActions({
  onSearchClick,
  onCreateClick,
  mapRef,
  modeRef,
  getCurrentLocation,
  guard,
}) {
  return (
    <div className="w-full space-y-4 mt-4">
      <Button
        onClick={onSearchClick}
        className="w-full h-20 bg-gray-900 hover:bg-gray-800 border border-gray-700 text-white text-lg font-medium rounded-2xl flex items-center justify-center gap-4 [&_svg]:!w-10 [&_svg]:!h-10"
      >
        <MagnifierIconProfile color="#8b5cf6" size="w-14 h-14" />¿ Dónde quieres aparcar ?
      </Button>

      <Button
        onClick={() =>
          guard(() => {
            getCurrentLocation((loc) => {
              if (modeRef.current === 'create' && mapRef.current) {
                const padding = getMapLayoutPadding() ?? {
                  top: 69,
                  bottom: 300,
                  left: 0,
                  right: 0,
                };
                mapRef.current.easeTo?.({
                  center: [loc.lng, loc.lat],
                  zoom: 17,
                  duration: 800,
                  padding,
                });
              }
            });
            onCreateClick();
          })
        }
        className="w-full h-20 bg-purple-600 hover:bg-purple-700 text-white text-lg font-medium rounded-2xl flex items-center justify-center gap-4 [&_svg]:!w-20 [&_svg]:!h-14"
      >
        <CarIconProfile color="#000000" size="w-20 h-14" />¡ Estoy aparcado aquí !
      </Button>
    </div>
  );
}
