/**
 * Commands main sends when she picks a menu item or presses its shortcut.
 * The menu is the one list of shortcuts; the renderer decides what each
 * command means for the view she is in.
 */
export type AppCommand =
  | "scan-again"
  | "import"
  | "find"
  | "new-collection"
  | "toggle-sidebar"
  | "toggle-inspector"
  | "reverse-paper-and-ink"
  | "size-bigger"
  | "size-smaller"
  | "size-default"
  | "reset-sample-text"
  | "go-back"
  | "go-all"
  | "go-my-fonts"
  | "go-system"
  | "go-imported"
  | "go-favorites"
  | "go-pairing"
  | "open-specimen"
  | "quick-preview"
  | "toggle-favorite"
  | "add-to-collection"
  | "export-png"
  | "use-as-heading"
  | "use-as-body"
  | "show-in-folder"
  | "show-about";

export interface AppInfo {
  /** "Finder" on macOS, "File Explorer" on Windows: main knows the OS, the renderer doesn't. */
  fileManagerName: string;
  /** Book's version, from package.json. */
  version: string;
}
