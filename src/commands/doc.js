import { parseEnvFile } from '../parser.js'
import { symbols } from '../output.js'

function getGroup(key) {
  const underscoreIndex = key.indexOf('_')
  if (underscoreIndex > 0) {
    return key.slice(0, underscoreIndex)
  }
  return 'OTHER'
}

function doc(options = {}) {
  const envPath = options.env || '.env'
  const examplePath = options.example || '.env.example'

  let exampleMap
  try {
    exampleMap = parseEnvFile(examplePath)
  } catch {
    // Fall back to .env if no example
    try {
      exampleMap = parseEnvFile(envPath)
    } catch {
      console.error(`${symbols.error} Cannot read ${examplePath} or ${envPath}`)
      process.exitCode = 1
      return
    }
  }

  let envMap
  try {
    envMap = parseEnvFile(envPath)
  } catch {
    envMap = new Map()
  }

  // Group variables by prefix
  const groups = new Map()
  for (const [key, value] of exampleMap.entries()) {
    const group = getGroup(key)
    if (!groups.has(group)) groups.set(group, [])
    groups.get(group).push({ key, defaultValue: value })
  }

  // Also include env-only keys
  for (const key of envMap.keys()) {
    if (!exampleMap.has(key)) {
      const group = getGroup(key)
      if (!groups.has(group)) groups.set(group, [])
      groups.get(group).push({ key, defaultValue: '' })
    }
  }

  console.log('# Environment Variables\n')
  console.log('| Variable | Required | Default | Group |')
  console.log('|----------|----------|---------|-------|')

  const sortedGroups = [...groups.keys()].sort()
  for (const group of sortedGroups) {
    const vars = groups.get(group).sort((a, b) => a.key.localeCompare(b.key))
    for (const { key, defaultValue } of vars) {
      const required = exampleMap.has(key) ? 'Yes' : 'No'
      const def = defaultValue || '-'
      console.log(`| ${key} | ${required} | ${def} | ${group} |`)
    }
  }
}

export { doc }
