import { z } from "zod";

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
  /** False where Book has no Fonts folder to Install into (Windows). */
  canInstall: boolean;
  /**
   * The application menu on Windows, where Book draws its own title bar and
   * menus. Empty on macOS, where the system menu bar shows it.
   */
  menu: AppMenuEntry[];
}

/** One entry of the application menu. `path` is its index at every level. */
export type AppMenuEntry =
  | { type: "separator"; path: number[] }
  | { type: "submenu"; path: number[]; label: string; entries: AppMenuEntry[] }
  | {
      type: "item";
      path: number[];
      label: string;
      /** "Ctrl+F", as Windows writes it. */
      shortcut: string | null;
      enabled: boolean;
      /** True or false for a checkbox or radio item, such as a Theme; null otherwise. */
      checked: boolean | null;
    };

/** The path of the menu item to click. */
export const menuItemPathSchema = z
  .array(z.number().int().min(0).max(100))
  .min(1)
  .max(6);
