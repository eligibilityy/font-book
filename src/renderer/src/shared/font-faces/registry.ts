import type { Style } from "@shared/contracts/library";

/**
 * The one owner of every FontFace in the page. Rows, the Specimen and Quick
 * preview ask it for a Style; it loads each Style once, shares it, and
 * deletes faces nobody is using when memory runs high.
 *
 * Why it exists (docs/product/edge-cases.md, R2 and R8): each loaded face
 * costs about 1.25 times its file size, and a font loaded under its real name
 * ("Arial") would replace that font everywhere in the page. So every Style is
 * registered under a generated name, and loads are limited.
 */

export type FaceStatus =
  | "loading"
  | "ready"
  /** The Font file parsed, but the browser refused to draw it. */
  | "failed"
  /** The Font file is gone from disk. */
  | "missing"
  /** Too big to load just for a Library row; the Specimen still loads it. */
  | "too-large";

/** Loads at the same time. More only queue up behind these. */
const MAX_CONCURRENT_LOADS = 4;
/** Total bytes of loaded faces to keep before unused ones are deleted. */
const MEMORY_BUDGET = 300 * 1024 * 1024;
/** Measured: a loaded face costs about 1.25 times its bytes. */
const MEMORY_PER_BYTE = 1.25;
/** Font files above this load only when she asks for that one Style. */
const ROW_PREVIEW_MAX_FILE_SIZE = 24 * 1024 * 1024;

/** The CSS family name a Style is registered under. Never the Style's own name. */
function faceFamilyName(styleId: string): string {
  return `book-style-${styleId}`;
}

/** The full font stack for Sample text: the Style, then boxes for anything it lacks. */
export function sampleFontFamily(styleId: string): string {
  return `"${faceFamilyName(styleId)}", "Book NotDef"`;
}

interface Entry {
  styleId: string;
  status: FaceStatus;
  users: number;
  lastUsed: number;
  memory: number;
  face: FontFace | null;
  priority: boolean;
}

const entries = new Map<string, Entry>();
const listeners = new Map<string, Set<() => void>>();
const queue: Entry[] = [];
let activeLoads = 0;
let memoryInUse = 0;

/**
 * Starts using a Style's face. Call the returned function when done; the face
 * stays loaded for a while in case it is needed again.
 *
 * `priority` is for what she is looking at directly (the Specimen, Quick
 * preview): it jumps the queue and ignores the size limit for rows.
 */
export function acquireFace(style: Style, priority: boolean): () => void {
  let entry = entries.get(style.id);
  if (!entry) {
    const tooLarge =
      !priority && style.fontFile.size > ROW_PREVIEW_MAX_FILE_SIZE;
    entry = {
      styleId: style.id,
      status: tooLarge ? "too-large" : "loading",
      users: 0,
      lastUsed: Date.now(),
      memory: 0,
      face: null,
      priority,
    };
    entries.set(style.id, entry);
    if (!tooLarge) enqueue(entry);
  } else if (priority && entry.status === "too-large") {
    entry.status = "loading";
    entry.priority = true;
    enqueue(entry);
    notify(entry.styleId);
  } else if (priority && !entry.priority && entry.status === "loading") {
    entry.priority = true;
    moveToFront(entry);
  }

  entry.users += 1;
  const used = entry;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    used.users -= 1;
    used.lastUsed = Date.now();
    if (used.users === 0 && used.status === "loading" && queue.includes(used)) {
      // Scrolled past before it started loading: forget it.
      queue.splice(queue.indexOf(used), 1);
      entries.delete(used.styleId);
    }
    evictUnused();
  };
}

export function faceStatus(styleId: string): FaceStatus | null {
  return entries.get(styleId)?.status ?? null;
}

export function subscribeToFace(
  styleId: string,
  listener: () => void,
): () => void {
  let set = listeners.get(styleId);
  if (!set) {
    set = new Set();
    listeners.set(styleId, set);
  }
  set.add(listener);
  return () => {
    set.delete(listener);
    if (set.size === 0) listeners.delete(styleId);
  };
}

/** After a Scan Again, files may have changed: forget faces nobody is using. */
export function forgetUnusedFaces(): void {
  for (const entry of [...entries.values()]) {
    if (entry.users === 0 && entry.status !== "loading") remove(entry);
  }
}

function enqueue(entry: Entry): void {
  if (entry.priority) queue.unshift(entry);
  else queue.push(entry);
  pump();
}

function moveToFront(entry: Entry): void {
  const index = queue.indexOf(entry);
  if (index > 0) {
    queue.splice(index, 1);
    queue.unshift(entry);
  }
}

function pump(): void {
  while (activeLoads < MAX_CONCURRENT_LOADS && queue.length > 0) {
    const entry = queue.shift();
    if (!entry) break;
    activeLoads += 1;
    void load(entry).finally(() => {
      activeLoads -= 1;
      pump();
    });
  }
}

async function load(entry: Entry): Promise<void> {
  const result = await window.fontBook.library
    .readStyleBytes(entry.styleId)
    .catch(() => ({ status: "unreadable" as const }));

  if (result.status !== "ready") {
    finish(entry, result.status === "missing" ? "missing" : "failed");
    return;
  }

  // Loaded with default descriptors (normal weight and style) and drawn with
  // font-synthesis: none, so the browser never fakes a bold or italic.
  const face = new FontFace(faceFamilyName(entry.styleId), result.bytes);
  try {
    await face.load();
  } catch {
    // Chromium's font sanitizer rejects some files that fontkit can parse.
    finish(entry, "failed");
    return;
  }
  if (entries.get(entry.styleId) !== entry) return; // forgotten meanwhile
  document.fonts.add(face);
  entry.face = face;
  entry.memory = result.bytes.byteLength * MEMORY_PER_BYTE;
  memoryInUse += entry.memory;
  finish(entry, "ready");
  evictUnused();
}

function finish(entry: Entry, status: FaceStatus): void {
  entry.status = status;
  notify(entry.styleId);
}

/** Deletes the least recently used faces nobody is showing, until under budget. */
function evictUnused(): void {
  if (memoryInUse <= MEMORY_BUDGET) return;
  const unused = [...entries.values()]
    .filter((entry) => entry.users === 0 && entry.status === "ready")
    .sort((a, b) => a.lastUsed - b.lastUsed);
  for (const entry of unused) {
    if (memoryInUse <= MEMORY_BUDGET) break;
    remove(entry);
  }
}

function remove(entry: Entry): void {
  if (entry.face) document.fonts.delete(entry.face);
  memoryInUse -= entry.memory;
  entries.delete(entry.styleId);
  notify(entry.styleId);
}

function notify(styleId: string): void {
  for (const listener of listeners.get(styleId) ?? []) listener();
}
