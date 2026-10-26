# Code standards

These standards apply to hand-written code. Biome owns formatting and lint. `npm run deps:check` owns import boundaries. `npm run knip` owns unused files, exports, and dependencies. All three run in `npm run check` and in CI. [docs/anti-slop.md](../anti-slop.md) lists the specific lint rules and why each exists.

## Naming and files

Use the domain names in [CONTEXT.md](../../CONTEXT.md): `Style`, not `font`; `Collection`, not `list`. Files and directories use kebab-case (`scan-font-folders.ts`, `specimen-controls/`). Components and types use PascalCase (`SpecimenView`, `FontFile`). Functions and values use camelCase (`styleId`, `loadStyle`).

Name an operation for what it does: `listFontFiles`, `parseFontFile`, `addStyleToCollection`, `exportSpecimenPng`. Avoid `handle`, `process`, `manage`, `data`, `info`, `utils`, and `helpers` as names; they say nothing about the job.

A component with styles owns a folder: `index.tsx`, `styles.module.css`, and its tests. A directory groups one cohesive module, and its `index.ts` exports the interface callers need. Export what callers use, not internal helpers.

Keep names required by tooling: `electron.vite.config.ts`, `index.html`, config files, and the template's entry files.

## Ownership and boundaries

Each process owns its job. `src/main` owns the filesystem, Font file parsing, persistence, windows, and menus. `src/preload` exposes the typed `window.fontBook` bridge and nothing else. `src/renderer/src` owns the UI. `src/shared` holds pure contracts and zod schemas with no Electron, Node, or DOM imports.

Main and renderer never import each other. They exchange values through preload, using types from `src/shared`.

In the renderer, each feature under `features/<feature>/` owns its components, hooks, state, operations, and tests. Its root `index.ts` is its public entry. Other features import only that entry (`@/features/library`), never a deeper path. `app/` composes features. `shared/` holds reusable UI and infrastructure and never imports a feature. Put code in `shared/` only when it has no feature-specific decisions in it.

Keep filesystem, Electron, and UI effects out of pure transformations. A function that turns parsed metadata into a `Style` should not also read the file.

Add an abstraction when there is a second real caller or a real dependency to replace in tests, not in anticipation.

## Types and external input

Everything that crosses a boundary is untrusted: IPC arguments, files on disk, JSON in `userData`, font metadata, drag-and-drop paths. Parse it with zod at the boundary, then pass typed domain values inward.

- Derive types from schemas with `z.infer`. Do not write the same shape twice.
- Use the type that the owner of a value exports. Do not redeclare it locally.
- No `any`. Use `unknown` only at the exact point of parsing, and parse it immediately.
- No `as` casts unless the compiler cannot see an invariant you have verified. State that invariant in the lint suppression on the line directly above: `// biome-ignore lint/plugin/no-unjustified-type-assertion: SAFETY: <invariant>`. See [anti-slop](../anti-slop.md) for why the reason lives in the suppression.
- No non-null assertions (`value!`). Handle the missing case or narrow with a check.
- No `@ts-ignore` or `@ts-expect-error` to hide a mismatch. Fix the types.
- Use discriminated unions for states with different valid data: `{ status: "loading" } | { status: "ready"; styles: Style[] } | { status: "error"; message: string }`. Do not model state as a bag of optional fields.
- Keep "missing" and "failed" different. An empty Library is not an error; an unreadable Font file is.
- Keep stored file formats (`collections.json`, `prefs.json`) readable across versions. Changing a stored shape needs a version field and a migration with a test.

## React and UI

- Use function components with explicit, typed props.
- Derive values during render. Do not copy props or other state into state.
- Use effects only to synchronize with something outside React: a `FontFace` load, an IPC subscription, a timer, a resize observer. Every effect that starts something cleans it up.
- Use the updater form (`setCount((c) => c + 1)`) when the next state depends on the previous one.
- Keep IPC calls in feature hooks or operations, not in JSX event handlers scattered across components.
- Give every control a label, keep keyboard access and visible focus, and show loading, empty, and error states. Respect reduced motion.
- Follow [design principles](../design-principles.md).

## Tests

Use Vitest. Test observable behavior through the interface callers use: call the operation, render the component, click the control, read the result.

- Do not mock modules (`vi.mock`) or replace imports globally. Pass dependencies in as arguments instead, and give tests a small, faithful fake.
- A fake models the real contract, including failure. It must not just echo the implementation under test.
- Use temporary directories for filesystem tests and small fixture Font files checked into the repository (with licenses that allow it, such as the SIL Open Font License). Never read the machine's installed fonts or real `userData`.
- When fixing a bug, write the failing test first when practical.
- Do not write tests that only restate the implementation or file names.
- Tests run offline and finish. No watch mode in CI or agent sessions.

## Comments

Explain a constraint, invariant, or tradeoff the code cannot show: why a `.ttc` needs a face index, why a write goes to a temp file first. Do not narrate what the next line does. Keep `SAFETY:` reasons on the line directly above their cast. Delete comments that a change makes untrue.

## Reviews

A review checks, in order: correct behavior, process boundaries and security baseline, domain names, types at boundaries, tests, then style. Cite the rule from this file, [architecture](architecture.md), or [design principles](../design-principles.md) for each finding. A pull request says what changed, why, how it was verified, and whether stored files changed. Keep file moves and behavior changes in separate commits.
