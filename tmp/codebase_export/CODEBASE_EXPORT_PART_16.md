
================================================================
FILE: src/services/transactionsSupabase.js
================================================================
```js
/**
 * Servicio de transacciones (Supabase).
 * Sustituye base44.entities.Transaction.
 */
import { getSupabase } from '@/lib/supabaseClient';

const TABLE = 'transactions';

/**
 * Normaliza fila a formato esperado por History/HistoryBuyerView/HistorySellerView.
 */
function normalizeTransaction(row, { buyerProfile, sellerProfile, alert } = {}) {
  if (!row) return null;
  const meta = row.metadata || {};
  const alertMeta = alert?.metadata || {};
  return {
    id: row.id,
    buyer_id: row.buyer_id,
    seller_id: row.seller_id,
    alert_id: row.alert_id,
    amount: Number(row.amount) ?? 0,
    status: row.status || 'pending',
    address: row.address ?? meta.address ?? alert?.address ?? alert?.address_text ?? null,
    created_date: row.created_at,
    seller_name: meta.seller_name ?? sellerProfile?.full_name ?? 'Usuario',
    seller_photo_url: meta.seller_photo_url ?? sellerProfile?.avatar_url ?? null,
    buyer_name: meta.buyer_name ?? buyerProfile?.full_name ?? 'Usuario',
    buyer_photo_url: meta.buyer_photo_url ?? buyerProfile?.avatar_url ?? null,
    seller_car: meta.seller_car ?? ((`${alert?.brand || ''} ${alert?.model || ''}`.trim()) || null),
    seller_brand: meta.seller_brand ?? alert?.brand ?? null,
    seller_model: meta.seller_model ?? alert?.model ?? null,
    seller_plate: meta.seller_plate ?? alert?.plate ?? alertMeta?.reserved_by_plate ?? null,
    seller_color: meta.seller_color ?? alert?.color ?? null,
    buyer_car: meta.buyer_car ?? alertMeta?.reserved_by_car ?? null,
    buyer_brand: meta.buyer_brand ?? null,
    buyer_model: meta.buyer_model ?? null,
    buyer_plate: meta.buyer_plate ?? alertMeta?.reserved_by_plate ?? null,
    buyer_color: meta.buyer_color ?? null,
  };
}

/**
 * Crea una transacción.
 * @param {Object} payload - { buyer_id, seller_id, alert_id, amount, status?, seller_name?, buyer_name?, seller_earnings?, platform_fee?, address? }
 * @returns {{ data, error }}
 */
export async function createTransaction(payload) {
  const supabase = getSupabase();
  if (!supabase) return { data: null, error: new Error('Supabase no configurado') };

  const row = {
    buyer_id: payload.buyer_id,
    seller_id: payload.seller_id,
    alert_id: payload.alert_id ?? null,
    amount: Number(payload.amount) ?? 0,
    status: payload.status || 'pending',
    seller_earnings: payload.seller_earnings != null ? Number(payload.seller_earnings) : null,
    platform_fee: payload.platform_fee != null ? Number(payload.platform_fee) : null,
    address: payload.address ?? null,
    metadata: {},
  };
  if (payload.seller_name) row.metadata.seller_name = payload.seller_name;
  if (payload.buyer_name) row.metadata.buyer_name = payload.buyer_name;
  if (payload.seller_photo_url) row.metadata.seller_photo_url = payload.seller_photo_url;
  if (payload.buyer_photo_url) row.metadata.buyer_photo_url = payload.buyer_photo_url;
  if (payload.seller_car) row.metadata.seller_car = payload.seller_car;
  if (payload.buyer_car) row.metadata.buyer_car = payload.buyer_car;
  if (payload.seller_plate) row.metadata.seller_plate = payload.seller_plate;
  if (payload.buyer_plate) row.metadata.buyer_plate = payload.buyer_plate;

  const { data, error } = await supabase
    .from(TABLE)
    .insert(row)
    .select()
    .single();

  if (error) return { data: null, error };
  return { data: normalizeTransaction(data), error: null };
}

/**
 * Lista transacciones del usuario (como buyer o seller).
 * @param {string} userId
 * @param {Object} opts - { limit?: number }
 * @returns {{ data: Array, error }}
 */
export async function listTransactions(userId, opts = {}) {
  const supabase = getSupabase();
  if (!supabase) return { data: [], error: new Error('Supabase no configurado') };

  const limit = opts.limit ?? 5000;

  const { data: rows, error } = await supabase
    .from(TABLE)
    .select('*')
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return { data: [], error };
  if (!rows?.length) return { data: [], error: null };

  const buyerIds = [...new Set(rows.map((r) => r.buyer_id).filter(Boolean))];
  const sellerIds = [...new Set(rows.map((r) => r.seller_id).filter(Boolean))];
  const alertIds = [...new Set(rows.map((r) => r.alert_id).filter(Boolean))];

  const [profilesRes, alertsRes] = await Promise.all([
    supabase.from('profiles').select('id, full_name, avatar_url').in('id', [...buyerIds, ...sellerIds]),
    alertIds.length
      ? supabase.from('parking_alerts').select('id, metadata, address_text').in('id', alertIds)
      : { data: [] },
  ]);

  const profileMap = Object.fromEntries((profilesRes?.data ?? []).map((p) => [p.id, p]));
  const alertMap = Object.fromEntries((alertsRes?.data ?? []).map((a) => [a.id, a]));

  const data = rows.map((r) =>
    normalizeTransaction(r, {
      buyerProfile: profileMap[r.buyer_id],
      sellerProfile: profileMap[r.seller_id],
      alert: alertMap[r.alert_id],
    })
  );
  return { data, error: null };
}

```

================================================================
FILE: src/services/uploadsSupabase.js
================================================================
```js
/**
 * Servicio de uploads (Supabase Storage).
 * Sustituye base44.integrations.Core.UploadFile.
 */
import { getSupabase } from '@/lib/supabaseClient';

const BUCKET = 'uploads';

/**
 * Sube un archivo al bucket uploads.
 * @param {File} file - Archivo a subir
 * @param {string} path - Ruta en el bucket (ej: "userId/1234567890.jpg")
 * @returns {{ url?: string, file_url?: string, error?: Error }}
 */
export async function uploadFile(file, path) {
  const supabase = getSupabase();
  if (!supabase) return { error: new Error('Supabase no configurado') };

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true });

  if (error) return { error };
  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
  return { url: urlData.publicUrl, file_url: urlData.publicUrl };
}

/**
 * Obtiene la URL pública de un archivo.
 * @param {string} path - Ruta en el bucket
 * @returns {string}
 */
export function getPublicUrl(path) {
  const supabase = getSupabase();
  if (!supabase) return '';
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Elimina un archivo del bucket.
 * @param {string} path - Ruta en el bucket
 * @returns {{ error?: Error }}
 */
export async function deleteFile(path) {
  const supabase = getSupabase();
  if (!supabase) return { error: new Error('Supabase no configurado') };
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  return { error };
}

```

================================================================
FILE: src/services/userLocationsSupabase.js
================================================================
```js
/**
 * Servicio de ubicaciones de usuario (Supabase).
 * Sustituye base44.entities.UserLocation.
 * Usa tabla user_location_updates (user_id, alert_id, lat, lng, is_active).
 */
import { getSupabase } from '@/lib/supabaseClient';

const TABLE = 'user_location_updates';

/**
 * Obtiene ubicaciones activas por alert_id (compradores navegando hacia la alerta).
 * @param {string} alertId
 * @returns {Promise<Array<{ user_id, alert_id, latitude, longitude, is_active }>>}
 */
export async function getLocationsByAlert(alertId) {
  if (!alertId) return [];
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data: rows, error } = await supabase
    .from(TABLE)
    .select('user_id, alert_id, lat, lng, is_active, updated_at')
    .eq('alert_id', alertId)
    .eq('is_active', true)
    .order('updated_at', { ascending: false });

  if (error) return [];
  return (rows ?? []).map((r) => ({
    user_id: r.user_id,
    alert_id: r.alert_id,
    latitude: r.lat,
    longitude: r.lng,
    is_active: r.is_active ?? true,
    updated_at: r.updated_at,
  }));
}

/**
 * Upserta la ubicación del usuario para una alerta (comprador navegando).
 * @param {Object} payload - { userId, alertId, lat, lng, accuracyM? }
 * @returns {{ data, error }}
 */
export async function upsertLocationForAlert(payload) {
  const supabase = getSupabase();
  if (!supabase) return { data: null, error: new Error('Supabase no configurado') };

  const { userId, alertId, lat, lng, accuracyM } = payload;
  const { data, error } = await supabase
    .from(TABLE)
    .upsert(
      {
        user_id: userId,
        alert_id: alertId,
        lat,
        lng,
        accuracy_m: accuracyM ?? null,
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,alert_id', ignoreDuplicates: false }
    )
    .select()
    .single();

  if (error) return { data: null, error };
  return { data, error: null };
}

```

================================================================
FILE: src/state/appStore.js
================================================================
```js
/**
 * Store global con Zustand.
 * NO contiene llamadas a Supabase.
 */
import { create } from 'zustand';

export const useAppStore = create((set) => ({
  auth: { user: null },
  profile: null,
  alerts: { items: [], loading: false },
  location: { lat: null, lng: null, accuracy: null },
  ui: { error: null },

  setUser: (user) => set((s) => ({ auth: { ...s.auth, user } })),
  setProfile: (profile) => set({ profile }),
  setLocation: (lat, lng, accuracy) =>
    set({ location: { lat, lng, accuracy } }),
  setAlerts: (items) =>
    set((s) => ({ alerts: { ...s.alerts, items: items ?? [], loading: false } })),
  setAlertsLoading: (loading) =>
    set((s) => ({ alerts: { ...s.alerts, loading } })),
  upsertAlert: (alert) =>
    set((s) => {
      const items = [...s.alerts.items];
      const idx = items.findIndex((a) => a.id === alert.id);
      if (idx >= 0) items[idx] = { ...items[idx], ...alert };
      else items.push(alert);
      return { alerts: { ...s.alerts, items } };
    }),
  removeAlert: (id) =>
    set((s) => ({
      alerts: {
        ...s.alerts,
        items: s.alerts.items.filter((a) => a.id !== id),
      },
    })),
  setError: (error) => set({ ui: { error } }),
  clearError: () => set((s) => ({ ui: { ...s.ui, error: null } })),
}));

```

================================================================
FILE: src/stories/Button.jsx
================================================================
```jsx
import React from 'react';

import PropTypes from 'prop-types';

import './button.css';

/** Primary UI component for user interaction */
export const Button = ({
  primary = false,
  backgroundColor = null,
  size = 'medium',
  label,
  ...props
}) => {
  const mode = primary ? 'storybook-button--primary' : 'storybook-button--secondary';
  return (
    <button
      type="button"
      className={['storybook-button', `storybook-button--${size}`, mode].join(' ')}
      style={backgroundColor && { backgroundColor }}
      {...props}
    >
      {label}
    </button>
  );
};

Button.propTypes = {
  /** Is this the principal call to action on the page? */
  primary: PropTypes.bool,
  /** What background color to use */
  backgroundColor: PropTypes.string,
  /** How large should the button be? */
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  /** Button contents */
  label: PropTypes.string.isRequired,
  /** Optional click handler */
  onClick: PropTypes.func,
};

```

================================================================
FILE: src/stories/Button.stories.js
================================================================
```js
import { fn } from 'storybook/test';

import { Button } from './Button';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
export default {
  title: 'Example/Button',
  component: Button,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {
    backgroundColor: { control: 'color' },
  },
  // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#story-args
  args: { onClick: fn() },
};

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Primary = {
  args: {
    primary: true,
    label: 'Button',
  },
};

export const Secondary = {
  args: {
    label: 'Button',
  },
};

export const Large = {
  args: {
    size: 'large',
    label: 'Button',
  },
};

export const Small = {
  args: {
    size: 'small',
    label: 'Button',
  },
};

```

================================================================
FILE: src/stories/Configure.mdx
================================================================
```mdx
import { Meta } from "@storybook/addon-docs/blocks";

import Github from "./assets/github.svg";
import Discord from "./assets/discord.svg";
import Youtube from "./assets/youtube.svg";
import Tutorials from "./assets/tutorials.svg";
import Styling from "./assets/styling.png";
import Context from "./assets/context.png";
import Assets from "./assets/assets.png";
import Docs from "./assets/docs.png";
import Share from "./assets/share.png";
import FigmaPlugin from "./assets/figma-plugin.png";
import Testing from "./assets/testing.png";
import Accessibility from "./assets/accessibility.png";
import Theming from "./assets/theming.png";
import AddonLibrary from "./assets/addon-library.png";

export const RightArrow = () => <svg 
    viewBox="0 0 14 14" 
    width="8px" 
    height="14px" 
    style={{ 
      marginLeft: '4px',
      display: 'inline-block',
      shapeRendering: 'inherit',
      verticalAlign: 'middle',
      fill: 'currentColor',
      'path fill': 'currentColor'
    }}
>
  <path d="m11.1 7.35-5.5 5.5a.5.5 0 0 1-.7-.7L10.04 7 4.9 1.85a.5.5 0 1 1 .7-.7l5.5 5.5c.2.2.2.5 0 .7Z" />
</svg>

<Meta title="Configure your project" />

<div className="sb-container">
  <div className='sb-section-title'>
    # Configure your project

    Because Storybook works separately from your app, you'll need to configure it for your specific stack and setup. Below, explore guides for configuring Storybook with popular frameworks and tools. If you get stuck, learn how you can ask for help from our community.
  </div>
  <div className="sb-section">
    <div className="sb-section-item">
      <img
        src={Styling}
        alt="A wall of logos representing different styling technologies"
      />
      <h4 className="sb-section-item-heading">Add styling and CSS</h4>
      <p className="sb-section-item-paragraph">Like with web applications, there are many ways to include CSS within Storybook. Learn more about setting up styling within Storybook.</p>
      <a
        href="https://storybook.js.org/docs/configure/styling-and-css/?renderer=react&ref=configure"
        target="_blank"
      >Learn more<RightArrow /></a>
    </div>
    <div className="sb-section-item">
      <img
        src={Context}
        alt="An abstraction representing the composition of data for a component"
      />
      <h4 className="sb-section-item-heading">Provide context and mocking</h4>
      <p className="sb-section-item-paragraph">Often when a story doesn't render, it's because your component is expecting a specific environment or context (like a theme provider) to be available.</p>
      <a
        href="https://storybook.js.org/docs/writing-stories/decorators/?renderer=react&ref=configure#context-for-mocking"
        target="_blank"
      >Learn more<RightArrow /></a>
    </div>
    <div className="sb-section-item">
      <img src={Assets} alt="A representation of typography and image assets" />
      <div>
        <h4 className="sb-section-item-heading">Load assets and resources</h4>
        <p className="sb-section-item-paragraph">To link static files (like fonts) to your projects and stories, use the
        `staticDirs` configuration option to specify folders to load when
        starting Storybook.</p>
        <a
          href="https://storybook.js.org/docs/configure/images-and-assets/?renderer=react&ref=configure"
          target="_blank"
        >Learn more<RightArrow /></a>
      </div>
    </div>
  </div>
</div>
<div className="sb-container">
  <div className='sb-section-title'>
    # Do more with Storybook

    Now that you know the basics, let's explore other parts of Storybook that will improve your experience. This list is just to get you started. You can customise Storybook in many ways to fit your needs.
  </div>

  <div className="sb-section">
    <div className="sb-features-grid">
      <div className="sb-grid-item">
        <img src={Docs} alt="A screenshot showing the autodocs tag being set, pointing a docs page being generated" />
        <h4 className="sb-section-item-heading">Autodocs</h4>
        <p className="sb-section-item-paragraph">Auto-generate living,
          interactive reference documentation from your components and stories.</p>
        <a
          href="https://storybook.js.org/docs/writing-docs/autodocs/?renderer=react&ref=configure"
          target="_blank"
        >Learn more<RightArrow /></a>
      </div>
      <div className="sb-grid-item">
        <img src={Share} alt="A browser window showing a Storybook being published to a chromatic.com URL" />
        <h4 className="sb-section-item-heading">Publish to Chromatic</h4>
        <p className="sb-section-item-paragraph">Publish your Storybook to review and collaborate with your entire team.</p>
        <a
          href="https://storybook.js.org/docs/sharing/publish-storybook/?renderer=react&ref=configure#publish-storybook-with-chromatic"
          target="_blank"
        >Learn more<RightArrow /></a>
      </div>
      <div className="sb-grid-item">
        <img src={FigmaPlugin} alt="Windows showing the Storybook plugin in Figma" />
        <h4 className="sb-section-item-heading">Figma Plugin</h4>
        <p className="sb-section-item-paragraph">Embed your stories into Figma to cross-reference the design and live
          implementation in one place.</p>
        <a
          href="https://storybook.js.org/docs/sharing/design-integrations/?renderer=react&ref=configure#embed-storybook-in-figma-with-the-plugin"
          target="_blank"
        >Learn more<RightArrow /></a>
      </div>
      <div className="sb-grid-item">
        <img src={Testing} alt="Screenshot of tests passing and failing" />
        <h4 className="sb-section-item-heading">Testing</h4>
        <p className="sb-section-item-paragraph">Use stories to test a component in all its variations, no matter how
          complex.</p>
        <a
          href="https://storybook.js.org/docs/writing-tests/?renderer=react&ref=configure"
          target="_blank"
        >Learn more<RightArrow /></a>
      </div>
      <div className="sb-grid-item">
        <img src={Accessibility} alt="Screenshot of accessibility tests passing and failing" />
        <h4 className="sb-section-item-heading">Accessibility</h4>
        <p className="sb-section-item-paragraph">Automatically test your components for a11y issues as you develop.</p>
        <a
          href="https://storybook.js.org/docs/writing-tests/accessibility-testing/?renderer=react&ref=configure"
          target="_blank"
        >Learn more<RightArrow /></a>
      </div>
      <div className="sb-grid-item">
        <img src={Theming} alt="Screenshot of Storybook in light and dark mode" />
        <h4 className="sb-section-item-heading">Theming</h4>
        <p className="sb-section-item-paragraph">Theme Storybook's UI to personalize it to your project.</p>
        <a
          href="https://storybook.js.org/docs/configure/theming/?renderer=react&ref=configure"
          target="_blank"
        >Learn more<RightArrow /></a>
      </div>
    </div>
  </div>
</div>
<div className='sb-addon'>
  <div className='sb-addon-text'>
    <h4>Addons</h4>
    <p className="sb-section-item-paragraph">Integrate your tools with Storybook to connect workflows.</p>
    <a
        href="https://storybook.js.org/addons/?ref=configure"
        target="_blank"
      >Discover all addons<RightArrow /></a>
  </div>
  <div className='sb-addon-img'>
    <img src={AddonLibrary} alt="Integrate your tools with Storybook to connect workflows." />
  </div>
</div>

<div className="sb-section sb-socials">
    <div className="sb-section-item">
      <img src={Github} alt="Github logo" className="sb-explore-image"/>
      Join our contributors building the future of UI development.

      <a
        href="https://github.com/storybookjs/storybook"
        target="_blank"
      >Star on GitHub<RightArrow /></a>
    </div>
    <div className="sb-section-item">
      <img src={Discord} alt="Discord logo" className="sb-explore-image"/>
      <div>
        Get support and chat with frontend developers.

        <a
          href="https://discord.gg/storybook"
          target="_blank"
        >Join Discord server<RightArrow /></a>
      </div>
    </div>
    <div className="sb-section-item">
      <img src={Youtube} alt="Youtube logo" className="sb-explore-image"/>
      <div>
        Watch tutorials, feature previews and interviews.

        <a
          href="https://www.youtube.com/@chromaticui"
          target="_blank"
        >Watch on YouTube<RightArrow /></a>
      </div>
    </div>
    <div className="sb-section-item">
      <img src={Tutorials} alt="A book" className="sb-explore-image"/>
      <p>Follow guided walkthroughs on for key workflows.</p>

      <a
          href="https://storybook.js.org/tutorials/?ref=configure"
          target="_blank"
        >Discover tutorials<RightArrow /></a>
    </div>
</div>

<style>
  {`
  .sb-container {
    margin-bottom: 48px;
  }

  .sb-section {
    width: 100%;
    display: flex;
    flex-direction: row;
    gap: 20px;
  }

  img {
    object-fit: cover;
  }

  .sb-section-title {
    margin-bottom: 32px;
  }

  .sb-section a:not(h1 a, h2 a, h3 a) {
    font-size: 14px;
  }

  .sb-section-item, .sb-grid-item {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .sb-section-item-heading {
    padding-top: 20px !important;
    padding-bottom: 5px !important;
    margin: 0 !important;
  }
  .sb-section-item-paragraph {
    margin: 0;
    padding-bottom: 10px;
  }

  .sb-chevron {
    margin-left: 5px;
  }

  .sb-features-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-gap: 32px 20px;
  }

  .sb-socials {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
  }

  .sb-socials p {
    margin-bottom: 10px;
  }

  .sb-explore-image {
    max-height: 32px;
    align-self: flex-start;
  }

  .sb-addon {
    width: 100%;
    display: flex;
    align-items: center;
    position: relative;
    background-color: #EEF3F8;
    border-radius: 5px;
    border: 1px solid rgba(0, 0, 0, 0.05);
    background: #EEF3F8;
    height: 180px;
    margin-bottom: 48px;
    overflow: hidden;
  }

  .sb-addon-text {
    padding-left: 48px;
    max-width: 240px;
  }

  .sb-addon-text h4 {
    padding-top: 0px;
  }

  .sb-addon-img {
    position: absolute;
    left: 345px;
    top: 0;
    height: 100%;
    width: 200%;
    overflow: hidden;
  }

  .sb-addon-img img {
    width: 650px;
    transform: rotate(-15deg);
    margin-left: 40px;
    margin-top: -72px;
    box-shadow: 0 0 1px rgba(255, 255, 255, 0);
    backface-visibility: hidden;
  }

  @media screen and (max-width: 800px) {
    .sb-addon-img {
      left: 300px;
    }
  }

  @media screen and (max-width: 600px) {
    .sb-section {
      flex-direction: column;
    }

    .sb-features-grid {
      grid-template-columns: repeat(1, 1fr);
    }

    .sb-socials {
      grid-template-columns: repeat(2, 1fr);
    }

    .sb-addon {
      height: 280px;
      align-items: flex-start;
      padding-top: 32px;
      overflow: hidden;
    }

    .sb-addon-text {
      padding-left: 24px;
    }

    .sb-addon-img {
      right: 0;
      left: 0;
      top: 130px;
      bottom: 0;
      overflow: hidden;
      height: auto;
      width: 124%;
    }

    .sb-addon-img img {
      width: 1200px;
      transform: rotate(-12deg);
      margin-left: 0;
      margin-top: 48px;
      margin-bottom: -40px;
      margin-left: -24px;
    }
  }
  `}
</style>

```

================================================================
FILE: src/stories/Header.jsx
================================================================
```jsx
import React from 'react';

import PropTypes from 'prop-types';

import { Button } from './Button';
import './header.css';

export const Header = ({ user = null, onLogin, onLogout, onCreateAccount }) => (
  <header>
    <div className="storybook-header">
      <div>
        <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
          <g fill="none" fillRule="evenodd">
            <path
              d="M10 0h12a10 10 0 0110 10v12a10 10 0 01-10 10H10A10 10 0 010 22V10A10 10 0 0110 0z"
              fill="#FFF"
            />
            <path
              d="M5.3 10.6l10.4 6v11.1l-10.4-6v-11zm11.4-6.2l9.7 5.5-9.7 5.6V4.4z"
              fill="#555AB9"
            />
            <path
              d="M27.2 10.6v11.2l-10.5 6V16.5l10.5-6zM15.7 4.4v11L6 10l9.7-5.5z"
              fill="#91BAF8"
            />
          </g>
        </svg>
        <h1>Acme</h1>
      </div>
      <div>
        {user ? (
          <>
            <span className="welcome">
              Welcome, <b>{user.name}</b>!
            </span>
            <Button size="small" onClick={onLogout} label="Log out" />
          </>
        ) : (
          <>
            <Button size="small" onClick={onLogin} label="Log in" />
            <Button primary size="small" onClick={onCreateAccount} label="Sign up" />
          </>
        )}
      </div>
    </div>
  </header>
);

Header.propTypes = {
  user: PropTypes.shape({
    name: PropTypes.string.isRequired,
  }),
  onLogin: PropTypes.func.isRequired,
  onLogout: PropTypes.func.isRequired,
  onCreateAccount: PropTypes.func.isRequired,
};

```

================================================================
FILE: src/stories/Header.stories.js
================================================================
```js
import { fn } from 'storybook/test';

import { Header } from './Header';

export default {
  title: 'Example/Header',
  component: Header,
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/configure/story-layout
    layout: 'fullscreen',
  },
  args: {
    onLogin: fn(),
    onLogout: fn(),
    onCreateAccount: fn(),
  },
};

export const LoggedIn = {
  args: {
    user: {
      name: 'Jane Doe',
    },
  },
};

export const LoggedOut = {};

```

================================================================
FILE: src/stories/Page.jsx
================================================================
```jsx
import React from 'react';

import { Header } from './Header';
import './page.css';

export const Page = () => {
  const [user, setUser] = React.useState();

  return (
    <article>
      <Header
        user={user}
        onLogin={() => setUser({ name: 'Jane Doe' })}
        onLogout={() => setUser(undefined)}
        onCreateAccount={() => setUser({ name: 'Jane Doe' })}
      />

      <section className="storybook-page">
        <h2>Pages in Storybook</h2>
        <p>
          We recommend building UIs with a{' '}
          <a href="https://componentdriven.org" target="_blank" rel="noopener noreferrer">
            <strong>component-driven</strong>
          </a>{' '}
          process starting with atomic components and ending with pages.
        </p>
        <p>
          Render pages with mock data. This makes it easy to build and review page states without
          needing to navigate to them in your app. Here are some handy patterns for managing page
          data in Storybook:
        </p>
        <ul>
          <li>
            Use a higher-level connected component. Storybook helps you compose such data from the
            "args" of child component stories
          </li>
          <li>
            Assemble data in the page component from your services. You can mock these services out
            using Storybook.
          </li>
        </ul>
        <p>
          Get a guided tutorial on component-driven development at{' '}
          <a href="https://storybook.js.org/tutorials/" target="_blank" rel="noopener noreferrer">
            Storybook tutorials
          </a>
          . Read more in the{' '}
          <a href="https://storybook.js.org/docs" target="_blank" rel="noopener noreferrer">
            docs
          </a>
          .
        </p>
        <div className="tip-wrapper">
          <span className="tip">Tip</span> Adjust the width of the canvas with the{' '}
          <svg width="10" height="10" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
            <g fill="none" fillRule="evenodd">
              <path
                d="M1.5 5.2h4.8c.3 0 .5.2.5.4v5.1c-.1.2-.3.3-.4.3H1.4a.5.5 0 01-.5-.4V5.7c0-.3.2-.5.5-.5zm0-2.1h6.9c.3 0 .5.2.5.4v7a.5.5 0 01-1 0V4H1.5a.5.5 0 010-1zm0-2.1h9c.3 0 .5.2.5.4v9.1a.5.5 0 01-1 0V2H1.5a.5.5 0 010-1zm4.3 5.2H2V10h3.8V6.2z"
                id="a"
                fill="#999"
              />
            </g>
          </svg>
          Viewports addon in the toolbar
        </div>
      </section>
    </article>
  );
};

```

================================================================
FILE: src/stories/Page.stories.js
================================================================
```js
import { expect, userEvent, within } from 'storybook/test';

import { Page } from './Page';

export default {
  title: 'Example/Page',
  component: Page,
  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/configure/story-layout
    layout: 'fullscreen',
  },
};

export const LoggedOut = {};

// More on component testing: https://storybook.js.org/docs/writing-tests/interaction-testing
export const LoggedIn = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const loginButton = canvas.getByRole('button', { name: /Log in/i });
    await expect(loginButton).toBeInTheDocument();
    await userEvent.click(loginButton);
    await expect(loginButton).not.toBeInTheDocument();

    const logoutButton = canvas.getByRole('button', { name: /Log out/i });
    await expect(logoutButton).toBeInTheDocument();
  },
};

```

================================================================
FILE: src/stories/button.css
================================================================
```css
.storybook-button {
  display: inline-block;
  cursor: pointer;
  border: 0;
  border-radius: 3em;
  font-weight: 700;
  line-height: 1;
  font-family: 'Nunito Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
}
.storybook-button--primary {
  background-color: #555ab9;
  color: white;
}
.storybook-button--secondary {
  box-shadow: rgba(0, 0, 0, 0.15) 0px 0px 0px 1px inset;
  background-color: transparent;
  color: #333;
}
.storybook-button--small {
  padding: 10px 16px;
  font-size: 12px;
}
.storybook-button--medium {
  padding: 11px 20px;
  font-size: 14px;
}
.storybook-button--large {
  padding: 12px 24px;
  font-size: 16px;
}

```

================================================================
FILE: src/stories/header.css
================================================================
```css
.storybook-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  padding: 15px 20px;
  font-family: 'Nunito Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

.storybook-header svg {
  display: inline-block;
  vertical-align: top;
}

.storybook-header h1 {
  display: inline-block;
  vertical-align: top;
  margin: 6px 0 6px 10px;
  font-weight: 700;
  font-size: 20px;
  line-height: 1;
}

.storybook-header button + button {
  margin-left: 10px;
}

.storybook-header .welcome {
  margin-right: 10px;
  color: #333;
  font-size: 14px;
}

```

================================================================
FILE: src/stories/page.css
================================================================
```css
.storybook-page {
  margin: 0 auto;
  padding: 48px 20px;
  max-width: 600px;
  color: #333;
  font-size: 14px;
  line-height: 24px;
  font-family: 'Nunito Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

.storybook-page h2 {
  display: inline-block;
  vertical-align: top;
  margin: 0 0 4px;
  font-weight: 700;
  font-size: 32px;
  line-height: 1;
}

.storybook-page p {
  margin: 1em 0;
}

.storybook-page a {
  color: inherit;
}

.storybook-page ul {
  margin: 1em 0;
  padding-left: 30px;
}

.storybook-page li {
  margin-bottom: 8px;
}

.storybook-page .tip {
  display: inline-block;
  vertical-align: top;
  margin-right: 10px;
  border-radius: 1em;
  background: #e7fdd8;
  padding: 4px 12px;
  color: #357a14;
  font-weight: 700;
  font-size: 11px;
  line-height: 12px;
}

.storybook-page .tip-wrapper {
  margin-top: 40px;
  margin-bottom: 40px;
  font-size: 13px;
  line-height: 20px;
}

.storybook-page .tip-wrapper svg {
  display: inline-block;
  vertical-align: top;
  margin-top: 3px;
  margin-right: 4px;
  width: 12px;
  height: 12px;
}

.storybook-page .tip-wrapper svg path {
  fill: #1ea7fd;
}

```

================================================================
FILE: src/styles/no-zoom.css
================================================================
```css
/**
 * Evita zoom en iOS Safari/Capacitor al enfocar inputs.
 * Safari hace zoom automático si font-size < 16px.
 */
@supports (-webkit-touch-callout: none) {
  input,
  select,
  textarea {
    font-size: 16px !important;
    line-height: 1.4;
  }
}

```

================================================================
FILE: src/utils/carUtils.js
================================================================
```js
/**
 * Shared car-related utilities used across multiple components.
 */

export const CAR_COLOR_MAP = {
  blanco:   '#FFFFFF',
  negro:    '#1a1a1a',
  gris:     '#6b7280',
  plata:    '#d1d5db',
  rojo:     '#ef4444',
  azul:     '#3b82f6',
  verde:    '#22c55e',
  amarillo: '#eab308',
  naranja:  '#f97316',
  morado:   '#7c3aed',
  rosa:     '#ec4899',
  beige:    '#d4b483',
  marron:   '#92400e',
};

/**
 * Returns a hex color for a Spanish car color name.
 * @param {string} colorName - e.g. "azul", "rojo"
 * @returns {string} hex color string
 */
export function getCarFill(colorName) {
  if (!colorName) return '#6b7280';
  const key = String(colorName)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  return CAR_COLOR_MAP[key] ?? '#6b7280';
}

/**
 * Formats a Spanish license plate string as "NNNN LLL".
 * @param {string} plate
 * @returns {string}
 */
export function formatPlate(plate) {
  const p = String(plate || '').replace(/\s+/g, '').toUpperCase();
  if (!p) return '0000 XXX';
  return `${p.slice(0, 4)} ${p.slice(4)}`.trim();
}

/**
 * Haversine distance in kilometres between two lat/lon points.
 * @returns {number} km
 */
export function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Haversine distance in metres.
 * @returns {number} metres
 */
export function haversineMeters(lat1, lon1, lat2, lon2) {
  return haversineKm(lat1, lon1, lat2, lon2) * 1000;
}

```

================================================================
FILE: src/utils/index.ts
================================================================
```ts
export function createPageUrl(pageName: string) {
  const raw = String(pageName || '').trim();
  return '/' + raw.toLowerCase();
}
```

================================================================
FILE: supabase/README.md
================================================================
```md
# Supabase

This directory contains the Supabase configuration and migrations for WaitMe.

## Structure

```
supabase/
├── config.toml    # Local development config
├── migrations/   # SQL migrations (version-controlled)
├── functions/    # Edge functions (optional)
└── seed.sql      # Seed data for local db reset
```

## Migrations

Migrations are applied in order by filename (timestamp prefix). To create a new migration:

```bash
npx supabase migration new <name>
```

## GitHub Actions

Migrations are pushed to the linked Supabase project when changes in `supabase/migrations/` are pushed to `main`.

**Required secrets:** See [docs/SETUP_SUPABASE_GITHUB_SECRETS.md](../docs/SETUP_SUPABASE_GITHUB_SECRETS.md)

- `SUPABASE_ACCESS_TOKEN` - From [Supabase Dashboard](https://supabase.com/dashboard/account/tokens)
- `SUPABASE_PROJECT_REF` - Project reference from Project Settings → General
- `SUPABASE_DB_PASSWORD` - Database password

**Link project locally:**
```bash
npx supabase login
npx supabase link --project-ref <PROJECT_REF>
```

## Local development

```bash
npx supabase start   # Requires Docker
npx supabase db reset  # Apply migrations + seed
```

```

================================================================
FILE: supabase/config.toml
================================================================
```toml
# For detailed configuration reference documentation, visit:
# https://supabase.com/docs/guides/local-development/cli/config
# A string used to distinguish different Supabase projects on the same host. Defaults to the
# working directory name when running `supabase init`.
project_id = "WaitMeNuevo"

[api]
enabled = true
# Port to use for the API URL.
port = 54321
# Schemas to expose in your API. Tables, views and stored procedures in this schema will get API
# endpoints. `public` and `graphql_public` schemas are included by default.
schemas = ["public", "graphql_public"]
# Extra schemas to add to the search_path of every request.
extra_search_path = ["public", "extensions"]
# The maximum number of rows returns from a view, table, or stored procedure. Limits payload size
# for accidental or malicious requests.
max_rows = 1000

[api.tls]
# Enable HTTPS endpoints locally using a self-signed certificate.
enabled = false
# Paths to self-signed certificate pair.
# cert_path = "../certs/my-cert.pem"
# key_path = "../certs/my-key.pem"

[db]
# Port to use for the local database URL.
port = 54322
# Port used by db diff command to initialize the shadow database.
shadow_port = 54320
# Maximum amount of time to wait for health check when starting the local database.
health_timeout = "2m"
# The database major version to use. This has to be the same as your remote database's. Run `SHOW
# server_version;` on the remote database to check.
major_version = 17

[db.pooler]
enabled = false
# Port to use for the local connection pooler.
port = 54329
# Specifies when a server connection can be reused by other clients.
# Configure one of the supported pooler modes: `transaction`, `session`.
pool_mode = "transaction"
# How many server connections to allow per user/database pair.
default_pool_size = 20
# Maximum number of client connections allowed.
max_client_conn = 100

# [db.vault]
# secret_key = "env(SECRET_VALUE)"

[db.migrations]
# If disabled, migrations will be skipped during a db push or reset.
enabled = true
# Specifies an ordered list of schema files that describe your database.
# Supports glob patterns relative to supabase directory: "./schemas/*.sql"
schema_paths = []

[db.seed]
# If enabled, seeds the database after migrations during a db reset.
enabled = true
# Specifies an ordered list of seed files to load during db reset.
# Supports glob patterns relative to supabase directory: "./seeds/*.sql"
sql_paths = ["./seed.sql"]

[db.network_restrictions]
# Enable management of network restrictions.
enabled = false
# List of IPv4 CIDR blocks allowed to connect to the database.
# Defaults to allow all IPv4 connections. Set empty array to block all IPs.
allowed_cidrs = ["0.0.0.0/0"]
# List of IPv6 CIDR blocks allowed to connect to the database.
# Defaults to allow all IPv6 connections. Set empty array to block all IPs.
allowed_cidrs_v6 = ["::/0"]

# Uncomment to reject non-secure connections to the database.
# [db.ssl_enforcement]
# enabled = true

[realtime]
enabled = true
# Bind realtime via either IPv4 or IPv6. (default: IPv4)
# ip_version = "IPv6"
# The maximum length in bytes of HTTP request headers. (default: 4096)
# max_header_length = 4096

[studio]
enabled = true
# Port to use for Supabase Studio.
port = 54323
# External URL of the API server that frontend connects to.
api_url = "http://127.0.0.1"
# OpenAI API Key to use for Supabase AI in the Supabase Studio.
openai_api_key = "env(OPENAI_API_KEY)"

# Email testing server. Emails sent with the local dev setup are not actually sent - rather, they
# are monitored, and you can view the emails that would have been sent from the web interface.
[inbucket]
enabled = true
# Port to use for the email testing server web interface.
port = 54324
# Uncomment to expose additional ports for testing user applications that send emails.
# smtp_port = 54325
# pop3_port = 54326
# admin_email = "admin@email.com"
# sender_name = "Admin"

[storage]
enabled = true
# The maximum file size allowed (e.g. "5MB", "500KB").
file_size_limit = "50MiB"

# Uncomment to configure local storage buckets
# [storage.buckets.images]
# public = false
# file_size_limit = "50MiB"
# allowed_mime_types = ["image/png", "image/jpeg"]
# objects_path = "./images"

# Allow connections via S3 compatible clients
[storage.s3_protocol]
enabled = true

# Image transformation API is available to Supabase Pro plan.
# [storage.image_transformation]
# enabled = true

# Store analytical data in S3 for running ETL jobs over Iceberg Catalog
# This feature is only available on the hosted platform.
[storage.analytics]
enabled = false
max_namespaces = 5
max_tables = 10
max_catalogs = 2

# Analytics Buckets is available to Supabase Pro plan.
# [storage.analytics.buckets.my-warehouse]

# Store vector embeddings in S3 for large and durable datasets
# This feature is only available on the hosted platform.
[storage.vector]
enabled = false
max_buckets = 10
max_indexes = 5

# Vector Buckets is available to Supabase Pro plan.
# [storage.vector.buckets.documents-openai]

[auth]
enabled = true
# The base URL of your website. Used as an allow-list for redirects and for constructing URLs used
# in emails.
site_url = "http://127.0.0.1:3000"
# A list of *exact* URLs that auth providers are permitted to redirect to post authentication.
additional_redirect_urls = ["https://127.0.0.1:3000"]
# How long tokens are valid for, in seconds. Defaults to 3600 (1 hour), maximum 604,800 (1 week).
jwt_expiry = 3600
# JWT issuer URL. If not set, defaults to the local API URL (http://127.0.0.1:<port>/auth/v1).
# jwt_issuer = ""
# Path to JWT signing key. DO NOT commit your signing keys file to git.
# signing_keys_path = "./signing_keys.json"
# If disabled, the refresh token will never expire.
enable_refresh_token_rotation = true
# Allows refresh tokens to be reused after expiry, up to the specified interval in seconds.
# Requires enable_refresh_token_rotation = true.
refresh_token_reuse_interval = 10
# Allow/disallow new user signups to your project.
enable_signup = true
# Allow/disallow anonymous sign-ins to your project.
enable_anonymous_sign_ins = false
# Allow/disallow testing manual linking of accounts
enable_manual_linking = false
# Passwords shorter than this value will be rejected as weak. Minimum 6, recommended 8 or more.
minimum_password_length = 6
# Passwords that do not meet the following requirements will be rejected as weak. Supported values
# are: `letters_digits`, `lower_upper_letters_digits`, `lower_upper_letters_digits_symbols`
password_requirements = ""

[auth.rate_limit]
# Number of emails that can be sent per hour. Requires auth.email.smtp to be enabled.
email_sent = 2
# Number of SMS messages that can be sent per hour. Requires auth.sms to be enabled.
sms_sent = 30
# Number of anonymous sign-ins that can be made per hour per IP address. Requires enable_anonymous_sign_ins = true.
anonymous_users = 30
# Number of sessions that can be refreshed in a 5 minute interval per IP address.
token_refresh = 150
# Number of sign up and sign-in requests that can be made in a 5 minute interval per IP address (excludes anonymous users).
sign_in_sign_ups = 30
# Number of OTP / Magic link verifications that can be made in a 5 minute interval per IP address.
token_verifications = 30
# Number of Web3 logins that can be made in a 5 minute interval per IP address.
web3 = 30

# Configure one of the supported captcha providers: `hcaptcha`, `turnstile`.
# [auth.captcha]
# enabled = true
# provider = "hcaptcha"
# secret = ""

[auth.email]
# Allow/disallow new user signups via email to your project.
enable_signup = true
# If enabled, a user will be required to confirm any email change on both the old, and new email
# addresses. If disabled, only the new email is required to confirm.
double_confirm_changes = true
# If enabled, users need to confirm their email address before signing in.
enable_confirmations = false
# If enabled, users will need to reauthenticate or have logged in recently to change their password.
secure_password_change = false
# Controls the minimum amount of time that must pass before sending another signup confirmation or password reset email.
max_frequency = "1s"
# Number of characters used in the email OTP.
otp_length = 6
# Number of seconds before the email OTP expires (defaults to 1 hour).
otp_expiry = 3600

# Use a production-ready SMTP server
# [auth.email.smtp]
# enabled = true
# host = "smtp.sendgrid.net"
# port = 587
# user = "apikey"
# pass = "env(SENDGRID_API_KEY)"
# admin_email = "admin@email.com"
# sender_name = "Admin"

# Uncomment to customize email template
# [auth.email.template.invite]
# subject = "You have been invited"
# content_path = "./supabase/templates/invite.html"

# Uncomment to customize notification email template
# [auth.email.notification.password_changed]
# enabled = true
# subject = "Your password has been changed"
# content_path = "./templates/password_changed_notification.html"

[auth.sms]
# Allow/disallow new user signups via SMS to your project.
enable_signup = false
# If enabled, users need to confirm their phone number before signing in.
enable_confirmations = false
# Template for sending OTP to users
template = "Your code is {{ .Code }}"
# Controls the minimum amount of time that must pass before sending another sms otp.
max_frequency = "5s"

# Use pre-defined map of phone number to OTP for testing.
# [auth.sms.test_otp]
# 4152127777 = "123456"

# Configure logged in session timeouts.
# [auth.sessions]
# Force log out after the specified duration.
# timebox = "24h"
# Force log out if the user has been inactive longer than the specified duration.
# inactivity_timeout = "8h"

# This hook runs before a new user is created and allows developers to reject the request based on the incoming user object.
# [auth.hook.before_user_created]
# enabled = true
# uri = "pg-functions://postgres/auth/before-user-created-hook"

# This hook runs before a token is issued and allows you to add additional claims based on the authentication method used.
# [auth.hook.custom_access_token]
# enabled = true
# uri = "pg-functions://<database>/<schema>/<hook_name>"

# Configure one of the supported SMS providers: `twilio`, `twilio_verify`, `messagebird`, `textlocal`, `vonage`.
[auth.sms.twilio]
enabled = false
account_sid = ""
message_service_sid = ""
# DO NOT commit your Twilio auth token to git. Use environment variable substitution instead:
auth_token = "env(SUPABASE_AUTH_SMS_TWILIO_AUTH_TOKEN)"

# Multi-factor-authentication is available to Supabase Pro plan.
[auth.mfa]
# Control how many MFA factors can be enrolled at once per user.
max_enrolled_factors = 10

# Control MFA via App Authenticator (TOTP)
[auth.mfa.totp]
enroll_enabled = false
verify_enabled = false

# Configure MFA via Phone Messaging
[auth.mfa.phone]
enroll_enabled = false
verify_enabled = false
otp_length = 6
template = "Your code is {{ .Code }}"
max_frequency = "5s"

# Configure MFA via WebAuthn
# [auth.mfa.web_authn]
# enroll_enabled = true
# verify_enabled = true

# Use an external OAuth provider. The full list of providers are: `apple`, `azure`, `bitbucket`,
# `discord`, `facebook`, `github`, `gitlab`, `google`, `keycloak`, `linkedin_oidc`, `notion`, `twitch`,
# `twitter`, `x`, `slack`, `spotify`, `workos`, `zoom`.
[auth.external.apple]
enabled = false
client_id = ""
# DO NOT commit your OAuth provider secret to git. Use environment variable substitution instead:
secret = "env(SUPABASE_AUTH_EXTERNAL_APPLE_SECRET)"
# Overrides the default auth redirectUrl.
redirect_uri = ""
# Overrides the default auth provider URL. Used to support self-hosted gitlab, single-tenant Azure,
# or any other third-party OIDC providers.
url = ""
# If enabled, the nonce check will be skipped. Required for local sign in with Google auth.
skip_nonce_check = false
# If enabled, it will allow the user to successfully authenticate when the provider does not return an email address.
email_optional = false

# Allow Solana wallet holders to sign in to your project via the Sign in with Solana (SIWS, EIP-4361) standard.
# You can configure "web3" rate limit in the [auth.rate_limit] section and set up [auth.captcha] if self-hosting.
[auth.web3.solana]
enabled = false

# Use Firebase Auth as a third-party provider alongside Supabase Auth.
[auth.third_party.firebase]
enabled = false
# project_id = "my-firebase-project"

# Use Auth0 as a third-party provider alongside Supabase Auth.
[auth.third_party.auth0]
enabled = false
# tenant = "my-auth0-tenant"
# tenant_region = "us"

# Use AWS Cognito (Amplify) as a third-party provider alongside Supabase Auth.
[auth.third_party.aws_cognito]
enabled = false
# user_pool_id = "my-user-pool-id"
# user_pool_region = "us-east-1"

# Use Clerk as a third-party provider alongside Supabase Auth.
[auth.third_party.clerk]
enabled = false
# Obtain from https://clerk.com/setup/supabase
# domain = "example.clerk.accounts.dev"

# OAuth server configuration
[auth.oauth_server]
# Enable OAuth server functionality
enabled = false
# Path for OAuth consent flow UI
authorization_url_path = "/oauth/consent"
# Allow dynamic client registration
allow_dynamic_registration = false

[edge_runtime]
enabled = true
# Supported request policies: `oneshot`, `per_worker`.
# `per_worker` (default) — enables hot reload during local development.
# `oneshot` — fallback mode if hot reload causes issues (e.g. in large repos or with symlinks).
policy = "per_worker"
# Port to attach the Chrome inspector for debugging edge functions.
inspector_port = 8083
# The Deno major version to use.
deno_version = 2

# [edge_runtime.secrets]
# secret_key = "env(SECRET_VALUE)"

[analytics]
enabled = true
port = 54327
# Configure one of the supported backends: `postgres`, `bigquery`.
backend = "postgres"

# Experimental features may be deprecated any time
[experimental]
# Configures Postgres storage engine to use OrioleDB (S3)
orioledb_version = ""
# Configures S3 bucket URL, eg. <bucket_name>.s3-<region>.amazonaws.com
s3_host = "env(S3_HOST)"
# Configures S3 bucket region, eg. us-east-1
s3_region = "env(S3_REGION)"
# Configures AWS_ACCESS_KEY_ID for S3 bucket
s3_access_key = "env(S3_ACCESS_KEY)"
# Configures AWS_SECRET_ACCESS_KEY for S3 bucket
s3_secret_key = "env(S3_SECRET_KEY)"

```

================================================================
FILE: supabase/functions/map-match/index.ts
================================================================
```ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const MAPBOX_SECRET = Deno.env.get("MAPBOX_SECRET_TOKEN");

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (!MAPBOX_SECRET) {
    return new Response(
      JSON.stringify({ error: "MAPBOX_SECRET_TOKEN not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json();
    const points = body?.points ?? [];
    if (!Array.isArray(points) || points.length < 2) {
      return new Response(
        JSON.stringify({ error: "points array with at least 2 items required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const coords = points
      .map((p: { lat: number; lng: number }) => `${p.lng},${p.lat}`)
      .join(";");
    const timestamps = points
      .map((p: { timestamp?: number }) => p.timestamp ?? Math.floor(Date.now() / 1000))
      .join(";");

    const url = `https://api.mapbox.com/matching/v5/mapbox/driving/${coords}?access_token=${MAPBOX_SECRET}&geometries=geojson&tidy=true&timestamps=${timestamps}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: data.message ?? "Map matching failed" }),
        { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const match = data.matchings?.[0];
    const geometry = match?.geometry;
    const confidence = match?.confidence ?? 0;

    return new Response(
      JSON.stringify({ geometry, confidence }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

```

================================================================
FILE: supabase/migrations/20260304134200_create_profiles.sql
================================================================
```sql
-- Tabla profiles (compatible con auth.users)
-- Campos obligatorios: full_name, phone, brand, model, color, vehicle_type, plate
-- Campo opcional: avatar_url
-- Nota: crear bucket 'avatars' en Storage con políticas públicas de lectura
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  display_name text,
  brand text,
  model text,
  color text default 'gris',
  vehicle_type text default 'car',
  plate text,
  phone text,
  allow_phone_calls boolean default false,
  notifications_enabled boolean default true,
  email_notifications boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS: usuarios solo pueden leer/actualizar su propio perfil
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

```

================================================================
FILE: supabase/migrations/20260304150000_create_parking_alerts.sql
================================================================
```sql
-- Tabla parking_alerts para migración desde base44
create table if not exists public.parking_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  lat double precision not null,
  lng double precision not null,
  price numeric not null,
  vehicle_type text default 'car',
  status text default 'active',
  reserved_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  expires_at timestamptz
);

-- Índices para consultas frecuentes
create index if not exists idx_parking_alerts_status on public.parking_alerts(status);
create index if not exists idx_parking_alerts_user_id on public.parking_alerts(user_id);
create index if not exists idx_parking_alerts_expires_at on public.parking_alerts(expires_at);

-- RLS
alter table public.parking_alerts enable row level security;

-- Usuario puede insertar sus alertas
create policy "Users can insert own alerts"
  on public.parking_alerts for insert
  with check (auth.uid() = user_id);

-- Usuario puede ver alertas activas (mapa) y sus propias alertas
create policy "Users can view active and own alerts"
  on public.parking_alerts for select
  using (
    status = 'active'
    or auth.uid() = user_id
    or auth.uid() = reserved_by
  );

-- Usuario puede actualizar sus alertas (owner) o reservar alertas activas (buyer)
create policy "Users can update own or reserve active alerts"
  on public.parking_alerts for update
  using (
    auth.uid() = user_id
    or (status = 'active' and auth.uid() is not null)
  );

```

================================================================
FILE: supabase/migrations/20260304160000_enable_realtime_parking_alerts.sql
================================================================
```sql
-- Habilitar Realtime para parking_alerts
alter publication supabase_realtime add table public.parking_alerts;

```

================================================================
FILE: supabase/migrations/20260304170000_add_geohash_parking_alerts.sql
================================================================
```sql
-- Añadir columna geohash a parking_alerts
alter table public.parking_alerts add column if not exists geohash text;

-- Índice compuesto para búsquedas por geohash + status
create index if not exists idx_parking_alerts_geohash_status on public.parking_alerts(geohash, status);

```

================================================================
FILE: supabase/migrations/20260305120000_fix_profiles_rls_and_trigger.sql
================================================================
```sql
-- Fix profiles: trigger para nuevos usuarios + políticas RLS explícitas
-- Resuelve "Error al guardar" al actualizar perfil

-- 1. Asegurar que la tabla profiles existe con estructura correcta
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  display_name text,
  brand text,
  model text,
  color text default 'gris',
  vehicle_type text default 'car',
  plate text,
  phone text,
  allow_phone_calls boolean default false,
  notifications_enabled boolean default true,
  email_notifications boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. RLS activado
alter table public.profiles enable row level security;

-- 3. Eliminar políticas existentes para recrearlas (evita conflictos)
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;

-- 4. Políticas RLS explícitas
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 5. Trigger: crear perfil automáticamente al registrar usuario
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();

-- 6. Backfill: crear perfiles para usuarios existentes sin perfil
insert into public.profiles (id, email, full_name, avatar_url)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name'),
  coalesce(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture')
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id)
on conflict (id) do nothing;

```

================================================================
FILE: supabase/migrations/20260305155000_migrate_parking_alerts_to_core.sql
================================================================
```sql
-- Migración segura: parking_alerts de schema antiguo (user_id, price) a core (seller_id, price_cents)
-- Solo ALTERs, idempotente con IF NOT EXISTS. No usar borrado de tablas.

-- Añadir columnas del schema core
ALTER TABLE public.parking_alerts ADD COLUMN IF NOT EXISTS seller_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.parking_alerts ADD COLUMN IF NOT EXISTS address_text text;
ALTER TABLE public.parking_alerts ADD COLUMN IF NOT EXISTS price_cents int;
ALTER TABLE public.parking_alerts ADD COLUMN IF NOT EXISTS currency text DEFAULT 'EUR';
ALTER TABLE public.parking_alerts ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.parking_alerts ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Backfill: seller_id desde user_id, price_cents desde price
UPDATE public.parking_alerts SET seller_id = user_id WHERE seller_id IS NULL AND user_id IS NOT NULL;
UPDATE public.parking_alerts SET price_cents = COALESCE(price_cents, GREATEST(0, floor(COALESCE(price, 0) * 100)::int)) WHERE price_cents IS NULL;
UPDATE public.parking_alerts SET updated_at = created_at WHERE updated_at IS NULL;

-- Constraints y defaults para filas nuevas (solo si la columna existe)
ALTER TABLE public.parking_alerts ALTER COLUMN price_cents SET DEFAULT 0;
ALTER TABLE public.parking_alerts ALTER COLUMN currency SET DEFAULT 'EUR';
ALTER TABLE public.parking_alerts ALTER COLUMN metadata SET DEFAULT '{}'::jsonb;
ALTER TABLE public.parking_alerts ALTER COLUMN updated_at SET DEFAULT now();

-- Índice para seller_id
CREATE INDEX IF NOT EXISTS idx_parking_alerts_seller_id ON public.parking_alerts(seller_id);

-- Políticas core: eliminar antiguas y crear nuevas (DROP POLICY es seguro, no borra datos)
DROP POLICY IF EXISTS "Users can insert own alerts" ON public.parking_alerts;
DROP POLICY IF EXISTS "Users can view active and own alerts" ON public.parking_alerts;
DROP POLICY IF EXISTS "Users can update own or reserve active alerts" ON public.parking_alerts;
DROP POLICY IF EXISTS "parking_alerts_select_all" ON public.parking_alerts;
DROP POLICY IF EXISTS "parking_alerts_insert_own" ON public.parking_alerts;
DROP POLICY IF EXISTS "parking_alerts_update_own" ON public.parking_alerts;
DROP POLICY IF EXISTS "parking_alerts_delete_own" ON public.parking_alerts;

CREATE POLICY "parking_alerts_select_all" ON public.parking_alerts FOR SELECT USING (true);
CREATE POLICY "parking_alerts_insert_own" ON public.parking_alerts FOR INSERT WITH CHECK (seller_id = auth.uid() OR (seller_id IS NULL AND user_id = auth.uid()));
CREATE POLICY "parking_alerts_update_own" ON public.parking_alerts FOR UPDATE USING (seller_id = auth.uid() OR (seller_id IS NULL AND user_id = auth.uid()));
CREATE POLICY "parking_alerts_delete_own" ON public.parking_alerts FOR DELETE USING (seller_id = auth.uid() OR (seller_id IS NULL AND user_id = auth.uid()));

```

================================================================
FILE: supabase/migrations/20260305160000_core_schema.sql
================================================================
```sql
-- =============================================================================
-- WaitMe Core Schema - Migración profesional (idempotente, sin borrado de tablas)
-- Requiere: public.profiles, auth.users, public.parking_alerts (de migraciones previas)
--
-- Si ALTER PUBLICATION falla con "already member", añadir tablas en Dashboard:
--   Database → Replication → supabase_realtime
-- =============================================================================

-- 1) parking_alerts: ya existe de 20260304150000, migrado por 20260305155000
--    Solo aseguramos trigger updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS parking_alerts_updated_at ON public.parking_alerts;
CREATE TRIGGER parking_alerts_updated_at
  BEFORE UPDATE ON public.parking_alerts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2) alert_reservations
CREATE TABLE IF NOT EXISTS public.alert_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id uuid NOT NULL REFERENCES public.parking_alerts(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('requested','accepted','active','completed','cancelled','expired')),
  started_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_alert_reservations_alert_id ON public.alert_reservations(alert_id);
CREATE INDEX IF NOT EXISTS idx_alert_reservations_buyer_id ON public.alert_reservations(buyer_id);
CREATE INDEX IF NOT EXISTS idx_alert_reservations_status ON public.alert_reservations(status);

ALTER TABLE public.alert_reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "alert_reservations_select" ON public.alert_reservations;
DROP POLICY IF EXISTS "alert_reservations_insert" ON public.alert_reservations;
DROP POLICY IF EXISTS "alert_reservations_update" ON public.alert_reservations;
CREATE POLICY "alert_reservations_select" ON public.alert_reservations FOR SELECT
  USING (
    buyer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.parking_alerts pa WHERE pa.id = alert_id AND (pa.seller_id = auth.uid() OR pa.user_id = auth.uid()))
  );
CREATE POLICY "alert_reservations_insert" ON public.alert_reservations FOR INSERT
  WITH CHECK (buyer_id = auth.uid());
CREATE POLICY "alert_reservations_update" ON public.alert_reservations FOR UPDATE
  USING (
    buyer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.parking_alerts pa WHERE pa.id = alert_id AND (pa.seller_id = auth.uid() OR pa.user_id = auth.uid()))
  );

DROP TRIGGER IF EXISTS alert_reservations_updated_at ON public.alert_reservations;
CREATE TRIGGER alert_reservations_updated_at
  BEFORE UPDATE ON public.alert_reservations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3) conversations
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id uuid REFERENCES public.parking_alerts(id) ON DELETE SET NULL,
  buyer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(alert_id, buyer_id, seller_id)
);

CREATE INDEX IF NOT EXISTS idx_conversations_buyer_id ON public.conversations(buyer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_seller_id ON public.conversations(seller_id);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conversations_select" ON public.conversations;
DROP POLICY IF EXISTS "conversations_insert" ON public.conversations;
DROP POLICY IF EXISTS "conversations_update" ON public.conversations;
CREATE POLICY "conversations_select" ON public.conversations FOR SELECT
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());
CREATE POLICY "conversations_insert" ON public.conversations FOR INSERT
  WITH CHECK (buyer_id = auth.uid() OR seller_id = auth.uid());
CREATE POLICY "conversations_update" ON public.conversations FOR UPDATE
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());

-- 4) messages
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON public.messages(conversation_id, created_at DESC);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "messages_select" ON public.messages;
DROP POLICY IF EXISTS "messages_insert" ON public.messages;
CREATE POLICY "messages_select" ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    )
  );
CREATE POLICY "messages_insert" ON public.messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    )
  );

-- 5) user_locations
CREATE TABLE IF NOT EXISTS public.user_locations (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  accuracy_m double precision,
  heading double precision,
  speed_mps double precision,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_locations_updated_at ON public.user_locations(updated_at);

ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_locations_select_all" ON public.user_locations;
DROP POLICY IF EXISTS "user_locations_insert_own" ON public.user_locations;
DROP POLICY IF EXISTS "user_locations_update_own" ON public.user_locations;
CREATE POLICY "user_locations_select_all" ON public.user_locations FOR SELECT USING (true);
CREATE POLICY "user_locations_insert_own" ON public.user_locations FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_locations_update_own" ON public.user_locations FOR UPDATE USING (user_id = auth.uid());

-- Realtime: añadir tablas a la publicación (ignorar si ya están)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.parking_alerts;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.alert_reservations;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.user_locations;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

```

================================================================
FILE: supabase/migrations/20260305170000_add_geohash_and_reservation_trigger.sql
================================================================
```sql
-- Añadir geohash a parking_alerts para búsquedas por proximidad (getNearbyAlerts)
-- Trigger: al aceptar reserva, actualizar status de la alerta a 'reserved'

-- Geohash para consultas espaciales
ALTER TABLE public.parking_alerts ADD COLUMN IF NOT EXISTS geohash text;
CREATE INDEX IF NOT EXISTS idx_parking_alerts_geohash_status ON public.parking_alerts(geohash, status);

-- Trigger: cuando reservation pasa a status 'accepted', marcar alerta como reserved
CREATE OR REPLACE FUNCTION public.on_reservation_accepted()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' THEN
    UPDATE public.parking_alerts
    SET status = 'reserved', updated_at = now()
    WHERE id = NEW.alert_id AND status = 'active';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_on_reservation_accepted_insert ON public.alert_reservations;
CREATE TRIGGER trigger_on_reservation_accepted_insert
  AFTER INSERT ON public.alert_reservations
  FOR EACH ROW EXECUTE FUNCTION public.on_reservation_accepted();

DROP TRIGGER IF EXISTS trigger_on_reservation_accepted_update ON public.alert_reservations;
CREATE TRIGGER trigger_on_reservation_accepted_update
  AFTER UPDATE ON public.alert_reservations
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'accepted')
  EXECUTE FUNCTION public.on_reservation_accepted();

```

================================================================
FILE: supabase/migrations/20260305180000_conversations_last_message.sql
================================================================
```sql
-- Añadir last_message a conversations para la lista de chats
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS last_message_text text;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS last_message_at timestamptz;

-- Trigger: actualizar last_message al insertar mensaje
CREATE OR REPLACE FUNCTION public.on_message_inserted()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET last_message_text = NEW.body,
      last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_on_message_inserted ON public.messages;
CREATE TRIGGER trigger_on_message_inserted
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.on_message_inserted();

```

================================================================
FILE: supabase/migrations/20260305190000_transactions.sql
================================================================
```sql
-- Tabla transactions para historial de pagos
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_id uuid REFERENCES public.parking_alerts(id) ON DELETE SET NULL,
  amount numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','cancelled','refunded')),
  seller_earnings numeric(10,2),
  platform_fee numeric(10,2),
  address text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transactions_buyer_id ON public.transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_seller_id ON public.transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_transactions_alert_id ON public.transactions(alert_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transactions_select_own" ON public.transactions FOR SELECT
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());
CREATE POLICY "transactions_insert" ON public.transactions FOR INSERT
  WITH CHECK (buyer_id = auth.uid() OR seller_id = auth.uid());
CREATE POLICY "transactions_update_own" ON public.transactions FOR UPDATE
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());

```

================================================================
FILE: supabase/migrations/20260305200000_storage_uploads_bucket.sql
================================================================
```sql
-- Bucket para uploads (chat adjuntos, etc.)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'uploads',
  'uploads',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'video/mp4', 'video/webm']
)
ON CONFLICT (id) DO NOTHING;

-- RLS: usuarios autenticados pueden subir; público puede leer
DROP POLICY IF EXISTS "uploads_insert_authenticated" ON storage.objects;
CREATE POLICY "uploads_insert_authenticated" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'uploads');
DROP POLICY IF EXISTS "uploads_select_public" ON storage.objects;
CREATE POLICY "uploads_select_public" ON storage.objects FOR SELECT
  USING (bucket_id = 'uploads');
DROP POLICY IF EXISTS "uploads_delete_authenticated" ON storage.objects;
CREATE POLICY "uploads_delete_authenticated" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'uploads');

```

================================================================
FILE: supabase/migrations/20260305210000_notifications.sql
================================================================
```sql
-- Tabla notifications para notificaciones de usuario
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'status_update',
  title text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT
  WITH CHECK (true);
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

-- Habilitar Realtime para subscribeNotifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

```

================================================================
FILE: supabase/migrations/20260305220000_profiles_notify_columns.sql
================================================================
```sql
-- Añadir columnas de preferencias de notificación a profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notify_reservations boolean DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notify_payments boolean DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notify_proximity boolean DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notify_promotions boolean DEFAULT true;

```

================================================================
FILE: supabase/migrations/20260305230000_user_location_updates.sql
================================================================
```sql
-- Tabla user_location_updates: ubicaciones de compradores por alerta (para SellerLocationTracker)
-- Sustituye el modelo Base44 UserLocation con alert_id.
-- user_locations (existente) queda para ubicación global por usuario; esta tabla es por (user, alert).
CREATE TABLE IF NOT EXISTS public.user_location_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_id uuid NOT NULL REFERENCES public.parking_alerts(id) ON DELETE CASCADE,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  accuracy_m double precision,
  is_active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, alert_id)
);

CREATE INDEX IF NOT EXISTS idx_user_location_updates_alert_id ON public.user_location_updates(alert_id);
CREATE INDEX IF NOT EXISTS idx_user_location_updates_alert_active ON public.user_location_updates(alert_id, is_active) WHERE is_active = true;

ALTER TABLE public.user_location_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_location_updates_select_all" ON public.user_location_updates FOR SELECT USING (true);
CREATE POLICY "user_location_updates_insert_own" ON public.user_location_updates FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_location_updates_update_own" ON public.user_location_updates FOR UPDATE USING (user_id = auth.uid());

-- Realtime para SellerLocationTracker
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.user_location_updates;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

```

================================================================
FILE: supabase/migrations/20260306000000_add_vehicle_color_parking_alerts.sql
================================================================
```sql
-- Añadir vehicle_color a parking_alerts para iconos en mapa
ALTER TABLE public.parking_alerts ADD COLUMN IF NOT EXISTS vehicle_color text;

```
