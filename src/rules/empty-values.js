function findEmpty(envMap) {
  const empty = []
  for (const [key, value] of envMap.entries()) {
    if (value === '') {
      empty.push(key)
    }
  }
  return empty
}

export { findEmpty }
