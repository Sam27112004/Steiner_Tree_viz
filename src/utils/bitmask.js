export function popcount(mask) {
  let count = 0
  let value = mask

  while (value > 0) {
    value &= value - 1
    count += 1
  }

  return count
}

export function bitmaskToSet(mask, labels = []) {
  const values = []

  for (let terminalIndex = 0; terminalIndex < labels.length; terminalIndex += 1) {
    if (mask & (1 << terminalIndex)) {
      values.push(labels[terminalIndex])
    }
  }

  return values
}

export function subsets(mask) {
  const result = []
  let subsetMask = (mask - 1) & mask

  while (subsetMask > 0) {
    result.push(subsetMask)
    subsetMask = (subsetMask - 1) & mask
  }

  return result
}