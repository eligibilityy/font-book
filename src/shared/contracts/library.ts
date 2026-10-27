import { z } from "zod";

/**
 * "system" is the operating system's own Font folder. Every other Font folder
 * is "user", which is what the My Fonts Library filter shows.
 */
export type FontFolderKind = "system" | "user";

export interface FontFolder {
  path: string;
  kind: FontFolderKind;
}

/**
 * What happened to one Font folder during a Scan. "missing" is normal (a
 * fresh Mac may have no ~/Library/Fonts) and is not an error; "unreadable"
 * is, and the UI names it.
 */
export type FontFolderReport =
  | { status: "scanned"; folder: FontFolder; fontFileCount: number }
  | { status: "missing"; folder: FontFolder }
  | { status: "unreadable"; folder: FontFolder };

export interface FontFile {
  path: string;
  /** The file name with its extension, such as "Inter-Bold.otf". */
  name: string;
  /** The Font folder this file was found in. */
  folder: FontFolder;
}

export interface FontFileList {
  folders: FontFolderReport[];
  fontFiles: FontFile[];
  /** Subfolders inside a Font folder that could not be read. */
  unreadableSubfolders: string[];
  /** Files in formats Book can't preview, such as .fon or Type 1. */
  skippedFileCount: number;
}

export const axisSchema = z.object({
  tag: z.string(),
  name: z.string(),
  min: z.number(),
  default: z.number(),
  max: z.number(),
});
export type Axis = z.infer<typeof axisSchema>;

export const namedInstanceSchema = z.object({
  name: z.string(),
  coordinates: z.record(z.string(), z.number()),
});
export type NamedInstance = z.infer<typeof namedInstanceSchema>;

/**
 * For a Style that can't draw its own Family name (an Arabic Style named
 * "Al Bayan"): a name in a script it does draw, and that script's English
 * name, such as { text: "العربية", script: "Arabic" }.
 */
export const ownScriptNameSchema = z.object({
  text: z.string(),
  script: z.string(),
});
export type OwnScriptName = z.infer<typeof ownScriptNameSchema>;

/** What the Font file's `OS/2.fsType` says about embedding, in plain words. */
export const embeddingSchema = z.enum([
  "installable",
  "editable",
  "preview-and-print",
  "restricted",
]);
export type Embedding = z.infer<typeof embeddingSchema>;

/**
 * Everything Book reads from one face of a Font file. Stored in the Scan
 * cache, so it is a schema: the cache is parsed on read like any file.
 */
export const parsedFaceSchema = z.object({
  faceIndex: z.number().int().nonnegative(),
  familyName: z.string(),
  styleName: z.string(),
  postscriptName: z.string(),
  /** `OS/2.usWeightClass`, 1 to 1000. */
  weight: z.number(),
  /** `OS/2.usWidthClass`, 1 (ultra-condensed) to 9 (ultra-expanded). */
  width: z.number(),
  isItalic: z.boolean(),
  axes: z.array(axisSchema),
  namedInstances: z.array(namedInstanceSchema),
  /** Raw hints for the Classification guess. */
  familyClass: z.number(),
  panose: z.array(z.number()),
  isFixedPitch: z.boolean(),
  designer: z.string().nullable(),
  foundry: z.string().nullable(),
  version: z.string().nullable(),
  copyright: z.string().nullable(),
  license: z.string().nullable(),
  licenseUrl: z.string().nullable(),
  embedding: embeddingSchema,
  /** What a Library row draws instead of the Family name; null when it draws the name. */
  ownScriptName: ownScriptNameSchema.nullable(),
});
export type ParsedFace = z.infer<typeof parsedFaceSchema>;

export interface StyleFontFile {
  path: string;
  name: string;
  folderPath: string;
  folderKind: FontFolderKind;
  /** Bytes on disk. For a .ttc this is the whole file, shared by its Styles. */
  size: number;
  faceCount: number;
}

/** One Style in the Library. `id` is opaque: never parse it. */
export interface Style extends ParsedFace {
  id: string;
  fontFile: StyleFontFile;
}

/** A Font file in a Font folder that couldn't be parsed. */
export interface FailedEntry {
  path: string;
  name: string;
  folderPath: string;
}

export interface Library {
  styles: Style[];
  failed: FailedEntry[];
  folders: FontFolderReport[];
  unreadableSubfolders: string[];
  skippedFileCount: number;
}

export interface ScanProgress {
  done: number;
  total: number;
}

export const styleIdSchema = z.string().min(1).max(64);

export type StyleBytesResult =
  | { status: "ready"; bytes: Uint8Array<ArrayBuffer> }
  | { status: "missing" }
  | { status: "unreadable" };

export const showInFolderInputSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("style"), styleId: styleIdSchema }),
  z.object({ kind: z.literal("failed"), path: z.string().min(1).max(4096) }),
]);
export type ShowInFolderInput = z.infer<typeof showInFolderInputSchema>;
