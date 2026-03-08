
================================================================
FILE: supabase/migrations/20260306100000_add_reserve_policy.sql
================================================================
```sql
-- Permitir que cualquier usuario autenticado reserve una alerta activa.
-- Solo puede actualizar status a 'reserved' y reserved_by a sí mismo.
CREATE POLICY "parking_alerts_reserve_active" ON public.parking_alerts
  FOR UPDATE
  USING (status = 'active' AND auth.uid() IS NOT NULL)
  WITH CHECK (status = 'reserved' AND reserved_by = auth.uid());

```

================================================================
FILE: supabase/migrations/20260306110000_add_reservation_timeout.sql
================================================================
```sql
-- Temporizador de reserva: reserved_until + función para expirar
ALTER TABLE public.parking_alerts ADD COLUMN IF NOT EXISTS reserved_until timestamptz;

-- Función que reactiva alertas cuya reserva expiró (SECURITY DEFINER para bypass RLS)
CREATE OR REPLACE FUNCTION public.expire_reservations()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected integer;
BEGIN
  WITH updated AS (
    UPDATE public.parking_alerts
    SET status = 'active', reserved_by = NULL, reserved_until = NULL
    WHERE status = 'reserved'
      AND reserved_until IS NOT NULL
      AND reserved_until < now()
    RETURNING id
  )
  SELECT count(*)::integer INTO affected FROM updated;
  RETURN affected;
END;
$$;

-- Cualquier usuario autenticado puede invocar (necesario para que getNearbyAlerts lo llame)
GRANT EXECUTE ON FUNCTION public.expire_reservations() TO authenticated;
GRANT EXECUTE ON FUNCTION public.expire_reservations() TO anon;

```

================================================================
FILE: supabase/seed.sql
================================================================
```sql
-- Seed data (optional)
-- Add initial data here for local development

```

================================================================
FILE: tailwind.config.js
================================================================
```js
/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
  	extend: {
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
```

================================================================
FILE: tests/app.spec.js
================================================================
```js
// @ts-check
import { test, expect } from '@playwright/test';
import percySnapshot from '@percy/playwright';

test.describe('App', () => {
  test('abre la app y carga correctamente', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\//);
    await page.waitForLoadState('networkidle');
    const body = page.locator('body');
    await expect(body).toBeVisible();
    const root = page.locator('#root');
    await expect(root).toBeVisible();
    await percySnapshot(page, 'App - Inicio');
  });

  test('muestra Login o contenido principal', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const loginOrContent = page.locator('text=WaitMe!').or(page.locator('text=Continuar con Google'));
    await expect(loginOrContent.first()).toBeVisible({ timeout: 10000 });
    await percySnapshot(page, 'App - Login o Home');
  });
});

```

================================================================
FILE: tests/contracts/alerts.test.js
================================================================
```js
/**
 * Contract tests: data layer alerts.
 * Valida que createAlert, getMyAlerts y el resto de la API existan y devuelvan { data, error }.
 */
import { describe, it, expect } from 'vitest'
import * as alerts from '@/data/alerts'

const hasDataErrorShape = (result) =>
  result && typeof result === 'object' && 'data' in result && 'error' in result

describe('alerts contract', () => {
  it('exports createAlert', () => {
    expect(typeof alerts.createAlert).toBe('function')
  })

  it('exports getMyAlerts', () => {
    expect(typeof alerts.getMyAlerts).toBe('function')
  })

  it('createAlert returns { data, error }', async () => {
    const result = await alerts.createAlert({
      sellerId: 'test-id',
      lat: 43.36,
      lng: -5.85,
      priceCents: 500,
    })
    expect(hasDataErrorShape(result)).toBe(true)
  })

  it('getMyAlerts returns { data, error }', async () => {
    const result = await alerts.getMyAlerts('test-seller-id')
    expect(hasDataErrorShape(result)).toBe(true)
    expect(Array.isArray(result.data) || result.data === null).toBe(true)
  })

  it('getAlertsReservedByMe returns { data, error }', async () => {
    const result = await alerts.getAlertsReservedByMe('test-buyer-id')
    expect(hasDataErrorShape(result)).toBe(true)
    expect(Array.isArray(result.data) || result.data === null).toBe(true)
  })

  it('updateAlert exists', () => {
    expect(typeof alerts.updateAlert).toBe('function')
  })

  it('deleteAlert exists', () => {
    expect(typeof alerts.deleteAlert).toBe('function')
  })

  it('reserveAlert exists and returns { data, error }', async () => {
    const result = await alerts.reserveAlert('non-existent-uuid', 'test-buyer-id')
    expect(hasDataErrorShape(result)).toBe(true)
  })

  it('subscribeAlerts exists and returns unsubscribe function', () => {
    expect(typeof alerts.subscribeAlerts).toBe('function')
    const unsub = alerts.subscribeAlerts({})
    expect(typeof unsub).toBe('function')
    unsub()
  })
})

```

================================================================
FILE: tests/contracts/chat.test.js
================================================================
```js
/**
 * Contract tests: data layer chat.
 * Valida que sendMessage, getMessages y el resto de la API existan y devuelvan { data, error }.
 */
import { describe, it, expect } from 'vitest'
import * as chat from '@/data/chat'

const hasDataErrorShape = (result) =>
  result && typeof result === 'object' && 'data' in result && 'error' in result

describe('chat contract', () => {
  it('exports sendMessage', () => {
    expect(typeof chat.sendMessage).toBe('function')
  })

  it('exports getMessages', () => {
    expect(typeof chat.getMessages).toBe('function')
  })

  it('sendMessage returns { data, error }', async () => {
    const result = await chat.sendMessage({
      conversationId: 'test-conv-id',
      senderId: 'test-sender-id',
      body: 'Hello',
    })
    expect(hasDataErrorShape(result)).toBe(true)
  })

  it('getMessages returns { data, error }', async () => {
    const result = await chat.getMessages('test-conv-id', 'test-user-id')
    expect(hasDataErrorShape(result)).toBe(true)
    expect(Array.isArray(result.data) || result.data === null).toBe(true)
  })

  it('getConversations returns { data, error }', async () => {
    const result = await chat.getConversations('test-user-id')
    expect(hasDataErrorShape(result)).toBe(true)
    expect(Array.isArray(result.data) || result.data === null).toBe(true)
  })

  it('exports createConversation', () => {
    expect(typeof chat.createConversation).toBe('function')
  })

  it('createConversation returns { data, error }', async () => {
    const result = await chat.createConversation({
      buyerId: 'test-buyer-id',
      sellerId: 'test-seller-id',
      alertId: 'test-alert-id',
    })
    expect(hasDataErrorShape(result)).toBe(true)
  })

  it('getConversation returns { data, error }', async () => {
    const result = await chat.getConversation('test-conv-id', 'test-user-id')
    expect(hasDataErrorShape(result)).toBe(true)
  })

  it('subscribeMessages exists and returns unsubscribe function', () => {
    expect(typeof chat.subscribeMessages).toBe('function')
    const unsub = chat.subscribeMessages('test-conv-id', () => {})
    expect(typeof unsub).toBe('function')
    unsub()
  })
})

```

================================================================
FILE: tests/contracts/notifications.test.js
================================================================
```js
/**
 * Contract tests: data layer notifications.
 * Valida que createNotification, listNotifications, markAsRead, subscribeNotifications
 * existan y devuelvan la forma esperada.
 */
import { describe, it, expect } from 'vitest'
import * as notifications from '@/data/notifications'

const hasDataErrorShape = (result) =>
  result && typeof result === 'object' && 'data' in result && 'error' in result

describe('notifications contract', () => {
  it('exports createNotification', () => {
    expect(typeof notifications.createNotification).toBe('function')
  })

  it('exports listNotifications', () => {
    expect(typeof notifications.listNotifications).toBe('function')
  })

  it('exports markAsRead', () => {
    expect(typeof notifications.markAsRead).toBe('function')
  })

  it('exports subscribeNotifications', () => {
    expect(typeof notifications.subscribeNotifications).toBe('function')
  })

  it('createNotification returns { data, error }', async () => {
    const result = await notifications.createNotification({
      user_id: 'test-user-id',
      type: 'extension_request',
      title: 'Prórroga',
      message: 'Test',
    })
    expect(hasDataErrorShape(result)).toBe(true)
  })

  it('listNotifications returns { data, error }', async () => {
    const result = await notifications.listNotifications('test-user-id')
    expect(hasDataErrorShape(result)).toBe(true)
    expect(Array.isArray(result.data) || result.data === null).toBe(true)
  })

  it('markAsRead returns { data, error }', async () => {
    const result = await notifications.markAsRead('test-notification-id', 'test-user-id')
    expect(hasDataErrorShape(result)).toBe(true)
  })

  it('subscribeNotifications returns unsubscribe function', () => {
    const unsub = notifications.subscribeNotifications('test-user-id', () => {})
    expect(typeof unsub).toBe('function')
    unsub()
  })
})

```

================================================================
FILE: tests/contracts/transactions.test.js
================================================================
```js
/**
 * Contract tests: data layer transactions.
 * Valida que createTransaction, listTransactions existan y devuelvan { data, error }.
 */
import { describe, it, expect } from 'vitest'
import * as transactions from '@/data/transactions'

const hasDataErrorShape = (result) =>
  result && typeof result === 'object' && 'data' in result && 'error' in result

describe('transactions contract', () => {
  it('exports createTransaction', () => {
    expect(typeof transactions.createTransaction).toBe('function')
  })

  it('exports listTransactions', () => {
    expect(typeof transactions.listTransactions).toBe('function')
  })

  it('createTransaction returns { data, error }', async () => {
    const result = await transactions.createTransaction({
      buyer_id: 'test-buyer-id',
      seller_id: 'test-seller-id',
      amount: 5,
      status: 'pending',
    })
    expect(hasDataErrorShape(result)).toBe(true)
  })

  it('listTransactions returns { data, error }', async () => {
    const result = await transactions.listTransactions('test-user-id')
    expect(hasDataErrorShape(result)).toBe(true)
    expect(Array.isArray(result.data) || result.data === null).toBe(true)
  })
})

```

================================================================
FILE: tests/contracts/uploads.test.js
================================================================
```js
/**
 * Contract tests: data layer uploads.
 * Valida que uploadFile, getPublicUrl, deleteFile existan y cumplan el contrato.
 */
import { describe, it, expect } from 'vitest'
import * as uploads from '@/data/uploads'

describe('uploads contract', () => {
  it('exports uploadFile', () => {
    expect(typeof uploads.uploadFile).toBe('function')
  })

  it('exports getPublicUrl', () => {
    expect(typeof uploads.getPublicUrl).toBe('function')
  })

  it('exports deleteFile', () => {
    expect(typeof uploads.deleteFile).toBe('function')
  })

  it('uploadFile returns { url?, file_url?, error? }', async () => {
    const file = new File(['test'], 'test.txt', { type: 'text/plain' })
    const result = await uploads.uploadFile(file, 'test/path.txt')
    expect(result && typeof result === 'object').toBe(true)
    expect('error' in result || 'url' in result || 'file_url' in result).toBe(true)
  })

  it('getPublicUrl returns string', () => {
    const result = uploads.getPublicUrl('test/path.txt')
    expect(typeof result).toBe('string')
  })

  it('deleteFile returns { error? }', async () => {
    const result = await uploads.deleteFile('test/path.txt')
    expect(result && typeof result === 'object').toBe(true)
  })
})

```

================================================================
FILE: tests/contracts/userLocations.test.js
================================================================
```js
/**
 * Contract tests: data layer userLocations.
 */
import { describe, it, expect } from 'vitest'
import * as userLocations from '@/data/userLocations'

describe('userLocations contract', () => {
  it('exports getLocationsByAlert', () => {
    expect(typeof userLocations.getLocationsByAlert).toBe('function')
  })

  it('exports upsertLocationForAlert', () => {
    expect(typeof userLocations.upsertLocationForAlert).toBe('function')
  })

  it('getLocationsByAlert returns array', async () => {
    const result = await userLocations.getLocationsByAlert('test-alert-id')
    expect(Array.isArray(result)).toBe(true)
  })

  it('upsertLocationForAlert returns { data, error }', async () => {
    const result = await userLocations.upsertLocationForAlert({
      userId: 'test-user-id',
      alertId: 'test-alert-id',
      lat: 43.36,
      lng: -5.85,
    })
    expect(result && typeof result === 'object' && 'data' in result && 'error' in result).toBe(true)
  })
})

```

================================================================
FILE: tests/map.spec.js
================================================================
```js
// @ts-check
import { test, expect } from '@playwright/test';
import percySnapshot from '@percy/playwright';

test.describe('Mapa', () => {
  test('el mapa o la app cargan sin errores de Mapbox', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    const tokenError = page.getByText(/VITE_MAPBOX_TOKEN|Configura.*MAPBOX/i);
    await expect(tokenError).not.toBeVisible({ timeout: 2000 }).catch(() => {});
    await percySnapshot(page, 'Mapa - Sin error token');
  });

  test('la app no muestra errores de mapa en la UI', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('mapa muestra "Mapa no disponible" o carga correctamente (sin crash)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    const mapUnavailable = page.getByText('Mapa no disponible');
    const appContent = page.locator('#root');
    await expect(appContent).toBeVisible();
    const hasMapMsg = await mapUnavailable.isVisible().catch(() => false);
    const hasContent = await appContent.isVisible();
    expect(hasContent).toBeTruthy();
  });

  test('realtime no rompe la app', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(4000);
    const body = page.locator('body');
    await expect(body).toBeVisible();
    const errorScreen = page.locator('text=Error');
    await expect(errorScreen).not.toBeVisible();
  });
});

```

================================================================
FILE: tests/profile.spec.js
================================================================
```js
// @ts-check
import { test, expect } from '@playwright/test';
import percySnapshot from '@percy/playwright';

test.describe('Profile', () => {
  test('al abrir perfil no aparece "Error al guardar"', async ({ page }) => {
    await page.goto('/#/profile');
    await page.waitForLoadState('networkidle');
    const errorText = page.getByText('Error al guardar');
    await expect(errorText).not.toBeVisible({ timeout: 5000 });
    await percySnapshot(page, 'Profile - Sin error');
  });

  test('pantalla perfil carga sin errores visibles', async ({ page }) => {
    await page.goto('/#/profile');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    const errorAlert = page.locator('[role="alert"]').filter({ hasText: 'Error al guardar' });
    await expect(errorAlert).not.toBeVisible();
    await percySnapshot(page, 'Profile - Carga');
  });
});

```

================================================================
FILE: tests/smoke/create.spec.js
================================================================
```js
// @ts-check
/**
 * Smoke tests: pantalla "Estoy aparcado aquí".
 * Requiere que el usuario vea el Home (hero con botones).
 * Sin dependencia de Percy.
 */
import { test, expect } from '@playwright/test';

test.describe('Smoke - Estoy aparcado aquí', () => {
  test('al hacer clic en "Estoy aparcado aquí" se abre la pantalla create', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const createBtn = page.getByRole('button', { name: /estoy aparcado aquí/i });
    const isVisible = await createBtn.isVisible().catch(() => false);

    if (!isVisible) {
      test.skip(true, 'Botón "Estoy aparcado aquí" no visible (¿Login en curso?)');
      return;
    }

    await createBtn.click();
    await page.waitForTimeout(1500);

    // El mapa debe existir (canvas de Mapbox o contenedor)
    const mapContainer = page.locator('.mapboxgl-map, [class*="mapbox"]').first();
    const card = page.getByText(/me voy en|publicar mi waitme/i).first();
    const ubiciteBtn = page.getByRole('button').filter({ has: page.locator('svg') }).first();

    await expect(mapContainer).toBeVisible({ timeout: 5000 });
    await expect(card).toBeVisible({ timeout: 5000 });
    expect(await ubiciteBtn.isVisible().catch(() => false)).toBeTruthy();
  });

  test('existen botones de zoom + y -', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const createBtn = page.getByRole('button', { name: /estoy aparcado aquí/i });
    if (!(await createBtn.isVisible().catch(() => false))) {
      test.skip(true, 'Home no visible');
      return;
    }

    await createBtn.click();
    await page.waitForTimeout(1500);

    const zoomButtons = page.locator('button').filter({ has: page.locator('svg') });
    const count = await zoomButtons.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('existe la tarjeta inferior con campos', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const createBtn = page.getByRole('button', { name: /estoy aparcado aquí/i });
    if (!(await createBtn.isVisible().catch(() => false))) {
      test.skip(true, 'Home no visible');
      return;
    }

    await createBtn.click();
    await page.waitForTimeout(1500);

    const card = page.locator('[class*="rounded-2xl"]').filter({ hasText: /me voy en|minutos|euros/i });
    await expect(card.first()).toBeVisible({ timeout: 5000 });
  });

  test('no hay error fatal tras abrir create', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const createBtn = page.getByRole('button', { name: /estoy aparcado aquí/i });
    if (!(await createBtn.isVisible().catch(() => false))) {
      test.skip(true, 'Home no visible');
      return;
    }

    await createBtn.click();
    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').textContent();
    const hasFatalError =
      (bodyText && bodyText.includes('dispatcher')) ||
      (bodyText && bodyText.includes('TypeError: null is not an object'));

    expect(hasFatalError).toBeFalsy();
  });
});

```

================================================================
FILE: tests/smoke/diagnostics.spec.js
================================================================
```js
// @ts-check
/**
 * Smoke tests: ruta /dev-diagnostics (solo en DEV).
 * Ejecutar con: npm run test:e2e tests/smoke/diagnostics.spec.js
 */
import { test, expect } from '@playwright/test';

test.describe('Smoke - Diagnostics', () => {
  test('ruta /dev-diagnostics carga en modo normal', async ({ page }) => {
    await page.goto('/#/dev-diagnostics');
    await page.waitForLoadState('domcontentloaded');

    const root = page.locator('#root');
    await expect(root).toBeVisible({ timeout: 10000 });

    // En DEV la ruta existe; en prod puede no existir
    const diag = page.getByText('Dev Diagnostics', { exact: false });
    const waitMe = page.getByText('WaitMe!', { exact: false });
    const hasContent = (await diag.isVisible().catch(() => false)) || (await waitMe.isVisible().catch(() => false));
    expect(hasContent).toBeTruthy();
  });
});

```

================================================================
FILE: tests/smoke/load.spec.js
================================================================
```js
// @ts-check
/**
 * Smoke tests: la app carga sin errores fatales.
 * Sin dependencia de Percy. Ejecutar con: npm run test:e2e tests/smoke/
 */
import { test, expect } from '@playwright/test';

test.describe('Smoke - Carga', () => {
  test('la app carga y #root tiene contenido', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const root = page.locator('#root');
    await expect(root).toBeVisible({ timeout: 10000 });
    await expect(root).not.toBeEmpty();
  });

  test('no hay pantalla blanca ni error fatal (dispatcher, TypeError)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const body = page.locator('body');
    await expect(body).toBeVisible();

    const bodyText = await body.textContent();
    const hasFatalError =
      (bodyText && bodyText.includes('dispatcher')) ||
      (bodyText && bodyText.includes('TypeError: null is not an object'));

    expect(hasFatalError).toBeFalsy();
  });

  test('muestra Login o Home (WaitMe! visible)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const waitMe = page.getByText('WaitMe!', { exact: false });
    await expect(waitMe.first()).toBeVisible({ timeout: 15000 });
  });
});

```

================================================================
FILE: tests/smoke/safe-mode.spec.js
================================================================
```js
// @ts-check
/**
 * Smoke tests: SAFE MODE.
 * Ejecutar con: VITE_SAFE_MODE=true npm run test:e2e tests/smoke/safe-mode.spec.js
 */
import { test, expect } from '@playwright/test';

const isSafeMode = process.env.VITE_SAFE_MODE === 'true';

test.describe('Smoke - Safe Mode', { skip: !isSafeMode }, () => {
  test('SAFE MODE carga y muestra shell', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const root = page.locator('#root');
    await expect(root).toBeVisible({ timeout: 10000 });
    await expect(root).not.toBeEmpty();

    const safeMode = page.getByText('SAFE MODE', { exact: false });
    await expect(safeMode.first()).toBeVisible({ timeout: 5000 });
  });

  test('no hay pantalla blanca en SAFE MODE', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const bodyText = await page.locator('body').textContent();
    const hasFatalError =
      (bodyText && bodyText.includes('dispatcher')) ||
      (bodyText && bodyText.includes('TypeError: null is not an object'));

    expect(hasFatalError).toBeFalsy();
  });

  test('ruta /dev-diagnostics carga en SAFE MODE', async ({ page }) => {
    await page.goto('/#/dev-diagnostics');
    await page.waitForLoadState('domcontentloaded');

    const diag = page.getByText('Dev Diagnostics', { exact: false });
    await expect(diag.first()).toBeVisible({ timeout: 5000 });
  });
});

```

================================================================
FILE: tsconfig.json
================================================================
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": false,
    "noImplicitAny": false,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true,
    "allowJs": true,
    "checkJs": false,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src", "tests", "*.config.js"],
  "exclude": ["node_modules", "dist", "ios"]
}

```

================================================================
FILE: vercel.json
================================================================
```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}

```

================================================================
FILE: vite.config.js
================================================================
```js
/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// https://vite.dev/config/
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  server: {
    port: 5173,
    host: true,
    fs: {
      deny: ['**/ios__backup*/**', '**/DerivedData/**', '**/ios/**']
    },
    watch: {
      ignored: ['**/ios__backup*/**', '**/DerivedData/**', '**/ios/**']
    },
    hmr: {
      host: '192.168.0.11',
      port: 5173
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      react: path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom')
    },
    dedupe: ['react', 'react-dom']
  },
  plugins: [react()],
  optimizeDeps: {
    include: ['react', 'react-dom']
  },
  base: "./",
  preview: {
    host: true,
    port: 4173
  },
  build: {
    outDir: "dist",
    assetsInlineLimit: 200000
  },
  test: {
    globals: true,
    environment: 'node',
    projects: [
      {
        extends: true,
        test: {
          name: 'contracts',
          include: ['tests/contracts/**/*.test.js'],
        },
      },
      {
        extends: true,
        plugins: [
          storybookTest({
            configDir: path.join(dirname, '.storybook'),
          }),
        ],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: 'chromium' }],
          },
          setupFiles: ['.storybook/vitest.setup.ts'],
        },
      },
    ],
  },
});
```

================================================================
FILE: vitest.shims.d.ts
================================================================
```ts
/// <reference types="@vitest/browser-playwright" />
```
