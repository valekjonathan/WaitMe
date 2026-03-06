import CreateAlertCard from './CreateAlertCard';

export default {
  title: 'Cards/CreateAlertCard',
  component: CreateAlertCard,
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'dark', values: [{ name: 'dark', value: '#0a0a0a' }] },
  },
  argTypes: {
    address: { control: 'text' },
    isLoading: { control: 'boolean' },
  },
};

export const Default = {
  args: {
    address: 'C/ Campoamor, 13',
    onAddressChange: () => {},
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

export const EmptyAddress = {
  args: {
    ...Default.args,
    address: '',
  },
};
