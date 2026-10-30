import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import {
  type DirectoryReader,
  fileSystemReader,
  isFontFileName,
  listFontFiles,
} from "./list-font-files";
import { parseFontFile } from "./parse-font-file";

export interface ImportOutcome {
  /** Font files now in the imported-fonts folder for this Import, new or already there. */
  importedPaths: string[];
  importedCount: number;
  alreadyImportedCount: number;
  failedCount: number;
  skippedCount: number;
}

interface ImportOptions {
  /** Book's own imported-fonts folder, under userData. */
  folder: string;
  reader?: DirectoryReader;
}

/** More copies of one file name than anyone keeps on purpose. */
const MAX_NAME_SUFFIX = 99;

/**
 * Import: copies Font files, and the Font files inside folders, into Book's
 * imported-fonts folder, so they stay available after the originals move.
 * Each file is parsed first, so a damaged or mislabelled file is never
 * copied. A file identical to one already Imported is not copied twice; a
 * different file with the same name is kept as "Name 2.otf". Never throws for
 * one bad file.
 */
export async function importFontFiles(
  sources: readonly string[],
  { folder, reader = fileSystemReader }: ImportOptions,
): Promise<ImportOutcome> {
  const outcome: ImportOutcome = {
    importedPaths: [],
    importedCount: 0,
    alreadyImportedCount: 0,
    failedCount: 0,
    skippedCount: 0,
  };

  const candidates: string[] = [];
  for (const source of sources) {
    const info = await stat(source).catch(() => null);
    if (info?.isDirectory()) {
      // A dropped folder is walked like a Font folder: subfolders included,
      // licence and readme files ignored.
      const list = await listFontFiles(
        [{ path: source, kind: "user" }],
        reader,
      );
      candidates.push(...list.fontFiles.map((fontFile) => fontFile.path));
      outcome.skippedCount += list.skippedFileCount;
    } else if (info?.isFile() && isFontFileName(basename(source))) {
      candidates.push(source);
    } else if (info?.isFile()) {
      // A .fon or Type 1 file, or something that isn't a Font file at all.
      outcome.skippedCount += 1;
    } else {
      outcome.failedCount += 1;
    }
  }

  if (candidates.length > 0) await mkdir(folder, { recursive: true });

  for (const source of candidates) {
    try {
      const bytes = await readFile(source);
      if (parseFontFile(bytes).status !== "parsed") {
        outcome.failedCount += 1;
        continue;
      }
      const placed = await placeCopy(folder, basename(source), bytes);
      outcome.importedPaths.push(placed.path);
      if (placed.isNew) outcome.importedCount += 1;
      else outcome.alreadyImportedCount += 1;
    } catch {
      outcome.failedCount += 1;
    }
  }
  return outcome;
}

/**
 * Writes the bytes under the file's own name, or "Name 2.otf" and so on when
 * a different file has that name. Returns the existing copy instead when an
 * identical file is already there. Install uses it too.
 */
export async function placeCopy(
  folder: string,
  name: string,
  bytes: Buffer,
): Promise<{ path: string; isNew: boolean }> {
  const extension = extname(name);
  const stem = name.slice(0, name.length - extension.length);
  for (let suffix = 1; suffix <= MAX_NAME_SUFFIX; suffix += 1) {
    const candidate = join(
      folder,
      suffix === 1 ? name : `${stem} ${suffix}${extension}`,
    );
    const existing = await readFile(candidate).catch(() => null);
    if (existing === null) {
      // "wx" fails instead of overwriting, if a file appeared meanwhile.
      await writeFile(candidate, bytes, { flag: "wx" });
      return { path: candidate, isNew: true };
    }
    if (existing.equals(bytes)) return { path: candidate, isNew: false };
  }
  throw new Error(`Too many Imported Font files named ${name}.`);
}
