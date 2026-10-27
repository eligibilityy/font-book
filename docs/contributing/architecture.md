# Architecture

Book is a local-first, offline Electron app. Font files on disk are authoritative; the Library index is a cache built from them. The main process owns the filesystem, Font file parsing, persistence, and native UI. The renderer owns presentation and UI state. Preload is the only door between them. `src/shared` holds the contracts both sides agree on.

Use [CONTEXT.md](../../CONTEXT.md) for domain names and [code standards](code-standards.md) for naming, types, and tests.

## Process model

Electron runs your code in separate processes. Each one can do different things, so each one owns different work. Read Electron's [process model](https://www.electronjs.org/docs/latest/tutorial/process-model) first.

| Area | Runs in | Owns | Must not |
| --- | --- | --- | --- |
| `src/main` | Node.js main process | App startup, windows, menus, dialogs, scanning Font folders, parsing Font files (fontkit or opentype.js), reading and writing `userData`, Export, `process.platform` branches | Import renderer code; trust IPC input without zod parsing |
| `src/preload` | Sandboxed preload, isolated context | The typed `window.fontBook` bridge built with `contextBridge` | Expose `ipcRenderer`, Node APIs, or a generic "send any channel" function; contain logic |
| `src/renderer/src` | Chromium page | React UI, UI state, `FontFace` loading, virtualized lists, Specimen and Pairing rendering | Import from `src/main`, Node, or Electron; know the OS |
| `src/shared` | Imported by all three | Pure contracts: zod schemas, derived types, IPC channel names, pure functions | Import Electron, Node (`fs`, `path`), or the DOM |

## Code map

```text
src/
├── main/
│   ├── index.ts            # Startup: single-instance lock, dev data folder, IPC handlers, menu, window
│   ├── window.ts           # The main window: size, title bar, security options, --titlebar-inset
│   ├── menu.ts             # The application menu; its accelerators are Book's shortcuts
│   ├── ipc/                # One file per domain; each handler parses input, calls an operation
│   ├── library/            # Font folders per platform, Scan, parse Font files, Import
│   ├── storage/            # json-file.ts (write queue, .bak, set-aside) and stores.ts (every file)
│   └── export/             # Capture a Specimen region and write a PNG
├── preload/
│   ├── index.ts            # contextBridge.exposeInMainWorld("fontBook", ...)
│   └── index.d.ts          # Declares window.fontBook for the renderer's type checker
├── shared/
│   ├── classification.ts   # The Classification guess (pure, tested)
│   └── contracts/          # channels.ts (every IPC channel name, no imports), then one file
│                           # per domain: zod schemas, z.infer types, the FontBookApi
└── renderer/src/
    ├── app/                # App shell, layout, feature composition
    ├── features/           # library, specimen, collections, favorites, pairing, glyphs, ...
    │   └── <feature>/
    │       ├── index.ts    # Public entry: the only file other features import
    │       ├── components/ hooks/ state/ operations/
    │       └── *.test.ts(x)
    └── shared/             # Tokens, controls, the FontFace registry (font-faces/), use-saved-file
```

The renderer imports `src/shared` as `@shared/...` (an alias in `tsconfig.web.json` and `electron.vite.config.ts`); main and preload use relative paths.

`bun run deps:check` enforces these boundaries: no main/renderer cross-imports, no Node or Electron in `src/shared`, renderer `shared/` never imports a feature, and features import each other only through their root `index.ts`.

## Data flow

```text
 OS Font folders                         <userData>/imported-fonts/
 (~/Library/Fonts, C:\Windows\Fonts, ...)            |
            \                                        /
             v                                      v
  main/library: scan Font folders -> parse each Font file -> Styles
                                   |          (cache: library-index.json)
                                   v
  main/ipc: ipcMain.handle("library:list-styles")   zod-parses input
                                   |
  preload: window.fontBook.library.listStyles()     typed, nothing else exposed
                                   |
                                   v
  renderer features/library: hook loads Styles -> virtualized Library list
                                   |
                     user selects a Style (by styleId)
                                   |
  preload: window.fontBook.library.readStyleBytes({ styleId })
                                   |
                                   v
  renderer features/specimen: new FontFace(name, bytes) -> document.fonts.add
                              -> render Sample text with Axes and OpenType features
```

The renderer never receives a file path it can open itself. It asks main for Styles by ID and for font bytes by ID. Bytes cross IPC as a `Uint8Array`, which `FontFace` accepts directly, so the Content Security Policy does not need loosening to load fonts. `blob:`, `data:`, and custom-scheme URLs are blocked by the template's CSP; this was verified, along with IPC speed (37 MB in under 100 ms), in [edge cases](../product/edge-cases.md).

**`.ttc` and `.otc` collections.** `FontFace` always renders face 0 of a collection, and `url(file.ttc#1)` is ignored (verified). So `library:read-style-bytes` returns **only the requested Style's face**: main extracts that face into a standalone font (copying its tables from the collection's table directory) and sends those bytes. The renderer never sees a collection.

**Send copies, not views.** When returning part of a `Buffer`, send `Buffer.from(view)` or `new Uint8Array(view)`. A `subarray` view silently serializes the entire underlying file over IPC (verified: a 10-byte view of a 37 MB file sent 37 MB).

## Rendering a Style

Installed fonts and loaded `FontFace` objects share one namespace in the renderer, and the browser quietly substitutes other fonts when something is missing. These rules keep the Specimen honest:

- **Generated family names.** Register each `FontFace` under a name derived from its Style ID (for example `book-<hash>`), never its real Family name. A `FontFace` named "Arial" replaces the installed Arial everywhere in the page, including UI text (verified).
- **No fake styles.** Load each `FontFace` with `weight` and `style` left at normal, and render Sample text with `font-synthesis: none`. Otherwise the browser fakes bold and italic on Styles that have neither (verified: 34% extra ink at the same width).
- **One property per job.** Drive Axes only with `font-variation-settings`, and OpenType features only with `font-feature-settings`. Do not mix in `font-weight` or `font-variant-*` for the same thing; mixing gave inconsistent results (verified). When Axis sliders are under the user's control, set `font-optical-sizing: none`, or `opsz` silently follows the font size.
- **Two separate statuses.** A Style has a *parse status* (main could read it) and a *render status* (Chromium accepted it). fontkit reads some files that Chromium's font sanitizer rejects with a generic `Invalid font data`. When `FontFace.load()` fails, show the Style as failed-to-render and tell main, so the Library can mark it.
- **Coverage, not fallback.** If the Sample text contains characters the Style lacks, the browser draws them in another font with no visible sign. Check the Sample text against the Style's character map (`library:check-coverage`, in main) and show which characters are missing instead of pretending.
- **Release what is off-screen.** Each loaded `FontFace` costs about 1.25 times its file size in memory. Remove faces from `document.fonts` when their rows scroll far away, and when switching Styles; memory returns after cleanup (verified).

## Font files and Font folders

- **Supported:** `.ttf`, `.otf`, `.ttc`, `.otc`, `.woff`, `.woff2`. **Skipped, with a count shown:** `.fon`/`.fnt`, Type 1 (`.pfb`, `.pfm`, `.afm`), `.dfont` and legacy Mac suitcases.
- **Skipped locations:** Adobe Fonts' Creative Cloud cache (`livetype`), hidden system fonts whose names start with `.`, and `/System/Library/AssetsV2`. The Scan does recurse into normal subfolders such as `/System/Library/Fonts/Supplemental`.
- **Names:** Family = name ID 16 (typographic family), falling back to ID 1; Style = name ID 17, falling back to ID 2. Grouping by ID 1 alone splits real Families: it produced 669 Families instead of 320 on the dev machine (verified).
- **Parse each Style in its own `try`/`catch`.** One bad file must become one failed entry, never a stopped Scan. fontkit's `namedVariations` throws on several shipping variable fonts (Bahnschrift, Segoe UI Variable, Sitka, verified); treat that as "no Named instances", not a failure.

## On-disk layout

The app reads Font folders and never writes into them. Everything it writes lives under `app.getPath('userData')` (macOS: `~/Library/Application Support/<productName>`; Windows: `%APPDATA%\<productName>`).

```text
<userData>/
├── library-index.json    # Cache of parsed Style metadata, keyed by Font file path + size + modified time, plus a parser version
├── collections.json      # Collections and Favorites (lists of styleIds)
├── classifications.json  # Classifications she set by hand, keyed by Family
├── prefs.json            # Sample text, Specimen size, line height, tracking, paper and ink, panels
├── app-state.json        # Main's own: window size and position, theme
└── imported-fonts/       # Copies of imported Font files
```

- **Cache vs user data.** `library-index.json` can always be deleted and rebuilt by a Scan. `collections.json`, `classifications.json` and `prefs.json` are the user's work: never silently overwrite them. The cache holds each Family's guessed Classification; only hand-set ones go in `classifications.json`.
- **Parse on read.** Every file is parsed with its zod schema when read. If `collections.json` fails to parse, rename it aside (for example `collections.corrupt-<timestamp>.json`), start empty, and tell the user. If the cache fails to parse, discard it and rescan.
- **Write safely.** Write to a temporary file in the same folder, then rename it over the original, so a crash never leaves half a file. On Windows that rename fails with `EPERM` while anything holds the target open, even antivirus or Book's own read handle (verified), so:
  - send all writes through **one write queue** in `main/storage`, so two writes never race;
  - retry the rename a few times with a short backoff on `EPERM` or `EBUSY`;
  - keep a `.bak` copy of the previous good version.
- **One instance.** Call `app.requestSingleInstanceLock()` at startup and focus the existing window instead of opening a second app that writes the same files.
- **Version stored files.** Each stored file has a `version` field. Changing its shape adds a migration with a test. If a file's `version` is newer than this build understands (she opened an older build), open it read-only and say so. Never overwrite it.
- **Style IDs** are created in main from the Font folder, the file's path relative to that folder (Unicode-normalized to NFC and case-folded), and the face index inside it. They are opaque strings to the renderer. Raw paths are not stable: the same file can be spelled differently (NFC vs NFD, letter case), and a moved or renamed file gets a new ID. Collections and Favorites store each Style ID together with a snapshot of its Family and Style names, so a Style that went missing can still be listed as Missing and later re-linked.
- **Dev and installed builds keep separate data.** In development, point `userData` at its own folder (for example `app.setPath("userData", ...)` with a "Book Dev" folder, before the app is ready). Otherwise `bun run dev` and the installed Book read and write the same Collections.
- Move to SQLite only if JSON becomes measurably slow or awkward. The rest of the app should not notice: only `main/storage` changes.

## IPC conventions

Read Electron's [IPC tutorial](https://www.electronjs.org/docs/latest/tutorial/ipc) (the "renderer to main, two-way" pattern) and [context isolation](https://www.electronjs.org/docs/latest/tutorial/context-isolation).

Start with **one handler per operation**:

- Channel names live in `src/shared/contracts/channels.ts`, a file with no imports. The sandboxed preload can only `require("electron")` at runtime, and every other contract file imports zod, so preload imports channel names from `channels.ts` and everything else with `import type`. Two dependency-cruiser rules enforce this; breaking it makes the window open without `window.fontBook`.
- Each operation has a channel named `domain:operation-name` in kebab-case: `library:list-styles`, `library:read-style-bytes`, `collections:add-style`, `export:save-specimen-png`.
- Its contract lives in `src/shared/contracts/<domain>.ts`: the channel name, an input schema, an output schema, and types derived with `z.infer`.
- Main registers it with `ipcMain.handle(channel, handler)`. The handler parses the input with the schema (`schema.parse` or `safeParse`), calls a plain operation function, and returns a serializable result.
- Preload exposes one named function per operation under a domain: `window.fontBook.collections.addStyle(input)`. The function only calls `ipcRenderer.invoke(channel, input)`.
- Main-to-renderer events (Scan progress) use `webContents.send` in main and a preload function such as `onScanProgress(callback)` that returns an unsubscribe function. The renderer subscribes in an effect and unsubscribes in its cleanup.
- Return values must survive [structured clone](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm): plain objects, arrays, strings, numbers, `Uint8Array`. No class instances, functions, or fontkit objects.
- Expected failures (unreadable Font file, cancelled dialog) are part of the output schema as a discriminated union, not thrown errors. Throw only for bugs.

**Later refactor: a named-query registry.** Pond uses a single `query` channel. Main keeps a registry mapping each query name to its input schema and handler; preload exposes one `query(name, input)` function typed from that registry; one place validates every call. It removes repeated boilerplate and makes "every operation has a schema" a compile-time guarantee, at the cost of heavier TypeScript generics. Consider it once there are many operations and the one-per-operation pattern feels repetitive. Do not start there.

## Security baseline

Follow Electron's [security checklist](https://www.electronjs.org/docs/latest/tutorial/security). Non-negotiable here:

- `contextIsolation: true`, `sandbox: true`, `nodeIntegration: false` on every window.
- Preload exposes intended capabilities only. A sandboxed preload can use only a limited set of modules; keep its imports to `electron` and `src/shared`. See [sandbox](https://www.electronjs.org/docs/latest/tutorial/sandbox).
- Main parses every IPC input with zod, including IDs and paths. Main checks that any path it reads belongs to a known Font file in the Library.
- Keep the template's Content Security Policy. Load fonts from bytes, not from `file://` URLs. A custom protocol (`book://`) would also work but needs CSP and privilege changes; keep it as a later option, not v1.
- The app makes no network requests.

## Export (v0.2)

`webContents.capturePage(rect)` returns an image in device pixels (2x on her Retina display), clips a rectangle larger than the viewport, and throws when the rectangle is partly off-screen (verified). Either clamp the capture to the visible Specimen, or render the Specimen in a hidden window sized to the content and capture that. Report the PNG's real pixel size in the UI.

## Changes by example

### Add an IPC operation

1. **Contract.** In `src/shared/contracts/<domain>.ts`, add the channel name, the input and output zod schemas, and their `z.infer` types. Reuse existing schemas such as the Style schema.
2. **Operation.** In `src/main/<domain>/`, write a plain function that does the work and takes its dependencies (folder paths, a storage object) as arguments. It knows nothing about IPC, so it can be tested without Electron.
3. **Handler.** In `src/main/ipc/<domain>.ts`, register `ipcMain.handle(channel, ...)`: parse the input with the schema, call the operation, return the result. Make sure startup in `src/main/index.ts` registers that file.
4. **Bridge.** In `src/preload/index.ts`, add one function under the domain that calls `ipcRenderer.invoke(channel, input)`. Update `src/preload/index.d.ts` so `window.fontBook` has the new function with the shared types, for example `listStyles(): Promise<Style[]>`.
5. **Renderer.** Call it from a hook or operation in the owning feature, such as `features/library/hooks/`. Model the result as a discriminated union (loading, ready, error).
6. **Tests.** Test the operation with a temporary directory and fixture Font files: success, invalid input rejected by the schema, and the failure case. Run `bun run check`.

### Add a feature

1. Pick the owning feature from [CONTEXT.md](../../CONTEXT.md) terms (`specimen`, `collections`, `pairing`). Create `src/renderer/src/features/<feature>/` with an `index.ts`.
2. Keep the feature's components, hooks, state, operations, and tests inside that folder.
3. Export from `index.ts` only what `app/` or another feature needs, usually one top-level component and its types.
4. Compose it in `app/`. If it needs data from main, add the IPC operations first (above).
5. Move code to renderer `shared/` only when a second feature needs it and it has no feature-specific decisions.
6. Check it against [design principles](../design-principles.md): loading, empty, and error states, keyboard access, labels, reduced motion.

### Add a stored file or field

Add the zod schema in `src/shared/contracts/`, read and write it only through `src/main/storage`, include a `version` field, and write a test that reads a fixture of the previous version.

### Test an operation

Pass the operation what it needs: a folder path, a storage object, a clock. Production passes the real thing; tests pass a temporary directory or a small in-memory fake that behaves like the real contract, including failures. Do not use `vi.mock`.

## Verification

`bun run check` runs the required local checks and offline tests. `bun run smoke` builds the app, opens it with Playwright against a throwaway data folder, walks the main flows with the keyboard (list, Quick preview, Specimen, Inspector, Favorites, a Collection, Axes, the Classification filter), and saves a screenshot of each step to `out/smoke`. Set `BOOK_EXECUTABLE` to run it against a packaged build (`dist/win-unpacked/book.exe` after `bun run build:unpack`). `bun run build` verifies the production bundle. `bun run build:mac` and `bun run build:win` package installers; the macOS arm64 build runs in GitHub Actions. Document changes to ownership, IPC conventions, or stored files in this file in the same pull request.
