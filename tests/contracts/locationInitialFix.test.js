/**
 * Tests de contrato para corrección de precisión de ubicación inicial.
 * Verificar: ubicación inicial usa getCurrentPosition, pipeline se activa después,
 * accuracy mejora en la segunda posición.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPreciseInitialLocation } from '@/lib/location';

describe('locationInitialFix', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', {
      geolocation: {
        getCurrentPosition: vi.fn((success) => {
          success({
            coords: {
              latitude: 43.3619,
              longitude: -5.8494,
              accuracy: 15,
            },
          });
        }),
        watchPosition: vi.fn(),
        clearWatch: vi.fn(),
      },
    });
  });

  it('getPreciseInitialLocation usa getCurrentPosition', async () => {
    const result = await getPreciseInitialLocation();
    expect(navigator.geolocation.getCurrentPosition).toHaveBeenCalled();
    expect(result).toMatchObject({
      lat: 43.3619,
      lng: -5.8494,
      accuracy: 15,
    });
  });

  it('getPreciseInitialLocation devuelve lat, lng, accuracy', async () => {
    const result = await getPreciseInitialLocation();
    expect(result).toHaveProperty('lat');
    expect(result).toHaveProperty('lng');
    expect(result).toHaveProperty('accuracy');
    expect(typeof result.lat).toBe('number');
    expect(typeof result.lng).toBe('number');
    expect(typeof result.accuracy).toBe('number');
  });

  it('getPreciseInitialLocation con accuracy > 50m reintenta hasta 3 veces', async () => {
    let callCount = 0;
    navigator.geolocation.getCurrentPosition = vi.fn((success) => {
      callCount += 1;
      success({
        coords: {
          latitude: 43.36,
          longitude: -5.85,
          accuracy: callCount < 3 ? 60 : 30,
        },
      });
    });

    const result = await getPreciseInitialLocation();
    expect(callCount).toBeGreaterThanOrEqual(1);
    expect(result.accuracy).toBeLessThanOrEqual(50);
  });

  it('getPreciseInitialLocation sin geolocation devuelve fallback', async () => {
    vi.stubGlobal('navigator', {});
    const result = await getPreciseInitialLocation();
    expect(result).toMatchObject({
      lat: 43.3619,
      lng: -5.8494,
      accuracy: 500,
    });
  });
});
