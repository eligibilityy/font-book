import { mkdir, readFile, unlink } from "node:fs/promises";
import { basename } from "node:path";
import { z } from "zod";
import { errorCode } from "../storage/json-file";
import { placeCopy } from "./import-font-files";

/** One Font file Book Installed: its Imported original and the copy in her Fonts folder. */
export const installedCopySchema = z.object({
  importedPath: z.string(),
  installedPath: z.string(),
});
export type InstalledCopy = z.infer<typeof installedCopySchema>;

export const INSTALLED_VERSION = 1;
export const installedFileSchema = z.object({
  version: z.literal(INSTALLED_VERSION),
  copies: z.array(installedCopySchema),
});
export type InstalledFile = z.infer<typeof installedFileSchema>;

export function emptyInstalledFile(): InstalledFile {
  return { version: INSTALLED_VERSION, copies: [] };
}

export type InstallOutcome =
  | { status: "installed"; copy: InstalledCopy }
  /** An identical file was already there. It isn't Book's, so it isn't recorded. */
  | { status: "already-there" };

/**
 * Install: copies an Imported Font file into her Fonts folder, where every
 * other app finds it. A different file with the same name is left alone and
 * the copy is named "Name 2.otf" instead.
 */
export async function installFontFile(
  importedPath: string,
  fontsFolder: string,
): Promise<InstallOutcome> {
  const bytes = await readFile(importedPath);
  await mkdir(fontsFolder, { recursive: true });
  const placed = await placeCopy(fontsFolder, basename(importedPath), bytes);
  if (!placed.isNew) return { status: "already-there" };
  return {
    status: "installed",
    copy: { importedPath, installedPath: placed.path },
  };
}

export type UninstallOutcome =
  /** Book's copy is deleted. */
  | "removed"
  /** Already deleted, by her or another app. */
  | "gone"
  /** No longer what Book put there, so it is hers now and stays. */
  | "changed";

/**
 * Uninstall: deletes the copy Install made, but only while it still matches
 * the Imported original byte for byte. Book never deletes a Font file it
 * didn't put there.
 */
export async function uninstallFontFile(
  copy: InstalledCopy,
): Promise<UninstallOutcome> {
  const installed = await readFile(copy.installedPath).catch(
    (error: unknown) => {
      if (errorCode(error) === "ENOENT") return null;
      throw error;
    },
  );
  if (installed === null) return "gone";
  const original = await readFile(copy.importedPath).catch(() => null);
  if (!original?.equals(installed)) return "changed";
  await unlink(copy.installedPath);
  return "removed";
}
