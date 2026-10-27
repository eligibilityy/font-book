# First build: v0.1 plan

The plan for Book v0.1, the first version she uses every day. It ties together four research documents. Each one is the source of truth for its own area:

| Document | Answers |
| --- | --- |
| [features.md](features.md) | What Book does, and what waits for later |
| [design-references.md](design-references.md) | How it should feel: Raphael Salaja, Emil Kowalski, and Benji Taylor, plus the motion table |
| [ui-spec.md](ui-spec.md) | What every screen looks like, every state, the keyboard map, and the copy |
| [edge-cases.md](edge-cases.md) | What will break, measured where possible, and how to prevent it |

Their conclusions are already folded into [architecture](../contributing/architecture.md), [design principles](../design-principles.md), and [CONTEXT.md](../../CONTEXT.md). If those disagree with a research document, the research document is older; fix the one that is wrong.

AI tools write the code and explain it as they go (see [AGENTS.md](../../AGENTS.md)). This plan says what to build and in what order, not how.

## What v0.1 is

A calm, fast way to answer "which of my fonts is right for this?":

- Book finds every Style on her Mac and groups them into Families, `.ttc` files included.
- Every row shows one shared Sample text in that row's Style: a pangram by default, or her own words once she types them.
- A Classification filter (Serif, Sans Serif, Slab Serif, Monospace, Script, Display) narrows any list. Book guesses each Family's Classification from the Font file and she can correct it.
- Space opens a Quick preview without leaving the list. Enter opens the Specimen: size, line height, tracking, Paper and ink, Axes, and About this Style.
- She keeps what she likes in Favorites and Collections, one per project.
- Nothing ever lies: no faked bold, no other font silently standing in for missing characters, no wrong face from a `.ttc`.

Not in v0.1: Pairing (the first thing in v0.2), Import, PNG Export, OpenType feature toggles, Glyph grid, the other facet filters, Settings window, Activate. Their place in the layout is already reserved ([ui-spec, room left for v0.2](ui-spec.md#room-left-for-v02)).

## Decisions made

- Base UI for overlays and controls. Motion for animation, with `MotionConfig reducedMotion="user"`. No sound.
- Space opens a Quick preview. It is a plain panel that appears instantly, not a Base UI Dialog, so focus stays in the list and Up/Down keep working.
- Frequency decides motion. Keyboard and repeated actions are instant. Only occasional and rare moments animate ([motion table](design-references.md#2-motion-spec-for-books-key-interactions)).
- Two views in one window: the Library list or the Specimen. The sidebar and toolbar never change.
- Missing characters draw as boxes from a bundled notdef font (to be confirmed by one experiment in milestone 6).
- `.ttc` faces are extracted in main; fonts are registered under generated names; `font-synthesis: none`.

Settled on 2026-10-27:

| # | Question | Decision | Where |
| --- | --- | --- | --- |
| 1 | Library rows: one per Family or one per Style? | One per Family; Style rows in Favorites and Collections | [ui-spec Q1](ui-spec.md#q1-library-rows) |
| 2 | Quick preview: 100ms fade or instant? | Instant, both open and close | [ui-spec Q2](ui-spec.md#q2-quick-preview-timing) |
| 3 | Inspector: overlay or resize the Specimen? | Resize once (two reflows per toggle), never animate width | [ui-spec Q3](ui-spec.md#q3-inspector) |
| 4 | Default Sample text and empty-state tone | "Sphinx of black quartz, judge my vow."; warm empty states (tone B) | [ui-spec Q4](ui-spec.md#q4-default-sample-text-and-empty-state-tone) |
| 5 | Pairing in v0.1, or first in v0.2? | v0.2. Cores first | [ui-spec 8.6](ui-spec.md#86-pairing-v02) |
| 6 | Import in v0.1? | v0.2 | [features](features.md) |
| 7 | Keep the "My Fonts" label? | Keep | [CONTEXT.md](../../CONTEXT.md) |
| 8 | Classification: by hand, or skip? | In v0.1: guessed from the Font file, set by hand to correct it | [ui-spec: Classification filter](ui-spec.md#classification-filter) |

## Build order

Status, 2026-10-27: milestones 4 to 9 are built (v0.1). Every item below is in the code; what is left is checking it on her Mac (next section).

The roadmap's milestones, with what v0.1 adds to each. "Done when" is the UI part; the roadmap has the learning part.

| Milestone | Build | Edge cases to handle | Done when |
| --- | --- | --- | --- |
| 4. IPC: list Font files | Rewrite the preload (`window.fontBook`), then `sandbox: true`. Replace the template's `watchWindowShortcuts` with a dev-only F12 handler. Single-instance lock; a separate "Book Dev" `userData` in development; fix `setAppUserModelId` to `studio.yiliya.book`. Window shell: min size, hidden-inset title bar, menu skeleton, Scan Again. List Font file names; recurse into subfolders. | Unreadable Font folders are named, not fatal; skip Adobe's livetype folder and `/System/Library/AssetsV2` | Mod+R rescans in a packaged build; an unreadable folder is named in the UI |
| 5. Metadata and zod | Parse with fontkit (opentype.js can't read `.ttc`). Family from name ID 16, Style from 17. Per-Style `try`/`catch`; Couldn't Read view; skipped-format count; Style IDs from normalized relative paths; cached index with parser version. Classification guess per Family, as a pure function with tests. | fontkit throwing on `namedVariations`; hidden "." fonts; duplicate PostScript names | A broken Font file appears in Couldn't Read and the Scan finishes; Family counts look right |
| 6. Specimen | Tokens, Base UI, Motion. `.ttc` face extraction; generated `FontFace` names; `font-synthesis: none`; parse status vs render status; notdef fallback experiment. Specimen header, Style picker, size, Paper and ink, inspector (Text, About this Style). | Fast switching shows a stale Style; OTS rejects a file fontkit read; huge CJK fonts | Fast switching never shows the wrong Style; a missing character shows a box; an unrenderable file shows the message |
| 7. Virtualized list | 80px rows in their own Style; `FontFace` registry with caps (4 loading, 300 MB, skip files over 24 MB as row previews); shared Sample text; search; keyboard map; context menu; Quick preview (instant); Classification filter. | Memory from loaded faces; holding Down; Space while typing | Holding Down for two seconds stays smooth on her Mac; Space five times leaves the preview open |
| 8. Collections and Favorites | Favorites, Collections, Add to Collection popover, Missing Styles, optimistic changes with undo-on-failure, theme, remembered window and Specimen state. Set Classification by hand, saved in `classifications.json`. Write queue with retry on `EPERM`, `.bak` copy, newer-version read-only mode. | Corrupt or newer `collections.json` or `classifications.json`; a Collection whose Font files moved; two Families with the same name in different Font folders | Everything survives a restart; a forced save failure undoes the change and says so |
| 9. Designer features (part) | Axis sliders with Named instances and Reset Axes; `font-variation-settings` only; `font-optical-sizing: none` when Axes are user-controlled. | Variable fonts faking bold; `opsz` drifting with size | A variable Google Fonts file shows real weights, never a fake bold |

Ship a build to her Mac at the end of every milestone from 5 on. Each one is a tag (`bun pm version patch`) and the release workflow does the rest.

## Check on her Mac

These were inferred, because they can't be tested on Windows. Check each one on the first build that reaches the relevant milestone ([edge cases, macOS](edge-cases.md)):

- Hidden system fonts (".SF NS") are skipped, and `/System/Library/Fonts/Supplemental` is scanned (milestone 5).
- Classification guesses for Apple's own Families look right (Times, Helvetica, Courier, Zapfino, Didot), and count how many land in Unclassified. If it is most of them, the guess order needs work (milestone 5).
- Adobe Fonts don't appear, and the About copy explains why (milestone 4).
- No privacy prompt appears for the system Font folders. One appears, with Book's text, only for Documents, Downloads, or Desktop (milestone 4, later Import).
- Running from Downloads (App Translocation) still works, or the first-launch copy tells her to move Book to Applications (milestone 3).
- Apple Color Emoji and large CJK Styles don't stall the list (milestone 7).
- File names with accents match after a restart, so Collections don't lose Styles (milestone 8).

## Review

Use the [review checklist](design-references.md#4-review-checklist-for-ui-pull-requests) and the [checklist for every UI change](../design-principles.md#checklist-for-every-ui-change) on each pull request. Ask an AI tool in this repo to review against them; it will explain and point to rules rather than rewrite your code.
