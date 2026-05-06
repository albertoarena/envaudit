#!/usr/bin/env node

import { check } from '../src/commands/check.js'
import { diff } from '../src/commands/diff.js'
import { sync } from '../src/commands/sync.js'
import { doc } from '../src/commands/doc.js'

const args = process.argv.slice(2)
const command = args[0]

function getFlag(name) {
  const index = args.indexOf(name)
  if (index === -1) return undefined
  return args[index + 1]
}

function hasFlag(name) {
  return args.includes(name)
}

function printHelp() {
  console.log(`envaudit — Zero-dependency CLI to audit, compare and sync .env files

Usage:
  envaudit check        Audit .env against .env.example
  envaudit diff <a> <b> Compare two env files
  envaudit sync         Sync missing keys between files
  envaudit doc          Generate markdown documentation

Options:
  --env <path>         Path to .env file (default: .env)
  --example <path>     Path to .env.example file (default: .env.example)
  --ci                 Exit with code 1 if errors found
  --ignore-empty       Skip empty value warnings (useful in CI)
  --dry-run            Show what sync would change without writing
  --no-color           Disable colored output
  --help, -h           Show this help message
  --version, -v        Show version`)
}

function printVersion() {
  console.log('envaudit 0.1.0')
}

if (hasFlag('--help') || hasFlag('-h') || !command) {
  printHelp()
} else if (hasFlag('--version') || hasFlag('-v')) {
  printVersion()
} else if (command === 'check') {
  check({
    env: getFlag('--env'),
    example: getFlag('--example'),
    ci: hasFlag('--ci'),
    ignoreEmpty: hasFlag('--ignore-empty'),
  })
} else if (command === 'diff') {
  const positional = args.filter((a) => !a.startsWith('--'))
  diff(positional[1], positional[2])
} else if (command === 'sync') {
  sync({
    env: getFlag('--env'),
    example: getFlag('--example'),
    dryRun: hasFlag('--dry-run'),
  })
} else if (command === 'doc') {
  doc({
    env: getFlag('--env'),
    example: getFlag('--example'),
  })
} else {
  console.error(`Unknown command: ${command}`)
  console.error('Run "envaudit --help" for usage')
  process.exitCode = 1
}
