const numberFormat = new Intl.NumberFormat();

/** "1,240". */
export function formatNumber(count: number): string {
  return numberFormat.format(count);
}

/** "1 Style", "1,240 Styles". */
export function countOf(count: number, one: string, many: string): string {
  return `${numberFormat.format(count)} ${count === 1 ? one : many}`;
}

/**
 * Text folded for matching: same Unicode form (macOS file names use NFD),
 * no accents, no case. "Café" and "cafe" match.
 */
export function searchKey(text: string): string {
  return text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

/** Sorts names the way people expect: "Font 2" before "Font 10", case ignored. */
export const nameCollator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});
