import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { relative, sep } from "node:path";
import { z } from "zod";
import {
  type FailedEntry,
  type FontFile,
  type FontFolder,
  type Library,
  parsedFaceSchema,
  type ScanProgress,
  type Style,
} from "../../shared/contracts/library";
import {
  type DirectoryReader,
  fileSystemReader,
  listFontFiles,
} from "./list-font-files";
import {
  PARSER_VERSION,
  type ParsedFontFile,
  parseFontFile,
} from "./parse-font-file";

const cachedResultSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("parsed"),
    faces: z.array(parsedFaceSchema),
    faceCount: z.number().int().positive(),
  }),
  z.object({ status: z.literal("failed") }),
]);

export const LIBRARY_INDEX_VERSION = 1;

/**
 * library-index.json: what each Font file contained the last time it was
 * parsed. A cache, not her work: it can always be deleted and rebuilt.
 */
export const libraryIndexSchema = z.object({
  version: z.literal(LIBRARY_INDEX_VERSION),
  parserVersion: z.number(),
  files: z.record(
    z.string(),
    z.object({
      size: z.number(),
      modifiedMs: z.number(),
      result: cachedResultSchema,
    }),
  ),
});
export type LibraryIndex = z.infer<typeof libraryIndexSchema>;

export const emptyLibraryIndex = (): LibraryIndex => ({
  version: LIBRARY_INDEX_VERSION,
  parserVersion: PARSER_VERSION,
  files: {},
});

export interface ScanOptions {
  previousIndex: LibraryIndex;
  onProgress?: (progress: ScanProgress) => void;
  reader?: DirectoryReader;
  readFontFile?: (path: string) => Promise<Buffer>;
  statFontFile?: (path: string) => Promise<{ size: number; mtimeMs: number }>;
}

/** Reading big files is I/O-bound; four at a time keeps memory bounded. */
const CONCURRENT_FILES = 4;

/**
 * A Scan: list every Font file, parse the ones that changed since the last
 * Scan, and turn the results into Styles. Never throws for a bad file.
 */
export async function scanLibrary(
  folders: FontFolder[],
  {
    previousIndex,
    onProgress,
    reader = fileSystemReader,
    readFontFile = (path) => readFile(path),
    statFontFile = (path) => stat(path),
  }: ScanOptions,
): Promise<{ library: Library; index: LibraryIndex }> {
  const list = await listFontFiles(folders, reader);
  const cacheIsUsable = previousIndex.parserVersion === PARSER_VERSION;
  const index = emptyLibraryIndex();
  const results = new Map<
    FontFile,
    { size: number; modifiedMs: number; result: ParsedFontFile }
  >();

  let done = 0;
  const total = list.fontFiles.length;
  onProgress?.({ done, total });

  await forEachWithLimit(list.fontFiles, CONCURRENT_FILES, async (fontFile) => {
    let info: { size: number; mtimeMs: number };
    try {
      info = await statFontFile(fontFile.path);
    } catch {
      // Removed between listing and reading it: leave it out.
      done += 1;
      return;
    }

    const cached = cacheIsUsable
      ? previousIndex.files[fontFile.path]
      : undefined;
    let result: ParsedFontFile;
    if (
      cached &&
      cached.size === info.size &&
      cached.modifiedMs === info.mtimeMs
    ) {
      result = cached.result;
    } else {
      try {
        result = parseFontFile(await readFontFile(fontFile.path));
      } catch {
        result = { status: "failed" };
      }
      // Parsing is synchronous; give IPC and window events a turn between files.
      await new Promise((resolve) => setImmediate(resolve));
    }

    index.files[fontFile.path] = {
      size: info.size,
      modifiedMs: info.mtimeMs,
      result,
    };
    results.set(fontFile, {
      size: info.size,
      modifiedMs: info.mtimeMs,
      result,
    });
    done += 1;
    if (done % 25 === 0) onProgress?.({ done, total });
  });
  onProgress?.({ done: total, total });

  const styles: Style[] = [];
  const failed: FailedEntry[] = [];
  // Keep the listing's order (by Font folder, then name), not completion order.
  for (const fontFile of list.fontFiles) {
    const entry = results.get(fontFile);
    if (!entry) continue;
    if (entry.result.status === "failed") {
      failed.push({
        path: fontFile.path,
        name: fontFile.name,
        folderPath: fontFile.folder.path,
      });
      continue;
    }
    for (const face of entry.result.faces) {
      // Dot-named Families (".SF NS") are reserved for the system's own UI.
      if (face.familyName.startsWith(".")) continue;
      styles.push({
        ...face,
        id: createStyleId(fontFile, face.faceIndex),
        fontFile: {
          path: fontFile.path,
          name: fontFile.name,
          folderPath: fontFile.folder.path,
          folderKind: fontFile.folder.kind,
          size: entry.size,
          modifiedMs: entry.modifiedMs,
          faceCount: entry.result.faceCount,
          // The Library service marks the Installed ones after the Scan.
          isInstalled: false,
        },
      });
    }
  }

  return {
    library: {
      styles,
      failed,
      folders: list.folders,
      unreadableSubfolders: list.unreadableSubfolders,
      skippedFileCount: list.skippedFileCount,
    },
    index,
  };
}

/**
 * A Style ID that survives restarts: the Font folder, the file's path inside
 * it, and the face index. Paths are normalized first, because the same file
 * can be spelled two ways (NFC vs NFD accents from macOS, letter case on
 * case-insensitive disks), and Collections must still find it.
 */
function createStyleId(fontFile: FontFile, faceIndex: number): string {
  const normalize = (value: string) => value.normalize("NFC").toLowerCase();
  const relativePath = relative(fontFile.folder.path, fontFile.path)
    .split(sep)
    .join("/");
  const key = `${normalize(fontFile.folder.path)}\n${normalize(relativePath)}\n${faceIndex}`;
  return createHash("sha256").update(key).digest("base64url").slice(0, 22);
}

async function forEachWithLimit<T>(
  items: T[],
  limit: number,
  task: (item: T) => Promise<void>,
): Promise<void> {
  let next = 0;
  const worker = async (): Promise<void> => {
    while (next < items.length) {
      const item = items[next];
      next += 1;
      if (item !== undefined) await task(item);
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker),
  );
}
