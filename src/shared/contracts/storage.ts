import { z } from "zod";
import { classificationSchema } from "../classification";
import { styleIdSchema } from "./library";

/**
 * A Style saved in a Collection or Favorites. The names are a snapshot, so a
 * Missing Style can still be listed by name after its Font file is gone.
 */
export const styleRefSchema = z.object({
  styleId: styleIdSchema,
  familyName: z.string().max(500),
  styleName: z.string().max(500),
});
export type StyleRef = z.infer<typeof styleRefSchema>;

export const collectionSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().min(1).max(200),
  styles: z.array(styleRefSchema).max(10_000),
});
export type Collection = z.infer<typeof collectionSchema>;

export const COLLECTIONS_VERSION = 1;
export const collectionsFileSchema = z.object({
  version: z.literal(COLLECTIONS_VERSION),
  favorites: z.array(styleRefSchema).max(10_000),
  collections: z.array(collectionSchema).max(1_000),
});
export type CollectionsFile = z.infer<typeof collectionsFileSchema>;

export const CLASSIFICATIONS_VERSION = 1;
/** Classifications she set by hand, keyed by Family key (see familyKey). */
export const classificationsFileSchema = z.object({
  version: z.literal(CLASSIFICATIONS_VERSION),
  families: z.record(z.string().max(500), classificationSchema),
});
export type ClassificationsFile = z.infer<typeof classificationsFileSchema>;

export const DEFAULT_SAMPLE_TEXT = "Sphinx of black quartz, judge my vow.";

/** One role in a Pairing: the Style, and the Axis values it was chosen with. */
const pairingSlotSchema = z.object({
  style: styleRefSchema.nullable(),
  /** Axis tag to value; Axes left out use the Style's default. */
  axisValues: z.record(z.string().max(4), z.number()),
});

/**
 * The Pairing: a heading Style and a body Style. Sizes and line heights
 * belong to the role, so Swap trades the Styles and keeps the page's scale.
 */
export const pairingSchema = z.object({
  heading: pairingSlotSchema,
  body: pairingSlotSchema,
  headingSize: z.number().min(16).max(160),
  headingLineHeight: z.number().min(0.8).max(2),
  bodySize: z.number().min(8).max(32),
  bodyLineHeight: z.number().min(1).max(2.4),
});
export type Pairing = z.infer<typeof pairingSchema>;

export const defaultPairing: Pairing = {
  heading: { style: null, axisValues: {} },
  body: { style: null, axisValues: {} },
  headingSize: 48,
  headingLineHeight: 1.1,
  bodySize: 16,
  bodyLineHeight: 1.5,
};

export const PREFS_VERSION = 1;
export const prefsFileSchema = z.object({
  version: z.literal(PREFS_VERSION),
  sampleText: z.string().max(300),
  specimenSize: z.number().min(8).max(300),
  lineHeight: z.number().min(0.8).max(2),
  /** Thousandths of an em, applied as letter-spacing. */
  tracking: z.number().min(-100).max(300),
  paperReversed: z.boolean(),
  inspectorOpen: z.boolean(),
  sidebarVisible: z.boolean(),
  firstLaunchHintSeen: z.boolean(),
  /** The dedication shows once, at first launch. Defaulted, so older prefs files still load. */
  dedicationSeen: z.boolean().default(false),
  /** Added in v0.2. Defaulted, so v0.1 prefs files still load. */
  pairing: pairingSchema.default(defaultPairing),
  /** The Specimen's layout: the Sample text once, or a waterfall of sizes. Added in v0.2. */
  specimenLayout: z.enum(["text", "waterfall"]).default("text"),
});
export type PrefsFile = z.infer<typeof prefsFileSchema>;

export const defaultPrefs: PrefsFile = {
  version: PREFS_VERSION,
  sampleText: DEFAULT_SAMPLE_TEXT,
  specimenSize: 64,
  lineHeight: 1.1,
  tracking: 0,
  paperReversed: false,
  inspectorOpen: false,
  sidebarVisible: true,
  firstLaunchHintSeen: false,
  dedicationSeen: false,
  pairing: defaultPairing,
  specimenLayout: "text",
};

/**
 * How a stored file was loaded. "set-aside": it couldn't be read, so it was
 * renamed and Book started fresh. "read-only": a newer Book wrote it, so this
 * Book shows it but never overwrites it. "unreadable": it exists but couldn't
 * be read, so nothing is saved over it.
 */
export type StoredFileStatus =
  | { status: "loaded" }
  | { status: "created" }
  | { status: "set-aside"; setAsideName: string }
  | { status: "read-only" }
  | { status: "unreadable" };

export interface StoredFile<T> {
  data: T;
  state: StoredFileStatus;
}

export interface StoredData {
  collections: StoredFile<CollectionsFile>;
  classifications: StoredFile<ClassificationsFile>;
  prefs: StoredFile<PrefsFile>;
}

export type SaveResult = { status: "saved" } | { status: "failed" };
