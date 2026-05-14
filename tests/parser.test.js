import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
import { parseLine, parseEnvContent, parseEnvFile } from '../src/parser.js'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const fixtures = join(__dirname, 'fixtures')

describe('parseLine', () => {
  it('parses basic KEY=value', () => {
    assert.deepEqual(parseLine('KEY=value'), { key: 'KEY', value: 'value' })
  })

  it('parses empty value', () => {
    assert.deepEqual(parseLine('KEY='), { key: 'KEY', value: '' })
  })

  it('parses double-quoted value', () => {
    assert.deepEqual(parseLine('KEY="hello world"'), { key: 'KEY', value: 'hello world' })
  })

  it('parses single-quoted value', () => {
    assert.deepEqual(parseLine("KEY='hello world'"), { key: 'KEY', value: 'hello world' })
  })

  it('strips inline comments', () => {
    assert.deepEqual(parseLine('KEY=value # comment'), { key: 'KEY', value: 'value' })
  })

  it('skips comment lines', () => {
    assert.equal(parseLine('# this is a comment'), null)
  })

  it('skips empty lines', () => {
    assert.equal(parseLine(''), null)
    assert.equal(parseLine('   '), null)
  })

  it('trims whitespace around keys and values', () => {
    assert.deepEqual(parseLine('  KEY  =  value  '), { key: 'KEY', value: 'value' })
  })

  it('handles values with equals signs', () => {
    assert.deepEqual(parseLine('KEY=a=b=c'), { key: 'KEY', value: 'a=b=c' })
  })
})

describe('parseEnvContent', () => {
  it('parses multi-line content', () => {
    const content = 'A=1\nB=2\n# comment\nC=3'
    const result = parseEnvContent(content)
    assert.equal(result.size, 3)
    assert.equal(result.get('A'), '1')
    assert.equal(result.get('B'), '2')
    assert.equal(result.get('C'), '3')
  })

  it('last duplicate wins', () => {
    const content = 'KEY=first\nKEY=second'
    const result = parseEnvContent(content)
    assert.equal(result.get('KEY'), 'second')
  })
})

describe('parseEnvFile', () => {
  it('parses a fixture file', () => {
    const result = parseEnvFile(join(fixtures, '.env.quotes'))
    assert.equal(result.get('SIMPLE'), 'value')
    assert.equal(result.get('DOUBLE_QUOTED'), 'hello world')
    assert.equal(result.get('SINGLE_QUOTED'), 'hello world')
    assert.equal(result.get('EMPTY'), '')
    assert.equal(result.get('INLINE_COMMENT'), 'value')
    assert.equal(result.get('SPACES'), 'spaced')
  })
})
