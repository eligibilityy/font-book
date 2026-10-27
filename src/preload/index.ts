// The preload runs sandboxed: it may import only `electron` and code that
// bundles into this file (src/shared). It forwards calls to main and holds no
// logic, so the web page never gets ipcRenderer or Node itself.
import { contextBridge, ipcRenderer } from "electron";
import type { FontBookApi } from "../shared/contracts/font-book-api";
import { libraryChannels } from "../shared/contracts/library";

const fontBook: FontBookApi = {
  library: {
    listFontFiles: () => ipcRenderer.invoke(libraryChannels.listFontFiles),
    onScanRequested: (callback) => {
      // Drop the IPC event object: it carries `sender`, which the page must not get.
      const listener = (): void => callback();
      ipcRenderer.on(libraryChannels.scanRequested, listener);
      return () => {
        ipcRenderer.removeListener(libraryChannels.scanRequested, listener);
      };
    },
  },
};

contextBridge.exposeInMainWorld("fontBook", fontBook);
