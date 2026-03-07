import CreateMapOverlay from './CreateMapOverlay';

const defaultArgs = {
  address: 'C/ Campoamor, 13',
  onAddressChange: () => {},
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
 * CreateMapOverlay usa MapScreenPanel (fuente única de verdad).
 */
export const WithLayoutContext = {
  args: defaultArgs,
  decorators: [
    (Story) => (
      <div className="relative w-full min-h-[600px] bg-gray-950">
        <div className="absolute inset-0">
          <Story />
        </div>
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
