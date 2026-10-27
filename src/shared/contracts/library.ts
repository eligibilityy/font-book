/** IPC channel names for the Library domain. */
export const libraryChannels = {
  listFontFiles: "library:list-font-files",
  scanRequested: "library:scan-requested",
} as const;

/**
 * "system" is the operating system's own Font folder. Every other Font folder
 * is "user", which is what the My Fonts Library filter will show.
 */
export type FontFolderKind = "system" | "user";

export interface FontFolder {
  path: string;
  kind: FontFolderKind;
}

/**
 * What happened to one Font folder during a Scan. "missing" is normal (a
 * fresh Mac may have no ~/Library/Fonts) and is not an error; "unreadable"
 * is, and the UI names it.
 */
export type FontFolderReport =
  | { status: "scanned"; folder: FontFolder; fontFileCount: number }
  | { status: "missing"; folder: FontFolder }
  | { status: "unreadable"; folder: FontFolder };

export interface FontFile {
  path: string;
  /** The file name with its extension, such as "Inter-Bold.otf". */
  name: string;
  /** The path of the Font folder this file was found in. */
  folderPath: string;
}

export interface FontFileList {
  folders: FontFolderReport[];
  fontFiles: FontFile[];
  /** Subfolders inside a Font folder that could not be read. */
  unreadableSubfolders: string[];
}
