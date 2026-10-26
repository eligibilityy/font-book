# Architecture

font-book is a local-first, offline Electron app. Font files on disk are authoritative; the Library index is a cache built from them. The main process owns the filesystem, Font file parsing, persistence, and native UI. The renderer owns presentation and UI state. Preload is the only door between them. `src/shared` holds the contracts both sides agree on.

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
│   ├── index.ts            # Startup: create window, register IPC handlers, menus
│   ├── ipc/                # One file per domain; each handler parses input, calls an operation
│   ├── library/            # Font folders per platform, Scan, parse Font files, Import
│   ├── storage/            # Read/parse/write JSON files in userData
│   └── export/             # Capture a Specimen region and write a PNG
├── preload/
│   ├── index.ts            # contextBridge.exposeInMainWorld("fontBook", ...)
│   └── index.d.ts          # Declares window.fontBook for the renderer's type checker
├── shared/
│   └── contracts/          # One file per domain: channel names, zod schemas, z.infer types
└── renderer/src/
    ├── app/                # App shell, layout, feature composition
    ├── features/           # library, specimen, collections, favorites, pairing, glyphs, ...
    │   └── <feature>/
    │       ├── index.ts    # Public entry: the only file other features import
    │       ├── components/ hooks/ state/ operations/
    │       └── *.test.ts(x)
    └── shared/             # Reusable UI primitives, the fontBook client, theme tokens
```

`npm run deps:check` enforces these boundaries: no main/renderer cross-imports, no Node or Electron in `src/shared`, renderer `shared/` never imports a feature, and features import each other only through their root `index.ts`.

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

The renderer never receives a file path it can open itself. It asks main for Styles by ID and for font bytes by ID. Bytes cross IPC as a `Uint8Array`, which `FontFace` accepts directly, so the Content Security Policy does not need loosening to load fonts.

Open question for milestone 6: a `.ttc` Font file holds several Styles, and `FontFace` takes a whole file. Decide how the renderer gets one Style out of a `.ttc` before supporting them in the Specimen.

## On-disk layout

The app reads Font folders and never writes into them. Everything it writes lives under `app.getPath('userData')` (macOS: `~/Library/Application Support/<productName>`; Windows: `%APPDATA%\<productName>`).

```text
<userData>/
├── library-index.json    # Cache of parsed Style metadata, keyed by Font file path + size + modified time
├── collections.json      # Collections and Favorites (lists of styleIds)
├── prefs.json            # Sample text, Specimen defaults, window size, theme
└── imported-fonts/       # Copies of imported Font files
```

- **Cache vs user data.** `library-index.json` can always be deleted and rebuilt by a Scan. `collections.json` and `prefs.json` are the user's work: never silently overwrite them.
- **Parse on read.** Every file is parsed with its zod schema when read. If `collections.json` fails to parse, rename it aside (for example `collections.corrupt-<timestamp>.json`), start empty, and tell the user. If the cache fails to parse, discard it and rescan.
- **Write safely.** Write to a temporary file in the same folder, then rename it over the original, so a crash never leaves half a file.
- **Version stored files.** Each stored file has a `version` field. Changing its shape adds a migration with a test.
- **Style IDs** are created in main from the Font file path and the face index inside it, and are opaque strings to the renderer. Collections and Favorites store Style IDs.
- Move to SQLite only if JSON becomes measurably slow or awkward. The rest of the app should not notice: only `main/storage` changes.

## IPC conventions

Read Electron's [IPC tutorial](https://www.electronjs.org/docs/latest/tutorial/ipc) (the "renderer to main, two-way" pattern) and [context isolation](https://www.electronjs.org/docs/latest/tutorial/context-isolation).

Start with **one handler per operation**:

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
- Keep the template's Content Security Policy. Load fonts from bytes, not from `file://` URLs.
- The app makes no network requests.

## Changes by example

### Add an IPC operation

1. **Contract.** In `src/shared/contracts/<domain>.ts`, add the channel name, the input and output zod schemas, and their `z.infer` types. Reuse existing schemas such as the Style schema.
2. **Operation.** In `src/main/<domain>/`, write a plain function that does the work and takes its dependencies (folder paths, a storage object) as arguments. It knows nothing about IPC, so it can be tested without Electron.
3. **Handler.** In `src/main/ipc/<domain>.ts`, register `ipcMain.handle(channel, ...)`: parse the input with the schema, call the operation, return the result. Make sure startup in `src/main/index.ts` registers that file.
4. **Bridge.** In `src/preload/index.ts`, add one function under the domain that calls `ipcRenderer.invoke(channel, input)`. Update `src/preload/index.d.ts` so `window.fontBook` has the new function with the shared types, for example `listStyles(): Promise<Style[]>`.
5. **Renderer.** Call it from a hook or operation in the owning feature, such as `features/library/hooks/`. Model the result as a discriminated union (loading, ready, error).
6. **Tests.** Test the operation with a temporary directory and fixture Font files: success, invalid input rejected by the schema, and the failure case. Run `npm run check`.

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

`npm run check` runs the required local checks and offline tests. `npm run build` verifies the production bundle. `npm run build:mac` and `npm run build:win` package installers; the macOS arm64 build runs in GitHub Actions. Document changes to ownership, IPC conventions, or stored files in this file in the same pull request.
