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
