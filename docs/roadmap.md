# Roadmap

Learning milestones, in order. Each one adds one new idea on top of the last and ends with something you can see working. Finish "Done when" before moving on, commit, and run `bun run check`.

AI tools working in this repository act as tutors for these milestones: they explain, link docs, and review your code, and you write it. See [AGENTS.md](../AGENTS.md).

## 1. Scaffold and explore the processes

**Goal.** Create the app from the electron-vite `react-ts` template and understand what each of its three entry points does.

**Concepts.** Main process vs renderer process vs preload script. Why the renderer cannot touch the filesystem. How electron-vite builds three bundles. `BrowserWindow` options: `contextIsolation`, `sandbox`, `nodeIntegration`.

**Done when.** The app opens with `bun run dev`. You can explain, in your own words, what `src/main/index.ts`, `src/preload/index.ts`, and `src/renderer/src/main.tsx` each do, and you have changed a line in each and seen the effect (main: window title; preload: an exposed value; renderer: text on screen).

**Resources.**
- [Electron: process model](https://www.electronjs.org/docs/latest/tutorial/process-model)
- [Electron: using preload scripts](https://www.electronjs.org/docs/latest/tutorial/tutorial-preload)
- [electron-vite: getting started](https://electron-vite.org/guide/)
- [React: quick start](https://react.dev/learn)

## 2. Guardrails

**Goal.** Add the tooling that catches mistakes before they reach her Mac: Biome, TypeScript strict checks, Vitest, dependency-cruiser, knip, commitlint, husky, and CI. Follow [docs/setup.md](setup.md).

**Concepts.** What a linter, a type checker, and a test runner each catch. Why import boundaries matter in Electron. Conventional Commits. A CI workflow that runs `bun run check` on every push.

**Done when.** `bun run check` passes locally and in GitHub Actions. A deliberately bad commit message is rejected by the commit hook. A deliberate `any` fails lint.

**Resources.**
- [TypeScript handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Biome](https://biomejs.dev/)
- [Vitest guide](https://vitest.dev/guide/)
- [GitHub Actions documentation](https://docs.github.com/en/actions)

## 3. First macOS build

**Goal.** Ship the scaffold to the M5 MacBook Air through the release workflow, before any features exist, so packaging problems show up early.

**Concepts.** electron-builder targets (`mac` arm64, `win`). Why a Windows PC cannot build a macOS app, and how a `macos-latest` runner does it. Git tags and GitHub Releases. Unsigned apps and Gatekeeper: the first launch needs approval in System Settings > Privacy & Security.

**Done when.** Pushing a `vX.Y.Z` tag (see [CONTRIBUTING.md](../CONTRIBUTING.md#releases)) produces a GitHub Release with a macOS arm64 build and a Windows installer, and the app opens on her Mac.

**Resources.**
- [electron-builder](https://www.electron.build/)
- [GitHub Docs: about releases](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases)
- [GitHub Actions documentation](https://docs.github.com/en/actions)
- [Apple: open a Mac app from an unknown developer](https://support.apple.com/guide/mac-help/open-a-mac-app-from-an-unknown-developer-mh40616/mac)

## 4. IPC: list Font files

**Goal.** Main lists Font files in the platform's Font folders; the renderer shows their names. This is your first trip across the process boundary.

**Concepts.** `ipcMain.handle` and `ipcRenderer.invoke`. `contextBridge.exposeInMainWorld`. Why preload exposes named functions instead of `ipcRenderer`. `app.getPath`, `path.join`, and branching on `process.platform` in main only. Reading folders with `fs/promises`. Typing `window.fontBook` in `index.d.ts`. Follow "Add an IPC operation" in [architecture](contributing/architecture.md#add-an-ipc-operation).

**Template gap to close here.** The scaffold ships with `sandbox: false`, and its preload exposes `@electron-toolkit/preload`'s `electronAPI` (a general-purpose `ipcRenderer` wrapper) as `window.electron`. Both break the security baseline in [AGENTS.md](../AGENTS.md). electron-vite leaves `@electron-toolkit/preload` as a runtime `require`, and a sandboxed preload can't load packages, so switching to `sandbox: true` before rewriting the preload makes the window fail to get its API. Rewrite the preload to import only `electron` and `src/shared`, expose `window.fontBook` instead, then turn the sandbox on. Also replace the template's `optimizer.watchWindowShortcuts`: in packaged builds it cancels Mod+R, Mod+Alt+I and Mod+Minus, which also silently disables those menu shortcuts on her Mac. See [first build](product/first-build.md#build-order) for the rest of this milestone's v0.1 work. Finding out why the old preload broke is a good exercise. See [Electron: process sandboxing](https://www.electronjs.org/docs/latest/tutorial/sandbox).

**Done when.** The renderer shows a plain list of Font file names from the real Font folders on both Windows and macOS. The scanning function has a test that uses a temporary directory with fixture files.

**Resources.**
- [Electron: inter-process communication](https://www.electronjs.org/docs/latest/tutorial/ipc)
- [Electron: context isolation](https://www.electronjs.org/docs/latest/tutorial/context-isolation)
- [Electron: app.getPath](https://www.electronjs.org/docs/latest/api/app#appgetpathname)
- [Node.js: fs/promises](https://nodejs.org/api/fs.html#promises-api)

## 5. Metadata parsing and zod

**Goal.** Parse each Font file in main into Styles (Family name, Style name, weight, italic, whether it has Axes), guess each Family's Classification, validate IPC input with zod, and show Styles grouped by Family.

**Concepts.** Parsing binary files with fontkit (or opentype.js). One `.ttc` Font file holding several Styles. zod schemas as the single source of truth, with `z.infer` for types. Discriminated unions for "parsed" vs "failed to parse". Caching parsed results in `library-index.json`. A pure function (no files, no Electron) that guesses a Classification from parsed fields, which makes it the easiest thing in the app to test; see [ui-spec: Classification filter](product/ui-spec.md#classification-filter).

**Done when.** The Library shows Families and Styles. A broken or non-font file in a Font folder shows as a failed entry instead of crashing the Scan. Sending invalid input to the handler is rejected by zod, and a test proves it.

**Resources.**
- [zod documentation](https://zod.dev/)
- [fontkit](https://github.com/foliojs/fontkit) or [opentype.js](https://github.com/opentypejs/opentype.js)
- [TypeScript: narrowing and discriminated unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [Electron: security checklist](https://www.electronjs.org/docs/latest/tutorial/security)

## 6. Specimen view

**Goal.** Select a Style and see a Specimen: Sample text you can edit, with size and line-height controls.

**Concepts.** Getting font bytes from main as a `Uint8Array`. The CSS Font Loading API: `new FontFace(...)`, `load()`, `document.fonts.add` and `delete`. Effects that load something and clean it up. Controlled inputs. Deriving values instead of duplicating state. Extract one face from `.ttc` files in main, and follow the rules in [architecture: rendering a Style](contributing/architecture.md#rendering-a-style) (generated family names, `font-synthesis: none`, coverage instead of silent fallback). [Edge cases](product/edge-cases.md) explains why each rule exists. This is the first milestone with real UI controls: install [Base UI](https://base-ui.com/) (`bun add @base-ui/react`) for the sliders, and [Motion](https://motion.dev/) (`bun add motion`) once something needs to animate. Add each one in the commit that first uses it, because knip fails the check on dependencies nothing imports.

**Done when.** Switching Styles quickly never shows the wrong Style and does not leak `FontFace` objects. The Specimen shows loading and error states.

**Resources.**
- [MDN: CSS Font Loading API](https://developer.mozilla.org/en-US/docs/Web/API/CSS_Font_Loading_API)
- [MDN: FontFace](https://developer.mozilla.org/en-US/docs/Web/API/FontFace)
- [React: synchronizing with effects](https://react.dev/learn/synchronizing-with-effects)
- [React: you might not need an effect](https://react.dev/learn/you-might-not-need-an-effect)

## 7. Virtualized Library list

**Goal.** Make the Library list fast with thousands of Styles (a Mac ships hundreds, and her collection will grow), with search by Family name.

**Concepts.** Why rendering every row is slow. Virtualization: render only visible rows. Measuring row height. Loading each row's preview only when it scrolls into view, and unloading it after. Keyboard navigation in a list.

**Done when.** Scrolling a list of 2,000+ Styles stays smooth on her Mac, search and the Classification filter narrow the list as you use them, and arrow keys move the selection.

**Resources.**
- [TanStack Virtual](https://tanstack.com/virtual/latest)
- [React: rendering lists](https://react.dev/learn/rendering-lists)
- [React: managing state](https://react.dev/learn/managing-state)

## 8. Collections and Favorites

**Goal.** Create, rename, and delete Collections; add Styles to them; star Favorites; set a Family's Classification by hand. Everything survives a restart.

**Concepts.** Main owns persistence. Reading and parsing `collections.json` with zod, writing safely (temp file then rename), a `version` field for future migrations. Updating UI state after an IPC mutation. Handling a missing or corrupt file without losing her work. See [architecture: on-disk layout](contributing/architecture.md#on-disk-layout).

**Done when.** Collections and Favorites persist across restarts on her Mac, a corrupt `collections.json` is set aside instead of overwritten, and the storage code has tests using a temporary directory.

**Resources.**
- [Electron: app.getPath('userData')](https://www.electronjs.org/docs/latest/api/app#appgetpathname)
- [Node.js: fs](https://nodejs.org/api/fs.html)
- [zod documentation](https://zod.dev/)

## 9. Designer features

**Goal.** The features a graphic-design student will reach for. Build them one at a time, each as its own feature folder.

- **OpenType features.** List the Style's feature tags from its metadata and toggle them with `font-feature-settings`.
- **Axes.** For variable Styles, a slider per Axis using `font-variation-settings`, plus Named instances as presets.
- **Glyph grid.** Every Glyph in the Style in a virtualized grid; click one to see it large with its code point.
- **PNG Export.** Save a Specimen or Pairing as a PNG to a location she picks in a save dialog. One approach: the renderer sends the Specimen's on-screen rectangle; main captures it with `webContents.capturePage` and writes the PNG.

**Concepts.** CSS font features and variations. Reading feature and Axis tables from parsed metadata. Reusing virtualization. Native save dialogs in main. Small, separate pull requests per feature.

Pairing (a heading Style and a body Style together) is the first feature after v0.1; see [ui-spec 8.6](product/ui-spec.md#86-pairing-v02).

**Done when.** Each feature works on her Mac, has tests for its operations, and passes a review against [design principles](design-principles.md).

**Resources.**
- [MDN: font-feature-settings](https://developer.mozilla.org/en-US/docs/Web/CSS/font-feature-settings)
- [MDN: variable fonts guide](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_fonts/Variable_fonts_guide)
- [Electron: dialog](https://www.electronjs.org/docs/latest/api/dialog)
- [Electron: webContents](https://www.electronjs.org/docs/latest/api/web-contents)
