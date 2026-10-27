import { create, type Font } from "fontkit";
import { z } from "zod";
import type { Embedding, ParsedFace } from "../../shared/contracts/library";
import { findOwnScriptName } from "./own-script-name";

/**
 * Bump when parsing changes what it stores, so every cached result from an
 * older Book is thrown away and the Font file is parsed again.
 */
export const PARSER_VERSION = 2;

export type ParsedFontFile =
  | { status: "parsed"; faces: ParsedFace[]; faceCount: number }
  | { status: "failed" };

/**
 * Reads every face (Style) in one Font file. A `.ttc` or `.otc` holds several.
 * A face that fails to parse is left out; the file fails only when no face
 * parses at all. Never throws.
 */
export function parseFontFile(bytes: Buffer): ParsedFontFile {
  let faces: Font[];
  try {
    const font = create(bytes);
    faces = "fonts" in font ? font.fonts : [font];
  } catch {
    return { status: "failed" };
  }

  const parsed: ParsedFace[] = [];
  faces.forEach((face, faceIndex) => {
    try {
      parsed.push(parseFace(face, faceIndex));
    } catch {
      // One damaged face must not hide the others in the same file.
    }
  });

  return parsed.length > 0
    ? { status: "parsed", faces: parsed, faceCount: faces.length }
    : { status: "failed" };
}

// fontkit's objects come from inside a Font file, so they are untrusted input:
// each table is parsed with a schema, and a missing or odd field falls back.
const os2Schema = z
  .object({
    usWeightClass: z.number(),
    usWidthClass: z.number(),
    sFamilyClass: z.number(),
    panose: z.array(z.number()),
    fsType: z
      .object({
        noEmbedding: z.boolean(),
        viewOnly: z.boolean(),
        editable: z.boolean(),
      })
      .partial(),
    fsSelection: z
      .object({ italic: z.boolean(), oblique: z.boolean() })
      .partial(),
  })
  .partial();

const postSchema = z
  .object({ isFixedPitch: z.union([z.number(), z.boolean()]) })
  .partial();

const headSchema = z
  .object({ macStyle: z.object({ italic: z.boolean() }).partial() })
  .partial();

const axesSchema = z.record(
  z.string(),
  z.object({
    name: z.string(),
    min: z.number(),
    default: z.number(),
    max: z.number(),
  }),
);

/** Name records by key, then by language: { fontFamily: { en: "Al Bayan", ar: "البيان" } }. */
const nameRecordsSchema = z.object({
  records: z.record(z.string(), z.record(z.string(), z.unknown())),
});

const namedVariationsSchema = z.record(
  z.string(),
  z.record(z.string(), z.number()),
);

function parseFace(face: Font, faceIndex: number): ParsedFace {
  const os2 = os2Schema.safeParse(face["OS/2"]).data ?? {};
  const post = postSchema.safeParse("post" in face ? face.post : null).data;
  const head = headSchema.safeParse("head" in face ? face.head : null).data;

  const postscriptName = cleanName(face.postscriptName) ?? "";
  // Name IDs 16 and 17 (typographic family and style) group "Inter Light"
  // into "Inter"; older files only have IDs 1 and 2.
  const familyName =
    readName(face, "preferredFamily") ??
    readName(face, "fontFamily") ??
    postscriptName;
  const styleName =
    readName(face, "preferredSubfamily") ??
    readName(face, "fontSubfamily") ??
    "Regular";

  if (familyName === "") throw new Error("Face has no name.");

  return {
    faceIndex,
    familyName,
    styleName,
    postscriptName,
    weight: os2.usWeightClass ?? 400,
    width: os2.usWidthClass ?? 5,
    isItalic:
      os2.fsSelection?.italic === true ||
      os2.fsSelection?.oblique === true ||
      head?.macStyle?.italic === true ||
      /\b(italic|oblique)\b/i.test(styleName),
    axes: readAxes(face),
    namedInstances: readNamedInstances(face),
    familyClass: os2.sFamilyClass ?? 0,
    panose: os2.panose ?? [],
    isFixedPitch: Boolean(post?.isFixedPitch),
    designer: readName(face, "designer"),
    foundry: readName(face, "manufacturer"),
    version: readName(face, "version"),
    copyright: readName(face, "copyright"),
    license: readName(face, "license"),
    licenseUrl: readName(face, "licenseURL"),
    embedding: readEmbedding(os2.fsType),
    ownScriptName: findOwnScriptName(
      familyName,
      readLocalizedFamilyNames(face),
      (codePoint) => hasGlyph(face, codePoint),
    ),
  };
}

function readName(face: Font, key: string): string | null {
  try {
    return cleanName(face.getName(key, "en"));
  } catch {
    return null;
  }
}

/** Trims spaces and the NUL characters some Font files pad names with. */
function cleanName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  // biome-ignore lint/suspicious/noControlCharactersInRegex: NUL padding is exactly what this strips.
  const cleaned = value.replace(/\u0000/g, "").trim();
  return cleaned === "" ? null : cleaned;
}

/** The Family name in every language the Font file gives, English excluded. */
function readLocalizedFamilyNames(face: Font): string[] {
  const records = nameRecordsSchema.safeParse("name" in face ? face.name : null)
    .data?.records;
  if (!records) return [];
  const names = new Set<string>();
  for (const key of ["preferredFamily", "fontFamily"]) {
    for (const [language, value] of Object.entries(records[key] ?? {})) {
      const name = language === "en" ? null : cleanName(value);
      if (name) names.add(name);
    }
  }
  return [...names];
}

function hasGlyph(face: Font, codePoint: number): boolean {
  try {
    return face.hasGlyphForCodePoint(codePoint);
  } catch {
    return false;
  }
}

function readAxes(face: Font): ParsedFace["axes"] {
  const axes = axesSchema.safeParse(face.variationAxes).data ?? {};
  return Object.entries(axes).map(([tag, axis]) => ({
    tag,
    name: axis.name,
    min: axis.min,
    default: axis.default,
    max: axis.max,
  }));
}

function readNamedInstances(face: Font): ParsedFace["namedInstances"] {
  try {
    // fontkit throws on some fvar tables; the Axes still work without these.
    const raw = "namedVariations" in face ? face.namedVariations : null;
    const instances = namedVariationsSchema.safeParse(raw).data ?? {};
    return Object.entries(instances).map(([name, coordinates]) => ({
      name,
      coordinates,
    }));
  } catch {
    return [];
  }
}

function readEmbedding(fsType: z.infer<typeof os2Schema>["fsType"]): Embedding {
  if (fsType?.noEmbedding) return "restricted";
  if (fsType?.viewOnly) return "preview-and-print";
  if (fsType?.editable) return "editable";
  return "installable";
}
