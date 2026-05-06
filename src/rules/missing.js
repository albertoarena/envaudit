function findMissing(envMap, exampleMap) {
  const missing = []
  for (const key of exampleMap.keys()) {
    if (!envMap.has(key)) {
      missing.push(key)
    }
  }
  return missing
}

export { findMissing }
