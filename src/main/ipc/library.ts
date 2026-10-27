import { BrowserWindow, dialog, ipcMain, shell } from "electron";
import { libraryChannels } from "../../shared/contracts/channels";
import {
  type ImportResult,
  importPathsSchema,
  showInFolderInputSchema,
  styleIdSchema,
} from "../../shared/contracts/library";
import type { LibraryService } from "../library/library-service";

export function registerLibraryHandlers(library: LibraryService): void {
  ipcMain.handle(libraryChannels.load, () => library.load());
  ipcMain.handle(libraryChannels.scan, () => library.scan());

  ipcMain.handle(libraryChannels.readStyleBytes, (_event, input: unknown) =>
    library.readStyleBytes(styleIdSchema.parse(input)),
  );

  // Paths she dropped on the window: reading them is what she asked for.
  ipcMain.handle(
    libraryChannels.importPaths,
    async (_event, input: unknown): Promise<ImportResult> => ({
      status: "imported",
      ...(await library.importFontFiles(importPathsSchema.parse(input))),
    }),
  );

  ipcMain.handle(
    libraryChannels.importWithDialog,
    async (event): Promise<ImportResult> => {
      const window = BrowserWindow.fromWebContents(event.sender);
      const options: Electron.OpenDialogOptions = {
        title: "Import",
        buttonLabel: "Import",
        // macOS can pick files and folders in one dialog; Windows can't, so
        // there it picks Font files, and folders are dropped instead.
        properties:
          process.platform === "darwin"
            ? ["openFile", "openDirectory", "multiSelections"]
            : ["openFile", "multiSelections"],
        filters: [
          {
            name: "Font files",
            extensions: ["ttf", "otf", "ttc", "otc", "woff", "woff2"],
          },
        ],
      };
      const picked = window
        ? await dialog.showOpenDialog(window, options)
        : await dialog.showOpenDialog(options);
      if (picked.canceled || picked.filePaths.length === 0)
        return { status: "cancelled" };
      return {
        status: "imported",
        ...(await library.importFontFiles(picked.filePaths)),
      };
    },
  );

  ipcMain.handle(libraryChannels.showInFolder, (_event, input: unknown) => {
    // Only paths of Font files in the Library: the page never names a path
    // main hasn't already found itself.
    const path = library.findFontFilePath(showInFolderInputSchema.parse(input));
    if (path) shell.showItemInFolder(path);
  });
}
