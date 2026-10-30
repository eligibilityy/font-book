import { join } from "node:path";
import { z } from "zod";
import {
  CLASSIFICATIONS_VERSION,
  type ClassificationsFile,
  COLLECTIONS_VERSION,
  type CollectionsFile,
  classificationsFileSchema,
  collectionsFileSchema,
  defaultPrefs,
  PREFS_VERSION,
  type PrefsFile,
  prefsFileSchema,
} from "../../shared/contracts/storage";
import {
  emptyInstalledFile,
  INSTALLED_VERSION,
  type InstalledFile,
  installedFileSchema,
} from "../library/install-font-files";
import {
  emptyLibraryIndex,
  LIBRARY_INDEX_VERSION,
  type LibraryIndex,
  libraryIndexSchema,
} from "../library/scan-library";
import { createJsonFile, type JsonFile } from "./json-file";

export const themeSchema = z.enum(["system", "light", "dark"]);
export type Theme = z.infer<typeof themeSchema>;

const APP_STATE_VERSION = 1;
const appStateSchema = z.object({
  version: z.literal(APP_STATE_VERSION),
  theme: themeSchema,
  windowBounds: z
    .object({
      x: z.number(),
      y: z.number(),
      width: z.number(),
      height: z.number(),
    })
    .nullable(),
  isMaximized: z.boolean(),
});
export type AppState = z.infer<typeof appStateSchema>;

export interface Stores {
  libraryIndex: JsonFile<LibraryIndex>;
  collections: JsonFile<CollectionsFile>;
  classifications: JsonFile<ClassificationsFile>;
  prefs: JsonFile<PrefsFile>;
  /** Main's own state: window size and position, and the theme. */
  appState: JsonFile<AppState>;
  /** The copies Install put in her Fonts folder, so Uninstall removes only those. */
  installed: JsonFile<InstalledFile>;
}

/** Every file Book writes, all under userData. See architecture: on-disk layout. */
export function openStores(userDataPath: string): Stores {
  return {
    libraryIndex: createJsonFile({
      path: join(userDataPath, "library-index.json"),
      schema: libraryIndexSchema,
      version: LIBRARY_INDEX_VERSION,
      defaults: emptyLibraryIndex,
    }),
    collections: createJsonFile({
      path: join(userDataPath, "collections.json"),
      schema: collectionsFileSchema,
      version: COLLECTIONS_VERSION,
      defaults: () => ({
        version: COLLECTIONS_VERSION,
        favorites: [],
        collections: [],
      }),
    }),
    classifications: createJsonFile({
      path: join(userDataPath, "classifications.json"),
      schema: classificationsFileSchema,
      version: CLASSIFICATIONS_VERSION,
      defaults: () => ({ version: CLASSIFICATIONS_VERSION, families: {} }),
    }),
    prefs: createJsonFile({
      path: join(userDataPath, "prefs.json"),
      schema: prefsFileSchema,
      version: PREFS_VERSION,
      defaults: () => defaultPrefs,
    }),
    appState: createJsonFile({
      path: join(userDataPath, "app-state.json"),
      schema: appStateSchema,
      version: APP_STATE_VERSION,
      defaults: () => ({
        version: APP_STATE_VERSION,
        theme: "system",
        windowBounds: null,
        isMaximized: false,
      }),
    }),
    installed: createJsonFile({
      path: join(userDataPath, "installed.json"),
      schema: installedFileSchema,
      version: INSTALLED_VERSION,
      defaults: emptyInstalledFile,
    }),
  };
}
