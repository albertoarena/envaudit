import { parseEnvFile } from '../parser.js'
import { looksLikeSecret } from '../rules/secrets.js'
import { colors, symbols } from '../output.js'

function maskValue(value) {
  if (looksLikeSecret(value)) {
    return value.slice(0, 3) + '***'
  }
  return value
}

function diff(file1, file2) {
  if (!file1 || !file2) {
    console.error(`${symbols.error} Usage: envaudit diff <file1> <file2>`)
    process.exitCode = 1
    return
  }

  let map1, map2
  try {
    map1 = parseEnvFile(file1)
  } catch {
    console.error(`${symbols.error} Cannot read ${file1}`)
    process.exitCode = 1
    return
  }
  try {
    map2 = parseEnvFile(file2)
  } catch {
    console.error(`${symbols.error} Cannot read ${file2}`)
    process.exitCode = 1
    return
  }

  const onlyIn1 = []
  const onlyIn2 = []
  const different = []

  for (const key of map1.keys()) {
    if (!map2.has(key)) {
      onlyIn1.push(key)
    } else if (map1.get(key) !== map2.get(key)) {
      different.push(key)
    }
  }

  for (const key of map2.keys()) {
    if (!map1.has(key)) {
      onlyIn2.push(key)
    }
  }

  if (onlyIn1.length === 0 && onlyIn2.length === 0 && different.length === 0) {
    console.log(`${symbols.success} ${colors.green('Files are identical')}`)
    return
  }

  if (onlyIn1.length > 0) {
    console.log(`\n${colors.bold(`Only in ${file1}`)}`)
    for (const key of onlyIn1) {
      console.log(`  ${colors.red('- ' + key)}`)
    }
  }

  if (onlyIn2.length > 0) {
    console.log(`\n${colors.bold(`Only in ${file2}`)}`)
    for (const key of onlyIn2) {
      console.log(`  ${colors.green('+ ' + key)}`)
    }
  }

  if (different.length > 0) {
    console.log(`\n${colors.bold('Different values')}`)
    for (const key of different) {
      const v1 = maskValue(map1.get(key))
      const v2 = maskValue(map2.get(key))
      console.log(`  ${colors.yellow(key)}`)
      console.log(`    ${colors.red(`- ${v1}`)}`)
      console.log(`    ${colors.green(`+ ${v2}`)}`)
    }
  }
}

export { diff }
