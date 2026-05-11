function findUnquotedSpaces(content) {
  const results = []
  const lines = content.split('\n')

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim()
    if (!line || line.startsWith('#')) continue

    // Strip export prefix
    if (line.startsWith('export ')) {
      line = line.slice(7)
    }

    const eqIndex = line.indexOf('=')
    if (eqIndex === -1) continue

    const key = line.slice(0, eqIndex).trim()
    const rawValue = line.slice(eqIndex + 1)
    const trimmedValue = rawValue.trim()

    // Skip empty values
    if (!trimmedValue) continue

    // Skip quoted values
    if (
      (trimmedValue.startsWith('"') && trimmedValue.endsWith('"')) ||
      (trimmedValue.startsWith("'") && trimmedValue.endsWith("'"))
    ) continue

    // Strip inline comment before checking for spaces
    let value = trimmedValue
    const commentIndex = value.indexOf(' #')
    if (commentIndex !== -1) {
      value = value.slice(0, commentIndex).trim()
    }

    if (value.includes(' ')) {
      results.push({ key, value, line: i + 1 })
    }
  }

  return results
}

export { findUnquotedSpaces }
