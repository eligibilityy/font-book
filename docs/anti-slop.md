# Anti-slop rules

"Slop" is code that compiles and looks fine but hides a problem: a type assertion that guesses, an `any` that switches off checking, an import that drags Node into the web page. AI tools produce it easily, and so do tired humans. This project copies the idea from [Pond](https://github.com/raphaelsalaja/pond), which runs 15 custom lint rules against it, and scales it down to built-in tools.

A rule that runs on every change beats a sentence in a doc. See [why checks, not prose](#why-checks-not-prose).

## Pond's 15 rules and how font-book covers them

Pond writes these as custom [oxlint](https://oxc.rs/docs/guide/usage/linter) plugins. font-book uses [Biome](https://biomejs.dev/) built-in rules where one exists, a small Biome plugin for type assertions, and [code standards](contributing/code-standards.md) for the rest.

| Pond rule | What it prevents | How font-book covers it |
| --- | --- | --- |
| `require-safety-comment-for-type-assertion` | An `as` cast with no written reason why it is safe. | **Biome plugin** `no-unjustified-type-assertion` flags every `x as T` and `<T>x` except `as const`. The reason goes in a suppression comment (see [type assertions](#type-assertions)). |
| `no-chained-type-assertions` | `x as unknown as T`, which forces any value into any type. | **Biome plugin**: each assertion in the chain is flagged and needs its own reason, so a chain is twice as hard to justify. |
| `no-widen-then-assert` | Storing a value as `unknown` or a broad type, then casting it back to a narrower type. | **Biome plugin** catches the cast at the end. `noExplicitAny` catches the `any` version. |
| `no-reflect-get` | `Reflect.get(obj, key)`, which reads a property without type checking. | **Biome** `noRestrictedGlobals` bans `Reflect`. |
| `no-reflect-apply` | `Reflect.apply(fn, ...)`, which calls a function without type checking. | **Biome** `noRestrictedGlobals` bans `Reflect`. |
| `no-unsafe-dictionary-type` | `Record<string, any>` and similar maps whose values have no real type. | **Partly.** `noExplicitAny` catches `any` and `noBannedTypes` catches `{}` and `Object`. `Record<string, unknown>` is a code standard: parse it with zod into a real type. |
| `no-object-parameters` | A parameter typed as `object`, which says nothing about what the function needs. | **Partly.** `noBannedTypes` catches `{}`, `Object`, and `Function`. Biome cannot ban the lowercase `object` keyword (`noRestrictedTypes` only matches type names), so that part is a code standard. |
| `no-known-value-widening` | Annotating a value with a broader type than TypeScript already inferred, which throws the extra detail away. | **Partly.** `noEvolvingTypes` and `noImplicitAnyLet` stop variables that start untyped. Otherwise a code standard: let inference work, and use `satisfies` to check a value against a type without widening it. |
| `no-unknown-parameters` | `function f(input: unknown)` outside a parser: the caller's value is never checked. | **Code standard.** `unknown` appears only at the exact point of parsing, and is parsed immediately with zod. |
| `no-unknown-returns` | A function that returns `unknown` or `Promise<unknown>`, pushing the checking onto every caller. | **Code standard.** Return the parsed type. zod's `parse` already returns it. |
| `no-unknown-type-aliases` | `type Payload = unknown`, which hides `unknown` behind a friendly name. | **Code standard.** Not automated. |
| `no-runtime-typeof` | `typeof x === "string"` checks scattered through the code instead of parsing once at the boundary. | **Code standard.** Parse input with zod where it enters (IPC, files), then work with typed values. Not automated: a blanket ban would also hit legitimate checks. |
| `no-module-mocking` | `vi.mock(...)` in tests, which swaps real imports for fakes and lets tests pass against code that no longer exists. | **Code standard** (no `vi.mock`; pass dependencies in). [Future exercise 2](#2-ban-vimock) automates it. |
| `no-conditional-empty-object-spread` | `{ ...(cond ? { icon } : {}) }`, which hides when a field is left out. | **Not yet.** [Future exercise 1](#1-ban-conditional-empty-spreads). The template's `src/main/index.ts` contains exactly this pattern. |
| `no-shape-in-symbol-names` | Names containing "shape", which describe structure instead of meaning. | **Not adopted.** A Pond naming preference. font-book names things by their domain role using [CONTEXT.md](../CONTEXT.md). |

## Other strict Biome rules

`biome.jsonc` turns on Biome's recommended rules plus these, all as errors. Its header comment lists them too.

| Rule | What it prevents |
| --- | --- |
| `noExplicitAny` | `any`, which switches off type checking for everything it touches. |
| `noNonNullAssertion` | `value!`, which tells TypeScript "this is never null" without checking. |
| `noTsIgnore` | `// @ts-ignore`, which hides a compiler error. |
| `noConsole` | Leftover `console.log` debugging. `console.warn` and `console.error` are allowed. |
| `noParameterAssign` | Reassigning a function's parameter, which makes the input hard to follow. |
| `useImportType` | Importing a type as if it were a value. `import type` disappears at build time, so it can never pull main-process code into the renderer by accident. |
| `noBarrelFile`, `noReExportAll` | Files that only re-export other files, and `export * from`. Exception: a feature's `index.ts`, its public entry, may re-export by name. |
| `noImportCycles` | Two files that import each other. |
| `useExhaustiveDependencies`, `useHookAtTopLevel` | React hooks that miss an input, or are called conditionally. |
| `noNodejsModules`, `noRestrictedImports` (renderer and `src/shared` only) | Importing Node built-ins or `electron` where they cannot run. Gives editor feedback; dependency-cruiser enforces the same rule in CI. |
| a11y recommended | Inaccessible UI: clickable `<div>`s, images without `alt`, missing `lang`. |

TypeScript itself is a layer too: `strict`, `noImplicitAny`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, and `noImplicitOverride`. [Setup step 7](setup.md#7-make-typescript-stricter) explains each.

## Type assertions

An assertion (`value as Style`) tells TypeScript "trust me". The plugin in `tools/biome/no-unjustified-type-assertion.grit` flags every one except `as const`.

First, try to remove it: parse the value with zod, add a type guard, or fix the type at its source. If the assertion really is safe, write down why, on the line directly above the line where the assertion starts:

```ts
// biome-ignore lint/plugin/no-unjustified-type-assertion: SAFETY: the preload bridge only ever resolves this channel with a Style[]
```

Biome refuses a suppression with no reason after the colon, and reports a suppression that no longer suppresses anything, so stale reasons get cleaned up. A reviewer reads the `SAFETY:` sentence and decides whether it holds.

Pond's version checks for a nearby `SAFETY:` comment directly. Biome's GritQL plugins cannot read comments, so font-book uses the suppression comment as the place for the reason. [Future exercise 3](#3-a-real-safety-comment-check) is the exact check.

## Import boundaries

`.dependency-cruiser.cjs` replaces Pond's `scripts/check-architecture.mjs`. `npm run deps:check` fails when:

- the renderer imports `src/main`, `src/preload`, Node built-ins, or `electron`
- main imports the renderer
- preload imports main or the renderer
- `src/shared` imports main, preload, the renderer, Node built-ins, or `electron`
- anything imports `src/main/index.ts` (the startup file)
- `src/renderer/src/shared` imports a feature
- a feature imports another feature's files instead of its `index.ts`
- a runtime import cycle exists (type-only cycles are allowed: they vanish at build time)
- app code imports a test file, an import cannot be resolved, or a package is missing from `package.json`

Each error names the rule. The rule's `comment` in `.dependency-cruiser.cjs` explains what to do instead. [Architecture](contributing/architecture.md) explains the boundaries.

## The other layers

| Layer | When it runs | What it catches |
| --- | --- | --- |
| Editor (Biome extension) | As you type | Lint and format problems, before you save. |
| `pre-commit` hook | `git commit` | Runs `npm run lint`. Kept fast, like Pond's: lint only. It never rewrites your files. |
| `commit-msg` hook | `git commit` | [commitlint](https://commitlint.js.org/) rejects messages that are not `type(scope): summary`. |
| `npm run check` | Before you push | Lint, typecheck, boundaries, unused code, tests. |
| [Knip](https://knip.dev/) | Inside `check` | Unused files, exports, and dependencies: dead code that agents leave behind after a refactor. |
| CI (`ci.yml`) | Every push and pull request | `npm run check` and `npm run build` on a clean machine, so "works on my PC" is not enough. |
| Release (`release.yml`) | On a `vX.Y.Z` tag | Runs `check` again, then builds the real installers on macOS and Windows. |

Left out from Pond on purpose, because a single small app does not need them yet: Turborepo task caching, performance budgets on bundle size, a desktop smoke test in CI, generated-docs checks, an SBOM, a Homebrew cask, and Developer ID signing with notarization.

## Why checks, not prose

- **Checks run every time.** A doc is read once, skimmed, or not at all. AI tools load only part of the docs into their context; a failing check reaches them anyway.
- **Checks fire at the moment of the mistake**, on the exact line, with a message that says what to do instead.
- **Checks define "done".** An agent, or a person, stops when the checks pass. If a rule is not checked, it is optional in practice.
- **Exceptions become visible.** Silencing a rule needs a written reason in the code, which a reviewer sees in the diff.
- **Prose still matters** for what tools cannot judge: naming, product behaviour, design. That is what [code standards](contributing/code-standards.md) and [design principles](design-principles.md) are for.

When you find a mistake that keeps coming back, the best fix is a new check. The exercises below are a start.

## Future exercises

Each one is a small, self-contained way to learn how linters work. Biome's [plugin docs](https://biomejs.dev/linter/plugins/) and [GritQL reference](https://biomejs.dev/reference/gritql/) cover the syntax. The [Biome playground](https://biomejs.dev/playground/) shows the syntax tree for any snippet, including node names like `TsAsExpression`. Add each new plugin file to the `"plugins"` list in `biome.jsonc`.

### 1. Ban conditional empty spreads

Write `tools/biome/no-conditional-empty-object-spread.grit`. It should flag a spread inside an object literal whose argument is a conditional expression (`a ? b : c`) with `{}` on either side. Test it on the template's `...(process.platform === "linux" ? { icon } : {})` in `src/main/index.ts`, then fix that line: build the options object first and add `icon` in an `if`.

### 2. Ban `vi.mock`

Write a GritQL plugin that flags calls to `vi.mock`, `vi.doMock`, and `vi.unstable_mockModule`. Start from the `console.log` example in Biome's plugin docs. Make the message point to the code standard: pass the dependency in as an argument and give the test a small fake.

### 3. A real SAFETY comment check

Biome also has JavaScript plugins, which work on Biome's full syntax tree (the "CST", which keeps comments) instead of a GritQL pattern. Finding how to read the comments before a node is part of the exercise. They are in **Developer Preview**: breaking changes can happen in patch releases, which is one reason Biome's version is pinned exactly. Write a JavaScript plugin that flags an assertion unless a comment containing `SAFETY:` sits directly above it, then remove the GritQL plugin and switch the suppressions back to plain `// SAFETY:` comments, matching [code standards](contributing/code-standards.md).
