import { posix, win32 } from "node:path";
import type { FontFolder } from "../../shared/contracts/library";

export interface FontFolderEnvironment {
  platform: NodeJS.Platform;
  homePath: string;
  /** Windows only: %WINDIR% and %LOCALAPPDATA%. */
  windowsPath?: string | undefined;
  localAppDataPath?: string | undefined;
}

/**
 * The operating system's Font folders, in the order the Library lists them.
 *
 * Some folders are left out on purpose. macOS keeps fonts it downloads on
 * demand in /System/Library/AssetsV2, and Adobe Fonts keeps its files in
 * ~/Library/Application Support/Adobe/CoreSync/plugins/livetype, licensed for
 * use through Creative Cloud only. Neither is a Font folder, so a Scan never
 * reaches them.
 */
/**
 * Her own Fonts folder, where Install copies Imported Font files so every app
 * finds them; null where copying isn't enough. On Windows a Font file must also
 * be registered with the system, which Book doesn't do.
 */
export function installFolderFor(env: FontFolderEnvironment): string | null {
  return env.platform === "darwin"
    ? posix.join(env.homePath, "Library", "Fonts")
    : null;
}

export function listFontFolders(env: FontFolderEnvironment): FontFolder[] {
  switch (env.platform) {
    case "darwin":
      return [
        { path: posix.join(env.homePath, "Library", "Fonts"), kind: "user" },
        { path: "/Library/Fonts", kind: "user" },
        // Includes Supplemental/; the Scan walks into subfolders.
        { path: "/System/Library/Fonts", kind: "system" },
      ];
    case "win32": {
      const windowsPath = env.windowsPath ?? "C:\\Windows";
      const localAppDataPath =
        env.localAppDataPath ?? win32.join(env.homePath, "AppData", "Local");
      return [
        // Fonts installed "for me only" since Windows 10 1809.
        {
          path: win32.join(localAppDataPath, "Microsoft", "Windows", "Fonts"),
          kind: "user",
        },
        { path: win32.join(windowsPath, "Fonts"), kind: "system" },
      ];
    }
    default:
      return [
        {
          path: posix.join(env.homePath, ".local", "share", "fonts"),
          kind: "user",
        },
        { path: posix.join(env.homePath, ".fonts"), kind: "user" },
        { path: "/usr/local/share/fonts", kind: "user" },
        { path: "/usr/share/fonts", kind: "system" },
      ];
  }
}
