import { writeFile } from "node:fs/promises";
import { basename } from "node:path";
import type { ExportPngResult } from "../../shared/contracts/export";

/** What an Export needs from Electron, so the order of steps can be tested. */
export interface ExportPorts {
  /** PNG bytes of the region and their pixel size. */
  capture(): Promise<{ png: Buffer; width: number; height: number }>;
  /** Where she chose to save, or null if she cancelled. */
  chooseSavePath(suggestedName: string): Promise<string | null>;
  write?: (path: string, bytes: Buffer) => Promise<void>;
}

/** Characters no file system accepts in a name, and control characters. */
const UNSAFE_NAME_CHARACTERS = /[/\\:*?"<>|\p{Cc}]/gu;

/** "Inter Bold.png" from "Inter Bold", safe on macOS and Windows. */
export function pngFileName(name: string): string {
  const cleaned = name.replace(UNSAFE_NAME_CHARACTERS, " ").trim();
  return `${cleaned === "" ? "Specimen" : cleaned}.png`;
}

/**
 * Captures first, then asks where to save: on macOS the save dialog is a
 * sheet over the window, and capturing after it opened would picture the
 * sheet. Never throws; a failed capture or write is a "failed" result.
 */
export async function savePng(
  name: string,
  { capture, chooseSavePath, write = writeFile }: ExportPorts,
): Promise<ExportPngResult> {
  let image: { png: Buffer; width: number; height: number };
  try {
    image = await capture();
  } catch {
    return { status: "failed" };
  }
  const path = await chooseSavePath(pngFileName(name));
  if (path === null) return { status: "cancelled" };
  try {
    await write(path, image.png);
  } catch {
    return { status: "failed" };
  }
  return {
    status: "saved",
    fileName: basename(path),
    width: image.width,
    height: image.height,
  };
}
