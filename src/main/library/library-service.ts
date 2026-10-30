import { readFile } from "node:fs/promises";
import type {
  FontFolder,
  ImportSummary,
  InstallResult,
  InstallSummary,
  Library,
  ScanProgress,
  Style,
  StyleBytesResult,
} from "../../shared/contracts/library";
import { errorCode, type JsonFile } from "../storage/json-file";
import { extractFace, isCollection } from "./extract-face";
import { importFontFiles } from "./import-font-files";
import {
  INSTALLED_VERSION,
  type InstalledCopy,
  type InstalledFile,
  installFontFile,
  uninstallFontFile,
} from "./install-font-files";
import {
  emptyLibraryIndex,
  type LibraryIndex,
  scanLibrary,
} from "./scan-library";

export interface LibraryService {
  /** The current Library; scans first if no Scan has finished yet. */
  load(): Promise<Library>;
  /** Scans again. If a Scan is already running, waits for that one instead. */
  scan(): Promise<Library>;
  readStyleBytes(styleId: string): Promise<StyleBytesResult>;
  /** Copies Font files into the imported-fonts folder, then Scans. */
  importFontFiles(
    paths: readonly string[],
  ): Promise<{ summary: ImportSummary; library: Library }>;
  /** Copies the Styles' Imported Font files into her Fonts folder, then Scans. */
  install(styleIds: readonly string[]): Promise<InstallResult>;
  /** Removes the copies Install made of the Styles' Font files, then Scans. */
  uninstall(styleIds: readonly string[]): Promise<InstallResult>;
  /** The Font file path of a Style or Failed entry in the Library, or null. */
  findFontFilePath(
    target:
      | { kind: "style"; styleId: string }
      | { kind: "failed"; path: string },
  ): string | null;
}

interface LibraryServiceOptions {
  folders: FontFolder[];
  /** Book's own folder of Imported Font files; also one of `folders`. */
  importedFolder: string;
  indexFile: JsonFile<LibraryIndex>;
  /** Her Fonts folder, where Install copies to; also one of `folders`. Null where Book can't Install. */
  installFolder: string | null;
  installedFile: JsonFile<InstalledFile>;
  onProgress: (progress: ScanProgress) => void;
}

/**
 * Main's copy of the Library. Main keeps it so it can check that every path
 * the renderer asks about belongs to a known Font file before reading it.
 */
export function createLibraryService({
  folders,
  importedFolder,
  indexFile,
  installFolder,
  installedFile,
  onProgress,
}: LibraryServiceOptions): LibraryService {
  let current: Library | null = null;
  let running: Promise<Library> | null = null;
  let stylesById = new Map<string, Style>();
  let failedPaths = new Set<string>();
  let index: LibraryIndex | null = null;
  let copies: InstalledCopy[] | null = null;

  async function loadCopies(): Promise<InstalledCopy[]> {
    // An unreadable file loses only the Installed marks, never a Font file.
    copies ??= await installedFile
      .load()
      .then((stored) => stored.data.copies)
      .catch(() => []);
    return copies;
  }

  async function saveCopies(next: InstalledCopy[]): Promise<void> {
    copies = next;
    await installedFile
      .save({ version: INSTALLED_VERSION, copies: next })
      .catch((error: unknown) => {
        console.warn("Couldn't save the Installed list", error);
      });
  }

  /**
   * Book's copies in her Fonts folder would list every Installed Style twice,
   * so they are hidden and the Imported original is marked Installed instead.
   * A copy she deleted, or whose original is gone, is no longer tracked.
   */
  async function applyInstalled(library: Library): Promise<Library> {
    const known = await loadCopies();
    const scanned = new Set(library.styles.map((style) => style.fontFile.path));
    const kept = known.filter(
      (copy) =>
        scanned.has(copy.importedPath) && scanned.has(copy.installedPath),
    );
    if (kept.length !== known.length) void saveCopies(kept);

    const installedPaths = new Set(kept.map((copy) => copy.installedPath));
    const importedPaths = new Set(kept.map((copy) => copy.importedPath));
    return {
      ...library,
      styles: library.styles
        .filter((style) => !installedPaths.has(style.fontFile.path))
        .map((style) =>
          importedPaths.has(style.fontFile.path)
            ? { ...style, fontFile: { ...style.fontFile, isInstalled: true } }
            : style,
        ),
    };
  }

  /** The Imported Font files holding these Styles, each once. */
  function importedFontFilePaths(styleIds: readonly string[]): string[] {
    const paths = new Set<string>();
    for (const id of styleIds) {
      const style = stylesById.get(id);
      if (style?.fontFile.folderKind === "imported") {
        paths.add(style.fontFile.path);
      }
    }
    return [...paths];
  }

  /** Scans once more after a change, waiting for any Scan already running. */
  async function scanAfterChange(): Promise<Library> {
    await running?.catch(() => null);
    return scan();
  }

  async function runScan(): Promise<Library> {
    if (!index) {
      // A missing or unreadable cache only costs time: start from empty.
      index = await indexFile
        .load()
        .then((stored) => stored.data)
        .catch(() => emptyLibraryIndex());
    }
    const result = await scanLibrary(folders, {
      previousIndex: index,
      onProgress,
    });
    index = result.index;
    const library = await applyInstalled(result.library);
    current = library;
    stylesById = new Map(library.styles.map((style) => [style.id, style]));
    failedPaths = new Set(library.failed.map((entry) => entry.path));
    indexFile.save(result.index).catch((error: unknown) => {
      console.warn("Couldn't save the Scan cache", error);
    });
    return library;
  }

  function scan(): Promise<Library> {
    running ??= runScan().finally(() => {
      running = null;
    });
    return running;
  }

  return {
    load: () => (current ? Promise.resolve(current) : scan()),
    scan,
    async readStyleBytes(styleId) {
      const style = stylesById.get(styleId);
      if (!style) return { status: "missing" };
      let bytes: Buffer;
      try {
        bytes = await readFile(style.fontFile.path);
      } catch (error) {
        return errorCode(error) === "ENOENT"
          ? { status: "missing" }
          : { status: "unreadable" };
      }
      try {
        // A copy, never a view: IPC would otherwise send the whole underlying
        // buffer. extractFace already returns fresh bytes.
        return {
          status: "ready",
          bytes: isCollection(bytes)
            ? extractFace(bytes, style.faceIndex)
            : new Uint8Array(bytes),
        };
      } catch {
        return { status: "unreadable" };
      }
    },
    async importFontFiles(paths) {
      const outcome = await importFontFiles(paths, { folder: importedFolder });
      // Wait for a Scan already running, then Scan once more: that one may
      // have listed the folder before the copies landed.
      await running?.catch(() => null);
      const library = await scan();
      const importedPaths = new Set(outcome.importedPaths);
      return {
        summary: {
          importedCount: outcome.importedCount,
          alreadyImportedCount: outcome.alreadyImportedCount,
          failedCount: outcome.failedCount,
          skippedCount: outcome.skippedCount,
          styleIds: library.styles
            .filter((style) => importedPaths.has(style.fontFile.path))
            .map((style) => style.id),
        },
        library,
      };
    },
    async install(styleIds) {
      if (!installFolder) throw new Error("Book can't Install here.");
      const summary: InstallSummary = {
        doneCount: 0,
        skippedCount: 0,
        failedCount: 0,
      };
      const next = [...(await loadCopies())];
      const alreadyInstalled = new Set(next.map((copy) => copy.importedPath));
      for (const path of importedFontFilePaths(styleIds)) {
        if (alreadyInstalled.has(path)) continue;
        try {
          const outcome = await installFontFile(path, installFolder);
          if (outcome.status === "installed") {
            next.push(outcome.copy);
            summary.doneCount += 1;
          } else {
            summary.skippedCount += 1;
          }
        } catch {
          summary.failedCount += 1;
        }
      }
      await saveCopies(next);
      return { summary, library: await scanAfterChange() };
    },
    async uninstall(styleIds) {
      const summary: InstallSummary = {
        doneCount: 0,
        skippedCount: 0,
        failedCount: 0,
      };
      const paths = new Set(importedFontFilePaths(styleIds));
      const next: InstalledCopy[] = [];
      for (const copy of await loadCopies()) {
        if (!paths.has(copy.importedPath)) {
          next.push(copy);
          continue;
        }
        try {
          // A copy that changed is hers now: it stays, and so leaves the list.
          const outcome = await uninstallFontFile(copy);
          if (outcome === "changed") summary.skippedCount += 1;
          else summary.doneCount += 1;
        } catch {
          next.push(copy);
          summary.failedCount += 1;
        }
      }
      await saveCopies(next);
      return { summary, library: await scanAfterChange() };
    },
    findFontFilePath(target) {
      if (target.kind === "style") {
        return stylesById.get(target.styleId)?.fontFile.path ?? null;
      }
      return failedPaths.has(target.path) ? target.path : null;
    },
  };
}
