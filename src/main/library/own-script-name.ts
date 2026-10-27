import type { OwnScriptName } from "../../shared/contracts/library";

/**
 * Scripts a Style without Latin letters is likely to draw, each with its own
 * name written in that script, the way Apple Font Book labels them. Checked in
 * this order, so the first one the Style covers completely wins: Korean and
 * Japanese before Chinese, because their Font files also carry Han characters.
 */
const SCRIPTS: readonly { script: string; pattern: RegExp; sample: string }[] =
  [
    { script: "Arabic", pattern: /\p{Script=Arabic}/u, sample: "العربية" },
    { script: "Hebrew", pattern: /\p{Script=Hebrew}/u, sample: "עברית" },
    { script: "Syriac", pattern: /\p{Script=Syriac}/u, sample: "ܣܘܪܝܝܐ" },
    { script: "Thaana", pattern: /\p{Script=Thaana}/u, sample: "ދިވެހި" },
    { script: "N'Ko", pattern: /\p{Script=Nko}/u, sample: "ߒߞߏ" },
    {
      script: "Devanagari",
      pattern: /\p{Script=Devanagari}/u,
      sample: "देवनागरी",
    },
    { script: "Bengali", pattern: /\p{Script=Bengali}/u, sample: "বাংলা" },
    { script: "Gurmukhi", pattern: /\p{Script=Gurmukhi}/u, sample: "ਗੁਰਮੁਖੀ" },
    { script: "Gujarati", pattern: /\p{Script=Gujarati}/u, sample: "ગુજરાતી" },
    { script: "Odia", pattern: /\p{Script=Oriya}/u, sample: "ଓଡ଼ିଆ" },
    { script: "Tamil", pattern: /\p{Script=Tamil}/u, sample: "தமிழ்" },
    { script: "Telugu", pattern: /\p{Script=Telugu}/u, sample: "తెలుగు" },
    { script: "Kannada", pattern: /\p{Script=Kannada}/u, sample: "ಕನ್ನಡ" },
    { script: "Malayalam", pattern: /\p{Script=Malayalam}/u, sample: "മലയാളം" },
    { script: "Sinhala", pattern: /\p{Script=Sinhala}/u, sample: "සිංහල" },
    { script: "Thai", pattern: /\p{Script=Thai}/u, sample: "ภาษาไทย" },
    { script: "Lao", pattern: /\p{Script=Lao}/u, sample: "ພາສາລາວ" },
    { script: "Khmer", pattern: /\p{Script=Khmer}/u, sample: "ភាសាខ្មែរ" },
    { script: "Myanmar", pattern: /\p{Script=Myanmar}/u, sample: "မြန်မာ" },
    { script: "Tibetan", pattern: /\p{Script=Tibetan}/u, sample: "བོད་ཡིག" },
    { script: "Georgian", pattern: /\p{Script=Georgian}/u, sample: "ქართული" },
    { script: "Armenian", pattern: /\p{Script=Armenian}/u, sample: "Հայերեն" },
    { script: "Ethiopic", pattern: /\p{Script=Ethiopic}/u, sample: "ግዕዝ" },
    { script: "Cherokee", pattern: /\p{Script=Cherokee}/u, sample: "ᏣᎳᎩ" },
    {
      script: "Canadian Syllabics",
      pattern: /\p{Script=Canadian_Aboriginal}/u,
      sample: "ᐃᓄᒃᑎᑐᑦ",
    },
    { script: "Korean", pattern: /\p{Script=Hangul}/u, sample: "한국어" },
    {
      script: "Japanese",
      pattern: /\p{Script=Hiragana}|\p{Script=Katakana}/u,
      sample: "ひらがな",
    },
    { script: "Chinese", pattern: /\p{Script=Han}/u, sample: "中文" },
    {
      script: "Cyrillic",
      pattern: /\p{Script=Cyrillic}/u,
      sample: "Кириллица",
    },
    { script: "Greek", pattern: /\p{Script=Greek}/u, sample: "Ελληνικά" },
  ];

// Letters and the marks that attach to them (Indic vowel signs, Arabic harakat).
const LETTER = /[\p{L}\p{M}]/u;

/**
 * What a Library row draws for a Style that can't draw its own Family name:
 * an Arabic Style named "Al Bayan" has no Latin letters, so its name would be
 * a row of empty boxes. Prefers the Family name the Font file gives in another
 * language ("البيان"), then the name of a script the Style covers, written in
 * that script. Null when the Style draws its Family name, which is nearly
 * always.
 *
 * `hasGlyph` answers whether the Style has a Glyph for a code point;
 * `localizedNames` are the Family names the Font file gives in other
 * languages.
 */
export function findOwnScriptName(
  familyName: string,
  localizedNames: readonly string[],
  hasGlyph: (codePoint: number) => boolean,
): OwnScriptName | null {
  // Most letters drawn is close enough: a Latin Style missing one accented
  // letter still shows its name, with one honest box.
  if (drawnShare(familyName, hasGlyph) >= 0.5) return null;

  for (const name of localizedNames) {
    if (drawnShare(name, hasGlyph) < 1) continue;
    const script = SCRIPTS.find((candidate) => candidate.pattern.test(name));
    if (script) return { text: name, script: script.script };
  }
  for (const { script, sample } of SCRIPTS) {
    if (drawnShare(sample, hasGlyph) === 1) return { text: sample, script };
  }
  return null;
}

/** The share of a text's letters the Style has Glyphs for, from 0 to 1. */
function drawnShare(
  text: string,
  hasGlyph: (codePoint: number) => boolean,
): number {
  const letters = [...text].filter((character) => LETTER.test(character));
  if (letters.length === 0) return 1;
  const drawn = letters.filter((letter) => {
    const codePoint = letter.codePointAt(0);
    return codePoint !== undefined && hasGlyph(codePoint);
  });
  return drawn.length / letters.length;
}
