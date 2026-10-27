import { mkdir, mkdtemp, readdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { importFontFiles } from "./import-font-files";

const fixtures = join(__dirname, "fixtures");
const pacifico = join(fixtures, "Pacifico-Regular.ttf");
const inconsolata = join(fixtures, "Inconsolata-Variable.ttf");

let downloads: string;
let folder: string;

beforeEach(async () => {
  const root = await mkdtemp(join(tmpdir(), "book-import-"));
  downloads = join(root, "Downloads");
  folder = join(root, "userData", "imported-fonts");
  await mkdir(downloads, { recursive: true });
});

describe("importFontFiles", () => {
  it("copies a Font file into the imported-fonts folder", async () => {
    const outcome = await importFontFiles([pacifico], { folder });

    expect(outcome).toMatchObject({ importedCount: 1, failedCount: 0 });
    expect(await readdir(folder)).toEqual(["Pacifico-Regular.ttf"]);
    expect(outcome.importedPaths).toEqual([
      join(folder, "Pacifico-Regular.ttf"),
    ]);
  });

  it("walks a dropped folder and ignores its licence and readme", async () => {
    const download = join(downloads, "Inconsolata");
    await mkdir(join(download, "static"), { recursive: true });
    await writeFile(
      join(download, "static", "Inconsolata.ttf"),
      await readFile(inconsolata),
    );
    await writeFile(join(download, "OFL.txt"), "SIL Open Font License");

    const outcome = await importFontFiles([download], { folder });

    expect(outcome).toMatchObject({
      importedCount: 1,
      failedCount: 0,
      skippedCount: 0,
    });
    expect(await readdir(folder)).toEqual(["Inconsolata.ttf"]);
  });

  it("doesn't copy the same Font file twice", async () => {
    await importFontFiles([pacifico], { folder });
    const again = await importFontFiles([pacifico], { folder });

    expect(again).toMatchObject({ importedCount: 0, alreadyImportedCount: 1 });
    expect(again.importedPaths).toEqual([join(folder, "Pacifico-Regular.ttf")]);
    expect(await readdir(folder)).toHaveLength(1);
  });

  it("keeps a different Font file with the same name beside the first", async () => {
    const sameName = join(downloads, "Pacifico-Regular.ttf");
    await writeFile(sameName, await readFile(inconsolata));

    await importFontFiles([pacifico], { folder });
    const outcome = await importFontFiles([sameName], { folder });

    expect(outcome.importedCount).toBe(1);
    expect((await readdir(folder)).sort()).toEqual([
      "Pacifico-Regular 2.ttf",
      "Pacifico-Regular.ttf",
    ]);
  });

  it("never copies a file that only looks like a Font file", async () => {
    const fake = join(downloads, "Totally-A-Font.otf");
    await writeFile(fake, "not a font");

    const outcome = await importFontFiles([fake, join(downloads, "gone.ttf")], {
      folder,
    });

    expect(outcome).toMatchObject({ importedCount: 0, failedCount: 2 });
    expect(await readdir(folder).catch(() => [])).toEqual([]);
  });

  it("counts files that aren't Font files as skipped", async () => {
    const readme = join(downloads, "README.txt");
    await writeFile(readme, "hello");

    const outcome = await importFontFiles([readme], { folder });

    expect(outcome).toMatchObject({ importedCount: 0, skippedCount: 1 });
  });
});
