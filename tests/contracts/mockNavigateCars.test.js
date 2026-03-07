/**
 * Tests para mockNavigateCars — validación de 20 coches y datos no vacíos.
 */
import { describe, it, expect } from 'vitest';
import { getMockNavigateCars } from '@/lib/mockNavigateCars';

describe('getMockNavigateCars', () => {
  it('returns 20 cars', () => {
    const cars = getMockNavigateCars([43.3619, -5.8494]);
    expect(cars).toHaveLength(20);
  });

  it('each car has required non-empty fields', () => {
    const cars = getMockNavigateCars([43.3619, -5.8494]);
    for (const car of cars) {
      expect(car.id).toBeTruthy();
      expect(car.user_name).toBeTruthy();
      expect(car.user_photo).toBeTruthy();
      expect(car.brand).toBeTruthy();
      expect(car.model).toBeTruthy();
      expect(car.plate).toBeTruthy();
      expect(car.address).toBeTruthy();
      expect(typeof car.latitude).toBe('number');
      expect(typeof car.longitude).toBe('number');
      expect(typeof car.price).toBe('number');
      expect(car.available_in_minutes).toBeDefined();
    }
  });

  it('cars are dispersed around user location', () => {
    const userLoc = [43.362, -5.849];
    const cars = getMockNavigateCars(userLoc);
    const [uLat, uLng] = userLoc;
    for (const car of cars) {
      const lat = car.latitude ?? car.lat;
      const lng = car.longitude ?? car.lng;
      expect(Math.abs(lat - uLat)).toBeLessThanOrEqual(0.01);
      expect(Math.abs(lng - uLng)).toBeLessThanOrEqual(0.01);
    }
  });
});
