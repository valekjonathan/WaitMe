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
