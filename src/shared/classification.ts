import { z } from "zod";
import { knownClassifications } from "./known-classifications";

export const classificationSchema = z.enum([
  "serif",
  "sans-serif",
  "slab-serif",
  "monospace",
  "script",
  "display",
  "unclassified",
]);
export type Classification = z.infer<typeof classificationSchema>;

export const classifications = classificationSchema.options;

export const classificationLabels: Record<Classification, string> = {
  serif: "Serif",
  "sans-serif": "Sans Serif",
  "slab-serif": "Slab Serif",
  monospace: "Monospace",
  script: "Script",
  display: "Display",
  unclassified: "Unclassified",
};

/** What a Representative Style's Font file says, as parsed in main. */
export interface ClassificationHints {
  familyName: string;
  isFixedPitch: boolean;
  /** `OS/2.sFamilyClass`: class in the high byte, subclass in the low byte. */
  familyClass: number;
  panose: number[];
}

/**
 * Guesses a Family's Classification from its Font file, in order of how much
 * each source can be trusted, stopping at the first answer: the Font file's
 * own fields, then a table of well-known Families, then words in the name.
 * Many Font files leave their fields empty, so "unclassified" is a normal
 * result.
 * See docs/product/ui-spec.md#classification-filter.
 */
export function guessClassification(
  hints: ClassificationHints,
): Classification {
  if (hints.isFixedPitch) return "monospace";
  return (
    fromFamilyClass(hints.familyClass) ??
    fromPanose(hints.panose) ??
    knownClassifications.get(hints.familyName.toLowerCase()) ??
    fromFamilyName(hints.familyName) ??
    "unclassified"
  );
}

/** IBM font class parameters, as used by `OS/2.sFamilyClass`. */
function fromFamilyClass(familyClass: number): Classification | null {
  switch ((familyClass >> 8) & 0xff) {
    case 1: // Oldstyle Serifs
    case 2: // Transitional Serifs
    case 3: // Modern Serifs
    case 7: // Freeform Serifs
      return "serif";
    case 4: // Clarendon Serifs
    case 5: // Slab Serifs
      return "slab-serif";
    case 8:
      return "sans-serif";
    case 9: // Ornamentals
      return "display";
    case 10:
      return "script";
    default: // 0 (no classification), 12 (Symbolic), reserved values
      return null;
  }
}

function fromPanose(panose: number[]): Classification | null {
  const [familyType, serifStyle] = panose;
  if (familyType === 3) return "script"; // Latin Hand Written
  if (familyType === 4) return "display"; // Latin Decorative
  if (familyType !== 2 || serifStyle === undefined) return null; // not Latin Text
  if (serifStyle >= 11 && serifStyle <= 13) return "sans-serif";
  if (serifStyle === 6) return "slab-serif"; // Square
  if (serifStyle >= 2 && serifStyle <= 10) return "serif";
  return null;
}

/**
 * Words designers and foundries put in Family names. The order matters:
 * "Noto Serif Display" is a Serif, "Roboto Slab" a Slab Serif. CJK naming
 * has its own words: Mincho, Myungjo and Song are serif styles; Gothic, Hei
 * and Maru are sans.
 */
const NAME_WORDS: readonly [RegExp, Classification][] = [
  [/\bmono\b|\bcode\b|\bconsole\b/i, "monospace"],
  [/\bslab\b|typewriter|clarendon|egyptian/i, "slab-serif"],
  [
    /\bsans\b|grotesk|grotesque|\bgothic\b|\bheiti\b|\bhei\b|\bmaru\b|rounded/i,
    "sans-serif",
  ],
  [
    /\bserif\b|\bmincho\b|myungjo|\bsongti\b|\bsong\b|\bming\b|\bantiqua\b|\broman\b/i,
    "serif",
  ],
  [
    /\bscript\b|\bhand\b|handwriting|\bbrush\b|calligraph|chancery|signature|\bkaiti\b/i,
    "script",
  ],
  [
    /\bdisplay\b|stencil|engraved|shadow|outline|\binline\b|poster|fraktur|blackletter|textura/i,
    "display",
  ],
];

function fromFamilyName(familyName: string): Classification | null {
  return NAME_WORDS.find(([pattern]) => pattern.test(familyName))?.[1] ?? null;
}
