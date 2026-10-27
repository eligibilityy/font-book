// The preload runs sandboxed: it may import only `electron` and code that
// bundles into this file (src/shared). It forwards calls to main and holds no
// logic, so the web page never gets ipcRenderer or Node itself.
import {
  contextBridge,
  type IpcRendererEvent,
  ipcRenderer,
  webUtils,
} from "electron";
import type { AppCommand } from "../shared/contracts/app";
import {
  appChannels,
  libraryChannels,
  storageChannels,
} from "../shared/contracts/channels";
import type { FontBookApi } from "../shared/contracts/font-book-api";
import type { ScanProgress } from "../shared/contracts/library";

/**
 * Subscribes to a main-to-renderer message. The IPC event object is dropped:
 * it carries `sender`, which the page must not get.
 */
function subscribe<T>(
  channel: string,
  callback: (payload: T) => void,
): () => void {
  const listener = (_event: IpcRendererEvent, payload: T): void =>
    callback(payload);
  ipcRenderer.on(channel, listener);
  return () => {
    ipcRenderer.removeListener(channel, listener);
  };
}

const fontBook: FontBookApi = {
  library: {
    load: () => ipcRenderer.invoke(libraryChannels.load),
    scan: () => ipcRenderer.invoke(libraryChannels.scan),
    readStyleBytes: (styleId) =>
      ipcRenderer.invoke(libraryChannels.readStyleBytes, styleId),
    showInFolder: (target) =>
      ipcRenderer.invoke(libraryChannels.showInFolder, target),
    // A dropped File's path is only readable here, in the preload; the page
    // hands over the Files and never sees a path.
    importFiles: (files) =>
      ipcRenderer.invoke(
        libraryChannels.importPaths,
        files.map((file) => webUtils.getPathForFile(file)),
      ),
    importWithDialog: () =>
      ipcRenderer.invoke(libraryChannels.importWithDialog),
    onScanProgress: (callback) =>
      subscribe<ScanProgress>(libraryChannels.scanProgress, callback),
  },
  storage: {
    loadAll: () => ipcRenderer.invoke(storageChannels.loadAll),
    saveCollections: (file) =>
      ipcRenderer.invoke(storageChannels.saveCollections, file),
    saveClassifications: (file) =>
      ipcRenderer.invoke(storageChannels.saveClassifications, file),
    savePrefs: (file) => ipcRenderer.invoke(storageChannels.savePrefs, file),
  },
  app: {
    getInfo: () => ipcRenderer.invoke(appChannels.getInfo),
    onCommand: (callback) =>
      subscribe<AppCommand>(appChannels.command, callback),
  },
};

contextBridge.exposeInMainWorld("fontBook", fontBook);
