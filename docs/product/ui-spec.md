# UI specification: v0.1

What every v0.1 screen looks like and how it behaves, surface by surface, so each [roadmap](../roadmap.md) milestone can build its part and know when it is done. Scope comes from [features](features.md), feel and motion from [design references](design-references.md) (which wins where it disagrees with [design principles](../design-principles.md)), failure behavior from [edge cases](edge-cases.md). Terms follow [CONTEXT.md](../../CONTEXT.md); new terms are only proposed, in section 13.

Items marked **Decided** answer an open question; the developer settled them on 2026-10-27. Everything else is the recommended default; change it in this file first if you change it in code.

Conventions: `Mod` is Cmd on macOS and Ctrl on Windows. "Motion row X" means the row named X in the [motion spec table](design-references.md#2-motion-spec-for-books-key-interactions). Edge-case codes (R1, F3, P3) point to [edge cases](edge-cases.md). Base UI components are imported from `@base-ui/react`.

## 1. Decisions in brief

1. **Two views in one window.** The main area shows one view at a time: the **Library list** (wide rows, best for job 1), or the **Specimen** (one Style, with an inspector). Pairing becomes a third view in v0.2. The sidebar and toolbar never change. Enter or double-click opens the Specimen; Back returns to the list exactly where she left it. This makes Quick preview meaningful (a look without leaving the list) and avoids squeezing four columns into a 13-inch screen.
2. **Family rows in the Library, Style rows in Favorites and Collections.** See [Q1](#q1-library-rows).
3. **Names in the list, Sample text in the previews.** Library rows show the Family name in its own Style, with Style count, Variable and Classification beneath. The toolbar field, Quick preview and the Specimen share one Sample text; editing it anywhere edits it everywhere. (Changed on 2026-10-27, after trying v0.1: a column of names scans faster than the same sentence repeated.)
4. **Missing Glyphs are never silent.** Every Sample text stack ends in a bundled "notdef" font, so a character the Style lacks draws as an empty box instead of borrowing another font (fixes R1 and E19 in every surface at no runtime cost).
5. **Organizing acts on a Style you can see.** Favorite and Add to Collection work in the Specimen and on Style rows, never on a Family row, so "which Style did I just star?" never comes up. Classification is the exception: it belongs to a Family, so it is set on Family rows and in the Specimen header.
6. **Classification is a guess until she sets it.** Book guesses each Family's Classification from the Font file and says so; she can correct any Family by hand. See [Classification filter](#classification-filter).

## 2. Answers to the open questions

### Q1. Library rows

**Decided: one row per Family, not expandable in v0.1.**

- In All, My Fonts and System, each row is a Family. It renders the Family's **representative Style**: the upright Style whose `usWeightClass` is closest to 400, preferring the Style name "Regular", then "Roman" or "Book", then alphabetical; a variable Style at its default Axis values; if every Style is italic, the italic closest to 400.
- In Favorites and Collections each row is a Style, because those hold Styles (CONTEXT.md: the Style is the unit you favorite and collect).
- Quick preview on a Family row shows the representative Style; Left and Right step through the Family's other Styles while it is open.
- Favorite and Add to Collection are disabled on Family rows (menu items greyed). She opens the Specimen, picks the Style, then acts. A Family row shows a small star if any of its Styles is a Favorite (an indicator, not a button).
- Search matches Family names on Family rows, and Family or Style names on Style rows.
- Keyboard: one row per Family keeps Up/Down meaningful (Helvetica Neue is one stop, not 14).
- Why not expandable: a tree inside a virtualized list needs a second keyboard model (Left/Right to expand) and variable row counts. Leave it for v0.2 if she misses it.

### Q2. Quick preview timing

**Revised after trying v0.1 (2026-10-27): a short slide, docked on the right.** Quick preview docks on the right of the list, so the selected row's name is never covered. It slides in 16px and fades over 180ms and leaves over 120ms, with Motion retargeting mid-flight, so Space during the animation simply reverses it. Content changes (Up, Down, Left, Right) stay instant, and the last Style stays on screen until the next has loaded. It shows the Sample text large, the alphabet and figures, and a short paragraph, with clickable Style arrows and Open Specimen. The neighbouring rows' Styles load in the background while it is open.

The original decision, kept for the reasoning: **instant, both ways.** Space is a high-frequency key, and Emil Kowalski's rule is that keyboard actions people repeat all day do not animate. The panel appears and disappears in the frame Space is pressed (Motion row "Quick preview open/close"). There is nothing to interrupt, so pressing Space five times quickly simply toggles five times. It needs no Motion: render the panel when it is open and nothing when it is closed. If it ever feels abrupt, try a 100ms opacity-only exit before adding anything to the open.

### Q3. Inspector

**Decided (delegated to this spec): the inspector resizes the Specimen once, never per frame.** Why not an overlay: the inspector holds the controls she uses while judging the text (line height, tracking, Axes), so covering the right edge of that text hides exactly what she is adjusting. Why not animate the width: width is a layout property, so animating it reflows every line of Sample text on every frame, which is slow with a large Style and makes the type jitter. The rule below gives the look of a sliding panel with only two reflows. The Specimen paper fills the whole main area. The inspector is a panel that slides over the paper's right edge. The Sample text column has `max-width` equal to the main area minus `--inspector-width` while the inspector is open.

- Opening: the text column narrows at once (one reflow), then the inspector slides in from the right (Motion row "Inspector show/hide").
- Closing: the inspector slides out, then the text column widens on Motion's `onExitComplete` (one reflow).
- The type is never covered and never reflows during the animation.

### Q4. Default Sample text and empty-state tone

**Decided: the default Sample text is the pangram "Sphinx of black quartz, judge my vow.", and empty states use tone B.** A pangram uses every letter of the alphabet, so a row shows the whole lowercase alphabet in each Style at a glance. This one is 37 characters, so every row shows it whole, and it is a designer's favourite for a reason: no awkward words, and a good mix of round and straight letters. She can replace it in the toolbar, and View > Reset Sample Text brings it back. The warmth moves into the empty states and the About window, where it is seen less often and so stays special.

The three directions that were considered:

| Option | Sample text example | Empty-state tone example (No Favorites) |
| --- | --- | --- |
| A. Plain and useful | "Quiet afternoons & the right typeface" | "No Favorites yet. Press F on a Style to add it." |
| B. Warm, still a tool | "[Her name]'s Book, since October 2026" | "No Favorites yet. Star a Style to keep it close." |
| C. A private line | A short line only the two of them know, with one figure in it | "Nothing starred yet. The ones you love will gather here." |

Keep every empty state useful: it must name the next action. The [microcopy table](#11-microcopy) uses tone B.

## 3. Window layout

### Sizes and tokens

New tokens (add beside the [existing ones](../design-principles.md#tokens-to-define)):

| Token | Value | Use |
| --- | --- | --- |
| `--toolbar-height` | 48px | Full-width toolbar; also the traffic-light row on macOS |
| `--titlebar-inset` | 80px on macOS, 0 elsewhere | Left padding of the toolbar; set by main as a CSS variable, never computed in the renderer |
| `--sidebar-width` | 200px | Fixed in v0.1 |
| `--list-header-height` | 32px | Title and counts above the rows |
| `--row-height` | 80px | Fixed Library row (replaces the 56px example) |
| `--row-sample-size` | 32px | Sample text size in rows (row size slider is v0.3) |
| `--inspector-width` | 272px | Specimen inspector |
| `--specimen-min-width` | 400px | Text column never narrower |
| `--quick-preview-size` | 80px | Sample text size in Quick preview |

Window: minimum 960 x 600, default 1280 x 800, bounds remembered (debounced 400ms) and clamped back onto a visible display at launch. macOS uses `titleBarStyle: "hiddenInset"` with traffic lights at about x 16, y 16; Windows keeps the standard frame and menu bar. The window is created hidden and shown on `ready-to-show` with a `backgroundColor` matching the theme, so there is no flash.

### List view

```text
+--------------------------------------------------------------------------------+
| o o o  [=]  [Search My Fonts       x]  [Sphinx of black quartz, judge my vow.   ] | toolbar 48
+--------------+-----------------------------------------------------------------+
| LIBRARY      | My Fonts  [Any Classification v]    312 Families, 1,240 Styles  | header 32
| > All        +-----------------------------------------------------------------+
|   My Fonts   | Sphinx of black quartz, judge my vow.   (in Inter)              | row 80
|   System     | Inter                                   18 Styles, Variable  *  |
|   Couldn't   +-----------------------------------------------------------------+
|   Read    3  | Sphinx of black quartz, judge my vow.   (in Playfair Display)   |
|              | Playfair Display                                    12 Styles   |
| Favorites  6 +-----------------------------------------------------------------+
|              | ...                                                             |
|              |                                                                 |
| COLLECTIONS +|                                                                 |
|   Poster    4|                                                                 |
|   Typo II  12|                                                                 |
+--------------+-----------------------------------------------------------------+
```

### Specimen view

```text
+--------------------------------------------------------------------------------+
| o o o  [=]  [< My Fonts]  [Search My Fonts  ]  [Sphinx of black quartz, judge] |
+--------------+---------------------------------------------+------------------+
| (sidebar)    | Inter                       [*] [+] [P] [i] | v Text           |
|              | [Regular v]  3 Axes   Size [----o----] [64] |   Line height 1.10|
|              |                                             |   Tracking      0 |
|              |   Sphinx of black quartz,                   | v Axes            |
|              |   judge my vow.                             |   Weight  --o 400 |
|              |                     (paper and ink)         | v About this Style|
|              |                                             |   Designer  ...   |
+--------------+---------------------------------------------+------------------+
```

`[=]` sidebar toggle, `[*]` Favorite, `[+]` Add to Collection, `[P]` paper and ink, `[i]` inspector.

### Narrow windows

The two-view layout fits at the minimum size: Specimen view needs 200 + 400 + 272 = 872px. When the window narrows:

1. The toolbar's search field shrinks from 280px to 160px; the Sample text field takes the rest (minimum 200px).
2. Below 1100px the Specimen header's size slider shrinks to 120px wide.
3. She can hide the sidebar at any width (View > Hide Sidebar). Book never hides it on its own.

## 4. Toolbar

**Purpose.** The controls that never move: sidebar toggle, Back, search, Sample text.

**Anatomy.** `--titlebar-inset`, sidebar Toggle, Back button (Specimen view only, labelled with the current Library filter or Collection name: "< My Fonts"), search field, Sample text field. Empty toolbar space is `-webkit-app-region: drag`; every control and every popup is `no-drag`.

**Base UI.** `Toggle` (sidebar, `aria-label` "Show Sidebar" / "Hide Sidebar"), `Input` inside `Field` for search and Sample text, `Tooltip` for icon buttons with one `Tooltip.Provider` around the app so the second tooltip opens instantly.

**Sample text field.** Single line, maximum 300 characters; pasted line breaks become spaces; `dir="auto"`. Changes update rows and the Specimen in the same frame; saving to `prefs.json` is debounced. Empty field: rows show each Family's name in its own Style (as Google Fonts does), the Specimen shows the Style name. View > Reset Sample Text restores the default. Escape leaves the field and returns focus to where it came from.

**Motion.** None. The Back button appears and disappears instantly (content changing in place).

## 5. Sidebar

**Purpose.** Choose what the Library list shows.

**Anatomy.** Three groups, in this order:

1. **Library**: All, My Fonts (every Font folder except the operating system's own), System. "Couldn't Read" appears under them only when at least one Font file failed to parse.
2. **Favorites** (Style count). Pairing joins it in v0.2.
3. **Collections**: a header with a `+` button, then one row per Collection, alphabetical, with its Style count. Long names truncate with an ellipsis and show the full name in a `Tooltip`.

**Base UI.** `ContextMenu` on Collection rows (Rename..., Delete...). `Popover` for New Collection and Rename. `AlertDialog` for Delete. Rows themselves are plain `<button>`s in a `<nav aria-label="Library">` with `aria-current="page"` on the chosen one; Tab moves between them in v0.1.

**States.** Empty Collections group: just the header and `+`, plus one gray line "Group Styles for a project." Collections file is read-only (newer version, S4): an inline note under the header (see microcopy). Sidebar hidden: width 0, `inert`, and `aria-hidden`.

**Motion.** Hide and show: instant in v0.1 (the sidebar is chrome, and toggling it is a layout change). Collection add feedback: Motion row "Collection add feedback" on the receiving row. First Collection ever: the new row enters with the one spring preset (y 6px to 0, opacity 0 to 1), once, remembered in `prefs.json`. Later Collections appear instantly.

**Edge cases.** M1: dot-named system Families never appear in any count. U3: if every Font folder is unreadable, the Library items still show; the list shows the empty state.

## 6. Library list

**Purpose.** Job 1: scroll the whole Library in her own words and judge by feel.

### Row anatomy

```text
+--------------------------------------------------------------------------+
| Sphinx of black quartz, judge my vow.______________________fade ->       |    32px, in the Style
| Inter                                       18 Styles, Variable     *    |    12px UI font
+--------------------------------------------------------------------------+
```

- Line 1: Sample text in the row's Style at `--row-sample-size`, numeric `line-height: 40px`, one line, `overflow: hidden`, a right-edge fade (`mask-image` gradient) instead of an ellipsis. Font stack: the generated family name (`book-style-<id>`, R2), then the bundled notdef font. Always `font-synthesis: none`, `font-weight: normal`, `font-style: normal` (R3).
- Line 2, UI font: Family name (`--gray-12`, medium), then on Family rows "18 Styles" or "1 Style", plus ", Variable" when any Style has Axes; on Style rows the Style name ("Bold Italic"). Right: star indicator if a Favorite is in it.
- Padding 12px 16px; hairline bottom border; fixed height, nothing in a row can change its height (R6).
- Selected: a rounded tile inset 8px from the row edges (`--selection` while the list has focus, gray otherwise), hiding the hairlines beside it. Hover: the same tile in `--gray-2`, pointer only. (Changed 2026-10-28: the full-width band read as heavy in dark mode.)

### Lazy loading

- Virtualize with TanStack Virtual, overscan 5 rows.
- A row asks the `FontFace` registry for its Style only after it has been on screen for 100ms, so flinging past 500 rows loads nothing in between.
- The registry (R8) loads at most 4 Styles at once, keeps at most 300 MB loaded, evicts least recently used, and deletes faces it evicts.
- Font files above 24 MB (CJK, emoji, P3) are not loaded for rows. The row shows the Family name in the UI font and "Large file. Opens in the Specimen." The Specimen and Quick preview do load them.
- Each row's late result is ignored if the row has been recycled for another Style (R7).

### States

| State | What she sees |
| --- | --- |
| First Scan, no cache | Centered in the list area: "Scanning Font folders..." and "1,240 Styles so far" in tabular figures. Rows appear when the Scan finishes. |
| Cached, background rescan | Rows at once from the cache (P1); header shows "Scanning..." on the right, replaced by the counts when done. New Families slot in without moving the selected row. |
| Row loading | Family name in the UI font, `--gray-9`, on line 1, same height. Swaps to the Style with no animation. |
| Row can't be previewed (F3) | Line 1: Family name in the UI font, `--gray-9`, with a small warning icon. Line 2 adds "Can't be previewed". Reported to main once so it is not retried on scroll. |
| Missing Glyphs | Empty boxes where the Style has no Glyph for a character (the notdef font). No extra text in rows. |
| No Latin letters (added 2026-10-28) | A Style that draws fewer than half the letters of its Family name (Al Bayan, Geeza Pro) shows, on line 1, its Family name in another language from the Font file if it can draw that, else its script's own name ("العربية"). Line 2 starts with the Latin Family name and adds the script ("Al Bayan, 2 Styles, Arabic"). Search matches the script name. Quick preview shows the same text large, with one line saying why. Main works this out while parsing (`ownScriptName`). |
| Empty Library (U3) | See the [microcopy](#11-microcopy) row "Empty Library": message, the Font folders Book looked in (each marked "Couldn't be read" if so), **Scan Again**. |
| Some Font folders unreadable | A one-line notice under the header: "Book couldn't read /Library/Fonts. Check its permissions in Finder, then choose Scan Again." Dismissible; returns on the next failing Scan. |
| Empty Favorites / Collection | Centered message and next step (microcopy). |
| Missing Style (Style rows, S1, S7) | Dimmed row; line 1 shows the saved Family and Style name in the UI font; line 2 "Missing. The Font file was moved or removed." Context menu offers **Remove from Collection** or **Remove from Favorites**. |
| Long names (U4) | Family and Style names truncate with an ellipsis; a `Tooltip` shows the full name after the usual delay. |
| Couldn't Read view | Rows show the Font file name and Font folder in the UI font, with "This Font file couldn't be read. It may be damaged." Footer: "Book skipped 192 Font files in formats it can't preview, such as .fon and Type 1." (F2) |

### Keyboard and focus

The list is one tab stop: `role="listbox"` on the scroll container with `aria-activedescendant` pointing at the selected row; rows are `role="option"` with `aria-selected`, `aria-setsize` and `aria-posinset` (virtualized rows need both). Each option's `aria-label` is "Inter, 18 Styles" (not the Sample text). The container has `aria-description` "Arrow keys to move, Space for Quick preview, Enter to open". Click selects; double-click opens the Specimen. Keys are in the [keyboard map](#9-keyboard-map). Coming Back from the Specimen restores scroll position, selection and focus.

**Context menu** (`ContextMenu`; Shift+F10 and the Menu key open it at the selected row): Open Specimen, Quick Preview, Show in Finder; on Style rows also Add to Favorites or Remove from Favorites, Add to Collection..., and in a Collection Remove from Collection. Motion row "Context menu": instant open, 100ms fade out.

**Motion.** None on selection, hover (up to 100ms colour, pointer only), scrolling or row loading (Motion row "Library list selection and hover"). Never animate a property on the list container.

### Classification filter

**Purpose.** Narrow the list to one kind of letterform: "show me only the Serifs in My Fonts".

**Classifications.** Serif, Sans Serif, Slab Serif, Monospace, Script, Display, and Unclassified. One per Family, never per Style, because a Family's Styles share their letterforms. The list is short on purpose: finer classes (Humanist, Didone, Grotesque) are where metadata is least reliable and where designers disagree most.

**Where it comes from.**

1. **Set by her.** A hand-set Classification always wins. It is saved in `classifications.json`, keyed by Family, so it survives a Scan and a restart.
2. **Guessed from the Font file.** Otherwise Book guesses from the Representative Style during a Scan, in this order, and stops at the first answer:
   1. `post.isFixedPitch` set: Monospace (reliable).
   2. `OS/2.sFamilyClass` class (its high byte): 1, 2, 3 or 7 (the serif classes) is Serif; 4 (Clarendon) or 5 (Slab) is Slab Serif; 8 is Sans Serif; 9 (Ornamental) is Display; 10 is Script. Class 0 (no classification) and 12 (Symbolic) fall through.
   3. PANOSE: family type 3 (Latin Hand Written) is Script; 4 (Latin Decorative) is Display; 2 (Latin Text) uses the serif style digit: 11 to 13 are Sans Serif, 6 (Square) is Slab Serif, 2 to 10 are Serif. Anything else falls through.
   4. A table of well-known Families whose Font files leave both fields empty, mostly ones that ship with macOS (Academy Engraved LET, American Typewriter, Zapfino) and Windows. Added on 2026-10-28, after v0.1.1 showed many Unclassified Families on her Mac. In `src/shared/known-classifications.ts`.
   5. Words in the Family name: "Mono" or "Code" is Monospace, "Slab" or "Typewriter" is Slab Serif, "Sans", "Grotesk" or "Gothic" is Sans Serif, "Serif", "Roman" or "Mincho" is Serif, "Script", "Hand" or "Brush" is Script, "Display", "Stencil" or "Engraved" is Display. The full list is in `src/shared/classification.ts`.
   6. Nothing matched: Unclassified.
3. **Honest about which is which.** A guess is always labelled "guessed" where a single Family is shown (the Specimen header). In the filter, guessed and hand-set Families count the same; the filter is for finding, not for proof.

Specs: [OS/2 table](https://learn.microsoft.com/en-us/typography/opentype/spec/os2) (`sFamilyClass`, `panose`), [post table](https://learn.microsoft.com/en-us/typography/opentype/spec/post) (`isFixedPitch`), and the [IBM font class parameters](https://learn.microsoft.com/en-us/typography/opentype/spec/ibmfc). Unit-test the guess as a pure function in `src/shared` or `main/fonts`: it takes the parsed fields and returns a Classification.

**Anatomy.** A Base UI `Select` in the list header, after the view title: "Any Classification" by default, then the seven Classifications, each with its Family count in the current view ("Serif 84"). It narrows whatever the list shows (All, My Fonts, System, Favorites, a Collection) and combines with search. The header count reads "41 of 312 Families". Like search, it is per view and not saved across launches.

**Setting it by hand.** On a Family row's context menu and the Style menu: Set Classification, a submenu of radio items for the seven Classifications plus **Use Guess from Font File** (checked when nothing is hand-set). The same menu opens from the Classification button in the Specimen header. Changing it is optimistic, like Favorites: the UI updates, the save happens in the background, and a failed save undoes it with the usual toast. If the change moves the selected Family out of the current filter, it stays visible until the selection moves, as unstarring does in Favorites.

**States.** No Families match the chosen Classification: "No Script Families in My Fonts." with **Show All Classifications**. Failed entries have no Classification and never appear in the filter.

**Motion.** None. Choosing a Classification changes the list in one frame; the `Select` popup uses the shared popover transition.

## 7. Search

**Purpose.** Narrow the current view by name.

- `Mod+F` or `/` focuses it; the placeholder names the scope ("Search My Fonts", "Search Typography II").
- Filters as she types, case- and accent-insensitive substring match (NFC-normalize both sides). Family names on Family rows; Family and Style names on Style rows.
- Typing in search while the Specimen is open switches back to the list view.
- The header shows "8 of 312 Families". The first match becomes the selected row.
- Down or Enter moves focus to the list. Escape clears a non-empty field; Escape on an empty field returns focus to the list. A clear button (`aria-label` "Clear Search") appears when the field has text.
- Search text is per view and is not saved across launches.
- No results: "No Families match "futur"." with a **Clear Search** button.
- Motion: none.

## 8. Surfaces

### 8.1 Specimen

**Purpose.** Judge one Style properly.

**Anatomy.** Header row 1: Family name (UI 15px semibold, wraps to two lines, then ellipsis and `Tooltip`), the Family's Classification as a small text button ("Sans Serif", or "Sans Serif, guessed" in gray; it opens the Set Classification menu from [Classification filter](#classification-filter)), then icon buttons Favorite, Add to Collection, Paper and Ink, Inspector. Header row 2: Style picker, an "N Axes" text button for variable Styles (opens the inspector at Axes), size `Slider` with `NumberField` (8 to 300px, default 64). Below: the Sample text on paper and ink, `--specimen-padding` 48px, wrapping, line height and tracking from the inspector.

**Base UI.** `Select` (Style picker), `Slider` and `NumberField` (size), `Toggle` (Favorite, `aria-label` "Favorite", pressed when it is one; Paper and Ink, `aria-label` "Reverse Paper and Ink"; Inspector, `aria-label` "Show Inspector"), `Popover` (Add to Collection), `Tooltip` on every icon button showing its label and shortcut.

**Style picker.** Lists the Family's Styles in weight order, uprights before italics. A variable Style lists its Named instances indented under it; choosing one selects that Style and moves the Axis sliders. The trigger shows the Style name, plus the Named instance name when the Axes match one exactly, or "Custom" when they do not ("Variable, SemiBold"). Two Styles with the same name (F6 duplicates) get the Font folder appended ("Bold, System" and "Bold, My Fonts"). Styles that can't be previewed are listed with "(can't be previewed)" and stay selectable so she can see why.

**Sample text editing.** The text is a `<textarea>` in the Style, `field-sizing: content`, `resize: none`, `dir="auto"`, `aria-label` "Sample text, in Inter Regular". It edits the shared Sample text. Enter does not insert a line break (Sample text is one line; it wraps). Typing updates in the same frame.

**Paper and ink.** Default paper `#fff`, ink `#111`; reversed swaps them. Independent of the app theme, applies to Specimen, Quick preview and Pairing, remembered. Changes in one frame (Motion row "Theme change").

**Focus.** Opening the Specimen focuses the Specimen region (`role="region"`, `aria-label` "Specimen of Inter Regular", `tabIndex={-1}`), not the textarea, so single-key shortcuts work at once. Clicking the text starts editing. Escape in the textarea leaves it; Escape again goes Back.

| State | What she sees |
| --- | --- |
| Loading | Nothing for 150ms (avoids a flash), then "Loading Inter Bold..." in the UI font where the text will be. Never Sample text in a fallback font (R1). |
| Loaded | Sample text in the Style. Switching Styles is instant; a late load for an older Style is ignored (R7). |
| Can't be previewed (F3, E-2) | In place of the text: the Family and Style name in the UI font, "This Style can't be previewed. The Font file may be damaged, or use a format Book can't draw." and **Show in Finder**. About this Style still works. |
| Missing Glyphs (R1) | Empty boxes for characters the Style lacks. The text line that lists them ("2 characters aren't in this Style: e n") is the v0.3 Missing Glyph hint. |
| Missing Style | "This Style's Font file is no longer in your Font folders. It may have been moved or removed." **Remove from Collection** when opened from a Collection. |
| `.ttc` Style (F1) | Renders like any other: main sends the one face's bytes. If extraction fails, the "can't be previewed" state. |
| Variable Style (F8) | One Style; Axes in the inspector; Named instances in the picker. Default view uses the Style's default Axis values. |
| Huge Style (P3) | Same loading state, which may last a second. |
| Empty Sample text | The Style name ("Inter Regular") in the Style, gray ink at 40% opacity, as a placeholder. |

**Motion.** Type never animates (Motion row "Specimen size slider drag"). Favorite: Motion row "Favorite toggle" (pop on click only). Switching between list and Specimen views: instant (proposed addition to the motion table: a medium-frequency, keyboard-driven change).

### 8.2 Inspector

**Purpose.** Depth on demand: Text, Axes, About this Style. Closed by default; open state remembered.

**Anatomy.** A 272px panel on the right of the Specimen, `--gray-1` surface, hairline left border, own scroll. Sections are `Collapsible` with a chevron that rotates 90 degrees (Benji 7). Section height may animate (small sections only).

1. **Text**: Line height (`Slider` and `NumberField`, 0.8 to 2.0, step 0.01, default 1.10) and Tracking (-100 to 300 in thousandths of an em, default 0, applied as `letter-spacing` on the text element itself).
2. **Axes** (only when the Style has Axes; absent from the DOM otherwise): one row per Axis, labelled with a human name and tag ("Weight `wght`"; unregistered Axes use the name from the Font file, else the tag). `Slider` with the real min and max, a tick at the default, a `NumberField`. Driven only through `font-variation-settings` (R4). The `opsz` row has a `Switch` "Match Size", on by default: the slider is disabled and follows the font size; turning it off sets `font-optical-sizing: none` and lets her set it. A "Reset Axes" button in the section header.
3. **About this Style**: Designer, Foundry, Version, Copyright, License (clamped to 4 lines with **Show More**), License URL (selectable text; Book does not open links in v0.1), Embedding (from `fsType`, plain words such as "Preview and print"), Font file name, Font folder, "Another copy is in System" when F6 applies, and **Show in Finder**. Fields absent from the Font file are omitted, not shown empty. Text is selectable. Never conclude anything about licensing.

Every slider: arrow keys step 1, Shift+Arrow 10, double-click resets, readout in tabular figures, updates on every movement, saving debounced.

**Accessibility.** `<aside aria-label="Inspector">`; when closed it is `inert` and `aria-hidden` so focus can't reach it.

**Motion.** Motion row "Inspector show/hide", with the single-reflow rule in [Q3](#q3-inspector). Reduced motion: fade only.

### 8.3 Quick preview

**Purpose.** A larger look at the selected row without leaving the list.

```text
+------------------------------------------------------------+
| Inter, Regular                           1 of 18 Styles  < > |   UI 12px
|                                                            |
|   Sphinx of black quartz,                                  |   80px, in the Style,
|   judge my vow.                                            |   on paper and ink
|                                                            |
| Left and Right for Styles. Space to close.                 |   UI 11px, gray
+------------------------------------------------------------+
```

**Anatomy.** A panel centered over the list area, width `min(880px, 100% - 64px)`, height 60% (minimum 320px), `--radius-lg`, `--shadow-lg`, paper and ink, line height and tracking from the Specimen settings, text clipped with a bottom fade. No backdrop.

**Base UI.** None, on purpose: a `Dialog` would move and trap focus, but Up/Down and Space must keep working in the list. It is a plain `<section role="region" aria-label="Quick preview">` rendered only while it is open (no Motion; it is instant). Focus never leaves the list. A polite live region announces "Quick preview, Inter Regular" on open and on each change.

**Behavior.** Up/Down move the list selection and swap the content in the same frame; the frame does not move. Left/Right step through the Family's Styles (Family rows only). Enter closes it and opens the Specimen at the shown Style. Space, Escape, or the list losing focus (clicking search, the sidebar, the toolbar) close it. Clicking another row selects it and the preview follows. It reuses the row's already loaded `FontFace` when there is one.

**Favorite (v0.2).** F, Mod+D, or the star in its header favorite the Style it shows, without closing it; on a Family row that is the Style Left and Right stepped to. Add to Collection works the same way. With Quick preview closed, F on a Family row says "Press Space or open the Specimen to choose a Style."

**States.** Loading: Style name in the UI font, centered. Can't be previewed: the Specimen message (U2), Space and Escape still close. Missing Style: the Specimen message. Missing Glyphs: boxes. Large file: loads now, with the loading state.

**Motion.** None: it opens and closes instantly ([Q2](#q2-quick-preview-timing)).

### 8.4 Favorites

- Toggle with the Specimen's star, `F`, `Mod+D`, or a Style row's context menu. Optimistic: the UI changes first, `collections.json` saves in the background; on failure the change is undone and a toast explains.
- Favorites view: Style rows sorted by Family, then Style. Unstarring a row there leaves it in place with an empty star until she leaves the view, so a mistaken `F` is undone by pressing `F` again.
- Click star: Motion row "Favorite toggle" pop. Keyboard: instant fill.

### 8.5 Collections and Add to Collection

**Add to Collection popover** (`Popover`, from the Specimen's `[+]` button, from `Mod+Shift+A`, or from a Style row's context menu, anchored to that row):

```text
+-- Add Inter Bold to --------------- [x] -+
| [x] Typography II                        |
| [ ] Poster brief                         |
|------------------------------------------|
| [ New Collection name     ] [Create]     |
+------------------------------------------+
```

- `Popover` with `Popover.Title` "Add Inter Bold to" and `Popover.Close` (`aria-label` "Close"), a `CheckboxGroup` of `Checkbox` rows (scrolls past 280px), a `Field` with `Input` and a "Create" button. No footer Cancel.
- Checking or unchecking applies at once (optimistic). Create makes the Collection, checks it, and adds the Style.
- Focus: the first checkbox, or the name field when there are no Collections. Escape closes and returns focus to the trigger.
- Names: 1 to 80 characters, trimmed; a duplicate name (case-insensitive) shows "A Collection named "Poster" already exists."
- Motion: Motion row "Popover from trigger", `transform-origin: var(--transform-origin)`. Feedback: only the sidebar row tints (Motion row "Collection add feedback"); the popover itself does not animate on change (one focal point).

**New Collection** (`+` in the sidebar or `Mod+N`; shows the sidebar first if hidden): a `Popover` anchored to `+` with the name field and **Create Collection**. **Rename...** (context menu): the same popover anchored to the row, name preselected, **Rename**. **Delete...**: an `AlertDialog`, title "Delete "Typography II"?", body "Its 12 Styles stay in your Library. Only the Collection is removed.", buttons **Cancel** and **Delete Collection** (danger). Initial focus on Cancel.

**Collection view.** Style rows in the order added. `Mod+Backspace` removes the selected row from the Collection (optimistic, no confirmation: no file is touched). Missing Styles show as described in the list states.

**Persistence errors.** Couldn't save: toast, change undone. Corrupt `collections.json` at launch: a `Dialog` explains that it was set aside, offers **Show in Finder** and **OK**. Newer version (S4): read-only note, and every organize action is disabled with a `Tooltip` saying why.

### 8.6 Pairing (v0.2)

Built in v0.2 (2026-10-28). The third view: the sidebar's Pairing item under Favorites, or Go > Pairing (Mod+5).

**Purpose.** Job 3: a heading Style and a body Style on one page.

- Choosing Styles: the Specimen header gets a `Menu` button "Pair" with Use as Heading, Use as Body, Open Pairing. The Style arrives with the Axis values it has in the Specimen. A row's context menu and the Style menu also have Use as Heading and Use as Body (on a Family row, the Style Quick preview shows, else the Representative Style). No new picker UI to build. Feedback: the sidebar's Pairing row tints and fades (Motion row "Collection add feedback") and the live region says "Inter Bold is the Heading in the Pairing".
- Layout on paper and ink, measure about 60 characters: headline (heading Style, 48px, the shared Sample text), subhead (heading Style, half the headline size), paragraph (body Style, 16px, line height 1.5, a fixed passage the developer writes), caption (body Style, three quarters of the body size).
- Adjust each role in the inspector (the same toggle as the Specimen's): Size and Line height per role, plus a slider for each Axis except `opsz`, which follows each line's size. Sizes and line heights belong to the role; Axis values travel with the Style.
- Saved in `prefs.json` as `pairing` (Style references with saved names, so a Missing Style keeps its name).
- Opening a role's Specimen from the header makes Back return to the Pairing.
- Header: "Heading: Inter Bold" and "Body: Source Serif Regular", each a link-styled button that opens that Specimen, and a **Swap** button. Motion row "Pairing swap" for the labels; the type swaps instantly.
- Empty slot: "Open a Specimen and choose Use as Heading." Missing or unpreviewable Style: that role shows the Specimen's message in its place; the other role still renders.
- `font-synthesis: none` matters most here: a Regular-only heading must never be faked bold.

### 8.7 Menus

The application menu is built in main from the single shortcut list. Single keys (`Space`, `F`) are shown with `registerAccelerator: false`, so they appear in the menu but do not steal typing. On Windows the Book menu items move to File and Help.

| Menu | Items (shortcut) |
| --- | --- |
| Book | About Book; Hide Book (Mod+H); Hide Others; Quit Book (Mod+Q) |
| File | New Collection (Mod+N); Scan Again (Mod+R); Close Window (Mod+W). v0.2: Import... (Mod+O), Export PNG... (Mod+E) |
| Edit | Undo, Redo, Cut, Copy, Paste, Select All (roles); Find (Mod+F) |
| View | Show/Hide Sidebar (Mod+Alt+S); Show/Hide Inspector (Mod+Alt+I); Reverse Paper and Ink (Mod+Shift+P); Bigger (Mod+=), Smaller (Mod+-), Default Size (Mod+0) for the Specimen size; Reset Sample Text; Theme > System, Light, Dark (radio); Enter Full Screen (role) |
| Go | Back (Mod+[); All (Mod+1); My Fonts (Mod+2); System (Mod+3); Favorites (Mod+4) |
| Style | Open Specimen (Enter); Quick Preview (Space); Add to Favorites / Remove from Favorites (Mod+D); Add to Collection... (Mod+Shift+A); Remove from Collection (Mod+Backspace); Set Classification (submenu); Show in Finder |
| Window | Minimize (Mod+M); Zoom; Bring All to Front (roles) |
| Developer (dev builds only) | Toggle Developer Tools (F12); Reload |

Items that don't apply are disabled, not hidden (Favorite on a Family row, Inspector in list view). Main learns what applies from one small renderer-to-main message when the selection or view changes. The "Show in Finder" label comes from main ("Show in File Explorer" on Windows), so the renderer never checks the OS.

### 8.8 Settings in v0.1

No Settings window (v0.3, `Mod+,`). Theme lives in View > Theme (System by default; main sets `nativeTheme.themeSource`, the renderer sets `data-theme`). Remembered in `prefs.json`: window bounds, Library filter, Sample text, Specimen size, line height, tracking, paper and ink, inspector and sidebar visibility, Pairing Styles, the first-Collection flag, the first-launch hint flag.

### 8.9 First launch and About

1. The window appears painted in the system theme.
2. No cache: the first-Scan state. On her Mac this is the only time she waits.
3. The list shows All with the default Sample text, the first row selected, focus in the list. Under the header, one gray line: "Space for Quick preview. Enter to open." It disappears for good after she first uses either.
4. Nothing else: no tour, no dialog.

**About Book** (`Dialog`, centered, scale from centre): app name, version, the dedication and the date the first build was given, set in a Style she loves (falls back to the UI font if that Style isn't installed), and "Adobe Fonts stay in Creative Cloud, so they don't appear in Book."

## 9. Keyboard map

All shortcuts live in one list that the menu, the key handler, and tooltips read. "Not while typing" means the handler returns early when focus is in an input, textarea, or contenteditable, or during IME composition.

| Key | Context | Action | Notes |
| --- | --- | --- | --- |
| Up / Down | Library list | Move selection one row | Instant; also while Quick preview is open |
| Home / End | Library list | First / last row | |
| Page Up / Page Down | Library list | Move by one screen of rows | |
| Enter | Library list or Quick preview | Open the Specimen | At the shown Style |
| Space | Library list | Open or close Quick preview | Not while typing (U1); `preventDefault` so the list doesn't scroll |
| Left / Right | Quick preview open | Previous / next Style in the Family | Family rows only |
| Escape | Anywhere | Close the topmost overlay, else leave a text field, else Quick preview, else Back | One step per press |
| Mod+[ | Specimen or Pairing | Back to the list | Restores scroll and selection |
| Mod+F, / | Anywhere | Focus search | `/` not while typing |
| Down, Enter | Search field | Move focus to the list | |
| F | List (Style rows), Specimen | Toggle Favorite | Not while typing; disabled on Family rows |
| Mod+D | Specimen, Style rows | Toggle Favorite | Menu accelerator |
| Mod+Shift+A | Specimen, Style rows | Add to Collection popover | |
| Mod+Backspace | Collection view | Remove from Collection | |
| Mod+N | Anywhere | New Collection popover | |
| Mod+R | Anywhere | Scan Again | Requires the template fix in section 14 |
| Mod+Alt+S / Mod+Alt+I | Anywhere / Specimen | Sidebar / Inspector | Inspector fix in section 14 |
| Mod+Shift+P | Specimen, Quick preview, Pairing | Reverse Paper and Ink | |
| Mod+= / Mod+- / Mod+0 | Specimen | Size up 10%, down 10%, back to 64 | `Mod+-` fix in section 14 |
| Mod+1 ... Mod+4 | Anywhere | Library filters, Favorites | |
| Arrows, Shift+Arrows | Focused slider | Step 1 / 10 | Base UI default steps set to match |
| Shift+F10, Menu key | Library list | Context menu at the selected row | |
| Tab / Shift+Tab | Anywhere | Toolbar, sidebar, list or Specimen, inspector | The list is one tab stop |

## 10. State matrix

| Surface | Loading | Empty | Error | Can't be previewed | Missing Glyphs | Missing Style | Populated | Long text |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Window | Hidden until painted | n/a | Corrupt file dialog | n/a | n/a | n/a | Sidebar, toolbar, view | n/a |
| Sidebar | Items shown, counts blank | "Group Styles for a project." | Read-only note | n/a | n/a | Counts include Missing | Groups and counts | Ellipsis and tooltip |
| Library list | First Scan progress, or cached rows and "Scanning..." | Empty Library or empty view message | Unreadable Font folder notice | Row in UI font, "Can't be previewed" | Boxes | Dimmed row, "Missing" | Rows in their Styles | Fade on Sample text, ellipsis on names |
| Search | n/a | Placeholder names scope | n/a | Matches by name anyway | n/a | Matches saved names | "8 of 312 Families" | Field scrolls |
| Specimen | Name after 150ms | Style name placeholder | n/a | Message and Show in Finder | Boxes | Message and Remove | Sample text | Family name 2 lines; text wraps |
| Inspector | Sections render from metadata at once | No Axes section for static Styles | n/a | About still shown | n/a | About from saved names | Three sections | Values wrap; License clamps |
| Quick preview | Name centered | Name placeholder | n/a | Specimen message | Boxes | Specimen message | Large Sample text | Bottom fade |
| Add to Collection | n/a | Name field only | Duplicate name message | n/a | n/a | n/a | Checklist | Ellipsis and tooltip |
| Favorites / Collection view | Rows load like the list | Message and next step | Save-failed toast | As list | Boxes | Dimmed rows | Style rows | As list |
| Pairing | Each role per Specimen | Slot instructions | n/a | Role shows message | Boxes | Role shows message | Page layout | Wraps at measure |

## 11. Microcopy

Title Case for buttons and menu items; sentence case for messages. Book never says "font" alone.

| Where | String |
| --- | --- |
| First Scan | "Scanning Font folders..." / "1,240 Styles so far" |
| List header | "312 Families, 1,240 Styles" / "8 of 312 Families" / "12 Styles" / "Scanning..." |
| Empty Library | "No Styles found yet." / "Install Font files with Apple Font Book or put them in your Fonts folder, then choose Scan Again." / "Book looked in:" plus the Font folders / **Scan Again** |
| Unreadable Font folder | "Book couldn't read [folder]. Check its permissions in Finder, then choose Scan Again." |
| Couldn't Read row | "This Font file couldn't be read. It may be damaged." |
| Skipped formats | "Book skipped [n] Font files in formats it can't preview, such as .fon and Type 1." |
| Can't be previewed | "This Style can't be previewed. The Font file may be damaged, or use a format Book can't draw." / **Show in Finder** |
| Large file row | "Large file. Opens in the Specimen." |
| Loading | "Loading [Family] [Style]..." |
| Missing Style row | "Missing. The Font file was moved or removed." |
| Missing Style, Specimen | "This Style's Font file is no longer in your Font folders. It may have been moved or removed." / **Remove from Collection** / **Remove from Favorites** |
| No search results | "No Families match "[query]"." (Style rows: "No Styles match") / **Clear Search** |
| No Favorites | "No Favorites yet. Star a Style to keep it close." |
| Empty Collection | "Nothing in [name] yet. Open a Style and choose Add to Collection." |
| No Collections (sidebar) | "Group Styles for a project." |
| First-launch hint | "Space for Quick preview. Enter to open." |
| Quick preview footer | "Left and Right for Styles. Space to close." / "1 of 18 Styles" |
| Add to Collection | Title "Add [Family] [Style] to" / placeholder "New Collection name" / **Create** |
| New / Rename Collection | Placeholder "Collection name" / **Create Collection** / **Rename** |
| Duplicate name | "A Collection named "[name]" already exists." |
| Delete Collection | "Delete "[name]"?" / "Its [n] Styles stay in your Library. Only the Collection is removed." / **Cancel** / **Delete Collection** |
| Couldn't save (toast) | "Couldn't save your change, so it was undone. Try again in a moment." |
| Corrupt Collections file | "Your Collections file couldn't be read." / "Book set it aside as [file name] and started fresh. Your Font files are untouched." / **Show in Finder** / **OK** |
| Newer Collections file | "These Collections were saved by a newer Book. Update Book to make changes." |
| Disabled organize on Family row (tooltip) | "Open the Specimen to choose a Style." |
| Classification | "Any Classification" / "Serif" / "Sans Serif" / "Slab Serif" / "Monospace" / "Script" / "Display" / "Unclassified" / "[Classification], guessed" / **Set Classification** / **Use Guess from Font File** / "No [Classification] Families in [view]." / **Show All Classifications** |
| Inspector sections | "Text" / "Line height" / "Tracking" / "Axes" / "Match Size" / "Reset Axes" / "About this Style" / "Show More" |
| About fields | "Designer" / "Foundry" / "Version" / "Copyright" / "License" / "License URL" / "Embedding" / "Font file" / "Font folder" / "Another copy is in [Font folder]" |
| Embedding values | "Installable" / "Editable" / "Preview and print" / "Restricted" |
| Pairing | "Heading" / "Body" / **Swap** / **Use as Heading** / **Use as Body** / **Open Pairing** / "Open a Specimen and choose Use as Heading." |
| About Book | "Adobe Fonts stay in Creative Cloud, so they don't appear in Book." |
| Accessible labels | "Show Sidebar" / "Hide Sidebar" / "Back to [name]" / "Search" / "Clear Search" / "Sample text" / "Favorite" / "Add to Collection" / "Reverse Paper and Ink" / "Show Inspector" / "Size" / "New Collection" / "Close" |
| Live region | "Quick preview, [Family] [Style]" / "Added to Favorites" / "Removed from Favorites" / "Added to [Collection]" / "Scan finished, [n] Styles" |

## 12. Milestone mapping

| Milestone | Builds from this spec | Done when (UI part) |
| --- | --- | --- |
| 4. IPC: list Font files | Window shell: min size, hidden-inset title bar, `--titlebar-inset`, drag regions, ready-to-show background. Menu skeleton with roles, File > Scan Again, the dev-only F12 handler replacing `watchWindowShortcuts` (section 14). Plain list of Font file names; empty Library and unreadable Font folder states. | Mod+R rescans in a packaged build; an unreadable folder is named. |
| 5. Metadata and zod | Families and Style counts, representative Style rule, Classification guess per Family (stored in the cache), Couldn't Read view and skipped-format count, first-Scan and cached-rescan states, hidden dot-named Families. Rows are still plain text. | A broken Font file appears in Couldn't Read; counts match. |
| 6. Specimen | Tokens, Base UI, Motion, `MotionConfig`. Two-view switch and Back. Specimen header, Style picker (static Styles), size, paper and ink, Sample text textarea, notdef fallback, all Specimen states including `.ttc`. Inspector with Text and About this Style, and the Q3 resize rule. | Fast Style switching never shows the wrong Style; a missing character shows a box; an unrenderable file shows the message. |
| 7. Virtualized list | Row anatomy, `FontFace` registry with caps, delayed loading, large-file rule, toolbar Sample text, search, keyboard map for the list, Library filters in the sidebar, context menu, Quick preview, first-launch hint, Classification filter in the list header. | Holding Down for two seconds is smooth on her Mac; Space five times leaves the preview open. |
| 8. Collections and Favorites | Favorites and Collections in the sidebar, Style-row views, Add to Collection, New, Rename, Delete, Missing Styles, optimistic changes with toasts, corrupt and newer file handling, View > Theme, remembered state, About Book. Set Classification by hand, saved in `classifications.json`. | Everything survives a restart; a forced save failure undoes the change and says so. |
| 9. Designer features (part) | Axes section with `opsz` Match Size and Reset Axes, Named instances in the Style picker. | A variable Google Fonts file shows real weights, never a fake bold. |

### 8.10 Import (v0.2)

Built in v0.2 (2026-10-28).

- **Ways in.** Drop Font files or folders anywhere on the window; File > Import... (Mod+O) opens main's dialog (files and folders on macOS, Font files on Windows). Dropping onto a Collection in the sidebar Imports and adds the Styles there in one step.
- **What happens.** Main parses each Font file first and copies only those that parse into `<userData>/imported-fonts/`, walking dropped folders like a Font folder (licences and readmes are ignored). An identical file already Imported isn't copied again; a different file with the same name becomes "Name 2.otf". Then main Scans and returns the new Library.
- **Drop overlay.** While files are dragged over the window: a dashed accent edge and a card, "Drop to Import" / "Book keeps its own copy of each Font file. The originals stay where they are." Over a Collection row, the row gets an accent outline and the card says "Import into [name]". While copying: "Importing...". It fades (100ms out, 180ms in); nothing moves. It never takes the pointer, so the row under it stays the target.
- **After.** The Imported view opens with the first Imported Family selected (or the Collection, when dropped on one), and a toast sums up: "Imported 3 Font files. 1 file couldn't be read, so it was left out."
- **Imported** is a Library filter under System, newest Import first. Empty: "Nothing Imported yet." with how to Import.

### 8.11 PNG Export (v0.2)

Built in v0.2 (2026-10-28).

- **Ways in.** The Export PNG icon button at the end of the Specimen's and the Pairing's header row 1, and File > Export PNG... (Mod+E). In the list it says "Open a Specimen or the Pairing to Export a PNG."
- **What it saves.** The paper exactly as she sees it, in device pixels (2x on her Retina display), without the inspector, the caret, a text selection or the scrollbar. Text below the visible area is not included: scroll or shrink the size first.
- **Where.** Main captures first, then shows the save dialog (a sheet on macOS would otherwise appear in the picture), suggesting "Inter Bold.png" or "Inter Bold and Source Serif 4 Regular.png", starting on the Desktop, then where she saved last.
- **After.** A toast, rising from the bottom edge (Motion row "Toast after Export"): "Exported "Inter Bold.png", 2,400 by 1,320 pixels." A failed capture or write: "Book couldn't save the PNG. Try another folder."

### Room left for v0.2

Pairing, PNG Export and Import are v0.2; the rest of this list moved to v0.3 on 2026-10-28 (see [features: v0.2 scope](features.md#v02-scope)).

- **Pairing**: a third view, a sidebar item under Favorites, and Go > Pairing (Mod+5). The full spec is in [8.6](#86-pairing-v02).
- **OpenType features**: a fourth inspector section between Axes and About this Style, with a count in the header ("4 OpenType features").
- **Glyph grid**: a Base UI `Tabs` control (Specimen, Glyphs) in Specimen header row 2.
- **PNG Export**: an icon button at the end of Specimen header row 1 and File > Export PNG...; the success toast uses Motion row "Toast after Export".
- **Import**: a drop overlay over the whole window and File > Import...; dropping on a sidebar Collection adds there. An "Imported" Library filter.
- **Missing Glyph hint**: the one line under the Specimen text listing missing characters.
- **Settings window** (`Mod+,`): theme, default Sample text, reset.

## 13. Proposed additions

### Proposed CONTEXT.md additions

- **Library filter**: a sidebar item that narrows the Library list to Styles from certain Font folders: All, My Fonts, System (later Imported). Used instead of "source", which CONTEXT.md lists under _Avoid_ for Font folder.
- **My Fonts**: the Library filter for every Font folder except the operating system's own (macOS `/System/Library/Fonts`; Windows `C:\Windows\Fonts`).
- **Representative Style**: the Style a Family row shows and Quick preview opens first (rule in Q1).
- **Inspector**: the panel on the Specimen's right edge holding Text, Axes and About this Style.
- **About this Style**: the inspector section with the Font file's own credits and license text.
- **Paper and ink**: a Specimen's background and text colours, independent of the app theme.
- **Failed entry**: a Font file in a Font folder that could not be parsed; listed under Couldn't Read.
- **Missing Style**: a Style referenced by a Collection or Favorites whose Font file is gone.
- Add `.otc` to the Font file list.

### Proposed design-principles.md amendments

1. Adopt the eleven amendments in [design references section 3](design-references.md#3-conflicts-and-recommendations).
2. Section 8: replace the empty Library copy (it offers Import, which is v0.2) with the one in this spec; replace "**Remove from Library**" (Book cannot remove a Font folder file and keeps no hidden list) with **Show in Finder**.
3. Section 6: "Up/Down moves through rows (Families in the Library, Styles in Favorites and Collections)"; add Left/Right in Quick preview.
4. Section 3: Sample text is a single line that wraps; one Sample text is shared by rows, Specimen and Quick preview.
5. Section 8: "Missing Glyphs draw as boxes from a bundled notdef font; Book never lets another font stand in."
6. Section 6: single-key shortcuts appear in the menu with `registerAccelerator: false`.
7. Tokens table: add the layout tokens in section 3 of this spec; `--row-height` becomes 80px.
8. Motion table (design references): add "List and Specimen view switch: instant" and "Sidebar hide/show: instant".

## 14. Contradictions and risks found

1. **The template blocks Book's shortcuts in packaged builds.** `src/main/index.ts` calls `optimizer.watchWindowShortcuts`, which in production calls `preventDefault` on Mod+R, Cmd+Alt+I, Ctrl+Shift+I and Mod+Minus. In Electron, that also stops menu accelerators, so Scan Again, Show Inspector and Smaller would silently do nothing on her Mac while working in dev. Replace it in milestone 4 with a small dev-only F12 handler.
2. **Silent fallback is a v0.1 blocker (R1) but the Missing Glyph hint is v0.3 (features).** The notdef font resolves it for v0.1. It needs one experiment in milestone 6: bundle Adobe NotDef (SIL OFL 1.1, a cmap format 13 font that maps every code point to `.notdef`) as a local file, confirm Chromium's sanitizer accepts it, and confirm emoji in a Comic Sans Specimen now draw as boxes (E19). Inferred, not yet tested.
3. **Design principles section 8 copy** offers Import and "Remove from Library", neither of which v0.1 can do (amendment 2).
4. **"Library sources"** (the brief) collides with CONTEXT.md, which avoids "source"; this spec uses Library filter.
5. **"My Fonts"** comes from features.md and Apple Font Book but uses "Fonts" for a set of Styles, which CONTEXT.md avoids. Kept because she knows the label; listed for a decision.
6. **CONTEXT.md says Quick preview shows "the highlighted Style"**, but Library rows are Families. The representative Style rule closes the gap.
7. **edge-cases E-2's message names Chromium**; user-facing copy here says "a format Book can't draw".
8. **Mod+Alt shortcuts on Windows** are AltGr on some keyboard layouts (Polish, German) and can type characters instead. Harmless on her Mac; avoid adding more Mod+Alt shortcuts.
