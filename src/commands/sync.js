import { readFileSync, writeFileSync } from 'fs'
import { parseEnvFile } from '../parser.js'
import { findMissing } from '../rules/missing.js'
import { findUndocumented } from '../rules/undocumented.js'
import { colors, symbols } from '../output.js'

function sync(options = {}) {
  const envPath = options.env || '.env'
  const examplePath = options.example || '.env.example'
  const dryRun = options.dryRun || false

  let envMap, exampleMap
  try {
    envMap = parseEnvFile(envPath)
  } catch {
    console.error(`${symbols.error} Cannot read ${envPath}`)
    process.exitCode = 1
    return
  }
  try {
    exampleMap = parseEnvFile(examplePath)
  } catch {
    console.error(`${symbols.error} Cannot read ${examplePath}`)
    process.exitCode = 1
    return
  }

  const missing = findMissing(envMap, exampleMap)
  const undocumented = findUndocumented(envMap, exampleMap)

  if (missing.length === 0 && undocumented.length === 0) {
    console.log(`${symbols.success} ${colors.green('Files are already in sync')}`)
    return
  }

  // Add missing keys to .env
  if (missing.length > 0) {
    const prefix = dryRun ? colors.dim('[dry-run] ') : ''
    console.log(`\n${colors.bold(`Adding to ${envPath}`)}`)
    let envContent = ''
    try {
      envContent = readFileSync(envPath, 'utf-8')
    } catch {
      // file might be empty or missing
    }
    const linesToAdd = missing.map((key) => `${key}=`)
    const addition = '\n' + linesToAdd.join('\n') + '\n'

    for (const key of missing) {
      console.log(`  ${prefix}${symbols.success} ${key}`)
    }

    if (!dryRun) {
      writeFileSync(envPath, envContent.trimEnd() + addition)
    }
  }

  // Add undocumented keys to .env.example
  if (undocumented.length > 0) {
    const prefix = dryRun ? colors.dim('[dry-run] ') : ''
    console.log(`\n${colors.bold(`Adding to ${examplePath}`)}`)
    let exampleContent = ''
    try {
      exampleContent = readFileSync(examplePath, 'utf-8')
    } catch {
      // file might be empty or missing
    }
    const linesToAdd = undocumented.map((key) => `${key}=`)
    const addition = '\n' + linesToAdd.join('\n') + '\n'

    for (const key of undocumented) {
      console.log(`  ${prefix}${symbols.success} ${key}`)
    }

    if (!dryRun) {
      writeFileSync(examplePath, exampleContent.trimEnd() + addition)
    }
  }

  if (dryRun) {
    console.log(`\n${colors.dim('No files were modified (dry run)')}`)
  } else {
    console.log(`\n${symbols.success} ${colors.green('Sync complete')}`)
  }
}

export { sync }
