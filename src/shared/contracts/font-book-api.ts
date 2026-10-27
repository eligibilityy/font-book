import type { AppCommand, AppInfo } from "./app";
import type {
  ImportResult,
  Library,
  ScanProgress,
  ShowInFolderInput,
  StyleBytesResult,
} from "./library";
import type {
  ClassificationsFile,
  CollectionsFile,
  PrefsFile,
  SaveResult,
  StoredData,
} from "./storage";

/**
 * Everything the renderer can ask of main. Preload implements it and exposes
 * it as `window.fontBook`; nothing else crosses the process boundary.
 */
export interface FontBookApi {
  library: {
    /** The current Library, scanning first if needed. */
    load(): Promise<Library>;
    /** Scan Again. */
    scan(): Promise<Library>;
    /** One Style's font bytes, ready for `new FontFace(...)`. */
    readStyleBytes(styleId: string): Promise<StyleBytesResult>;
    showInFolder(target: ShowInFolderInput): Promise<void>;
    /** Imports dropped files and folders, then Scans. */
    importFiles(files: readonly File[]): Promise<ImportResult>;
    /** File > Import...: main shows the open dialog, Imports, then Scans. */
    importWithDialog(): Promise<ImportResult>;
    /** Returns an unsubscribe function. */
    onScanProgress(callback: (progress: ScanProgress) => void): () => void;
  };
  storage: {
    loadAll(): Promise<StoredData>;
    saveCollections(file: CollectionsFile): Promise<SaveResult>;
    saveClassifications(file: ClassificationsFile): Promise<SaveResult>;
    savePrefs(file: PrefsFile): Promise<SaveResult>;
  };
  app: {
    getInfo(): Promise<AppInfo>;
    /** Menu items and their shortcuts. Returns an unsubscribe function. */
    onCommand(callback: (command: AppCommand) => void): () => void;
  };
}
