import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
import { findMissing } from '../src/rules/missing.js'
import { findUndocumented } from '../src/rules/undocumented.js'
import { findEmpty } from '../src/rules/empty-values.js'
import { findSecrets, looksLikeSecret } from '../src/rules/secrets.js'
import { findUnquotedSpaces } from '../src/rules/unquoted-spaces.js'

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

describe('findUnquotedSpaces', () => {
  it('flags unquoted values with spaces', () => {
    const content = 'APP_NAME=My Application\nAPP_ENV=production\n'
    const result = findUnquotedSpaces(content)
    assert.equal(result.length, 1)
    assert.equal(result[0].key, 'APP_NAME')
    assert.equal(result[0].value, 'My Application')
    assert.equal(result[0].line, 1)
  })

  it('flags multiple unquoted values', () => {
    const content = 'A=one two\nB=three four five\n'
    const result = findUnquotedSpaces(content)
    assert.equal(result.length, 2)
    assert.equal(result[0].key, 'A')
    assert.equal(result[1].key, 'B')
  })

  it('skips double-quoted values', () => {
    const content = 'APP_NAME="My Application"\n'
    const result = findUnquotedSpaces(content)
    assert.equal(result.length, 0)
  })

  it('skips single-quoted values', () => {
    const content = "APP_NAME='My Application'\n"
    const result = findUnquotedSpaces(content)
    assert.equal(result.length, 0)
  })

  it('skips values without spaces', () => {
    const content = 'APP_ENV=production\nDB_PORT=5432\n'
    const result = findUnquotedSpaces(content)
    assert.equal(result.length, 0)
  })

  it('skips empty values', () => {
    const content = 'APP_NAME=\nAPI_KEY=\n'
    const result = findUnquotedSpaces(content)
    assert.equal(result.length, 0)
  })

  it('skips comment lines', () => {
    const content = '# This is a comment with spaces\n'
    const result = findUnquotedSpaces(content)
    assert.equal(result.length, 0)
  })

  it('skips empty lines', () => {
    const content = '\n  \n'
    const result = findUnquotedSpaces(content)
    assert.equal(result.length, 0)
  })

  it('ignores inline comment when checking for spaces', () => {
    const content = 'KEY=value # this is a comment\n'
    const result = findUnquotedSpaces(content)
    assert.equal(result.length, 0)
  })

  it('flags value with spaces before inline comment', () => {
    const content = 'KEY=two words # comment\n'
    const result = findUnquotedSpaces(content)
    assert.equal(result.length, 1)
    assert.equal(result[0].key, 'KEY')
    assert.equal(result[0].value, 'two words')
  })

  it('handles export prefix', () => {
    const content = 'export APP_NAME=My App\n'
    const result = findUnquotedSpaces(content)
    assert.equal(result.length, 1)
    assert.equal(result[0].key, 'APP_NAME')
  })

  it('skips exported quoted values', () => {
    const content = 'export APP_NAME="My App"\n'
    const result = findUnquotedSpaces(content)
    assert.equal(result.length, 0)
  })

  it('returns correct line numbers', () => {
    const content = '# comment\nAPP_ENV=production\nAPP_NAME=My App\n\nTITLE=Hello World\n'
    const result = findUnquotedSpaces(content)
    assert.equal(result.length, 2)
    assert.equal(result[0].line, 3)
    assert.equal(result[1].line, 5)
  })
})
