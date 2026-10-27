# Design principles

Book is a tool for a designer. She will judge it the way she judges type: by spacing,
rhythm, restraint, and whether it gets out of the way. These principles describe how the app
should feel and give reviewers (human or AI) something concrete to check against.

**Inspiration and credit.** These ideas are adapted from [Pond](https://github.com/raphaelsalaja/pond)'s
design principles, which in turn borrow from Benji Taylor's
[Family Values](https://benji.org/family-values): **simplicity**, **fluidity**, and **delight**.
We've rewritten them for a type tool and cut them down to what one person learning the stack
can build well.

This is shared vocabulary, not a rulebook to follow blindly. When in doubt, optimise for the
feeling: *calm, precise, and quietly delightful*.

Words in **bold capitals** (Library, Style, Specimen, and so on) are defined in
[CONTEXT.md](../CONTEXT.md). Use them in UI copy too.

---

## 1. The type is the hero; the chrome recedes

Every screen exists to show type. The interface around it should be neutral, quiet, and small.

- **Chrome is grayscale.** Use one neutral gray scale for surfaces, borders, and UI text, and
  one accent colour for selection and focus only. Colour on screen should come from what the
  user chose (Specimen colours), not from decoration.
- **The UI font never changes.** Labels, buttons, and numbers always use the app's UI font,
  even inside a Specimen. Only Sample text renders in the Style being previewed. (Pond had
  a bug where size labels quietly inherited the previewed font because a CSS variable was
  misspelled. Keep the UI font in one token and use it on purpose.)
- **Specimens get the space.** The Specimen area takes most of the window and has generous
  padding. Controls sit in a slim toolbar or an inspector panel at the edge, never on top of
  the type.
- **The Specimen canvas has its own paper and ink.** A Specimen's background and text
  colours are separate from the app's light/dark theme. A designer may want black text on
  white paper while the app is in dark mode. Give the canvas a one-click paper/ink swap.
- **Desktop density.** Small UI text (12-13px), compact 28px controls, hairline borders.
  Large type belongs to Specimens, not to the chrome.
- **Honest type.** Sample text uses `font-synthesis: none`, so Book never shows a faked bold
  or italic, and leaves `font-optical-sizing` on auto unless she sets the `opsz` Axis. A
  character the Style lacks draws as an empty box from a bundled notdef font; Book never lets
  another font stand in. See [architecture](contributing/architecture.md#rendering-a-style).

## 2. Gradual revelation: show the basics, reveal the depth

Show the fundamentals first and reveal everything else when it becomes relevant. Pond's
image for this: you glimpse a room through a doorway, and it resolves into detail as you
walk in.

- **First look:** a Specimen shows Sample text, size, and the Style name. That's enough to
  answer "do I like this?"
- **One step deeper:** tracking, leading, and colour live in a compact toolbar row or an
  inspector section.
- **Expert depth:** Axes and OpenType features appear in their own inspector sections,
  *only when the Style has them*. A static Style shows no Axes section at all, not an empty
  one. Show a count ("4 OpenType features") so their presence is discoverable.
- **Overlays, not page changes, for quick jobs.** Adding a Style to a Collection, renaming
  a Collection, or picking a colour opens a popover (a small floating panel) anchored to the
  button that triggered it. The user never loses their place in the Library or the
  Specimen. Use a dialog only for decisions that need full attention (deleting a Collection).
  Each overlay does one job. A header close button is enough, with no extra footer Cancel.
- **Build overlays and controls on [Base UI](https://base-ui.com/)** (`@base-ui/react`):
  Popover, Dialog, Menu, Slider, Switch, Toggle. It handles focus trapping, Escape, focus
  return, and ARIA roles, so you style the parts instead of rebuilding that behavior. Pond
  does the same.

## 3. Direct manipulation: the type responds immediately

Designers learn a typeface by playing with it. Every control should feel connected to the
glyphs.

- **Names in the list, Sample text in the previews.** Library rows show each Family's name
  set in its own Style: a column of names is quickest to scan. One Sample text (a single
  line that wraps) is shared by the toolbar field, Quick preview and the Specimen; editing it
  in any of them edits it everywhere.
- **The interface font is Inter**, bundled (SIL OFL) and registered as "Book UI", so the
  chrome looks the same on every computer and never borrows a font she is judging.
- **Sliders update live.** Size, tracking, leading, and Axis sliders update the Specimen on
  every movement, not on release. If anything needs slowing down, delay *saving* the
  preference, never the visual update.
- **Every slider shows its number,** in tabular figures so it doesn't jitter, and the
  number is editable by typing. Arrow keys step by 1, Shift+Arrow by 10. Double-clicking a
  slider resets it to its default.
- **Axis sliders use the Style's real range** (min, default, max) and mark the default.
  Named instances appear as quick presets that move the slider.
- **OpenType feature toggles show what they do.** Label each with its tag and a
  human name ("`ss01` Stylistic Set 1"). When she toggles one, the affected Glyphs should
  visibly change in the Sample text. If a feature changes nothing in the current text,
  hint at a sample that would show it.

## 4. Continuous transitions: fly, don't teleport

Treat the app as one continuous space. Motion should explain what changed and where things
went, never decorate.

- **New UI eases into place.** Popovers grow from their trigger: start at scale 0.97 or
  higher (never 0) from Base UI's `var(--transform-origin)`. Centred dialogs scale from the
  centre. The inspector slides in from the side it lives on. Height may animate only for
  small inspector sections; never animate layout properties (width, height, padding) inside
  the Library list or the Glyph grid. Animate `transform` and `opacity`.
- **Frequent actions are instant.** Actions repeated many times in a row (list navigation,
  slider steps, keyboard shortcuts, switching between the list and the Specimen, hiding the
  sidebar) and context menus appear instantly. A context menu may fade out. Frequency
  decides how much something animates (Emil Kowalski; see
  [design references](product/design-references.md)).
- **Direction follows the layout.** Things on the right enter from the right. A Style
  added to a Collection gets one focal response: its sidebar Collection row pulses with a
  280ms accent tint that fades out. No flying copies of the row.
- **Don't animate the type while it's being adjusted.** Slider changes and typing are
  instant. Easing a font-size change makes the tool feel laggy. Swapping the Style in a
  Specimen is also instant: it's content updating in place, not a new object arriving.
- **Motion never blocks.** Clicks and keys work immediately, even mid-animation.
- **Keep it short.** Most transitions run 150-250ms. Use the motion tokens below, not
  one-off numbers. Watch it at normal speed and check the in-between frames before calling it done.
- **Exits are quicker, never ease-in.** An exit retraces its entrance's path but is never
  longer than it. Use ease-out to enter and to exit; ease-in-out only for something moving
  from one place on screen to another; never ease-in. Nothing a user starts runs longer than
  280ms.
- **Interruptible by construction.** Base UI overlays use CSS transitions on their
  open/closed style attributes; the inspector uses Motion. Quick preview is instant and needs neither. Never use
  `@keyframes` or `transition: all` for UI that can be toggled. Key `AnimatePresence`
  children by the overlay's open state, not by the Style, or every arrow press replays the
  entrance.
- **The full motion table** for each interaction lives in
  [design references](product/design-references.md#2-motion-spec-for-books-key-interactions).
- **Tools.** Use the [Motion](https://motion.dev/) library (`motion`, imported from
  `motion/react`) for enter and exit, layout, and height animations, the things CSS can't
  do on its own. Plain CSS transitions are fine for hover and press states. Keep Motion's
  durations and easings in one module that mirrors the CSS motion tokens, so both use the
  same values.

## 5. Delight with restraint

Delight works through surprise, and surprise wears off with repetition. Pond calls this the
**Delight-Impact Curve**: *the less often something happens, the more delight it can carry.*

- **Frequent actions** (scrolling the Library, selecting a Style, typing, moving sliders)
  get restrained polish only: crisp hover states, a tiny press effect, nothing that slows
  her down.
- **Occasional actions** (adding a Favorite, creating a Collection) can have a small,
  satisfying response: a Favorite star that pops once when favorited by click. The keyboard
  shortcut and un-favoriting are instant.
- **Rare, meaningful moments** (first Import, first Collection, first PNG Export) can carry
  a memorable flourish, shown once.
- **No sound for now.** Book has no interface sounds. If that changes, keep them off by
  default, limit them to one or two soft cues, and put them behind their own setting,
  separate from reduced motion.
- **Personal touches belong in the corners:** the empty-state copy and the About window.
  That's where a gift can show it was made for her. The default Sample text stays a plain
  pangram ("Sphinx of black quartz, judge my vow.") because it is the most-seen line in the
  app and has to work in a critique.

## 6. Keyboard-first for power use, friendly for the mouse

She'll use a trackpad most of the time, but browsing hundreds of Families is much faster
from the keyboard.

- **The Library list is keyboard navigable.** Up/Down moves through rows (Families in the
  Library, Styles in Favorites and Collections), Enter opens the Specimen, Space opens a Quick
  preview of the highlighted row (Space or Escape closes it and leaves the selection where it
  was), Left/Right step through a Family's Styles while Quick preview is open, and Home/End
  jump. The full map is in the [UI spec](product/ui-spec.md#9-keyboard-map).
- **Search is one keystroke away:** `Mod+F` or `/` focuses search. `Mod` means Cmd on
  macOS and Ctrl on Windows. Always write shortcuts with `Mod` so they work on both.
- **Single-key shortcuts never fire while she's typing.** Sample text is a text field, so
  pressing "F" in it must type an F, not toggle a Favorite. Check whether focus is in an
  editable element before running any shortcut. Single-key shortcuts (Space, F) still appear
  in the menu, with `registerAccelerator: false`, so the menu shows them without them
  stealing keystrokes.
- **One list of shortcuts.** Define every shortcut once, with a label. The app menu, the
  in-app key handling, and any shortcut help screen all read from that list.
- **Real menus.** Put important actions in the macOS menu bar with their shortcuts shown.
  That is how Mac users discover shortcuts.
- **Escape closes the topmost overlay** and returns focus to the button that opened it.

## 7. Respect the person's settings

- **Light and dark.** Follow the system appearance by default, with a manual override.
  Both themes must be designed, not just inverted. In dark mode, shadows get darker and
  borders carry more of the separation.
- **Reduced motion.** When the system asks for reduced motion, nothing moves, scales, or
  slides. Opacity and colour fades of up to 180ms may stay, so changes are still noticeable.
  No information may depend on seeing an animation. Implement this in **one place** and
  reuse it: the CSS rule in the tokens file (which stops animating transforms, matching Motion), plus
  one `<MotionConfig reducedMotion="user">` around the app. That setting already keeps
  opacity and colour and drops transforms, so CSS and Motion behave the same.
- **Focus is always visible for keyboard users.** Show a clear focus ring when navigating
  by keyboard, and avoid stray rings after mouse clicks.
- **Everything has a name.** Icon-only buttons, sliders, and toggles need an accessible
  label ("Tracking", "Add to Favorites"). Screen readers and tooltips both use it.

## 8. Every state is designed: empty, loading, error, full

A screen isn't finished until all of its states are.

- **Empty states teach.** Each one explains what belongs there and offers one next step:
  - Empty Library: "No Styles found yet." Name the Font folders Book looked in and offer
    **Scan Again**. (Import arrives in v0.2.)
  - Empty Collection: "Add Styles from the Library with **Add to Collection**."
  - No Favorites: "Star a Style to keep it close."
  - No search results: say what was searched for and offer **Clear Search**.
- **Loading shows structure.** While a Scan runs, show progress in words ("Scanning Font
  folders, 1,240 Styles so far"). While a Style's font loads, show its name in the UI font
  in the same space it will occupy, so nothing shifts when it arrives.
- **Errors are human and specific.** Say what happened and what to do: "This Font file
  couldn't be read. It may be damaged." with **Show in Finder**. (Book never deletes or
  hides files in Font folders.) Never show a raw error code or an engine name such as
  "Chromium" as the main message.
- **Handle edge cases on purpose.** Plan for very long Family names, Styles missing Glyphs
  for the Sample text (they draw as boxes), Font files that parse but can't be previewed, a
  Library of 2,000+ Styles, Missing Styles in a Collection, and a Collection with one Style.
  The [edge cases](product/edge-cases.md) doc lists them with severity.
- **Show changes first, confirm later.** Favoriting or adding to a Collection updates the UI
  at once and saves in the background. If saving fails, put it back and say so.

## 9. Fast is a feature

Perceived speed is part of the design. A designer scrolling a Library should never wait.

- **Virtualize long lists** (the Library and the Glyph grid). Render only the rows on screen.
- **Load fonts lazily.** Load a Style's font only when its row scrolls into view, and
  release it when it scrolls far away. Keep rows a fixed height so loading never shifts the
  layout.
- **No flash at launch.** The window appears only when it's ready, already painted in the
  right theme.

## 10. Feel at home on the Mac

- A hidden-inset title bar with the traffic lights sitting in the toolbar, plus drag regions
  so the window moves when she drags empty toolbar space.
- The default arrow cursor on buttons, as in native Mac apps. Pointer cursors are for links.
- Remember the window size and position, the last Specimen settings, and the last Sample
  text.
- Use system conventions: `Mod+,` for Settings, `Mod+W` to close, standard Edit menu roles
  so copy and paste work in text fields.
- Keep OS checks in the main process. The renderer reads layout values such as the
  title-bar inset from CSS variables and never checks which OS it is on.

---

## Tokens to define

Tokens are named design values (CSS custom properties) that every component uses instead of
raw numbers. Define them once under `src/renderer/src/shared/` (see
[architecture](contributing/architecture.md)), with light values on `:root` and dark
overrides under `[data-theme="dark"]` (plus `prefers-color-scheme` when the theme is "system").
Start small. Add a token when a second component needs the same value.

| Category | Suggested tokens | Starting point |
| --- | --- | --- |
| Gray scale | `--gray-1` ... `--gray-12` | 1-2 backgrounds, 3-5 hover/active fills, 6-8 borders, 9-10 secondary text and icons, 11-12 primary text. Light: `#fff` to `#1b1b1b`. Dark: `#0a0a0a` to `#eee`. |
| Accent | `--accent-9`, `--accent-11`, `--accent-a4`, `--focus-ring` | One hue for selection, focus and primary buttons only. |
| Specimen | `--specimen-paper`, `--specimen-ink` | Separate from the theme. Default paper `#fff`, ink `#111`. |
| Semantic | `--danger`, `--success` | Use sparingly, for errors and confirmations. |
| UI type | `--font-ui`, `--font-mono`, `--text-xs` ... `--text-xl`, `--weight-regular/medium/semibold` | `--font-ui: system-ui, -apple-system, "Segoe UI", sans-serif`. Sizes 11 / 12 / 13 (body) / 15 / 20 / 24 px. |
| Spacing | `--space-1` ... `--space-8` | A 4px base: 4, 8, 12, 16, 24, 32, 48, 64. |
| Radius | `--radius-sm/md/lg/full` | 6, 8, 12 px, 9999px. |
| Size | `--control-sm/md`, `--toolbar-height`, `--row-height` | Controls 28 / 32 px, toolbar 48 px, Library row fixed at 80 px. |
| Layout | `--titlebar-inset`, `--sidebar-width`, `--inspector-width`, `--list-header-height`, `--specimen-min-width`, `--row-sample-size`, `--quick-preview-size` | 80 px on macOS (set by main), 200, 272, 32, 400, 32, 80 px. See the [UI spec](product/ui-spec.md#sizes-and-tokens). |
| Border | `--border-width`, `--border-subtle` | Hairline `0.5px` on Retina, `1px` fallback. |
| Shadow | `--shadow-sm/md/lg` | A 1px translucent ring plus a soft drop shadow. Darker in dark mode. |
| Motion | `--duration-fast/base/slow`, `--ease-out`, `--ease-in-out` | 100 / 180 / 280 ms. `--ease-out: cubic-bezier(0.22, 1, 0.36, 1)`. `--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1)` (judge by eye at 180 ms). One spring, for the Favorite pop only: `{ type: "spring", duration: 0.25, bounce: 0.3 }`. |
| Layers | `--z-toolbar`, `--z-popover`, `--z-dialog`, `--z-toast` | A small fixed ladder, for example 10 / 100 / 200 / 300. |
| Specimen defaults | `--specimen-size`, `--specimen-leading`, `--specimen-padding` | 64 px, 1.1, 48-56 px. |

```css
/* Illustration only: shape, not a full file. */
:root { --gray-1: #fff; --gray-12: #1b1b1b; --duration-base: 180ms; }
[data-theme="dark"] { --gray-1: #0a0a0a; --gray-12: #eee; }
@media (prefers-reduced-motion: reduce) {
  /* Transforms jump to their end state; short fades stay (matches MotionConfig reducedMotion="user"). */
  *, *::before, *::after { transition-property: opacity, color, background-color, border-color !important; animation: none !important; }
}
```

Rule of thumb: if a component's CSS has a raw colour, duration, or pixel size that isn't one
of a handful of layout one-offs, it probably needs a token.

---

## Checklist for every UI change

Copy this into the pull request and tick it off. Reviewers and AI agents apply it as written.

**Vocabulary and copy**
- [ ] UI text uses the terms in [CONTEXT.md](../CONTEXT.md) (Style, not "font"; Collection, not "folder").
- [ ] Buttons use Title Case verbs ("Add to Collection", "Export PNG"). Errors say what to do next.

**States**
- [ ] Loading, empty, error, and populated states all exist and have been seen in the app.
- [ ] Long names, a huge Library, missing Glyphs, and a single item all look intentional.
- [ ] Optimistic changes roll back with a message if saving fails.

**Keyboard and focus**
- [ ] Everything can be reached and operated with the keyboard alone.
- [ ] Focus is visible when using the keyboard, and returns to the trigger when an overlay closes.
- [ ] Escape closes the topmost overlay.
- [ ] New shortcuts are in the single shortcut list, use `Mod`, and don't fire while typing.

**Labels and semantics**
- [ ] Every icon-only button, slider, and toggle has an accessible label.
- [ ] Lists and grids use proper roles (`listbox`/`option`, or `grid`), with the selected item marked.

**Motion**
- [ ] New or revealed UI transitions into place using motion tokens. Nothing teleports or decorates.
- [ ] Sliders and typing update the type instantly, with no easing on the type.
- [ ] With reduced motion on, nothing moves or scales, fades are 180ms or less, and nothing is lost.
- [ ] No `transition: all` and no `@keyframes` on toggleable UI.
- [ ] `AnimatePresence` keys follow the overlay, not the Style.
- [ ] Repeated and keyboard-driven actions are instant (see the motion table in [design references](product/design-references.md)).

**Theme and visual**
- [ ] Checked in both light and dark mode.
- [ ] Only tokens are used for colour, type, spacing, radius, shadow, and motion.
- [ ] The UI font stays the UI font. Only Sample text renders in the previewed Style.
- [ ] Specimen paper and ink are unaffected by the app theme.

**Performance**
- [ ] Lists longer than about 100 items are virtualized. Fonts load lazily and release when far off-screen.
- [ ] Nothing shifts in the layout when a font finishes loading.

**Delight**
- [ ] Any flourish matches how often it happens (frequent means subtle, rare can be special).
- [ ] No interface sounds were added (see principle 5).
