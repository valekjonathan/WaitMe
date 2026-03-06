import CreateMapOverlay from './CreateMapOverlay';

const defaultArgs = {
  address: 'C/ Campoamor, 13',
  onAddressChange: () => {},
  onUseCurrentLocation: () => {},
  onRecenter: () => {},
  onCreateAlert: () => {},
  isLoading: false,
  mapRef: { current: null },
};

export default {
  title: 'Components/CreateMapOverlay',
  component: CreateMapOverlay,
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'dark', values: [{ name: 'dark', value: '#0a0a0a' }] },
  },
  decorators: [
    (Story) => (
      <div className="relative w-full min-h-[500px] bg-gray-900">
        <Story />
      </div>
    ),
  ],
};

/** Overlay aislado — para ver tarjeta + zoom sin mapa */
export const Default = {
  args: defaultArgs,
};

export const Loading = {
  args: {
    ...defaultArgs,
    isLoading: true,
  },
};

/**
 * Overlay completo en contexto — simula OverlayLayer + BottomNav.
 * Permite validar posición de la tarjeta respecto al menú inferior
 * sin depender del mapa real.
 */
export const WithLayoutContext = {
  args: defaultArgs,
  decorators: [
    (Story) => (
      <div
        className="relative w-full min-h-[600px] bg-gray-950"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 90px)' }}
      >
        <div className="absolute inset-0 flex flex-col justify-end pointer-events-none">
          <div className="pointer-events-auto">
            <Story />
          </div>
        </div>
        {/* Simulador del menú inferior */}
        <div
          data-waitme-nav
          className="absolute bottom-0 left-0 right-0 h-16 bg-[#0B0B0F] border-t border-white/5 flex items-center justify-center text-gray-500 text-xs"
        >
          [BottomNav simulado]
        </div>
      </div>
    ),
  ],
};
