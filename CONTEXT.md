# Book

A local-first font manager and specimen app. It runs on your computer, reads the fonts you already have, and never needs the network. There is no Book cloud.

Use these words in the UI, in code identifiers, in commits, and when talking about the app. The _Avoid_ lists name synonyms that make the code harder to search and the UI harder to learn.

## Language

### Library

**Library**:
Every Style the app knows about, from Font folders and from Imports. One Library per user; it is an index over files on disk, not a copy of them.
_Avoid_: catalog, database, collection (for the whole set), fonts (for the whole set)

**Font folder**:
A folder the app scans for Font files: the operating system's font folders (macOS: `~/Library/Fonts`, `/Library/Fonts`, `/System/Library/Fonts`; Windows: `C:\Windows\Fonts`, `%LOCALAPPDATA%\Microsoft\Windows\Fonts`) and the app's own imported-fonts folder.
_Avoid_: source, directory (in UI copy), location

**Scan**:
Walking the Font folders, finding Font files, and reading their metadata into the Library index.
_Avoid_: sync, crawl, refresh (as the product word), load

**Import**:
Adding Font files that are not in a Font folder (dragged in or chosen in a file dialog). The app copies them into its own imported-fonts folder so they stay available if the original moves.
_Avoid_: add, upload, install, activate

**Library filter**:
A sidebar item that narrows the Library list by where Styles come from: All, My Fonts (every Font folder except the operating system's own, Imported included), System, and Imported (newest Import first).
_Avoid_: source, location, tab

**Failed entry**:
A Font file in a Font folder that could not be parsed. Failed entries are listed under "Couldn't Read"; they never stop a Scan.
_Avoid_: error, broken font, invalid font

**Install**:
Copying an Imported Style's Font file into the user's own Fonts folder (macOS: `~/Library/Fonts`) so other apps, such as Illustrator, can use it. The Imported Font file stays in Book. Book records each copy it makes; **Uninstall** removes only those copies, and only while they are unchanged. macOS only: on Windows a Font file must also be registered with the system.
_Avoid_: activate, enable, add

**Activate** (not planned):
Making a Style available to other apps without copying it, as pro font managers do. Install covers what Book needs.
_Avoid_: install, enable, import

### Fonts

**Font file**:
One file on disk: `.ttf`, `.otf`, `.ttc`, `.otc`, `.woff`, or `.woff2`. One Font file can hold several Styles (a `.ttc` or `.otc` collection file usually does).
_Avoid_: font (for the file), typeface, asset

**Family**:
Styles that share a family name, such as "Inter" or "Playfair Display". The Library groups Styles by Family.
_Avoid_: typeface, font (for the group), superfamily

**Representative Style**:
The Style a Family row shows and Quick preview opens first: the upright Style closest to weight 400, preferring one named "Regular".
_Avoid_: default font, main style, primary

**Classification**:
The broad kind of letterform a Family has: Serif, Sans Serif, Slab Serif, Monospace, Script, Display, or Unclassified. One per Family. Book guesses it from the Font file; a Classification she sets by hand always wins.
_Avoid_: category, genre, tag, type (for this), style (for this)

**Style**:
One face within a Family, such as "Bold Italic". The unit you preview, favorite, and put in a Collection. A Style is identified by its Font file and its index inside that file.
_Avoid_: font, face, weight (as a noun), variant, cut

**Axis**:
A variable-font design axis, such as `wght` (weight), `wdth` (width), `opsz` (optical size), or `slnt` (slant), with a minimum, default, and maximum.
_Avoid_: slider (for the axis itself), dimension, parameter

**Named instance**:
A preset combination of Axis values that a variable Style's designer named, such as "SemiBold". It is a setting of one Style, not a separate Style.
_Avoid_: style (for an instance), weight, preset

**OpenType feature**:
A switchable typographic behavior inside a Style, identified by a four-letter tag: `liga` (ligatures), `smcp` (small caps), `ss01` (stylistic set 1), `tnum` (tabular figures).
_Avoid_: option, setting, effect, font feature (in UI copy)

**Glyph**:
One drawn shape in a Style. A character can map to several Glyphs (alternates), and some Glyphs have no character (ligatures).
_Avoid_: character, letter, symbol (for the drawn shape)

### Organizing

**Collection**:
A user-named set of Styles, such as one per school project. A Style can be in many Collections.
_Avoid_: folder, list, board, group, set, playlist

**Favorite**:
A Style the user has starred. Favorites are one flag per Style, not a Collection.
_Avoid_: like, star (as a noun in code), bookmark, pin

**Missing Style**:
A Style in a Collection or Favorites whose Font file is gone (moved, renamed, or deleted). It stays listed by its saved names until she re-links or removes it.
_Avoid_: broken, dead, orphan (in UI copy)

### Previewing

**Specimen**:
A rendered preview of one Style with Sample text and controls (size, line height, Axes, OpenType features).
_Avoid_: preview (alone, as the product word), sample (for the whole view), demo

**Quick preview**:
A temporary, larger Specimen of the highlighted row's Style (the Representative Style on a Family row), opened with Space from the Library list without leaving it. Space or Escape closes it and the list selection is unchanged.
_Avoid_: quick look, peek, popup, lightbox

**Paper and ink**:
A Specimen's background and text colours. They are independent of the app's light or dark theme.
_Avoid_: theme (for these), background, canvas colour

**Inspector**:
The panel on the Specimen's right edge with the Text, Axes, and About this Style sections.
_Avoid_: sidebar (that is the left panel), drawer, details pane

**About this Style**:
The inspector section that shows the Font file's own credits: designer, foundry, version, copyright, and license text. Book shows the license as written and never judges it.
_Avoid_: info, metadata (in UI copy), license check

**Sample text**:
The words a Specimen or Pairing renders. The user can type their own. One Sample text is shared by the Specimen and Quick preview. Library rows show the Family name instead.
_Avoid_: pangram (unless it is one), placeholder, lorem

**Pairing**:
A heading Style and a body Style shown together to judge how they work as a combination.
_Avoid_: combo, match, board, mood board

**Export**:
Saving a Specimen or Pairing as a PNG image to a location the user picks.
_Avoid_: download, save (for this), screenshot, render

## Relationships

- A **Library** contains many **Families**; a **Family** contains one or more **Styles**.
- A **Font file** contains one or more **Styles**; a **Style** belongs to exactly one **Font file**.
- A **Style** may have **Axes**, **Named instances**, **OpenType features**, and always has **Glyphs**.
- A **Collection** references **Styles**; deleting a Collection never deletes a Font file.
- A **Specimen** shows one **Style**; a **Pairing** shows two.

## Flagged ambiguities

- **"font"** in casual speech can mean a Style ("use that font"), a Family ("I love that font"), or a Font file ("send me the font"). In code and UI copy, always pick the precise term. `font` alone is not an identifier.
- **`FontFace`** is the browser's font-loading object in the renderer. It loads one Style for rendering. It is not a domain term; do not name domain types `Face` or `FontFace`.
- **"weight"** is a number (400, 700) or an Axis value, never a Style. "Bold" is a Style name; `wght: 700` is an Axis value.
- **Variable fonts**: one Font file may contain one Style with Axes that cover what a static family ships as many Styles. Named instances are not Styles.
- **"collection"** also names a `.ttc` file ("TrueType Collection"). In this project, call that a Font file. "Collection" always means the user-named set.
- **"My Fonts"** (a Library filter) uses "Fonts" for a set of Styles, which this glossary otherwise avoids. Kept because she knows the label from Apple Font Book (decided 2026-10-27). Rename it here first if that ever changes.
- **"Font Book"** is also the name of Apple's built-in macOS app. Refer to this project as Book and keep the shipped product name distinct.
