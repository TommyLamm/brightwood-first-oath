/** Navigate visible slots while retaining their original bag identities after category filtering. */
export function nextInventoryBagIndex(
  bagIndices: readonly number[], currentBagIndex: number, key: string, columns: number,
): number | null {
  const current = bagIndices.indexOf(currentBagIndex);
  if (current < 0) return null;
  const width = Number.isFinite(columns) ? Math.max(1, Math.floor(columns)) : 1;
  let next: number;
  switch (key) {
    case 'ArrowLeft': next = current - 1; break;
    case 'ArrowRight': next = current + 1; break;
    case 'ArrowUp': next = current - width; break;
    case 'ArrowDown': next = current + width; break;
    case 'Home': next = 0; break;
    case 'End': next = bagIndices.length - 1; break;
    default: return null;
  }
  return bagIndices[Math.max(0, Math.min(bagIndices.length - 1, next))] ?? null;
}
