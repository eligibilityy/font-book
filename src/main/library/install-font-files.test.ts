import { mkdir, mkdtemp, readdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { installFontFile, uninstallFontFile } from "./install-font-files";

const pacifico = join(__dirname, "fixtures", "Pacifico-Regular.ttf");

let imported: string;
let fontsFolder: string;

beforeEach(async () => {
  const root = await mkdtemp(join(tmpdir(), "book-install-"));
  const importedFolder = join(root, "userData", "imported-fonts");
  fontsFolder = join(root, "Library", "Fonts");
  await mkdir(importedFolder, { recursive: true });
  imported = join(importedFolder, "Pacifico-Regular.ttf");
  await writeFile(imported, await readFile(pacifico));
});

describe("installFontFile", () => {
  it("copies the Imported Font file into the Fonts folder", async () => {
    const outcome = await installFontFile(imported, fontsFolder);

    const installedPath = join(fontsFolder, "Pacifico-Regular.ttf");
    expect(outcome).toEqual({
      status: "installed",
      copy: { importedPath: imported, installedPath },
    });
    expect(
      (await readFile(installedPath)).equals(await readFile(imported)),
    ).toBe(true);
  });

  it("doesn't claim an identical file that was already there", async () => {
    await mkdir(fontsFolder, { recursive: true });
    await writeFile(
      join(fontsFolder, "Pacifico-Regular.ttf"),
      await readFile(imported),
    );

    expect(await installFontFile(imported, fontsFolder)).toEqual({
      status: "already-there",
    });
  });

  it("never overwrites a different file with the same name", async () => {
    await mkdir(fontsFolder, { recursive: true });
    await writeFile(join(fontsFolder, "Pacifico-Regular.ttf"), "her own file");

    const outcome = await installFontFile(imported, fontsFolder);

    expect(outcome).toMatchObject({
      status: "installed",
      copy: { installedPath: join(fontsFolder, "Pacifico-Regular 2.ttf") },
    });
    expect(
      await readFile(join(fontsFolder, "Pacifico-Regular.ttf"), "utf8"),
    ).toBe("her own file");
  });
});

describe("uninstallFontFile", () => {
  it("deletes the copy Install made", async () => {
    const outcome = await installFontFile(imported, fontsFolder);
    if (outcome.status !== "installed") throw new Error("not installed");

    expect(await uninstallFontFile(outcome.copy)).toBe("removed");
    expect(await readdir(fontsFolder)).toEqual([]);
  });

  it("leaves a copy that changed since, because it's hers now", async () => {
    const outcome = await installFontFile(imported, fontsFolder);
    if (outcome.status !== "installed") throw new Error("not installed");
    await writeFile(outcome.copy.installedPath, "replaced by her");

    expect(await uninstallFontFile(outcome.copy)).toBe("changed");
    expect(await readdir(fontsFolder)).toEqual(["Pacifico-Regular.ttf"]);
  });

  it("reports a copy that is already gone", async () => {
    expect(
      await uninstallFontFile({
        importedPath: imported,
        installedPath: join(fontsFolder, "Pacifico-Regular.ttf"),
      }),
    ).toBe("gone");
  });
});
