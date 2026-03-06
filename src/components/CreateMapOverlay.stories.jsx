import CreateMapOverlay from './CreateMapOverlay';

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

export const Default = {
  args: {
    address: 'C/ Campoamor, 13',
    onAddressChange: () => {},
    onUseCurrentLocation: () => {},
    onRecenter: () => {},
    onCreateAlert: () => {},
    isLoading: false,
    mapRef: { current: null },
  },
};

export const Loading = {
  args: {
    ...Default.args,
    isLoading: true,
  },
};
