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
