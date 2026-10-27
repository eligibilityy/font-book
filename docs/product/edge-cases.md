# Edge cases and likely bugs

What can go wrong in Book's first version, found before the code exists. Each entry gives a severity, the scenario, what breaks, how to notice it, what to do, and the [roadmap](../roadmap.md) milestone where it first matters. Terms follow [CONTEXT.md](../../CONTEXT.md).

Evidence labels:

- **Verified (En)**: shown by experiment En in the table below, on the Windows 11 dev box.
- **Documented**: stated in the linked documentation.
- **Inferred**: reasoning or experience, not tested here. Check it on her Mac before relying on it.

Severity: **blocker** (the milestone's "Done when" cannot pass), **high** (shows her wrong type or loses her work), **medium** (visible annoyance), **low** (polish).

## Top 10 risks

| # | Risk | Severity | Milestone | Evidence |
| --- | --- | --- | --- | --- |
| 1 | A Style that fails to load, or lacks a character, silently renders in another font. The Specimen lies. | blocker | 6 | Verified (E13, E19) |
| 2 | Registering a `FontFace` under the real family name overrides the installed font of that name, including the UI font. | high | 6 | Verified (E13) |
| 3 | `FontFace` always uses face 0 of a `.ttc`. Every other Style in a `.ttc` shows the wrong Style. | blocker | 6 | Verified (E10) |
| 4 | `font-weight` on a variable Style draws a fake bold instead of moving the `wght` Axis; `opsz` changes on its own with font size. | high | 6, 9 | Verified (E14, E15, E16) |
| 5 | fontkit throws on common variable fonts (`namedVariations`), and one throw can stop the whole Scan. | high | 5 | Verified (E1, E2) |
| 6 | fontkit parses a file that Chromium then refuses to render (OTS sanitizer), so the Library lists Styles that never load. | high | 5, 6 | Verified (E12) |
| 7 | Grouping Families by name ID 1 splits real families ("Arial Narrow", "Segoe UI Light" become separate Families). | high | 5 | Verified (E3) |
| 8 | Style IDs built from raw path strings break on Unicode normalization, letter case, moves, and renames, orphaning Collections. | high | 5, 8 | Verified (E25) + Inferred |
| 9 | Safe-write rename fails with `EPERM` on Windows whenever any process has the file open; dev and packaged builds share one `userData` folder. | high | 8 | Verified (E24, E25) |
| 10 | Large Font files (CJK 20 to 40 MB, emoji tens to hundreds of MB) cost memory per loaded `FontFace`, and `subarray` silently sends the whole file over IPC. | high | 6, 7 | Verified (E20, E22) |

## Experiments run

Setup: Electron 44.9.3 (Chromium 152.0.7977.167, Node 24.22.0 in main), `sandbox: true`, `contextIsolation: true`, a preload exposing named functions with `contextBridge`, and the template's exact CSP meta tag. Standalone scripts used Node 24.22.1, fontkit 2.0.4, opentype.js 2.0.0, wawoff2 2.0.1, ttf2woff 3.0.0. Fonts: the dev box's `C:\Windows\Fonts` and `%LOCALAPPDATA%\Microsoft\Windows\Fonts`. Display scale factor 1.25. Scratch code lived outside the repo and is not part of Book.

| ID | What | How | Result |
| --- | --- | --- | --- |
| E1 | Scan cost and failures | fontkit `create` on all 1,400 files in both Windows Font folders | 726 `.ttf`, 459 `.otf`, 15 `.ttc`, 192 `.fon`, plus `.ini`, `.dat`, `.xml`, `.compositefont`. 1,222 Styles (38 from `.ttc`) in 1.6 s with a warm disk cache, 1,121 MB read, peak RSS 187 MB. 192 `.fon` rejected ("Unknown font format"); 1 corrupt 4 KB `mstmc.ttf`; 5 metadata throws (E2). |
| E2 | Variable font metadata | read `variationAxes` and `namedVariations` | `variationAxes` works. `namedVariations` throws `TypeError: Cannot read properties of undefined (reading 'en')` on 5 of 12 variable fonts (Bahnschrift, Segoe UI Variable, Sitka, Sitka Italic, ABC Areal). Raw `font.fvar.instance` still has the name IDs and coordinates. |
| E3 | Family name IDs | compare name ID 1 with ID 16 (typographic family) | 581 of 1,222 Styles differ. 669 Families by ID 1, 320 by ID 16. Example: ID 1 "Arial Narrow", ID 16 "Arial", ID 17 "Narrow Bold". |
| E4 | Duplicates | group by PostScript name | 23 PostScript names in more than one file: `PAPYRUS.TTF` (system) and `papyrus.ttf` (per-user); `SF-Mono-Bold.otf` and `SF-Mono-Bold_0.otf`. |
| E5 | Embedding flags | OS/2 `fsType` | 601 installable, 434 editable, 108 no-subsetting, 76 preview-and-print, 3 restricted. |
| E6 | opentype.js and `.ttc` | `opentype.parse` on `msyh.ttc` | Fails: "Unsupported OpenType signature ttcf". fontkit lists both faces. |
| E7 | fontkit speed | `characterSet`, `getGlyph().path.toSVG()` | 29,905 code points from Microsoft YaHei in 8 ms. Glyph outline to SVG about 0.06 ms each once warm (the first 1,000 took 2.4 s including warm-up). Segoe UI Emoji has 64,883 Glyphs. fontkit reads `.woff` and `.woff2`. |
| E8 | CSP and font sources | `new FontFace(name, source)` under the template CSP | `Uint8Array` from IPC: loads. `blob:` URL, `data:` URL, `url(book-font://...)`: all blocked ("'font-src' was not explicitly set, so 'default-src' is used"); the promise rejects with `NetworkError`. |
| E9 | WOFF and WOFF2 from bytes | Arial compressed with wawoff2 and ttf2woff | Both load; WOFF2 width matches installed Arial exactly. |
| E10 | `.ttc` face choice | whole `msgothic.ttc` vs each face extracted in main | Whole file renders face 0 (width 300.0 = face 0; faces 1 and 2 measure 232.8). `url(...msgothic.ttc#1)` also gives face 0. Faces extracted into standalone files (about 40 lines copying the table directory) all load. |
| E11 | Broken input | `.fon`, corrupt `.ttf`, truncated `.ttf` | All reject with `SyntaxError: Invalid font data in ArrayBuffer.` The specific reason appears only in the console ("OTS parsing error: ..."). |
| E12 | Chromium rejects fonts the OS accepts | all 1,200 `.ttf/.otf/.ttc` through IPC into `FontFace` | 1,116 MB in 7.9 s (3.1 s of it IPC). Rejected: `BELL.TTF`, `GILLUBCD.TTF` (cmap language id), `msjhl.ttc` (maxp), `NanumSquareNeo-Variable.ttf`, `mstmc.ttf`. fontkit parsed all but the last. |
| E13 | Name collisions and silent fallback | `FontFace` with real names; failed loads | A face named "Arial" with Comic Sans bytes replaces Arial for `font-family: Arial` (302.4 to 320.5 px). A face named "Segoe UI" replaces `'Segoe UI'` but not `system-ui`. A failed face named "Times New Roman" renders as the installed Times with no visible error; a failed uniquely named face renders as the default serif. |
| E14 | Synthetic styles | Comic Sans Regular only, then bold and italic | `font-weight: 700` adds 34% ink (4,730 to 6,330 dark pixels) with an identical width; `font-synthesis: none` returns to 4,730. Synthetic italic also changes the drawing; `none` stops it. |
| E15 | Variable weight | Segoe UI Variable (`wght` 300 to 700) | Default descriptors plus `font-weight: 700`: fake bold, width unchanged (305.4). `font-variation-settings: 'wght' 700`: real bold (330.8). Descriptor `weight: "300 700"` plus `font-weight: 700`: real bold. `font-variation-settings` wins over `font-weight`. |
| E16 | Optical size | Segoe UI Variable (`opsz` 5 to 36) at 40 px | Default `font-optical-sizing: auto` renders like `opsz` 36, not the font's default 10.5; `none` renders the default. |
| E17 | Feature defaults | Arial, Calibri | Kerning is on by default even at 10 px (79.8 vs 88.4 px with `font-kerning: none`). Ligatures are on by default. `font-feature-settings: 'tnum' 1` plus `font-variant-numeric: proportional-nums` gave proportional figures (55.9 vs 81.1 px). |
| E18 | `line-height: normal` | one line at 100 px | Arial 114.4, Calibri 122.4, Microsoft YaHei 132, Segoe UI Variable 132.8 px. |
| E19 | Color font and emoji fallback | Segoe UI Emoji (COLR v1, 12.9 MB) | Loads in 74 ms including IPC and renders in color. Emoji typed into a Comic Sans Specimen render in color from system fallback with the identical width (109.8 px): nothing shows they are not Comic Sans. |
| E20 | IPC cost and limits | `ipcMain.handle` returning a `Buffer` | 19.7 MB in 42 ms, 37.1 MB in 87 ms; `FontFace.load()` 36 and 74 ms. Synthetic 64, 128, 200, 300 MB all arrived (124 to 656 ms): no ceiling hit. `buffer.subarray(0, 10)` of a 37 MB file arrived with a 37,112,128-byte backing `ArrayBuffer`. |
| E21 | Custom protocol alternative | `protocol.handle("book-font")`, CSP `font-src`/`connect-src` added | 37 MB `fetch` in 137 ms; `FontFace` with `url()` 72 ms. Without the `corsEnabled` scheme privilege, `file://` pages get a CORS error. |
| E22 | `FontFace` memory | 200 faces of a 1.05 MB file, then delete | Renderer working set 204 MB, then 455 MB loaded, then 213 MB after `document.fonts.delete`, dropping references, and garbage collection. No leak when cleanup is done. |
| E23 | `capturePage` | hidden window (`show: false`), various rects | Works while hidden. Output is in device pixels (400 x 200 CSS px gave 500 x 250). A rect larger than the viewport is clipped to it. A rect partly or fully below the viewport throws `UnknownVizError`. |
| E24 | `userData` in dev | lab app with `package.json` `name: "book"`, no `productName` | `app.getName()` is "book"; `userData` is `...\AppData\Roaming\book`. |
| E25 | Filesystem | Node 24 on NTFS | Rename-over fails with `EPERM` while any handle is open on the target (even Node's own read handle), succeeds once closed. A 315-character path reads and writes fine. A file saved under an NFD name ("Cafe" + combining accent) is not found by its NFC spelling, and the two strings are unequal. `arial.ttf` finds `Arial.TTF`. |

## Font formats

**F1. `.ttc`/`.otc` collections show face 0 for every Style.** blocker, M6. Verified (E10). *Scenario:* she picks "MS PGothic" (face 2) or, on her Mac, any non-first Style of Helvetica.ttc, Avenir Next.ttc, PingFang.ttc. *Failure:* the Specimen draws face 0 under the right name. *Detect:* a test comparing rendered widths of faces from one `.ttc`. *Mitigate:* main extracts the one face into a standalone font (copy the face's table directory and tables, rewrite offsets) and `readStyleBytes` returns only those bytes. Copy into a new buffer; never `subarray` (see P2). Cache extracted bytes per session.

**F2. `.fon`, `.fnt`, Type 1 (`.pfb`, `.pfm`, `.afm`, `.lwfn`), `.dfont` and legacy suitcases.** medium, M5. Verified for `.fon` (E1, E11); Inferred for the rest. *Failure:* 192 `.fon` files on Windows become 192 red error rows. Chromium renders none of these formats; fontkit reads `.dfont` but Chromium will not render it. Suitcases keep data in the resource fork, which `fs.readFile` does not see. *Mitigate:* filter by extension, case-insensitively (`.TTF` exists, E4). Skip unsupported formats from Font folders silently with a count ("192 bitmap fonts skipped"); refuse them at Import with a named reason. Add `.otc` to CONTEXT.md's Font file list.

**F3. Parsed but unrenderable.** high, M5/M6. Verified (E12). *Scenario:* `BELL.TTF` parses in fontkit but OTS (the font sanitizer inside Chromium, <https://github.com/khaledhosny/ots>) rejects it. *Failure:* a Style that always shows the loading or error state; she thinks Book is broken. *Detect:* the `FontFace.load()` rejection. *Mitigate:* treat render status as separate from parse status. When the renderer fails to load a Style, report it to main (`library:report-style-unrenderable`) and store it in the cache, so the Library row says "This Style can't be previewed" instead of retrying on every scroll.

**F4. One bad Style aborts the Scan.** high, M5. Verified (E1, E2). *Scenario:* reading `namedVariations` on Segoe UI Variable throws. On her Mac, SF Pro and New York are variable and may trigger the same name-table path (Inferred). *Mitigate:* wrap every metadata read for each Style in its own try/catch and return a discriminated union per Style. For Named instances, fall back to `font.fvar.instance` (name ID and coordinates) and resolve names yourself, falling back to "Instance 3". Keep fontkit (E6: opentype.js 2.0.0 cannot read `.ttc`).

**F5. Wrong Family grouping.** high, M5. Verified (E3). *Failure:* "Arial Narrow", "Arial Black", and "Segoe UI Light" become their own Families; her Library shows twice as many Families. *Mitigate:* Family = name ID 16 (typographic family), falling back to ID 1. Style name = ID 17, falling back to ID 2. Store both; ID 1 is still what other apps show in font menus.

**F6. Duplicate Styles across folders and versions.** medium, M5. Verified (E4). *Scenario:* the same PostScript name in `/Library/Fonts` and `~/Library/Fonts`, an Imported copy of an installed font, or Windows' `_0` duplicate files. *Mitigate:* keep both (they are different Font files and may be different versions); show the version string (name ID 5) and Font folder in the Style's detail; mark duplicates. Never key anything by PostScript name alone.

**F7. Names in other languages or encodings.** medium, M5. Inferred (none on this box lacked English, E1). *Scenario:* a Japanese or Chinese foundry font with only Japanese name records, or old Mac fonts with only Mac Roman names. *Mitigate:* pick a name record by preference (Windows English, then any Windows, then Mac Roman), never assume `.en`. Show the localized name too when it differs (Microsoft YaHei has "微软雅黑", E1).

**F8. Variable font structure.** medium, M9. Verified (E2, E15). *Scenarios:* italic shipped as a separate file vs an `ital` or `slnt` Axis; `slnt` runs negative; `avar` remaps the Axis; Named instances whose name ID is 2 ("Regular"); `STAT` describes the real style names. *Mitigate:* treat one variable Font file as one Style with Axes (CONTEXT.md already says so). Read Axis min/default/max from `fvar`; show Named instances as presets only.

**F9. Color fonts.** medium, M6/M9. Verified for COLR v1 on Windows (E19); Inferred for sbix and SVG on macOS. Apple Color Emoji is an sbix bitmap font of very large size (check with `ls -l` on her Mac). *Mitigate:* exclude very large Font files from Library row previews (see P3); in the Glyph grid, draw encoded color Glyphs as text, because a fontkit outline path is monochrome.

**F10. Symbol and non-Latin fonts.** medium, M6. Inferred, partly Verified (E7: Webdings maps Latin letters to symbols). *Failure:* default Latin Sample text in an Arabic, Devanagari, or CJK Style renders mostly in fallback fonts. *Mitigate:* pick a default Sample text from the Style's character set (cmap) or OS/2 Unicode ranges; set `dir="auto"` on Sample text for right-to-left scripts.

**F11. Huge Glyph counts.** medium, M9. Verified (E7). *Failure:* a Glyph grid of 30,000 to 65,000 cells, and Glyphs without a character (ligatures, alternates) cannot be drawn as text at all. *Mitigate:* virtualize the grid; for encoded Glyphs render the character; for unencoded ones ask main for SVG paths of only the visible glyph IDs, in batches.

## Rendering correctness

**R1. Silent fallback makes the Specimen lie.** blocker, M6. Verified (E13, E19). *Scenarios:* the `FontFace` fails to load and the text renders in a default font; the Style lacks lowercase, accents, or emoji and Chromium substitutes per character. *Detect:* `face.status === "error"`; coverage from the cmap. *Mitigate:* never render Sample text until `load()` resolves; on failure show the error state, not text. Ask main which code points of the Sample text the Style lacks (fontkit `hasGlyphForCodePoint`; `characterSet` costs about 8 ms for 30,000 code points) and mark those characters, as [design principles section 8](../design-principles.md#8-every-state-is-designed-empty-loading-error-full) asks. Cmap coverage does not prove complex-script shaping is right; it is still the honest first step.

**R2. Real family names collide.** high, M6. Verified (E13). *Failure:* registering "Inter" overrides the installed Inter everywhere in the page, including any UI token that names a real font; registering "Segoe UI" overrides `'Segoe UI'` (but not `system-ui`). *Mitigate:* register every `FontFace` under a generated family name derived from the Style ID, such as `book-style-7f3a`, and use only that name in Specimen CSS. Keep `--font-ui` starting with `system-ui`.

**R3. Fake bold and fake italic.** high, M6. Verified (E14, E15). *Failure:* inherited `font-weight: 700` (a heading, a `<strong>`) or `font-style: italic` on a Regular-only `FontFace` draws a synthesized style she may judge as real. *Mitigate:* Specimen text sets `font-weight: normal`, `font-style: normal`, and `font-synthesis: none`. Each Style is its own `FontFace`; never ask CSS to pick a weight.

**R4. Variable Axes through the wrong property.** high, M9. Verified (E15, E16). *Mitigate:* drive every Axis with `font-variation-settings` only, built from one map of Axis values. Set `font-optical-sizing: none` when the user controls `opsz`, and show the font's own default; otherwise `opsz` silently follows font size. Pass the Axis range as the descriptor (`weight: "300 700"`) if you ever use `font-weight`.

**R5. Feature settings fighting each other.** medium, M9. Verified (E17). Kerning and ligatures are on by default; `font-variant-*` and `font-feature-settings` combine unpredictably. *Mitigate:* build OpenType feature toggles into one `font-feature-settings` string from one map; never set `font-variant-*` in the Specimen. Show `kern` and `liga` as on by default.

**R6. Layout jumps between Styles.** medium, M6/M7. Verified (E18). `line-height: normal` ranges from 114 to 133 px at 100 px between ordinary fonts, and differs between Windows and macOS for some fonts (hhea vs typo vs win metrics, the USE_TYPO_METRICS flag; Inferred). *Mitigate:* always use a numeric line height; fixed Library row height with `overflow: hidden`, as design principles section 9 requires.

**R7. Stale Style after fast switching.** high, M6. Inferred. *Scenario:* she arrows from a 37 MB CJK Style to a small one; the big load resolves last and replaces the newer Specimen. *Mitigate:* in the loading effect, keep a `cancelled` flag set by cleanup and ignore late results; cleanup also calls `document.fonts.delete(face)`. Test by mocking a slow bridge, not `vi.mock` (inject the client).

**R8. `FontFace` memory.** high, M7. Verified (E22): about 1.25 times the file size per loaded face, fully released after delete. *Mitigate:* one owner (a small registry in the renderer) creates, counts, and deletes faces; cap concurrent loads (for example 4) and total loaded bytes (for example 300 MB, least recently used first).

## macOS

**M1. Hidden system fonts.** medium, M5. Inferred. Some files in `/System/Library/Fonts` have family names starting with "." (for example ".SF NS"); Apple reserves them for the system UI. *Mitigate:* hide Styles whose family or PostScript name starts with ".", and skip dotfiles (`.DS_Store`, `._Font.ttf` AppleDouble files from copied drives).

**M2. Subfolders and protected folders.** medium, M4. Inferred. `/System/Library/Fonts/Supplemental` holds many Families; the Scan must recurse. `/System/Library` is read-only (System Integrity Protection); reading works, and Book never writes there (AGENTS.md). Fonts that macOS downloads on demand live under `/System/Library/AssetsV2/`; leave them out of v1.

**M3. Adobe Fonts.** medium, M4. Inferred (Adobe's help pages refused automated fetches). Creative Cloud stores activated fonts as hidden, obfuscated files under `~/Library/Application Support/Adobe/CoreSync/plugins/livetype`, intended for use only through the OS font system. *Mitigate:* do not scan that folder or read those files; they are licensed for use through Creative Cloud, not for copying.

**M4. Privacy prompts and unsigned builds.** medium, M3/M8. Inferred. Reading Documents, Downloads, or Desktop triggers a macOS privacy prompt; the ad-hoc signature changes on every build, so macOS may ask again after each update. `electron-builder.yml` has usage strings for Documents and Downloads but not Desktop (`NSDesktopFolderUsageDescription`), where students keep downloads. *Mitigate:* Import copies files immediately after she picks them in a dialog or drops them; never re-read originals later. Add the Desktop string.

**M5. App Translocation and quarantine.** low, M3. Inferred. Opened straight from Downloads, an unsigned app runs from a random read-only path; a zip unpacked by some tools reports "damaged". Data in `userData` is unaffected. *Mitigate:* the release notes tell her to drag Book to Applications first; if "damaged" appears, `xattr -cr /Applications/Book.app`.

**M6. iCloud Drive placeholders.** medium, M8. Inferred. With "Optimize Mac Storage", an Imported file may be dataless; reading it downloads it, or fails offline. *Mitigate:* Import reads with a timeout and reports "This file is still in iCloud" on failure.

**M7. Files change while Book runs.** medium, M5. Documented: `fs.watch` behavior varies by platform and is not fully reliable (<https://nodejs.org/api/fs.html#caveats>). *Mitigate:* do not depend on watching for v1. Rescan when the window regains focus (cheap thanks to the size and mtime cache) and on a menu item; treat a Style whose file vanished as Missing, not as an error.

**M8. Unicode normalization and case.** high, M5/M8. Verified on NTFS (E25), Inferred for APFS. APFS is case-insensitive and normalization-insensitive by default but preserves the bytes it was given; one file can be reached by NFC or NFD spellings that compare unequal as strings. *Mitigate:* see S1.

## Windows (dev box)

**W1. Per-user fonts and duplicates.** medium, M4. Verified (E1, E4). The per-user folder exists and holds many fonts; installing the same font twice creates `_0` files. Fonts can also be registered from arbitrary paths in the registry (Inferred); ignore that for v1.

**W2. Non-font files in Font folders.** low, M4. Verified (E1): `desktop.ini`, `StaticCache.dat`, `.compositefont`, a file with no extension. Filter by extension.

**W3. Long paths.** low. Verified (E25): Node handles 315-character paths. No action.

**W4. Locked files.** low. Verified implicitly (E1, E12): every system Font file could be read while Windows used it.

## Electron and security

**E-1. CSP needs no change for IPC bytes.** Verified (E8). `FontFace` from a `Uint8Array` loads under `default-src 'self'`; `blob:`, `data:`, and custom-scheme URLs are blocked. Keep the template CSP. If a custom protocol is ever adopted (E21), it needs `font-src` and `connect-src` entries and the `corsEnabled` scheme privilege.

**E-2. Failures look alike.** medium, M6. Verified (E11). Every bad font rejects with the same `SyntaxError`; the OTS reason is only in the console. *Mitigate:* show one human message ("This Style couldn't be previewed. The file may be damaged or use a format Chromium can't draw.") and log the reason with `console.warn` in development.

**E-3. Sandboxed preload.** blocker for M4 (already in the roadmap). Inferred plus Documented in the roadmap. The preload may import only `electron` and `src/shared`; zod schemas from `src/shared` must bundle into the preload rather than load at runtime. Check the built `out/preload/index.js` for `require(` of anything but `electron`.

**E-4. Export capture.** high, M9. Verified (E23). `capturePage` clips to the visible viewport and throws `UnknownVizError` for a rect outside it; output is in device pixels (2x on her Retina display, 1.25x here). *Mitigate:* clamp the rect to the viewport, and for a Specimen taller than the window render it in a dedicated hidden window sized to the content (hidden capture works). Round the rect to integers, compute the PNG size from the captured image, not from CSS pixels.

**E-5. IPC size.** low, M6. Verified (E20): 300 MB still arrives; cost is about 2.3 ms per MB. No chunking needed for v1.

**E-6. One instance only.** medium, M8. Documented (`app.requestSingleInstanceLock`, <https://www.electronjs.org/docs/latest/api/app>). Two instances writing `collections.json` lose each other's changes. Take the lock at startup; on a second launch focus the existing window.

## Persistence

**S1. Style IDs that survive real life.** high, M5/M8. Verified (E25) + Inferred. *Failure:* IDs built from the raw path change when a path is spelled NFD vs NFC or with different case, when the user renames a folder, or when an Import is re-copied, so Collections and Favorites point at nothing. *Mitigate:* build the ID from a normalized key: the Font folder kind plus the path relative to that folder, NFC-normalized, case-folded when the volume is case-insensitive, plus the face index. Store a snapshot next to each Collection entry (Family, Style name, PostScript name, file size) so a missing Style can be shown by name and re-linked when a matching file appears.

**S2. Safe write fails on Windows.** high, M8. Verified (E25). Temp-file-then-rename throws `EPERM` while anything (antivirus, Windows Search, Book's own unclosed read) holds the target open. *Mitigate:* one write queue in `main/storage`; close every handle before rename; retry rename a few times with a short backoff on `EPERM`/`EBUSY`; keep the previous file as `collections.bak.json`; if all retries fail, report "Couldn't save" and roll back the optimistic UI change.

**S3. Dev and installed builds share data.** medium, M8. Verified for dev (E24), Inferred for the packaged name. Dev uses `...\Roaming\book` (`package.json` `name`); the packaged app uses `productName` "Book". Both Windows and default macOS volumes ignore case, so they are the same folder, and a broken dev build can corrupt the installed app's Collections. *Mitigate:* in development only, point `userData` at a "Book Dev" folder with `app.setPath` before `ready`.

**S4. Versions and downgrades.** medium, M8. Inferred. A file with a `version` newer than the app knows (she installs an older build) must not be "migrated" or overwritten. Open read-only and say so.

**S5. Duplicate Imports.** low, M8. Inferred. Importing the same file twice, or a file already in a Font folder. *Mitigate:* hash the bytes on Import; if identical bytes exist, select the existing Style instead of copying again. Name copies so they never overwrite (`Inter-Regular (2).ttf`).

**S6. Stale cache after parser fixes.** low, M5. Inferred. `library-index.json` keyed only by path, size, and mtime keeps results from a buggy parser forever. Add a parser version to the cache file; a mismatch discards it.

**S7. Deleting a Collection with Missing Styles.** low, M8. Inferred. Deleting removes IDs only, never files (CONTEXT.md). Show Missing Styles in a Collection as named, dimmed rows with **Remove from Collection**.

## Performance

**P1. Startup Scan.** medium, M5/M7. Verified (E1): 1,222 Styles in 1.6 s warm; cold disk and her larger macOS set are unknown. *Mitigate:* show cached results immediately, then rescan in the background and stream progress; only re-parse files whose size or mtime changed. Read whole files one at a time (peak RSS stayed at 187 MB) rather than in parallel.

**P2. `subarray` sends the whole file.** high, M6. Verified (E20). Serialization copies the entire backing `ArrayBuffer`. *Mitigate:* return `Buffer.from(view)` or `new Uint8Array(view)` (a copy), never a view of a larger buffer.

**P3. Row previews in the Library list.** high, M7. Verified costs (E20, E22). Each visible row loads its whole Font file: 40 to 80 ms and tens of MB for a CJK `.ttc`, much more for emoji. *Mitigate:* lazy-load with the caps in R8; skip the row preview for files above a size limit (show the name in the UI font and load on selection); unload rows far off-screen.

## UX edge cases

**U1. Space in Sample text.** high, M7. Inferred. Space must type a space while focus is in an editable element, and open Quick preview only from the list ([design principles section 6](../design-principles.md#6-keyboard-first-for-power-use-friendly-for-the-mouse)). Test both.

**U2. Quick preview on a Style that fails.** medium, M7. Inferred. Show the error state inside Quick preview; Space and Escape still close it; selection unchanged.

**U3. Empty Library.** medium, M4. Inferred. Brand-new install with only system fonts hidden, or an unreadable folder: show the empty state from design principles section 8, and say which Font folders could not be read.

**U4. Long names and odd content.** low, M7. Inferred. Family names over 60 characters, uppercase-only Styles, symbol fonts, emoji in Sample text (R1). Truncate with an ellipsis and a full-name tooltip.

**U5. Embedding flags at Export.** low, M9. Verified that flags exist (E5); Inferred on licensing. `fsType` governs embedding font data in documents, and a PNG holds no font data, so do not block Export. Optionally show "Restricted license" in the Style's details.

## Decisions the architecture doc should change

1. **Answer the `.ttc` open question.** Main extracts the chosen face into standalone font bytes and `library:read-style-bytes` returns only that face. Note that bytes must be copied, not sliced (P2).
2. **Add a `FontFace` naming and CSS rule** to the data flow: generated family names from the Style ID, `font-synthesis: none`, `font-weight`/`font-style` normal, Axes only through `font-variation-settings`, OpenType features only through `font-feature-settings`, `font-optical-sizing: none` when Axes are user-controlled.
3. **Separate parse status from render status** in the Style contract, with a channel for the renderer to report an unrenderable Style, and a coverage operation (`library:check-coverage` for Sample text code points).
4. **Define Family and Style names** as name IDs 16 and 17 with fallback to 1 and 2.
5. **Redefine Style IDs** as normalized relative keys plus face index, and store a name snapshot with each Collection entry (S1).
6. **Extend "Write safely"** with a single write queue, retry on `EPERM`/`EBUSY`, a `.bak` copy, single-instance lock, and refusing newer `version` values.
7. **Separate dev `userData`** from the installed app's.
8. **Add a parser version** to `library-index.json`.
9. **List supported and skipped formats**, including `.otc`; skip `.fon`, Type 1, `.dfont`, suitcases. List excluded locations: Adobe Fonts' livetype folder, dot-named system Families, `/System/Library/AssetsV2`. Note that the Scan recurses into subfolders.
10. **Describe Export** as capture clamped to the viewport, or a hidden window sized to the Specimen, with PNG size in device pixels.
11. **Keep IPC bytes and the template CSP** for v1 (measured fast enough); record the custom-protocol option and the CSP and privilege changes it would need.
