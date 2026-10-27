import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";
import {
  createJsonFile,
  type JsonFileSystem,
  nodeFileSystem,
  ReadOnlyFileError,
} from "./json-file";

const schema = z.object({ version: z.literal(1), names: z.array(z.string()) });
type Data = z.infer<typeof schema>;
const defaults = (): Data => ({ version: 1, names: [] });

let folder: string;
let path: string;

beforeEach(async () => {
  folder = await mkdtemp(join(tmpdir(), "book-storage-"));
  path = join(folder, "collections.json");
});

afterEach(async () => {
  await rm(folder, { recursive: true, force: true });
});

function open(fileSystem: JsonFileSystem = nodeFileSystem) {
  return createJsonFile({
    path,
    schema,
    version: 1,
    defaults,
    fileSystem,
    now: () => new Date("2026-10-27T12:00:00.000Z"),
  });
}

describe("createJsonFile", () => {
  it("starts from the defaults when there is no file yet", async () => {
    expect(await open().load()).toEqual({
      data: defaults(),
      state: { status: "created" },
    });
  });

  it("saves and loads back, keeping the previous version as .bak", async () => {
    const file = open();
    await file.save({ version: 1, names: ["Poster"] });
    await file.save({ version: 1, names: ["Poster", "Typo II"] });

    expect(await open().load()).toEqual({
      data: { version: 1, names: ["Poster", "Typo II"] },
      state: { status: "loaded" },
    });
    expect(JSON.parse(await readFile(`${path}.bak`, "utf8"))).toEqual({
      version: 1,
      names: ["Poster"],
    });
  });

  it("sets a corrupt file aside instead of overwriting it", async () => {
    await writeFile(path, "{ not json");

    const result = await open().load();

    const setAsideName = "collections.corrupt-2026-10-27T12-00-00-000Z.json";
    expect(result).toEqual({
      data: defaults(),
      state: { status: "set-aside", setAsideName },
    });
    expect(await readFile(join(folder, setAsideName), "utf8")).toBe(
      "{ not json",
    );
    expect(await readdir(folder)).not.toContain("collections.json");
  });

  it("opens a file from a newer Book read-only and refuses to save", async () => {
    const newer = JSON.stringify({
      version: 2,
      names: ["Poster"],
      extra: true,
    });
    await writeFile(path, newer);
    const file = open();

    expect(await file.load()).toEqual({
      data: { version: 1, names: ["Poster"] },
      state: { status: "read-only" },
    });
    await expect(file.save(defaults())).rejects.toBeInstanceOf(
      ReadOnlyFileError,
    );
    expect(await readFile(path, "utf8")).toBe(newer);
  });

  it("retries a rename that Windows reports as busy", async () => {
    let failures = 2;
    const busyOnce: JsonFileSystem = {
      ...nodeFileSystem,
      rename: (from, to) => {
        if (failures > 0) {
          failures -= 1;
          return Promise.reject(
            Object.assign(new Error("operation not permitted"), {
              code: "EPERM",
            }),
          );
        }
        return nodeFileSystem.rename(from, to);
      },
    };

    await open(busyOnce).save({ version: 1, names: ["Poster"] });

    expect(failures).toBe(0);
    expect((await open().load()).data.names).toEqual(["Poster"]);
  });

  it("writes one save at a time, in order", async () => {
    const file = open();
    await Promise.all([
      file.save({ version: 1, names: ["a"] }),
      file.save({ version: 1, names: ["a", "b"] }),
      file.save({ version: 1, names: ["a", "b", "c"] }),
    ]);

    expect((await open().load()).data.names).toEqual(["a", "b", "c"]);
  });
});
