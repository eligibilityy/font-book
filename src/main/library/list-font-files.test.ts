import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { FontFolder } from "../../shared/contracts/library";
import {
  type DirectoryReader,
  fileSystemReader,
  listFontFiles,
} from "./list-font-files";

let root: string;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "book-scan-"));
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

/** Creates empty files; a Scan only looks at names, not contents. */
async function createFiles(paths: string[]): Promise<void> {
  for (const path of paths) {
    await mkdir(join(root, path, ".."), { recursive: true });
    await writeFile(join(root, path), "");
  }
}

function userFolder(name: string): FontFolder {
  return { path: join(root, name), kind: "user" };
}

describe("listFontFiles", () => {
  it("lists Font files in a folder and its subfolders, sorted by name", async () => {
    await createFiles([
      "fonts/Inter-Regular.otf",
      "fonts/archive/Futura.ttc",
      "fonts/Supplemental/deep/er/Zapfino.TTF",
      "fonts/Playfair.woff2",
      "fonts/Mono.otc",
      "fonts/Old.woff",
    ]);
    const folder = userFolder("fonts");

    const result = await listFontFiles([folder]);

    expect(result.fontFiles.map((file) => file.name)).toEqual([
      "Futura.ttc",
      "Inter-Regular.otf",
      "Mono.otc",
      "Old.woff",
      "Playfair.woff2",
      "Zapfino.TTF",
    ]);
    expect(
      result.fontFiles.every((file) => file.folderPath === folder.path),
    ).toBe(true);
    expect(result.folders).toEqual([
      { status: "scanned", folder, fontFileCount: 6 },
    ]);
  });

  it("skips hidden files and files that aren't Font files", async () => {
    await createFiles([
      "fonts/Inter.ttf",
      "fonts/._Inter.ttf",
      "fonts/.DS_Store",
      "fonts/.hidden/Secret.otf",
      "fonts/readme.txt",
      "fonts/Legacy.fon",
      "fonts/Type1.pfb",
      "fonts/Inter.ttf.zip",
    ]);

    const result = await listFontFiles([userFolder("fonts")]);

    expect(result.fontFiles.map((file) => file.name)).toEqual(["Inter.ttf"]);
  });

  it("reports a Font folder that doesn't exist as missing, not as an error", async () => {
    await createFiles(["present/Inter.ttf"]);
    const missing = userFolder("not-there");
    const present = userFolder("present");

    const result = await listFontFiles([missing, present]);

    expect(result.folders).toEqual([
      { status: "missing", folder: missing },
      { status: "scanned", folder: present, fontFileCount: 1 },
    ]);
    expect(result.fontFiles).toHaveLength(1);
  });

  it("names unreadable folders and keeps scanning the rest", async () => {
    await createFiles([
      "locked/Inter.ttf",
      "open/Inter.ttf",
      "open/private/Hidden.ttf",
      "open/shared/Visible.ttf",
    ]);
    const locked = userFolder("locked");
    const open = userFolder("open");
    const privatePath = join(open.path, "private");
    const deniedPaths = new Set([locked.path, privatePath]);
    // Behaves like the real disk, except that two folders deny permission.
    const reader: DirectoryReader = {
      readDirectory: (path) =>
        deniedPaths.has(path)
          ? Promise.reject(
              Object.assign(new Error("permission denied"), { code: "EACCES" }),
            )
          : fileSystemReader.readDirectory(path),
    };

    const result = await listFontFiles([locked, open], reader);

    expect(result.folders).toEqual([
      { status: "unreadable", folder: locked },
      { status: "scanned", folder: open, fontFileCount: 2 },
    ]);
    expect(result.unreadableSubfolders).toEqual([privatePath]);
    expect(result.fontFiles.map((file) => file.name)).toEqual([
      "Inter.ttf",
      "Visible.ttf",
    ]);
  });

  it("keeps each Font folder's files together, in folder order", async () => {
    await createFiles(["b/Alpha.ttf", "a/Zulu.ttf", "a/Beta.ttf"]);

    const result = await listFontFiles([userFolder("a"), userFolder("b")]);

    expect(result.fontFiles.map((file) => file.name)).toEqual([
      "Beta.ttf",
      "Zulu.ttf",
      "Alpha.ttf",
    ]);
  });
});
