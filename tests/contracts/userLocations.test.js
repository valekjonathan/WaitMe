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
