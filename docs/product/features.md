# Features

What Book should do, in what order. This sets the product scope. The [roadmap](../roadmap.md) sets the learning order, and the [design principles](../design-principles.md) set how each feature should feel. Terms in **bold** or capitals (Style, Family, Specimen, and so on) are defined in [CONTEXT.md](../../CONTEXT.md).

Priorities: **v0.1** is the first build she uses every day. **v0.2** is the next release: Pairing, Import, PNG Export and small Specimen and list improvements. **v0.3** is the work that needs the Style's character set or OpenType feature list parsed first, plus the Glyph grid and Settings window. **Later** is worth doing someday. **Won't do** has a reason. Effort is for a learner working evenings: **S** about one evening, **M** a few evenings, **L** a week or more.

## Who it's for

A multimedia-arts and graphic-design student on an M5 MacBook Air. Her fonts come from Google Fonts downloads, foundry trial fonts, fonts handed out for class projects, and the fonts that ship with macOS. She also uses Adobe Fonts through Creative Cloud, which Book cannot see (see [Won't do](#wont-do)).

1. **"Find a display face for this poster in ten minutes."** Type the poster's headline once, scroll the whole Library with it, and narrow down by feel, not by Family name.
2. **"Keep each class project's type together."** One Collection per brief, so the Styles for a project are one click away weeks later, and so she can see which ones are trial or free fonts before she hands work in.
3. **"Decide if these two work together."** Put a heading Style next to a body Style with real-looking text, adjust weight and size, and show the result to a tutor or classmate.

## Competitive notes

| Tool | Best idea worth borrowing | Pitfall to avoid |
| --- | --- | --- |
| [Apple Font Book](https://support.apple.com/guide/font-book/view-fonts-fntbk1001/mac) | Sample text in the user's own script; an Info view with language support and the Font file's location; [Smart Collections](https://support.apple.com/guide/font-book/create-manage-font-collections-libraries-fb34860/mac) built from criteria. | Few ways to compare Styles side by side, little customization ([review](https://thesweetbits.com/best-font-manager-mac/)). No Axis or OpenType feature playground. |
| [Typeface](https://typefaceapp.com/) | Quick Collection: a scratchpad for candidates while browsing. Measured filters (weight, width, x-height ratio, figures, language) described in its [search help](https://typefaceapp.com/help/articles/search). Pairing Studio. | A huge feature surface (nested, invertible tags, query syntax) that a student will never learn. |
| [RightFont](https://rightfontapp.com/) | Space opens a detailed preview from the list. Saved filters. One unified search field. | Reviewers call it complex for beginners and note it lacks comparison tools ([review](https://thesweetbits.com/best-font-manager-mac/)). |
| [FontBase](https://fontba.se/) | Playground: H1, H2, and paragraph set in one Style, like a real page. Watched folders. [Super search](https://fontba.se/blog/super-search) measures weight, contrast, and x-height from the Glyph shapes instead of trusting metadata. | Core depth (tags, Glyph access, grid views) behind a subscription; mixed reports on speed and polish. |
| [Google Fonts](https://design.google/library/reimagining-google-fonts) | Type your own Sample text once and "apply to all" rows. Filters for classification, language, and variable ([summary](https://9to5google.com/2023/09/06/google-fonts-material-3-redesign/)). Scale and colour controls on the specimen. | Web-catalogue chrome; Book shows only what is on her disk and needs none of the discovery machinery. |
| [Adobe Fonts](https://blog.adobe.com/en/publish/2020/08/14/using-tags-to-find-the-perfect-font-for-the-job) | Classification plus a few coarse "properties" (weight, width, x-height, contrast) that combine with AND. | No filter for which Axes a variable Family has ([forum](https://community.adobe.com/questions-438/is-there-a-filter-in-search-for-what-axes-are-available-for-variable-fonts-738665)). Its files are hidden and renamed by Creative Cloud ([report](https://tug.org/pipermail/xetex/2020-August/027753.html)). |
| [Fontstand](https://fontstand.com/help) | Trial fonts are a real part of a student's life: free short trials, rentals, evaluation-only terms. | Book can't verify licenses. It should show what the Font file says, not pretend to know. |
| [FontDrop!](https://fontdrop.info/) | Drop one file and get everything: Glyph grid, info, waterfall, language support, features ([listing](https://alternativeto.net/software/fontdrop-/about)). Runs locally. | Language detection that users find incomplete ([forum](https://forum.glyphsapp.com/t/i-dislike-alphabet-types-charset-checker-and-fontdrops-and-underwares-font-validation-i-want-to-find-an-alternative-that-detects-all-languages-including-japanese-etc/24597/2)). Only one file at a time. |
| [Wakamai Fondue](https://wakamaifondue.com/) | OpenType features grouped by category with human names, each linked to a tester with that feature on ([2026 rewrite](https://pixelambacht.nl/2026/a-new-wakamai-fondue/)). | A report of every table overwhelms a non-engineer. Book shows the few that change her text. |
| [FontGoggles](https://fontgoggles.org/) | Several Styles stacked under the same text; feature toggles that cycle on, off, and default; Axis sliders covering the combined range. | A QA tool for type designers: glyph names, advances, and clusters are noise for her. |
| [Suitcase Fusion](https://creativepro.com/review-extensis-suitcase-fusion-3/) and [NexusFont](https://www.xiles.app/) | Sets per project; load only the fonts you are working with. | Nested sets reviewers call awkward; activation-centric workflows that Book does not do. |
| [Typewolf](https://www.typewolf.com/lookbooks) and [Fonts In Use](https://fontsinuse.com/about) | Pairings shown as complete systems with roles (headline, summary, byline, body). Fonts In Use indexes by format (poster, book, packaging, web). | Both are inspiration sites; Book should not try to be a catalogue of examples. |

## Feature list

### Library and Scan

| Feature | Description and why she needs it | Effort | Depends on | Priority |
| --- | --- | --- | --- | --- |
| Scan Font folders | Find Font files in the macOS and Windows Font folders. Everything else rests on it. | M | Milestone 4 | v0.1 |
| Parse Styles | Family, Style name, weight, italic, Axes, plus the extra fields listed under [Filters](#filters-and-facets), so later features need no new parsing. | M | Scan | v0.1 |
| `.ttc` Font files | Many macOS system Families (Avenir Next, Futura, Didot, Helvetica) are `.ttc`. Without them the Library looks broken to a designer. The renderer needs one Style's bytes out of the file (see the [architecture open question](../contributing/architecture.md#data-flow)). | M | Parse Styles | v0.1 |
| Failed entries | A damaged Font file shows as a readable error, not a crash. | S | Parse Styles | v0.1 |
| Library index cache | Second launch is instant. The cache is disposable, so adding fields later means bumping its version and rescanning. | S | Parse Styles | v0.1 |
| Scan Again | A menu item and `Mod+R` to rescan after she installs something. | S | Scan | v0.1 |
| Watch Font folders | Pick up new Font files without Scan Again. | M | Scan | later |
| Downloadable macOS system fonts | Fonts Apple downloads on demand live outside the Font folders. | M | Scan | later |

### Browsing, search, and filter

| Feature | Description and why she needs it | Effort | Depends on | Priority |
| --- | --- | --- | --- | --- |
| Virtualized Library list | Each row shows the Family rendered in its own Style. Smooth with 2,000+ Styles. | L | Specimen loading | v0.1 |
| Shared Sample text | Type once in the toolbar; every row renders it. This is job 1. | S | List | v0.1 |
| Search by Family name | `Mod+F` or `/`, filters as she types. | S | List | v0.1 |
| Keyboard navigation | Up/Down, Home/End, Enter opens the Specimen. | M | List | v0.1 |
| Names in their own script | A Style that can't draw its Latin Family name (Al Bayan, Geeza Pro) shows its name in its own script instead of empty boxes, with the script named on the row. Found on her Mac in v0.1.1. | S | Parse Styles | v0.2 |
| My fonts / System filter | Sidebar items that split her Font folder from `/System/Library/Fonts`. Hides about a hundred script Families she never uses. | S | Scan | v0.1 |
| Row size slider | Small rows to skim, large rows to judge. | S | List | v0.3 |
| Classification filter | Serif, Sans Serif, Slab Serif, Monospace, Script, Display, Unclassified. Guessed from the Font file, set by hand to correct it. Rules in [ui-spec](ui-spec.md#classification-filter). | M | Parse Styles, Collections storage | v0.1 |
| Variable, Has italics, Style count filters | Cheap, reliable facets. | S | Parse Styles | v0.2 |
| Language filter | "Has the characters for Tagalog / Polish / Vietnamese." | M | Character set | v0.3 |
| Recently imported | Newest Imports first. | S | Import | v0.2 |
| Filter by Sample text coverage | Hide Styles that lack a character in what she typed (Typeface does this). | M | Character set | v0.3 |
| Measured weight, width, x-height, contrast | FontBase and Adobe-style "properties". Needs outline measurement. | L | Parse Styles | later |
| Saved filters (Smart Collections) | A Collection defined by criteria. | M | Filters, Collections | later |

### Specimen

| Feature | Description and why she needs it | Effort | Depends on | Priority |
| --- | --- | --- | --- | --- |
| Editable Sample text | Click and type, in the Style being previewed. | M | Milestone 6 | v0.1 |
| Size, line height, tracking | Live sliders with typed numbers. | S | Specimen | v0.1 |
| Paper and ink swap | One click between dark-on-light and light-on-dark, independent of app theme. Posters are often reversed. | S | Specimen | v0.1 |
| Style picker | Move between a Family's Styles (and Named instances) without going back to the list. | S | Specimen | v0.1 |
| About this Style | Designer, foundry, version, copyright, license text and URL from the Font file, the file's location with Show in Finder. Answers "can I use this for my portfolio?" as far as the file can. | S | Parse Styles | v0.1 |
| Missing Glyph hint | Mark characters in the Sample text that fell back to another font. | M | Character set | v0.3 |
| Waterfall | The same line at several sizes, to judge text versus display use. | S | Specimen | v0.2 |
| Text presets | Headline, paragraph, A-Z and figures, a language sample. | S | Specimen | v0.2 |
| Compare Styles stacked | Two to four Styles under one Sample text (FontGoggles, Specimen for Mac). | M | Specimen | later |

### Quick preview

| Feature | Description and why she needs it | Effort | Depends on | Priority |
| --- | --- | --- | --- | --- |
| Space opens Quick preview | A larger Specimen over the list, Space or Escape closes it, selection unchanged. The fastest way to judge a row. | M | Specimen, list keyboard | v0.1 |
| Arrows inside Quick preview | Up/Down moves the highlight while it stays open, like Finder's Quick Look. | S | Quick preview | v0.1 |
| Favorite from Quick preview | Press the Favorite shortcut without closing it. | S | Favorites | v0.2 |

### Pairing

| Feature | Description and why she needs it | Effort | Depends on | Priority |
| --- | --- | --- | --- | --- |
| Heading plus body | Two Style pickers and a page-like layout: headline, subhead, paragraph, caption. This is job 3. | M | Specimen | v0.2 (first item) |
| Swap roles, adjust each | Swap heading and body; size, weight (Axis), and line height per role. | S | Pairing | v0.2 |
| Pair from the list | "Use as heading" or "Use as body" from a row's menu. | S | Pairing | v0.2 |
| Saved Pairings | Keep a Pairing inside a Collection for a project. | M | Collections | later |
| Pairing suggestions | Automatic "this goes with that". Pairing is taste; a wrong suggestion teaches a student the wrong thing. | L | | won't do |

### Glyph grid

| Feature | Description and why she needs it | Effort | Depends on | Priority |
| --- | --- | --- | --- | --- |
| Glyph grid | Every Glyph, virtualized; click for a large view with code point. Checking for an ampersand or a nice `g` is a real design question. | M | Virtualization | v0.3 |
| Copy a character | Copy the selected character to paste into Illustrator or Figma. | S | Glyph grid | v0.3 |
| Group by Unicode block | Letters, figures, punctuation, symbols, as in Wakamai Fondue's character map. | M | Glyph grid | later |
| Unencoded Glyphs and alternates | Show Glyphs reachable only through OpenType features. | L | OpenType features | later |

### Axes and OpenType features

| Feature | Description and why she needs it | Effort | Depends on | Priority |
| --- | --- | --- | --- | --- |
| Axis sliders | One per Axis with the real range and default. Many Google Fonts downloads are a single variable Font file; without this they look like one Style. | M | Specimen | v0.1 |
| Named instances | Presets that move the sliders, also listed in the Style picker. | S | Axis sliders | v0.1 |
| OpenType feature toggles | Tag plus human name, only features that exist, grouped (figures, ligatures, stylistic sets, case). | M | Parse Styles | v0.3 |
| Feature sample hints | If a toggle changes nothing in her text, offer text that shows it (for example `1/2` for fractions). | M | Toggles | v0.3 |
| Copy CSS | Copy `font-variation-settings` and `font-feature-settings` for web class projects. | S | Toggles | later |

### Collections and Favorites

| Feature | Description and why she needs it | Effort | Depends on | Priority |
| --- | --- | --- | --- | --- |
| Favorites | Star a Style; a Favorites item in the sidebar. | M | Milestone 8 | v0.1 |
| Collections | Create, rename, delete; Add to Collection popover. This is job 2. | M | Milestone 8 | v0.1 |
| Drag a Style onto a Collection | The natural Mac gesture. | M | Collections | v0.3 |
| Collection note | One line of text, such as "Typography II, due 12 May, trial fonts". | S | Collections | v0.2 |
| Tags | Collections already cover projects and moods. A second organizing system doubles the learning for her and the code for him. | L | | won't do |

### Import and Export

| Feature | Description and why she needs it | Effort | Depends on | Priority |
| --- | --- | --- | --- | --- |
| Import by drag and drop | Drop Font files or a folder (unzipped Google Fonts download, class pack) onto the window; Book copies them into its own folder. | M | Scan, safe writes | v0.2 |
| Import into a Collection | Dropping onto a Collection imports and adds in one step. | S | Import, Collections | v0.2 |
| PNG Export of a Specimen or Pairing | For mood boards, critiques, and messaging a tutor. | M | Specimen | v0.2 |
| PDF specimen sheet | A printable sheet for a Collection. | L | Export | later |
| Activate | Making Styles available in other apps. CONTEXT.md lists it as future; Book never writes into system Font folders. | L | | later |

### Settings

| Feature | Description and why she needs it | Effort | Depends on | Priority |
| --- | --- | --- | --- | --- |
| Remember state | Window size, last Sample text, last Specimen settings (in `prefs.json`). | S | Storage | v0.1 |
| Theme | System, light, or dark. | S | Tokens | v0.1 |
| Settings window | `Mod+,`; theme, default Sample text, reset to defaults. | S | Remember state | v0.3 |
| Extra Font folders | Watch a folder such as `~/Documents/Class Fonts` without copying. | M | Scan | later |

### Personal touches

See [Personal touches](#personal-touches-for-a-gift) for the ideas. They are all S effort and v0.1 unless noted, because they live in copy and in rare moments.

### Won't do

- **Adobe Fonts.** Creative Cloud stores activated Adobe Fonts in a hidden folder under renamed files and licenses them for use through Creative Cloud. Book can't read them reliably and shouldn't try. An honest line in the About window or the Help menu ("Adobe Fonts stay in Creative Cloud") prevents confusion.
- **Google Fonts or any online catalogue.** Book makes no network requests.
- **Font editing, validation reports, duplicate cleanup that deletes files.** Book never changes or deletes her Font files.
- **Automatic license checking.** The file's license text is shown as written; Book never says "safe for commercial use".

## v0.1 scope

The smallest Book she would choose over Apple Font Book: browse everything with her own words, judge a Style properly, and keep project Styles together. Depth over breadth: every feature below gets its empty, loading, and error states, keyboard access, and both themes.

| Milestone | What ships in v0.1 |
| --- | --- |
| 4. IPC: list Font files | Scan of macOS and Windows Font folders. |
| 5. Metadata and zod | Styles grouped by Family, `.ttc` parsing, failed entries, cache, the Classification guess, and the extra fields for later filters. |
| 6. Specimen | Editable Sample text, size, line height, tracking, paper and ink swap, Style picker, About this Style. `.ttc` Styles render. |
| 7. Virtualized list | Rows in their own Style, shared Sample text, search, keyboard, My fonts / System, Quick preview with arrows, Scan Again, Classification filter. |
| 8. Collections and Favorites | Favorites, Collections, Add to Collection popover, hand-set Classification, safe storage, remembered state, theme. |
| 9. Designer features (part) | Axis sliders with Named instances. |

**Not in v0.1:** Pairing (first in v0.2), Import, PNG Export, OpenType feature toggles, Glyph grid, every facet filter except Classification (variable, italics, language), missing Glyph hint, waterfall, drag onto Collections, Settings window, Copy CSS, comparison, Activate, watched folders, Smart Collections.

Why this cut: everything in v0.1 serves jobs 1 and 2 directly, and each piece is a roadmap milestone already. Import matters less at first because Styles she installs with Apple Font Book land in `~/Library/Fonts`, which Book scans. Axes jump the queue because variable Google Fonts files are common and look wrong without them.

## v0.2 scope

Decided on 2026-10-28, after v0.1.1 reached her Mac. v0.2 is the features she reaches for in a class project; v0.3 is the work that first needs the character set or OpenType features parsed.

| Area | What ships in v0.2 |
| --- | --- |
| Fixes from her Mac | Names in their own script for Styles without Latin letters; fewer Unclassified Families; quieter list selection. |
| Pairing | Heading plus body, swap, size and weight per role, Pair from the list. |
| Import | Drag and drop, File > Import..., Import into a Collection, the Imported Library filter, newest first. |
| PNG Export | A Specimen or Pairing as a PNG. |
| Small items | Waterfall, Text presets, Favorite from Quick preview, Collection note, Variable and Has italics filters. |

**v0.3:** Missing Glyph hint, Sample text coverage and Language filters (all need the character set), OpenType feature toggles and sample hints, Glyph grid and Copy a character, drag onto Collections, Settings window, row size slider.

## Filters and facets

Facets she will actually use, and how trustworthy each is when read from the Font file. Parse these fields in milestone 5 even before the filters exist; the cache is disposable, so this costs nothing later.

| Facet | Source in the Font file | Reliability |
| --- | --- | --- |
| Family grouping | `name` ID 16 (typographic family), falling back to ID 1 ([name table](https://learn.microsoft.com/en-us/typography/opentype/spec/name)). | High. Old fonts that only set ID 1 split into "Inter" and "Inter Light"; merge by ID 16 when present. |
| Variable | `fvar` table present; Axes and Named instances from it. | Exact. |
| Has italics | `fsSelection` italic bit, `head.macStyle`, an `ital` or `slnt` Axis, or an italic sibling Style in the Family. | High when combined. |
| Weight count | Count of Styles in the Family, or the `wght` Axis range for variable Styles. | High, but "count" and "range" need different labels. |
| Weight value | `OS/2.usWeightClass`. | Medium. Some foundries use non-standard numbers; fine for sorting, poor for exact matching. |
| Monospace | `post.isFixedPitch`, confirmed by equal advance widths of a few Glyphs. | High. |
| Serif, Sans, Slab, Script, Display | `OS/2.sFamilyClass` (IBM classes) and PANOSE ([OS/2 spec](https://learn.microsoft.com/en-us/typography/opentype/spec/os2)), then name keywords ("Sans", "Serif", "Mono", "Script", "Display"). | Low to medium. Many Font files leave both fields as zero or set them loosely; the spec describes `sFamilyClass` as a hint for choosing fallbacks, not a catalogue. Show "Unclassified" honestly and let her set a Family's classification by hand (stored in her data, not the file). |
| Language and script coverage | `cmap` character set checked against each language's required characters, using open data such as [Hyperglot](https://github.com/rosettatype/hyperglot) (Apache 2.0). | High for "has the characters". It does not prove marks and shaping work, which matters for Arabic or Devanagari. Do not use `OS/2.ulUnicodeRange`: its bits are set by the designer, coarse, and frozen at Unicode 5.1. |
| OpenType features | `GSUB` and `GPOS` feature tags. | Exact for "present"; a feature can exist yet do nothing for Latin text. |
| Recently imported | Book's own Import timestamp. | Exact. For Font folder Styles, file creation time is a medium-quality stand-in. |
| License | `name` IDs 13 (license description) and 14 (license URL); "Trial" or "Demo" in names; `OS/2.fsType` embedding bits. | Low as a verdict, useful as information. Show the text; never conclude. |
| Color font | `COLR`, `CPAL`, `sbix`, `SVG` tables. | Exact. |
| x-height, width, contrast | `OS/2.sxHeight` and `usWidthClass`; contrast has no field. | Medium for x-height and width (measure the `x` Glyph to confirm); contrast needs outline measurement as FontBase does. Later. |

For her, the order of usefulness is probably: My fonts / System, Favorites and Collections, classification, variable, has italics, language, recently imported. Classification is the most wanted and the least reliable, so it ships only with the manual override.

## Personal touches for a gift

The Delight-Impact Curve applies: frequent actions stay plain, rare moments can carry warmth. Nothing here should make the tool feel less serious in a critique.

- **Default Sample text** is the pangram "Sphinx of black quartz, judge my vow." (decided 2026-10-27). It is the most-seen line in the app, so it stays a working tool; the warmth goes into the corners below. She can replace it, and View > Reset Sample Text restores it.
- **About window** with a one-sentence dedication and the date the first build was given to her, set in a Style she loves.
- **Empty states** written in his voice but still useful: "No Favorites yet. Star a Style to keep it close."
- **First Collection** gets a single soft flourish the first time only (the Collection settles into the sidebar with a little more spring than usual).
- **Version names** from type history or from shared memories in the release notes, never in the UI chrome.
- **One quiet Easter egg**, at most: for example, typing her name as Sample text sets it at a beautiful default size. Optional; skip it if it feels forced.
- **App icon** designed with care, or designed by her later. A designer will notice a template icon first.

Avoid: confetti, hearts, sounds, pop-up messages, anything on every launch, anything a classmate looking over her shoulder would find embarrassing.

## Open questions for the developer

All answered on 2026-10-27; see [first build: decisions](first-build.md#decisions-made). Kept for the reasoning.

1. Library rows: one row per Family (showing its regular Style, with a Style count) or one row per Style? Per Family is calmer and matches how she thinks; Quick preview and Favorites then need a "which Style" rule.
2. `.ttc` in v0.1: extract one Style into standalone bytes in main, or show `.ttc` Styles as "preview not available yet"? Skipping them hides Futura, Avenir Next, and Didot, which matters to a designer.
3. Is Pairing in v0.1 or the first item of v0.2? It is the most "for her" feature but adds a second layout to build.
4. Should Import move into v0.1 so class and trial fonts never need installing system-wide?
5. CONTEXT.md has no terms yet for classification, waterfall, Smart Collection, or "About this Style". Add them before building those features.
6. Does she want a hand-set classification per Family, or would she rather not classify at all?
7. What should the default Sample text and the About dedication say? Only he can write those.
