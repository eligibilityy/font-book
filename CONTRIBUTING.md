# Contributing

## General

- **Tooling**: Node (runs the tools), Bun (installs packages and runs the scripts; `bun.lock` is the lock file), and the scripts in `package.json`. First-time setup is in [docs/setup.md](docs/setup.md).
- **Style**: [Biome](https://biomejs.dev/) formats and lints. `bun run format` formats; `bun run lint` checks.
- **Commits**: [Conventional Commits](https://www.conventionalcommits.org/), enforced by commitlint and husky.
- **Checks**: run `bun run check` before pushing. It runs lint, typecheck, dependency boundaries (`deps:check`), unused-code detection (`knip`), and tests.
- **Standards**: [code standards](docs/contributing/code-standards.md), [architecture](docs/contributing/architecture.md), [design principles](docs/design-principles.md), [anti-slop rules](docs/anti-slop.md), and the glossary in [CONTEXT.md](CONTEXT.md). Human and AI contributors follow the same documents.

## Workflow

1. Start from an up-to-date `main` and create a branch named for the change: `feat/specimen-axes`, `fix/scan-ttc-files`, `docs/roadmap`.
2. Make small commits. Each commit does one thing and leaves the app working.
3. Write commit messages as `type(scope): summary`, for example `feat(library): list Font files from Font folders` or `fix(specimen): clean up FontFace on unmount`. Common types: `feat`, `fix`, `refactor`, `test`, `docs`, `build`, `ci`, `chore`. Scopes are usually a process (`main`, `preload`) or a feature (`library`, `specimen`, `collections`).
4. Run `bun run check`. Fix what it reports instead of disabling the rule.
5. Push the branch and open a pull request. Fill in the template: what changed and why, how you verified it (checks plus what you clicked in the app), and any change to stored files in `userData`.
6. Merge when CI is green. Prefer squash merges so `main` reads as one Conventional Commit per change.

Keep pull requests focused: one feature or fix. Keep file moves separate from behavior changes so each is easy to review.

## Tests

Use temporary directories and small fixture Font files in tests. Never depend on the fonts installed on the machine running the tests, on the user's `userData`, or on the network. See [code standards](docs/contributing/code-standards.md#tests).

## Releases

Releases are built by GitHub Actions, not on a laptop. A Windows machine cannot build the macOS app.

1. On an up-to-date `main`, bump the version and create a tag: `bun pm version patch -m "chore(release): %s"` (or `minor`). This writes `package.json`, commits, and tags `vX.Y.Z`.
2. Push the commit and the tag: `git push --follow-tags`.
3. The release workflow runs on the `vX.Y.Z` tag. It builds the macOS arm64 app (`build:mac`) on a `macos-latest` runner and the Windows installer (`build:win`), then attaches both to a GitHub Release.
4. Download the macOS build on the Mac and install it. The build is unsigned, so macOS will warn the first time it opens; [docs/setup.md](docs/setup.md) explains how to allow it.

Note in the release description any change to files the app stores in `userData`.

## Links

- [docs/roadmap.md](docs/roadmap.md): learning milestones.
- [docs/setup.md](docs/setup.md): scaffold, tooling, CI, and release setup.
- [Electron security checklist](https://www.electronjs.org/docs/latest/tutorial/security)
- [Conventional Commits](https://www.conventionalcommits.org/)
