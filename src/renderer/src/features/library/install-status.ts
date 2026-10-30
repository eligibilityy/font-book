import type { Style } from "@shared/contracts/library";

/** Only the Font file matters, so a test can pass just that. */
type WithFontFile = Pick<Style, "fontFile">;

/**
 * Whether other apps can use these Styles' Imported Font files yet:
 * "not-imported" when none came from an Import (they are in a Font folder
 * already), "installed" when every Imported one is Installed.
 */
export type InstallStatus = "not-imported" | "not-installed" | "installed";

export function installStatus(styles: readonly WithFontFile[]): InstallStatus {
  const imported = styles.filter(
    (style) => style.fontFile.folderKind === "imported",
  );
  if (imported.length === 0) return "not-imported";
  return imported.every((style) => style.fontFile.isInstalled)
    ? "installed"
    : "not-installed";
}
