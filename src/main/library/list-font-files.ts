import { readdir, stat } from "node:fs/promises";
import { extname, join } from "node:path";
import type {
  FontFile,
  FontFileList,
  FontFolder,
  FontFolderReport,
} from "../../shared/contracts/library";

/** One entry in a folder, reduced to what a Scan needs. */
export interface DirectoryEntry {
  name: string;
  kind: "file" | "directory" | "other";
}

/**
 * Reads one folder. Production passes `fileSystemReader`; tests pass a fake
 * that can fail the way a real disk does (permission denied, folder gone).
 */
export interface DirectoryReader {
  readDirectory(path: string): Promise<DirectoryEntry[]>;
}

export const fileSystemReader: DirectoryReader = {
  async readDirectory(path) {
    const entries = await readdir(path, { withFileTypes: true });
    return Promise.all(
      entries.map(async (entry): Promise<DirectoryEntry> => {
        if (entry.isFile()) return { name: entry.name, kind: "file" };
        if (entry.isDirectory()) return { name: entry.name, kind: "directory" };
        if (entry.isSymbolicLink()) {
          // Follow links to files only. A linked folder could point back up
          // the tree and make the Scan loop forever.
          const target = await stat(join(path, entry.name)).catch(() => null);
          if (target?.isFile()) return { name: entry.name, kind: "file" };
        }
        return { name: entry.name, kind: "other" };
      }),
    );
  },
};

const FONT_FILE_EXTENSIONS = new Set([
  ".ttf",
  ".otf",
  ".ttc",
  ".otc",
  ".woff",
  ".woff2",
]);

/**
 * Font formats Book can't preview: Windows bitmap fonts, PostScript Type 1,
 * and classic Mac resource-fork fonts. They are counted so the UI can say so.
 */
const SKIPPED_EXTENSIONS = new Set([
  ".fon",
  ".fnt",
  ".pfb",
  ".pfa",
  ".pfm",
  ".afm",
  ".dfont",
  ".suit",
  ".bdf",
  ".pcf",
]);

/** Deep enough for any real Font folder; stops runaway trees. */
const MAX_DEPTH = 16;

/**
 * Walks each Font folder and its subfolders and lists the Font files in it.
 * It never throws for a folder it can't read: that folder is reported, and the
 * rest of the Scan carries on.
 */
export async function listFontFiles(
  folders: FontFolder[],
  reader: DirectoryReader = fileSystemReader,
): Promise<FontFileList> {
  const unreadableSubfolders: string[] = [];
  const skipped = { count: 0 };

  const scans = await Promise.all(
    folders.map(async (folder) => {
      const fontFiles: FontFile[] = [];
      const top = await readDirectory(reader, folder.path);
      if (top.status !== "read") {
        const report: FontFolderReport = { status: top.status, folder };
        return { report, fontFiles };
      }
      await collectFontFiles({
        reader,
        folder,
        directoryPath: folder.path,
        entries: top.entries,
        depth: 0,
        fontFiles,
        unreadableSubfolders,
        skipped,
      });
      fontFiles.sort(compareFontFiles);
      const report: FontFolderReport = {
        status: "scanned",
        folder,
        fontFileCount: fontFiles.length,
      };
      return { report, fontFiles };
    }),
  );

  return {
    folders: scans.map((scan) => scan.report),
    fontFiles: scans.flatMap((scan) => scan.fontFiles),
    unreadableSubfolders: unreadableSubfolders.sort(),
    skippedFileCount: skipped.count,
  };
}

interface CollectContext {
  reader: DirectoryReader;
  folder: FontFolder;
  directoryPath: string;
  entries: DirectoryEntry[];
  depth: number;
  fontFiles: FontFile[];
  unreadableSubfolders: string[];
  skipped: { count: number };
}

async function collectFontFiles(context: CollectContext): Promise<void> {
  const { reader, folder, directoryPath, entries, depth } = context;
  for (const entry of entries) {
    // Dot-named entries are hidden: .DS_Store, and the "._Name.ttf" AppleDouble
    // files macOS leaves behind when fonts are copied from a USB drive.
    if (entry.name.startsWith(".")) continue;
    const entryPath = join(directoryPath, entry.name);

    if (entry.kind === "file" && isFontFileName(entry.name)) {
      context.fontFiles.push({ path: entryPath, name: entry.name, folder });
    } else if (entry.kind === "file" && isSkippedFileName(entry.name)) {
      context.skipped.count += 1;
    } else if (entry.kind === "directory" && depth < MAX_DEPTH) {
      const child = await readDirectory(reader, entryPath);
      if (child.status === "read") {
        await collectFontFiles({
          ...context,
          directoryPath: entryPath,
          entries: child.entries,
          depth: depth + 1,
        });
      } else if (child.status === "unreadable") {
        context.unreadableSubfolders.push(entryPath);
      }
    }
  }
}

export function isFontFileName(name: string): boolean {
  return FONT_FILE_EXTENSIONS.has(extname(name).toLowerCase());
}

function isSkippedFileName(name: string): boolean {
  return SKIPPED_EXTENSIONS.has(extname(name).toLowerCase());
}

type ReadResult =
  | { status: "read"; entries: DirectoryEntry[] }
  | { status: "missing" }
  | { status: "unreadable" };

async function readDirectory(
  reader: DirectoryReader,
  path: string,
): Promise<ReadResult> {
  try {
    return { status: "read", entries: await reader.readDirectory(path) };
  } catch (error) {
    return isMissingError(error)
      ? { status: "missing" }
      : { status: "unreadable" };
  }
}

function isMissingError(error: unknown): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    (error.code === "ENOENT" || error.code === "ENOTDIR")
  );
}

const nameCollator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

function compareFontFiles(a: FontFile, b: FontFile): number {
  return nameCollator.compare(a.name, b.name) || a.path.localeCompare(b.path);
}
