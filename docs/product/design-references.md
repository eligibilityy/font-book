# Design references: Salaja, Kowalski, Taylor

This document turns the published principles of three interface designers into checks for Book. It sits beside [design principles](../design-principles.md), which stays the rulebook. Nothing here overrides it; section 3 proposes amendments for the lead to accept or reject.

Domain words (Library, Style, Specimen, Quick preview, Collection, Favorite, Pairing, Export, and so on) are defined in [CONTEXT.md](../../CONTEXT.md).

**How to read this.** Text in quotation marks is a short quote from the source. "Paraphrase" lines restate the source in my own words. Every "In Book" line is my inference and recommendation, not something the designer said about Book. All sources were read on 2026-10-27.

---

## 1. Principles by designer

### Benji Taylor

Benji led design on the Family wallet. His essay "Family Values" is the root of Pond's and Book's principles.

1. **Gradual revelation.** Paraphrase: put the fundamentals at hand and keep complexity "out of sight and out of mind until required". Each tray holds one action or one piece of content, and consecutive trays change height so progress is visible. Source: <https://benji.org/family-values>
   - In Book, this means: a Specimen first shows only Sample text, size, and the Style name. A static Style renders no Axes section. Each popover does one job (Add to Collection is a checklist of Collections, nothing else). Test: open a static Style and confirm no empty Axes or OpenType feature section exists in the DOM.
2. **Fly, don't teleport.** "We fly instead of teleport." Paraphrase: every transition should show the path from A to B. Source: <https://benji.org/family-values>
   - In Book, this means: overlays enter from the thing that opened them (popover from its trigger, inspector from the right edge, toast from the bottom edge). Test: slow animations down in DevTools (Animations panel, 10%) and confirm every overlay starts at its trigger or edge, never at the window centre unless it is a centred dialog.
3. **Consistent physical rules.** "We treat the app as having unbreakable physical rules when navigating its space." Paraphrase: direction of motion matches the direction of the action. Source: <https://benji.org/family-values>
   - In Book, this means: something on the right always enters and leaves to the right; a panel that slides in slides back out the same way. Test: for each overlay, enter and exit share a direction and an origin.
4. **Persistent things stay put.** Paraphrase: a component that persists into the next state "should remain consistent" instead of being duplicated or re-animated. Source: <https://benji.org/family-values>
   - In Book, this means: when the Quick preview moves to the next Style (Down arrow while open), the overlay frame stays still and only the Sample text changes. Test: hold Down with the Quick preview open; the frame never fades, scales, or flickers.
5. **Delight is selective emphasis.** "Mastering delight is mastering selective emphasis." "The potential for delight increases as the frequency of feature usage decreases." Source: <https://benji.org/family-values>
   - In Book, this means: zero flourish on list navigation and slider drags; a small pop on adding a Favorite by click; a one-time moment for the first Import, first Collection, and first Export. Test: each flourish is tagged in the PR with its frequency tier (see the motion table).
6. **Polish is uniform.** "Users notice when parts of an app are less polished." Source: <https://benji.org/family-values>
   - In Book, this means: Settings, About, empty states, and error states get the same token-based spacing, type, and motion as the Specimen. Test: no screen uses raw colours, durations, or pixel sizes that the tokens table does not list.
7. **Morph, don't swap.** Paraphrase: transform the actual shapes instead of using "crossfades or opacity tricks"; for arrows and chevrons, rotate, because "when you rotate, it just works." Source: <https://benji.org/morphing-icons-with-claude>
   - In Book, this means: a disclosure chevron for an inspector section rotates 90 degrees rather than swapping icons; a toggle such as paper/ink swap changes its label or icon in place. Test: no icon in an open/closed control is replaced by a different element on toggle.
8. **Values ease, nothing jumps; finish the old signal first.** "When a new value arrives, nothing jumps." "Arrows fade out fully before the new direction fades in." Source: <https://benji.org/liveline>
   - In Book, this means: the Scan progress count ("1,240 Styles so far") updates in tabular figures so digits never shift width; two contradictory states (for example "Saving" and "Saved") are never on screen at once. Test: during a Scan the count's width stays constant.
9. **Ship the defaults.** "I wanted the defaults to be the version you actually ship." Paraphrase: a bar enters "off whichever edge it is on" and changes shape rather than swapping panels. Source: <https://benji.org/drawesome>
   - In Book, this means: the default Sample text, size (64px), and paper/ink must look finished with zero adjustment. Test: open the app fresh with an empty `userData` folder; the first Specimen looks intentional without touching a control.

### Emil Kowalski

Emil built Sonner (toasts) and Vaul (drawers) and teaches animations.dev. His public rules are on his blog and in his skills repository.

1. **Ask what the animation is for.** "Before you start animating, ask yourself: what's the purpose of this animation?" and "sometimes the best animation is no animation." Source: <https://emilkowal.ski/ui/you-dont-need-animations>
   - In Book, this means: every animation in a PR names its purpose (orientation, state change, feedback, rare delight). Test: a reviewer can delete any animation whose purpose is "it looks nice" and nothing is lost.
2. **Frequency decides; keyboard actions don't animate.** "never animate keyboard initiated actions." Paraphrase of his tiers: 100+ times a day gets no animation, tens of times a day gets little or none, occasional actions get standard motion, rare ones may delight. Sources: <https://emilkowal.ski/ui/great-animations>, <https://github.com/emilkowalski/skills/blob/main/skills/emil-design-eng/SKILL.md>
   - In Book, this means: Up/Down in the Library list, selection highlight, typing Sample text, and slider steps are instant. Test: hold Down for two seconds; the highlight moves with no lag and no transition on any row.
3. **Fast.** "UI animations should generally stay under 300ms." Paraphrase: a 180ms dropdown feels more responsive than a 400ms one. Source: <https://emilkowal.ski/ui/7-practical-animation-tips>
   - In Book, this means: no user-initiated animation in Book exceeds 280ms (`--duration-slow`). Test: search the PR for durations; none above 280ms except a one-time rare flourish.
4. **Ease-out to enter; never ease-in.** "The best type of easing for this purpose is `ease-out`." "Never use ease-in for UI animations." His strong ease-out is `cubic-bezier(0.23, 1, 0.32, 1)`; ease-in-out is for things moving on screen. Sources: <https://emilkowal.ski/ui/great-animations>, <https://github.com/emilkowalski/skills/blob/main/skills/emil-design-eng/SKILL.md>
   - In Book, this means: enter and exit use `--ease-out` (Book's `cubic-bezier(0.22, 1, 0.36, 1)` is effectively the same curve). Test: no `ease-in` keyword or ease-in curve appears in a UI transition.
5. **Origin-aware popovers.** "They should scale in from the trigger." Base UI exposes `--transform-origin` for this; centred modals keep `center`. Source: <https://emilkowal.ski/ui/7-practical-animation-tips>
   - In Book, this means: every Base UI Popover and Menu popup sets `transform-origin: var(--transform-origin)`. Test: open Add to Collection from a button near the bottom of the window; the popover grows from the button, even when Base UI flips it above.
6. **Never from nothing.** "Try animating from a higher initial scale instead (0.9+)." Pressed buttons scale to about 0.97. Source: <https://emilkowal.ski/ui/7-practical-animation-tips>
   - In Book, this means: overlays start at scale 0.97 to 0.98 with opacity 0; no `scale(0)` anywhere; buttons press to 0.97. Test: grep the PR for `scale(0)` and `scale: 0`.
7. **Interruptible.** "Interruptibility helps your animations feel more natural and responsive." Paraphrase: CSS transitions retarget mid-flight; keyframe animations restart, so avoid them for UI that can be toggled quickly. Sources: <https://emilkowal.ski/ui/great-animations>, <https://emilkowal.ski/ui/building-a-toast-component>
   - In Book, this means: overlays use CSS transitions (Base UI `data-starting-style` / `data-ending-style`) or Motion `animate`, never `@keyframes`. Test: press Space five times quickly on a Library row; the Quick preview ends in the correct state (open after an odd count) with no queued replays.
8. **Only transform and opacity, and watch inherited variables.** Paraphrase: padding, margin, width, and height trigger layout; transform and opacity only composite. Changing a CSS variable on a parent recalculates every child: "Since CSS Variables are inheritable, changing them will cause style recalculation for all children." Sources: <https://emilkowal.ski/ui/great-animations>, <https://emilkowal.ski/ui/building-a-drawer-component>
   - In Book, this means: never animate a property on the virtualized Library list container or the Glyph grid; set the Specimen font size on the Sample text element itself, not as a variable on a parent holding thousands of Glyph cells. Test: record a DevTools Performance trace while dragging the size slider over a 2,000-Glyph grid; no long "Recalculate Style" tasks over 16ms.
9. **Reduced motion is gentler, not zero.** "Reduced motion means fewer and gentler animations, not zero." Paraphrase: keep opacity and colour changes, drop movement. Sources: <https://github.com/emilkowalski/skills/blob/main/skills/emil-design-eng/SKILL.md>, <https://emilkowal.ski/ui/great-animations>
   - In Book, this means: with Reduce Motion on in macOS, popovers and the inspector fade but do not scale or slide. (Motion's `reducedMotion="user"` already does this: it disables transform and layout animations and keeps opacity, per <https://motion.dev/docs/react-motion-config>.) Test: turn on Reduce Motion and open every overlay; nothing moves, nothing is missing.
10. **Exits are faster; repeats are instant.** Paraphrase: exit faster than enter. "Once a tooltip is open, hovering over other tooltips should open them with no delay and no animation." Sources: <https://github.com/emilkowalski/skills/blob/main/skills/emil-design-eng/SKILL.md>, <https://emilkowal.ski/ui/7-practical-animation-tips>
    - In Book, this means: exits use `--duration-fast` (100ms); toolbar tooltips use Base UI's delay group so the second tooltip shows instantly. Test: no exit duration is longer than its enter duration.

### Raphael Salaja

Raphael wrote Pond, whose principles Book adapts. His public writing is on his site, and his rule set for agents is in the userinterface-wiki repository.

1. **Few timing values, reused.** "Define some timing guidelines for your animations and reuse them throughout your product." "keep durations under 300ms for most interactions." Sources: <https://raphaelsalaja.com/library/12-principles-of-animation>, <https://github.com/raphaelsalaja/userinterface-wiki/blob/main/skills/SKILL.md> (`timing-consistent`)
   - In Book, this means: every duration and easing comes from the motion tokens, mirrored in one Motion module. Test: no raw `ms` or `s` value appears in component CSS or Motion props outside the tokens module.
2. **Frequency picks the animation, down to entrance versus exit.** "Apple only animates out their context menus as they are used so frequently". The wiki rule: "Keyboard navigation should be instant, no animation." Sources: <https://raphaelsalaja.com/library/12-principles-of-animation>, <https://github.com/raphaelsalaja/userinterface-wiki/blob/main/skills/rules/none-keyboard-navigation.md>
   - In Book, this means: a right-click context menu on a Library row appears instantly and fades out over 100ms. Test: right-click several rows quickly; each menu is fully visible on the first frame.
3. **One focal point.** "Avoid animating too many things at the same exact time." Wiki: "Only one element should animate prominently at a time." Sources: <https://raphaelsalaja.com/library/12-principles-of-animation>, <https://github.com/raphaelsalaja/userinterface-wiki/blob/main/skills/rules/staging-one-focal-point.md>
   - In Book, this means: when a Style is added to a Collection, only the Collection's sidebar row reacts, not the popover, the row, and a toast at once. Test: each user action triggers at most one prominent animation.
4. **Just enough, almost invisible.** "The sweet spot is just enough animation, of the right kind, at the right moments." "great interface animations are almost invisible." Source: <https://raphaelsalaja.com/library/12-principles-of-animation>
   - In Book, this means: if she notices an animation during normal browsing, it is too much. Test: show the build to her (or anyone) for five minutes of browsing; ask afterwards which animations they noticed. Only rare-moment ones should come up.
5. **Coherency is everything.** "Coherency is everything." Paraphrase: users feel inconsistent timing, easing, or spacing as "something's off" even when they cannot name it. Source: <https://raphaelsalaja.com/library/the-rise-of-design-engineering>
   - In Book, this means: two popovers never use different durations or scales; all overlays share one enter and one exit recipe. Test: list every overlay's enter and exit values in the PR; they match.
6. **No teleporting UI, but never gate input.** Pond: newly revealed interface "must transition into place", and "Focus, input, and pointer interaction must be available immediately." Source: <https://github.com/raphaelsalaja/pond/blob/main/apps/desktop/src/renderer/src/PRINCIPLES.md>
   - In Book, this means: clicks and keys work during every animation; an exiting overlay has `pointer-events: none` and focus has already returned to its trigger. Test: open a popover and click a Library row within 50ms; the row is selected on that click.
7. **Watch the in-between frames.** Pond: "An animation is not done when its endpoints are correct." Source: <https://github.com/raphaelsalaja/pond/blob/main/apps/desktop/src/renderer/src/PRINCIPLES.md>
   - In Book, this means: each motion PR is checked at 10% speed in the DevTools Animations panel and again at full speed the next day (Emil gives the same "fresh eyes" advice in <https://emilkowal.ski/ui/great-animations>). Test: the PR description says both checks were done.
8. **Honest typography.** Wiki rules: disable `font-synthesis` "to prevent faux bold/italic", leave `font-optical-sizing` on auto, keep `calt` enabled, use tabular numbers for data. Source: <https://github.com/raphaelsalaja/userinterface-wiki/blob/main/skills/SKILL.md> (`type-no-font-synthesis`, `type-optical-sizing-auto`, `type-opentype-contextual-alternates`, `type-tabular-nums-for-data`)
   - In Book, this means: the Specimen sets `font-synthesis: none`, so a Style that lacks bold or italic is never faked by the browser; OpenType features start at the Style's own defaults; slider readouts and counts use tabular figures. Test: use a Family that has only a Regular Style as the Pairing heading (headings are bold by default in browser CSS); it must still render at its real weight, not a smeared fake bold.

---

## 2. Motion spec for Book's key interactions

Tokens are from [design principles](../design-principles.md#tokens-to-define): `--duration-fast` 100ms, `--duration-base` 180ms, `--duration-slow` 280ms, `--ease-out` `cubic-bezier(0.22, 1, 0.36, 1)`. "Tier" is Emil's frequency tier: high (100+ a day), medium (tens a day), occasional, or rare.

| Interaction | Tier | Animate? | Property | Duration (enter / exit) | Easing | Origin | Interruption | Reduced motion | Justified by |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Quick preview open/close (Space) | High, keyboard | No (decided 2026-10-27) | none | 0ms / 0ms | none | none | Nothing to interrupt; each Space toggles. Down/Up while open swaps Sample text instantly. | Same | Emil 2, 10; Raphael 2 |
| Popover from trigger (Add to Collection, colour) | Occasional | Yes | opacity, scale 0.97 to 1 | 180ms / 100ms | `--ease-out` | `var(--transform-origin)` from Base UI | CSS transition retargets; reopening mid-exit grows back from the current frame | Opacity only | Emil 5, 6, 7; Benji 2 |
| Context menu (right-click a row) | Medium | Exit only | opacity | 0ms / 100ms | `--ease-out` | none | Instant on every open | Same | Raphael 2; Emil 2 |
| Inspector show/hide | Occasional | Yes | transform translateX(100%) to 0, opacity | 280ms / 180ms | `--ease-out` | Right edge | Toggling mid-slide reverses from the current position | Fade only (Motion drops the slide) | Benji 2, 3; Emil 3, 8 |
| Collection add feedback | Occasional | Yes, once | Sidebar Collection row: accent tint fades out; count updates instantly | 280ms fade-out | `--ease-out` | none | A second add restarts the tint; never stacks | Keep the tint fade (colour, not motion) | Raphael 3; Benji 5 |
| Favorite toggle | Occasional (click), medium (key) | Click on: yes. Key or off: no | Star scale 1 to 1.15 to 1; fill changes instantly | about 250ms | Spring, bounce 0.3 or less | Star centre | Rapid clicks retarget the spring; never replay from 0 | No scale; fill only | Benji 5; Emil 2 |
| Library list selection and hover | High | No | background colour | 0ms (hover may use up to 100ms colour, pointer only) | none | none | n/a | Same | Emil 2; Raphael 2 |
| Pairing swap (heading and body exchange) | Occasional | Labels only | Sample text: instant. Style name labels: layout position swap | 180ms | ease-in-out (moving on screen) | Each label's own box | Second swap mid-flight reverses | Instant (Motion drops layout) | Benji 4, 7; design principles 4 |
| Theme change (light/dark, and paper/ink) | Rare / occasional | No | all colours in one frame | 0ms | none | none | n/a | Same | Emil 1, 8; Raphael 4 |
| Specimen size slider drag | High | No | font-size on the Sample text; thumb follows pointer 1:1 | 0ms | none | none | n/a; save the value with a debounce | Same | Emil 2; design principles 3 |
| Toast after Export | Occasional (first Export: rare) | Yes | transform translateY(100%) to 0, opacity | 280ms / 180ms | `--ease-out` | Bottom edge | CSS transition; a second toast retargets the first. Auto-dismiss after about 4s, paused on hover and while the window is hidden. | Opacity only | Emil 7 (Sonner); Benji 2 |
| List and Specimen view switch (Enter, Mod+[) | High, keyboard | No | view content | 0ms | none | none | n/a | Same | Emil 1 (keyboard actions); UI spec |
| Sidebar hide/show (Mod+Alt+S) | Medium, keyboard | No | layout | 0ms | none | none | n/a | Same | Emil 1; UI spec |

A Motion transition for the Favorite pop, as an illustration of size only:

```ts
// The one spring preset. Everything else is a duration token plus --ease-out.
export const popSpring = { type: "spring", duration: 0.25, bounce: 0.3 } as const;
```

Two rules that apply to every row:

- **Key `AnimatePresence` children by the overlay's open state, not by the Style.** If an overlay's child is keyed on the Style ID, each Down arrow replays the enter animation (Benji 4). The Quick preview is now instant, so this applies to any future animated overlay that follows the selection.
- **No `transition: all`, no `@keyframes` for UI that can be toggled, no animated width, height, or padding in the Library list or Glyph grid.** Inspector section reveals may animate height (design principles 4), because they have few children and happen occasionally.

---

## 3. Conflicts and recommendations

Conflicts between the three designers:

1. **Exit easing.** Raphael's wiki: "Exits must use ease-in" (`easing-exit-ease-in`). Emil: "Never use ease-in for UI animations." Recommendation: follow Emil. Use `--ease-out` for enter and exit, and keep exits short (100 to 180ms) so the curve barely matters. Raphael's own article also recommends ease-out "to make elements feel more snappy".
2. **Exit symmetry.** Raphael's wiki: "Exit animation should mirror initial for symmetry" (`exit-matches-initial`). Emil: exit faster than enter. Recommendation: do both. The exit retraces the same path and properties (Raphael), at a shorter duration (Emil).
3. **Springs versus CSS transitions for interruptibility.** Raphael's wiki: "Motion that can be interrupted must use springs" (`spring-for-interruptible`). Emil: CSS transitions also retarget, and they stay smooth on a busy main thread. Recommendation: CSS transitions for Base UI overlays (Pond does this too); Motion `animate` for the inspector and Quick preview; a spring only for the Favorite pop. Book has no drag gestures in v1, which is where springs matter most.
4. **How much to animate keyboard actions.** Emil: never. Benji and Pond: every revealed element must fly, not teleport. Recommendation: Emil wins for high-frequency keys (list navigation, slider arrows, Favorite shortcut). Decided on 2026-10-27: the Quick preview is instant both ways too. (The earlier compromise was a 100ms fade and scale. The fallback, if instant ever feels abrupt, is to set its enter to 0ms and keep the 100ms exit fade (the Apple context-menu pattern Raphael cites).

Conflicts with the current [design principles](../design-principles.md), with proposed amendments. These are proposals only; that file has not been edited.

1. **Section 4, "New UI eases into place".** It conflicts with Emil's keyboard rule and Raphael's context-menu rule. Amend: add "Exceptions: actions repeated many times in a row (list navigation, slider steps, keyboard shortcuts) and context menus appear instantly. A context menu may fade out."
2. **Section 7, reduced motion: "every transition reaches its final state immediately".** This conflicts with Emil ("not zero"), and it does not match the decided tool: `MotionConfig reducedMotion="user"` keeps opacity and colour animations. The CSS rule in the tokens section cuts every duration to 0.01ms. As written, Motion animations will still fade while CSS ones snap. Amend: "With reduced motion, nothing moves, scales, or slides. Opacity and colour fades of up to 180ms may stay. No information depends on seeing a transition." Then change the example CSS rule to remove transforms rather than zeroing all durations, so CSS and Motion behave the same.
3. **Section 4, "Popovers grow from their trigger".** Amend: add "Start at scale 0.97 or higher, never 0. Use `var(--transform-origin)` from Base UI. Centred dialogs scale from the centre."
4. **Section 4, "Keep it short".** Amend: add "Exits are no longer than entrances. Use ease-out to enter and exit; never ease-in. Use ease-in-out only for something moving from one place to another on screen."
5. **Section 4, "travel toward, or pulse in, that Collection".** A flying copy of the row is costly for a learner and is a second focal point (Raphael 3). Amend: choose the pulse (a 280ms tint fade on the sidebar row) for v1.
6. **Section 4, "Revealed sections animate their height".** Emil says animate only transform and opacity. Amend: "Height may animate only for small inspector sections. Never animate layout properties inside the Library list or Glyph grid."
7. **Section 5, "a Favorite star that pops once".** Amend: "pops when favorited by click; the keyboard shortcut and un-favoriting are instant."
8. **Tokens table, Motion row.** `--ease-in-out` has no value. Amend: give it one (Emil's strong ease-in-out is `cubic-bezier(0.77, 0, 0.175, 1)`; judge by eye at 180ms) and add the one spring preset from section 2.
9. **Section 1 or 3, typography.** Not covered today. Amend: "The Specimen sets `font-synthesis: none` and leaves `font-optical-sizing` on auto unless the user sets the `opsz` Axis, so Book never shows a faked bold or italic."
10. **Section 5, sounds.** Raphael's wiki treats reduced motion as a proxy for sound sensitivity (`a11y-reduced-motion-check`); the Pond analysis advised keeping them independent. Book has no sounds, so no change now. If sounds are ever added, decide this then.
11. **Checklist, Motion group.** Amend: add "No `transition: all` and no `@keyframes` on toggleable UI" and "`AnimatePresence` keys follow the overlay, not the Style."

---

## 4. Review checklist for UI pull requests

An AI reviewer can apply each item by reading the diff, or by asking the author for the result of the named test.

1. Every animation has a stated purpose and a frequency tier (high, medium, occasional, rare). High-tier and keyboard-repeated actions have no animation.
2. Every duration and easing comes from a motion token or the shared Motion module. No raw `ms`, `s`, or cubic-bezier values in components.
3. No user-initiated animation is longer than 280ms. Exits are no longer than their entrances.
4. No `ease-in` on UI. Enter and exit use `--ease-out`; ease-in-out only for movement across the screen.
5. Popovers and menus use `transform-origin: var(--transform-origin)` and start at scale 0.97 or higher. Nothing scales from 0.
6. Only `transform` and `opacity` animate (plus height in small inspector sections). No `transition: all`.
7. Overlays use CSS transitions or Motion `animate`, not `@keyframes`. Toggling five times quickly ends in the right state with nothing queued.
8. Input is never blocked: exiting elements have `pointer-events: none`, focus returns to the trigger at once, and clicks during a transition work.
9. The Quick preview's frame stays still while Up/Down changes the Style, and it opens and closes in one frame.
10. Sliders, typing, and Style changes update the Sample text in the same frame, with no easing, and nothing sets a CSS variable on a parent of the Library list or Glyph grid for each slider move.
11. With macOS Reduce Motion on, nothing moves or scales, fades are 180ms or less, and every state is still reachable and visible.
12. At most one prominent animation runs per user action.
13. Changing numbers (slider readouts, counts, Scan progress) use tabular figures and never shift the layout.
14. The Specimen uses `font-synthesis: none`; the UI font never inherits the previewed Style.
15. The author watched the animation at 10% speed and at full speed, and the PR says so.

---

## Sources

Read for this document (all on 2026-10-27):

- Benji Taylor: <https://benji.org/family-values>, <https://benji.org/morphing-icons-with-claude>, <https://benji.org/liveline>, <https://benji.org/drawesome>, post list at <https://benji.org>.
- Emil Kowalski: <https://emilkowal.ski/ui/great-animations>, <https://emilkowal.ski/ui/you-dont-need-animations>, <https://emilkowal.ski/ui/7-practical-animation-tips>, <https://emilkowal.ski/ui/building-a-toast-component>, <https://emilkowal.ski/ui/building-a-drawer-component>, <https://emilkowal.ski/ui/the-magic-of-clip-path>, <https://github.com/emilkowalski/skills/blob/main/skills/emil-design-eng/SKILL.md>, the public landing page at <https://animations.dev/>.
- Raphael Salaja: <https://raphaelsalaja.com/library/12-principles-of-animation>, <https://raphaelsalaja.com/library/the-rise-of-design-engineering>, <https://raphaelsalaja.com/library/the-concept-of-taste>, <https://github.com/raphaelsalaja/userinterface-wiki> (`skills/SKILL.md` and the rule files named above), <https://github.com/raphaelsalaja/cambio>, Pond's `apps/desktop/src/renderer/src/PRINCIPLES.md` and `packages/theme` in a local clone of <https://github.com/raphaelsalaja/pond>.
- Motion: <https://motion.dev/docs/react-motion-config> for what `reducedMotion="user"` disables.

Not available or not read:

- The animations.dev course lessons are paywalled; only the landing page was read, and no course content is used here.
- The userinterface.wiki article pages did not return article text when fetched; the same rules were read from the GitHub repository instead.
- Not read: Emil's "Developing Taste" and "Agents with Taste", Benji's "Agentation", "Annotating for agents", and "Honkish", and Raphael's non-design posts. No talks by Raphael were found.
