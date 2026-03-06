import MapZoomControls from './MapZoomControls';

export default {
  title: 'Components/MapZoomControls',
  component: MapZoomControls,
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'dark', values: [{ name: 'dark', value: '#0a0a0a' }] },
  },
};

export const Default = {
  args: {
    mapRef: { current: null },
    className: '',
  },
};

export const WithCustomPosition = {
  args: {
    ...Default.args,
    className: 'left-[4%]',
  },
};
