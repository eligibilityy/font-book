import { z } from "zod";

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
 * each source can be trusted, stopping at the first answer. Many Font files
 * leave these fields empty, so "unclassified" is a normal result.
 * See docs/product/ui-spec.md#classification-filter.
 */
export function guessClassification(
  hints: ClassificationHints,
): Classification {
  if (hints.isFixedPitch) return "monospace";
  return (
    fromFamilyClass(hints.familyClass) ??
    fromPanose(hints.panose) ??
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

function fromFamilyName(familyName: string): Classification | null {
  if (/\bmono\b/i.test(familyName)) return "monospace";
  if (/\bslab\b/i.test(familyName)) return "slab-serif";
  if (/\bsans\b|grotesk|grotesque/i.test(familyName)) return "sans-serif";
  if (/\bserif\b/i.test(familyName)) return "serif";
  if (/\bscript\b/i.test(familyName)) return "script";
  if (/\bdisplay\b/i.test(familyName)) return "display";
  return null;
}
