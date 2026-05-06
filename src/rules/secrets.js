const KNOWN_PREFIXES = [
  'sk_', 'pk_', 'tok_', 'key_', 'ghp_', 'gho_',
  'github_pat_', 'xoxb-', 'xoxp-', 'AKIA', 'whsec_',
]

const PLACEHOLDER_PATTERNS = [
  'your-key-here', 'xxx', 'null', 'empty', 'changeme',
  'secret', 'password', 'example', 'test', 'dummy',
  'fake', 'placeholder', 'todo', 'change_me',
]

function isPlaceholder(value) {
  const lower = value.toLowerCase()
  return PLACEHOLDER_PATTERNS.some((p) => lower.includes(p))
}

function isSafeValue(value) {
  if (!value || value.length === 0) return true

  // Boolean-like
  if (['true', 'false', '1', '0'].includes(value.toLowerCase())) return true

  // Localhost / example domains
  if (/localhost|127\.0\.0\.1|example\.com/i.test(value)) return true

  // Short strings (likely not secrets)
  if (value.length <= 8) return true

  if (isPlaceholder(value)) return true

  return false
}

function looksLikeSecret(value) {
  if (!value || value.length === 0) return false

  // Known secret prefixes always win
  for (const prefix of KNOWN_PREFIXES) {
    if (value.startsWith(prefix)) return true
  }

  if (isSafeValue(value)) return false

  // Base64-like long alphanumeric strings (20+ chars)
  // Require enough digit density to distinguish real tokens from words/names
  if (value.length >= 20 && /^[A-Za-z0-9+/=_-]+$/.test(value)) {
    const digitCount = (value.match(/[0-9]/g) || []).length
    if (digitCount / value.length >= 0.1) return true
  }

  // Mixed case + digits + special chars, longer than 12
  if (value.length > 12) {
    const hasUpper = /[A-Z]/.test(value)
    const hasLower = /[a-z]/.test(value)
    const hasDigit = /[0-9]/.test(value)
    const hasSpecial = /[^A-Za-z0-9]/.test(value)
    if (hasUpper && hasLower && hasDigit && hasSpecial) return true
  }

  return false
}

function findSecrets(exampleMap) {
  const secrets = []
  for (const [key, value] of exampleMap.entries()) {
    if (looksLikeSecret(value)) {
      secrets.push({ key, value })
    }
  }
  return secrets
}

export { findSecrets, looksLikeSecret }
