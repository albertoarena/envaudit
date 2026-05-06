import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
import { findMissing } from '../src/rules/missing.js'
import { findUndocumented } from '../src/rules/undocumented.js'
import { findEmpty } from '../src/rules/empty-values.js'
import { findSecrets, looksLikeSecret } from '../src/rules/secrets.js'

describe('findMissing', () => {
  it('finds keys in example but not in env', () => {
    const env = new Map([['A', '1'], ['B', '2']])
    const example = new Map([['A', '1'], ['B', '2'], ['C', '3']])
    assert.deepEqual(findMissing(env, example), ['C'])
  })

  it('returns empty when all keys present', () => {
    const env = new Map([['A', '1'], ['B', '2']])
    const example = new Map([['A', '1']])
    assert.deepEqual(findMissing(env, example), [])
  })
})

describe('findUndocumented', () => {
  it('finds keys in env but not in example', () => {
    const env = new Map([['A', '1'], ['B', '2'], ['C', '3']])
    const example = new Map([['A', '1']])
    assert.deepEqual(findUndocumented(env, example), ['B', 'C'])
  })
})

describe('findEmpty', () => {
  it('finds keys with empty values', () => {
    const env = new Map([['A', '1'], ['B', ''], ['C', '']])
    assert.deepEqual(findEmpty(env), ['B', 'C'])
  })

  it('returns empty when all values set', () => {
    const env = new Map([['A', '1']])
    assert.deepEqual(findEmpty(env), [])
  })
})

describe('looksLikeSecret', () => {
  it('flags known prefixes', () => {
    assert.equal(looksLikeSecret('sk_live_abc123def456ghi789'), true)
    assert.equal(looksLikeSecret('ghp_1234567890abcdefghij'), true)
    assert.equal(looksLikeSecret('AKIAIOSFODNN7EXAMPLE1'), true)
    assert.equal(looksLikeSecret('xoxb-123456789-abcdefghij'), true)
  })

  it('ignores placeholders', () => {
    assert.equal(looksLikeSecret('your-key-here'), false)
    assert.equal(looksLikeSecret('changeme'), false)
    assert.equal(looksLikeSecret('TODO'), false)
  })

  it('ignores safe values', () => {
    assert.equal(looksLikeSecret(''), false)
    assert.equal(looksLikeSecret('true'), false)
    assert.equal(looksLikeSecret('false'), false)
    assert.equal(looksLikeSecret('http://localhost:3000'), false)
    assert.equal(looksLikeSecret('abc'), false)
  })

  it('flags base64-like long strings', () => {
    assert.equal(looksLikeSecret('YWJjZGVmZ2hp1mts2W5vcH3ycw'), true)
    assert.equal(looksLikeSecret('catalogsuggestionsblock'), false)
    assert.equal(looksLikeSecret('AcmeCorporationCatalogV2B'), false)
  })

  it('ignores slug-like identifiers', () => {
    assert.equal(looksLikeSecret('claude-sonnet-4-20250514'), false)
    assert.equal(looksLikeSecret('gpt-4o-mini-2024-07-18'), false)
    assert.equal(looksLikeSecret('my-app-service-v2.1'), false)
    assert.equal(looksLikeSecret('us-east-1a'), false)
  })

  it('flags mixed-case strings with digits and special chars', () => {
    assert.equal(looksLikeSecret('aB3$dEfGhI9kLmN!'), true)
  })
})

describe('findSecrets', () => {
  it('finds suspicious values in example map', () => {
    const example = new Map([
      ['SAFE', 'changeme'],
      ['DANGEROUS', 'sk_live_abc123def456ghi789'],
    ])
    const result = findSecrets(example)
    assert.equal(result.length, 1)
    assert.equal(result[0].key, 'DANGEROUS')
  })
})
