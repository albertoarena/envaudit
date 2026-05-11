import { readFileSync } from 'fs'
import { parseEnvContent } from '../parser.js'
import { findMissing } from '../rules/missing.js'
import { findUndocumented } from '../rules/undocumented.js'
import { findEmpty } from '../rules/empty-values.js'
import { findSecrets } from '../rules/secrets.js'
import { findUnquotedSpaces } from '../rules/unquoted-spaces.js'
import { colors, symbols, printSummary } from '../output.js'

function check(options = {}) {
  const envPath = options.env || '.env'
  const examplePath = options.example || '.env.example'

  let envContent, exampleContent
  try {
    envContent = readFileSync(envPath, 'utf-8')
  } catch {
    console.error(`${symbols.error} Cannot read ${envPath}`)
    process.exitCode = 1
    return
  }
  try {
    exampleContent = readFileSync(examplePath, 'utf-8')
  } catch {
    console.error(`${symbols.error} Cannot read ${examplePath}`)
    process.exitCode = 1
    return
  }

  const envMap = parseEnvContent(envContent)
  const exampleMap = parseEnvContent(exampleContent)

  let errorCount = 0
  let warningCount = 0

  // Errors: missing variables
  const missing = findMissing(envMap, exampleMap)
  if (missing.length > 0) {
    console.log(`\n${colors.bold('Missing variables')} ${colors.dim(`(in ${examplePath} but not in ${envPath})`)}`)
    for (const key of missing) {
      console.log(`  ${symbols.error} ${key}`)
      errorCount++
    }
  }

  // Errors: secrets in example
  const secrets = findSecrets(exampleMap)
  if (secrets.length > 0) {
    console.log(`\n${colors.bold('Possible secrets in example file')}`)
    for (const { key } of secrets) {
      console.log(`  ${symbols.error} ${key} ${colors.dim('has a value that looks like a real secret')}`)
      errorCount++
    }
  }

  // Errors: unquoted values with spaces
  const unquotedSpaces = findUnquotedSpaces(envContent)
  if (unquotedSpaces.length > 0) {
    console.log(`\n${colors.bold('Unquoted values with spaces')} ${colors.dim(`(in ${envPath})`)}`)
    for (const { key, value, line } of unquotedSpaces) {
      console.log(`  ${symbols.error} ${key} ${colors.dim(`(line ${line})`)}`)
      console.log(`    ${colors.dim(`Wrap in quotes: ${key}="${value}"`)}`)
      errorCount++
    }
  }

  // Warnings: undocumented variables
  const undocumented = findUndocumented(envMap, exampleMap)
  if (undocumented.length > 0) {
    console.log(`\n${colors.bold('Undocumented variables')} ${colors.dim(`(in ${envPath} but not in ${examplePath})`)}`)
    for (const key of undocumented) {
      console.log(`  ${symbols.warning} ${key}`)
      warningCount++
    }
  }

  // Warnings: empty values
  if (!options.ignoreEmpty) {
    const empty = findEmpty(envMap)
    if (empty.length > 0) {
      console.log(`\n${colors.bold('Empty values')}`)
      for (const key of empty) {
        console.log(`  ${symbols.warning} ${key}`)
        warningCount++
      }
    }
  }

  printSummary(errorCount, warningCount)

  if (options.ci && errorCount > 0) {
    process.exitCode = 1
  }
}

export { check }
