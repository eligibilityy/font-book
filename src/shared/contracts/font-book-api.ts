import type { FontFileList } from "./library";

/**
 * Everything the renderer can ask of main. Preload implements it and exposes
 * it as `window.fontBook`; nothing else crosses the process boundary.
 */
export interface FontBookApi {
  library: {
    listFontFiles(): Promise<FontFileList>;
    /** Called when she chooses File > Scan Again. Returns an unsubscribe function. */
    onScanRequested(callback: () => void): () => void;
  };
}
