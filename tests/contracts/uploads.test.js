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
