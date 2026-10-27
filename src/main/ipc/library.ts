import { ipcMain } from "electron";
import {
  type FontFolder,
  libraryChannels,
} from "../../shared/contracts/library";
import { listFontFiles } from "../library/list-font-files";

export function registerLibraryHandlers(fontFolders: FontFolder[]): void {
  // No input to parse yet. Once a handler takes arguments, parse them with
  // zod here before calling the operation (milestone 5).
  ipcMain.handle(libraryChannels.listFontFiles, () =>
    listFontFiles(fontFolders),
  );
}
