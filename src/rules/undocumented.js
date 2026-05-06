function findUndocumented(envMap, exampleMap) {
  const undocumented = []
  for (const key of envMap.keys()) {
    if (!exampleMap.has(key)) {
      undocumented.push(key)
    }
  }
  return undocumented
}

export { findUndocumented }
