import type { Style } from "@shared/contracts/library";
import { nameCollator } from "@/shared/text";

/** Styles that share a Family name, grouped for one Library row. */
export interface Family {
  /** Normalized name: the same Family from two Font folders shares one key. */
  key: string;
  name: string;
  /** In picker order: by weight, uprights before italics. */
  styles: Style[];
  representative: Style;
  hasAxes: boolean;
}

/** The key Families are grouped and classified by. */
export function familyKey(familyName: string): string {
  return familyName.normalize("NFC").toLowerCase();
}

/** Groups Styles into Families, sorted by Family name. */
export function groupIntoFamilies(styles: Style[]): Family[] {
  const groups = new Map<string, Style[]>();
  for (const style of styles) {
    const key = familyKey(style.familyName);
    const group = groups.get(key);
    if (group) group.push(style);
    else groups.set(key, [style]);
  }

  const families: Family[] = [];
  for (const [key, group] of groups) {
    const sorted = sortStyles(group);
    const representative = pickRepresentativeStyle(sorted);
    if (!representative) continue;
    families.push({
      key,
      name: representative.familyName,
      styles: sorted,
      representative,
      hasAxes: sorted.some((style) => style.axes.length > 0),
    });
  }
  return families.sort((a, b) => nameCollator.compare(a.name, b.name));
}

/** Weight order, uprights before italics, then by name. */
function sortStyles(styles: Style[]): Style[] {
  return [...styles].sort(
    (a, b) =>
      Number(a.isItalic) - Number(b.isItalic) ||
      a.weight - b.weight ||
      a.width - b.width ||
      nameCollator.compare(a.styleName, b.styleName) ||
      a.fontFile.folderPath.localeCompare(b.fontFile.folderPath),
  );
}

const REGULAR_NAMES = ["regular", "roman", "book", "normal"];

/**
 * The Style a Family row shows: the upright closest to weight 400, preferring
 * one named "Regular" (then "Roman" or "Book"). If every Style is italic, the
 * italic closest to 400.
 */
export function pickRepresentativeStyle(styles: Style[]): Style | undefined {
  const uprights = styles.filter((style) => !style.isItalic);
  const candidates = uprights.length > 0 ? uprights : styles;
  return [...candidates].sort((a, b) => score(a) - score(b))[0];
}

function score(style: Style): number {
  const nameRank = REGULAR_NAMES.indexOf(style.styleName.toLowerCase());
  // Distance from 400 matters most; a "Regular" name breaks ties.
  return (
    Math.abs(style.weight - 400) * 10 +
    (nameRank === -1 ? 9 : nameRank) +
    (style.width === 5 ? 0 : 5)
  );
}

/**
 * When the same Style is installed in two Font folders, the Style picker and
 * About this Style name the folder, so she can tell the copies apart.
 */
export function findDuplicates(styles: Style[]): Map<string, Style[]> {
  const byName = new Map<string, Style[]>();
  for (const style of styles) {
    const key =
      style.postscriptName || `${style.familyName} ${style.styleName}`;
    byName.set(key, [...(byName.get(key) ?? []), style]);
  }
  const duplicates = new Map<string, Style[]>();
  for (const group of byName.values()) {
    if (group.length < 2) continue;
    for (const style of group) duplicates.set(style.id, group);
  }
  return duplicates;
}
