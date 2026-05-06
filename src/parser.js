import { readFileSync } from 'fs'

function parseLine(line) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) return null

  const eqIndex = trimmed.indexOf('=')
  if (eqIndex === -1) return null

  const key = trimmed.slice(0, eqIndex).trim()
  let value = trimmed.slice(eqIndex + 1)

  // Handle quoted values
  const trimmedValue = value.trim()
  if (
    (trimmedValue.startsWith('"') && trimmedValue.endsWith('"')) ||
    (trimmedValue.startsWith("'") && trimmedValue.endsWith("'"))
  ) {
    value = trimmedValue.slice(1, -1)
    return { key, value }
  }

  // Strip inline comments (only for unquoted values)
  const commentIndex = value.indexOf(' #')
  if (commentIndex !== -1) {
    value = value.slice(0, commentIndex)
  }

  value = value.trim()
  return { key, value }
}

function parseEnvContent(content) {
  const entries = new Map()
  const lines = content.split('\n')

  for (const line of lines) {
    const result = parseLine(line)
    if (result) {
      entries.set(result.key, result.value)
    }
  }

  return entries
}

function parseEnvFile(filePath) {
  const content = readFileSync(filePath, 'utf-8')
  return parseEnvContent(content)
}

export { parseLine, parseEnvContent, parseEnvFile }
