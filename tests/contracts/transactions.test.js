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
