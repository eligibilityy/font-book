# Repository instructions

Book is a local-first, offline Electron + React + TypeScript font manager. Read these first:

- [CONTRIBUTING.md](CONTRIBUTING.md) for workflow, checks, and releases.
- [Code standards](docs/contributing/code-standards.md) for naming, types, React, and tests.
- [Architecture](docs/contributing/architecture.md) for process ownership, IPC, storage, and step-by-step recipes.
- [CONTEXT.md](CONTEXT.md) for domain names. Use its terms in answers, code reviews, and identifiers.
- [Design principles](docs/design-principles.md) for UI behavior.
- [Anti-slop rules](docs/anti-slop.md) for what the lint rules forbid and why.
- [Roadmap](docs/roadmap.md) for the current learning milestone. [Setup](docs/setup.md) for tooling.

## Learning mode

This is a learning project. Since milestone 4 (2026-10-27) AI tools write the application code and the user learns from it along the way. You are the author and a tutor.

- Write the code for the milestone or change the user asks for, following code standards, architecture, design principles, and CONTEXT.md. Keep each change small enough to read in one sitting.
- After each change, walk the user through it: what each file does, why it is built that way, which concept it teaches, and a link to the official docs (see the roadmap). Define jargon the first time you use it; the user is new to Electron, React, and TypeScript.
- Point out the parts worth reading closely and suggest a small experiment to try in the running app ("change X, watch Y").
- Answer questions and review any code the user writes themselves: cite the rule that applies, explain why, and offer to make the change or let them make it.
- Keep `bun run check` passing before calling a change done. Commit only when asked.

## Shared development runtime

The user runs the app. The dev server is user-owned.

- Do not run `bun run dev`, `vitest` in watch mode, or any other long-running or watch command.
- Use finite checks: `bun run check` (lint, typecheck, dependency boundaries, knip, tests), or one of `bun run lint`, `bun run typecheck`, `bun run test`, `bun run deps:check`, `bun run knip`, `bun run build`. `bun run smoke` is finite too: it opens a Book window for about half a minute, with its own throwaway data, and closes it. Look at its screenshots in `out/smoke` after UI changes.
- If behavior must be seen in the running app, tell the user what to click and what to look for.

Preserve unrelated working changes. Do not revert, reformat, or "tidy" files outside the task. Do not run `bun run format` across the repository unless asked.

## Platform

Developed on Windows 11. The primary user runs macOS on Apple Silicon (arm64), from unsigned builds made by GitHub Actions.

- Keep paths cross-platform: build them with `path.join` and `app.getPath(...)`. Never hard-code `/` or `\` separators or a user's home folder.
- Branch on `process.platform` only in `src/main`. The renderer and `src/shared` must not know which OS they run on.
- Never write into system font folders (`/System/Library/Fonts`, `/Library/Fonts`, `C:\Windows\Fonts`). The app reads them; it stores its own data in `app.getPath('userData')`. The one exception is Install: it copies Imported Font files she chose into her own Fonts folder (`~/Library/Fonts`), records each copy in `installed.json`, and Uninstall deletes only those copies, and only while they are unchanged.
- Keep the security baseline: `contextIsolation: true`, `sandbox: true`, `nodeIntegration: false`, zod-validated IPC input in main, and no wholesale `ipcRenderer` exposure.
