import { ipcMain, shell } from "electron";
import { libraryChannels } from "../../shared/contracts/channels";
import {
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

  ipcMain.handle(libraryChannels.showInFolder, (_event, input: unknown) => {
    // Only paths of Font files in the Library: the page never names a path
    // main hasn't already found itself.
    const path = library.findFontFilePath(showInFolderInputSchema.parse(input));
    if (path) shell.showItemInFolder(path);
  });
}
