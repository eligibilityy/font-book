import * as fs from "node:fs/promises";
import { basename, dirname, extname, join } from "node:path";
import type { z } from "zod";
import type { StoredFile } from "../../shared/contracts/storage";

/** The few filesystem calls a JSON file needs. Tests pass a faulty one. */
export interface JsonFileSystem {
  readFile(path: string): Promise<string>;
  writeFile(path: string, text: string): Promise<void>;
  rename(from: string, to: string): Promise<void>;
  copyFile(from: string, to: string): Promise<void>;
  mkdir(path: string): Promise<void>;
}

export const nodeFileSystem: JsonFileSystem = {
  readFile: (path) => fs.readFile(path, "utf8"),
  writeFile: (path, text) => fs.writeFile(path, text, "utf8"),
  rename: (from, to) => fs.rename(from, to),
  copyFile: (from, to) => fs.copyFile(from, to),
  mkdir: async (path) => {
    await fs.mkdir(path, { recursive: true });
  },
};

interface JsonFileOptions<T> {
  path: string;
  schema: z.ZodType<T>;
  /** The `version` this build writes. A file with a higher one is read-only. */
  version: number;
  defaults: () => T;
  fileSystem?: JsonFileSystem;
  /** For the set-aside file name. */
  now?: () => Date;
}

export interface JsonFile<T> {
  load(): Promise<StoredFile<T>>;
  /** Queued: writes happen one at a time, in the order they were asked for. */
  save(data: T): Promise<void>;
}

export class ReadOnlyFileError extends Error {
  constructor(path: string) {
    super(`${basename(path)} was saved by a newer Book and is read-only.`);
  }
}

/**
 * A JSON file in userData that holds the user's work. It is parsed with its
 * schema on every read, never silently overwritten, and written so that a
 * crash or a busy file can't leave half a file behind.
 */
export function createJsonFile<T>({
  path,
  schema,
  version,
  defaults,
  fileSystem = nodeFileSystem,
  now = () => new Date(),
}: JsonFileOptions<T>): JsonFile<T> {
  let isReadOnly = false;
  let queue: Promise<unknown> = Promise.resolve();

  async function load(): Promise<StoredFile<T>> {
    let text: string;
    try {
      text = await fileSystem.readFile(path);
    } catch (error) {
      if (errorCode(error) === "ENOENT") {
        return { data: defaults(), state: { status: "created" } };
      }
      // It exists but can't be read (permissions, a disk error). Never write
      // over a file Book couldn't see.
      console.error(`Couldn't read ${basename(path)}`, error);
      isReadOnly = true;
      return { data: defaults(), state: { status: "unreadable" } };
    }

    const raw = parseJson(text);
    const fileVersion = readVersion(raw);
    if (fileVersion !== null && fileVersion > version) {
      // Opened by an older Book than the one that wrote it. Show what this
      // build can understand, and never write over the newer file.
      isReadOnly = true;
      const attempt = schema.safeParse(withVersion(raw, version));
      return {
        data: attempt.success ? attempt.data : defaults(),
        state: { status: "read-only" },
      };
    }

    const parsed = schema.safeParse(raw);
    if (parsed.success)
      return { data: parsed.data, state: { status: "loaded" } };

    const setAsideName = setAsideFileName(path, now());
    await fileSystem.rename(path, join(dirname(path), setAsideName));
    return { data: defaults(), state: { status: "set-aside", setAsideName } };
  }

  async function write(data: T): Promise<void> {
    if (isReadOnly) throw new ReadOnlyFileError(path);
    await fileSystem.mkdir(dirname(path));
    const temporaryPath = `${path}.tmp`;
    await fileSystem.writeFile(
      temporaryPath,
      `${JSON.stringify(data, null, 2)}\n`,
    );
    try {
      await fileSystem.copyFile(path, `${path}.bak`);
    } catch (error) {
      if (errorCode(error) !== "ENOENT") throw error;
    }
    await renameWithRetry(fileSystem, temporaryPath, path);
  }

  function save(data: T): Promise<void> {
    const result = queue.then(() => write(data));
    // The next write waits for this one whether it worked or not.
    queue = result.catch(() => undefined);
    return result;
  }

  return { load, save };
}

const RETRYABLE_CODES = new Set(["EPERM", "EBUSY", "EACCES"]);
const RENAME_ATTEMPTS = 6;

/**
 * On Windows, renaming over a file fails with EPERM while anything holds it
 * open, even briefly: antivirus, the search indexer, or Book's own read. It
 * clears within milliseconds, so try again with a growing pause.
 */
async function renameWithRetry(
  fileSystem: JsonFileSystem,
  from: string,
  to: string,
): Promise<void> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      await fileSystem.rename(from, to);
      return;
    } catch (error) {
      const code = errorCode(error);
      if (
        attempt >= RENAME_ATTEMPTS ||
        code === null ||
        !RETRYABLE_CODES.has(code)
      ) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 15 * 2 ** attempt));
    }
  }
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function readVersion(raw: unknown): number | null {
  if (typeof raw !== "object" || raw === null || !("version" in raw))
    return null;
  return typeof raw.version === "number" ? raw.version : null;
}

function withVersion(raw: unknown, version: number): unknown {
  return typeof raw === "object" && raw !== null ? { ...raw, version } : raw;
}

function setAsideFileName(path: string, date: Date): string {
  const extension = extname(path);
  const stem = basename(path, extension);
  const stamp = date.toISOString().replace(/[:.]/g, "-");
  return `${stem}.corrupt-${stamp}${extension}`;
}

export function errorCode(error: unknown): string | null {
  return error instanceof Error &&
    "code" in error &&
    typeof error.code === "string"
    ? error.code
    : null;
}
