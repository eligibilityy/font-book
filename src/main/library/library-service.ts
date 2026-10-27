import { readFile } from "node:fs/promises";
import type {
  FontFolder,
  Library,
  ScanProgress,
  Style,
  StyleBytesResult,
} from "../../shared/contracts/library";
import { errorCode, type JsonFile } from "../storage/json-file";
import { extractFace, isCollection } from "./extract-face";
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
  /** The Font file path of a Style or Failed entry in the Library, or null. */
  findFontFilePath(
    target:
      | { kind: "style"; styleId: string }
      | { kind: "failed"; path: string },
  ): string | null;
}

interface LibraryServiceOptions {
  folders: FontFolder[];
  indexFile: JsonFile<LibraryIndex>;
  onProgress: (progress: ScanProgress) => void;
}

/**
 * Main's copy of the Library. Main keeps it so it can check that every path
 * the renderer asks about belongs to a known Font file before reading it.
 */
export function createLibraryService({
  folders,
  indexFile,
  onProgress,
}: LibraryServiceOptions): LibraryService {
  let current: Library | null = null;
  let running: Promise<Library> | null = null;
  let stylesById = new Map<string, Style>();
  let failedPaths = new Set<string>();
  let index: LibraryIndex | null = null;

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
    current = result.library;
    stylesById = new Map(
      result.library.styles.map((style) => [style.id, style]),
    );
    failedPaths = new Set(result.library.failed.map((entry) => entry.path));
    indexFile.save(result.index).catch((error: unknown) => {
      console.warn("Couldn't save the Scan cache", error);
    });
    return result.library;
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
    findFontFilePath(target) {
      if (target.kind === "style") {
        return stylesById.get(target.styleId)?.fontFile.path ?? null;
      }
      return failedPaths.has(target.path) ? target.path : null;
    },
  };
}
