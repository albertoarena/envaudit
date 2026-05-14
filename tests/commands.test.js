import { describe, it, beforeEach, afterEach } from 'node:test'
import { strict as assert } from 'node:assert'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { writeFileSync, unlinkSync, readFileSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const fixtures = join(__dirname, 'fixtures')

// Capture console output
function captureOutput(fn) {
  const lines = []
  const originalLog = console.log
  const originalError = console.error
  console.log = (...args) => lines.push(args.join(' '))
  console.error = (...args) => lines.push(args.join(' '))
  try {
    fn()
  } finally {
    console.log = originalLog
    console.error = originalError
  }
  return lines.join('\n')
}

describe('check command', () => {
  // Dynamic import to reset module state
  let check
  beforeEach(async () => {
    const mod = await import('../src/commands/check.js')
    check = mod.check
    process.exitCode = undefined
  })

  it('finds missing and undocumented variables', () => {
    const output = captureOutput(() => {
      check({
        env: join(fixtures, '.env.basic'),
        example: join(fixtures, '.env.example.basic'),
      })
    })
    assert.ok(output.includes('APP_DEBUG'))
    assert.ok(output.includes('API_KEY'))
    assert.ok(output.includes('UNDOCUMENTED_VAR'))
  })

  it('sets exit code 1 with --ci when errors exist', () => {
    captureOutput(() => {
      check({
        env: join(fixtures, '.env.basic'),
        example: join(fixtures, '.env.example.basic'),
        ci: true,
      })
    })
    assert.equal(process.exitCode, 1)
  })

  it('skips empty value warnings with ignoreEmpty option', () => {
    const output = captureOutput(() => {
      check({
        env: join(fixtures, '.env.basic'),
        example: join(fixtures, '.env.example.basic'),
        ignoreEmpty: true,
      })
    })
    assert.ok(!output.includes('Empty values'))
  })

  it('reports error for missing env file', () => {
    const output = captureOutput(() => {
      check({ env: '/nonexistent/.env' })
    })
    assert.ok(output.includes('Cannot read'))
    assert.equal(process.exitCode, 1)
  })
})

describe('check command — unquoted spaces', () => {
  let check
  beforeEach(async () => {
    const mod = await import('../src/commands/check.js')
    check = mod.check
    process.exitCode = undefined
  })

  it('detects unquoted values with spaces', () => {
    const output = captureOutput(() => {
      check({
        env: join(fixtures, '.env.unquoted-spaces'),
        example: join(fixtures, '.env.example.basic'),
      })
    })
    assert.ok(output.includes('Unquoted values with spaces'))
    assert.ok(output.includes('APP_NAME'))
    assert.ok(output.includes('TITLE'))
    assert.ok(output.includes('SPACED_COMMENT'))
    assert.ok(output.includes('Wrap in quotes'))
  })

  it('sets exit code 1 with --ci when unquoted spaces found', () => {
    captureOutput(() => {
      check({
        env: join(fixtures, '.env.unquoted-spaces'),
        example: join(fixtures, '.env.unquoted-spaces'),
        ci: true,
      })
    })
    assert.equal(process.exitCode, 1)
  })
})

describe('diff command', () => {
  let diff
  beforeEach(async () => {
    const mod = await import('../src/commands/diff.js')
    diff = mod.diff
    process.exitCode = undefined
  })

  it('shows differences between two files', () => {
    const output = captureOutput(() => {
      diff(join(fixtures, '.env.file1'), join(fixtures, '.env.file2'))
    })
    assert.ok(output.includes('ONLY_IN_1'))
    assert.ok(output.includes('ONLY_IN_2'))
    assert.ok(output.includes('DIFF_VALUE'))
  })

  it('shows identical message for same file', () => {
    const output = captureOutput(() => {
      diff(join(fixtures, '.env.file1'), join(fixtures, '.env.file1'))
    })
    assert.ok(output.includes('identical'))
  })

  it('reports error for missing arguments', () => {
    captureOutput(() => {
      diff(undefined, undefined)
    })
    assert.equal(process.exitCode, 1)
  })
})

describe('sync command', () => {
  let sync
  const tmpEnv = join(fixtures, '.env.sync-tmp')
  const tmpExample = join(fixtures, '.env.example.sync-tmp')

  beforeEach(async () => {
    const mod = await import('../src/commands/sync.js')
    sync = mod.sync
    process.exitCode = undefined
    writeFileSync(tmpEnv, 'A=1\nB=2\nEXTRA=yes\n')
    writeFileSync(tmpExample, 'A=\nB=\nC=\n')
  })

  afterEach(() => {
    try { unlinkSync(tmpEnv) } catch {}
    try { unlinkSync(tmpExample) } catch {}
  })

  it('adds missing keys to env and undocumented to example', () => {
    captureOutput(() => {
      sync({ env: tmpEnv, example: tmpExample })
    })
    const envContent = readFileSync(tmpEnv, 'utf-8')
    const exampleContent = readFileSync(tmpExample, 'utf-8')
    assert.ok(envContent.includes('C='))
    assert.ok(exampleContent.includes('EXTRA='))
  })

  it('dry-run does not modify files', () => {
    const beforeEnv = readFileSync(tmpEnv, 'utf-8')
    const beforeExample = readFileSync(tmpExample, 'utf-8')
    captureOutput(() => {
      sync({ env: tmpEnv, example: tmpExample, dryRun: true })
    })
    assert.equal(readFileSync(tmpEnv, 'utf-8'), beforeEnv)
    assert.equal(readFileSync(tmpExample, 'utf-8'), beforeExample)
  })
})

describe('doc command', () => {
  let doc
  beforeEach(async () => {
    const mod = await import('../src/commands/doc.js')
    doc = mod.doc
    process.exitCode = undefined
  })

  it('generates markdown table', () => {
    const output = captureOutput(() => {
      doc({
        env: join(fixtures, '.env.basic'),
        example: join(fixtures, '.env.example.basic'),
      })
    })
    assert.ok(output.includes('| Variable |'))
    assert.ok(output.includes('APP_NAME'))
    assert.ok(output.includes('DB_HOST'))
  })
})
