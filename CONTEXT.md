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

**Activate** (future):
Making a Style available to other apps on the computer. Not built; the app never writes into system Font folders today.
_Avoid_: install, enable, import

### Fonts

**Font file**:
One file on disk: `.ttf`, `.otf`, `.ttc`, `.woff`, or `.woff2`. One Font file can hold several Styles (a `.ttc` collection file usually does).
_Avoid_: font (for the file), typeface, asset

**Family**:
Styles that share a family name, such as "Inter" or "Playfair Display". The Library groups Styles by Family.
_Avoid_: typeface, font (for the group), superfamily

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

### Previewing

**Specimen**:
A rendered preview of one Style with Sample text and controls (size, line height, Axes, OpenType features).
_Avoid_: preview (alone, as the product word), sample (for the whole view), demo

**Quick preview**:
A temporary, larger Specimen of the highlighted Style, opened with Space from the Library list without leaving it. Space or Escape closes it and the list selection is unchanged.
_Avoid_: quick look, peek, popup, lightbox

**Sample text**:
The words a Specimen or Pairing renders. The user can type their own.
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
- **"Font Book"** is also the name of Apple's built-in macOS app. Refer to this project as Book and keep the shipped product name distinct.
