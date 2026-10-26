# Setup

This repository already has its guardrails: the config files that check your code. The app itself comes from the electron-vite template, which you generate and copy in. Follow the parts in order. Part 1 is roadmap milestone 1, Part 2 is milestone 2, and Part 4 is milestone 3.

Files already here, and what each tool does:

| File | Tool | What it does |
| --- | --- | --- |
| `biome.jsonc` | [Biome](https://biomejs.dev/) | Formats code and lints it (finds bugs and risky patterns). Replaces the template's ESLint and Prettier. |
| `tools/biome/no-unjustified-type-assertion.grit` | Biome plugin | Flags every `as` type assertion that has no written SAFETY reason. |
| `.dependency-cruiser.cjs` | [dependency-cruiser](https://github.com/sverweij/dependency-cruiser) | Checks who may import whom, so main, preload, and renderer code stay separate. |
| `knip.json` | [Knip](https://knip.dev/) | Finds unused files, exports, and dependencies. |
| `commitlint.config.cjs` | [commitlint](https://commitlint.js.org/) | Rejects commit messages that are not [Conventional Commits](https://www.conventionalcommits.org/). |
| `.husky/pre-commit`, `.husky/commit-msg` | [husky](https://typicode.github.io/husky/) | Git hooks: lint before each commit, check the message after you write it. |
| `.github/workflows/ci.yml` | GitHub Actions | Runs `npm run check` and `npm run build` on every push and pull request. |
| `.github/workflows/release.yml` | GitHub Actions | Builds the Mac and Windows installers and publishes a GitHub Release. |
| `.gitattributes` | Git | Keeps line endings as LF on Windows, so Biome does not see every file as changed. |

[docs/anti-slop.md](anti-slop.md) explains what the rules forbid and why.

## Before you start

In PowerShell, check your tools:

```powershell
node -v   # v22.12 or newer (you have 22.19)
npm -v    # 11.x
git --version
```

In VS Code, install the **Biome** extension (`biomejs.biome`).

## Part 1: Scaffold the app

### 1. Generate the template in a temporary folder

The generator empties a folder that is not empty, so never point it at `D:\Projects\font-book`. Generate into a fresh folder instead. The last folder name becomes the app's package name, so call it `font-book`:

```powershell
New-Item -ItemType Directory D:\Projects\font-book-tmp
cd D:\Projects\font-book-tmp
npm create @quick-start/electron@1.0.31 font-book -- --template react-ts --skip
```

`--skip` answers the remaining questions with "no": no auto-updater (the app is offline) and no download mirror. Version 1.0.31 is the version these instructions were checked against. Only use `--skip` in an empty folder: it also skips the "folder is not empty" warning and wipes the folder.

### 2. Copy it into the repository without overwriting anything

```powershell
robocopy D:\Projects\font-book-tmp\font-book D:\Projects\font-book /E /XC /XN /XO
```

- `/E` copies all folders, including empty ones.
- `/XC /XN /XO` skip any file that already exists in the destination, whether it is the same age, newer, or older. Files already in `font-book` are never replaced.
- Robocopy reports success with exit codes 0 to 7. Exit code 1 means "files copied". Only 8 or higher is a failure.
- Do not add `/MIR` or `/PURGE`. They delete files in the destination.

Check that the copy worked (`package.json`, `src\main\index.ts`, and `electron-builder.yml` exist in `D:\Projects\font-book`), then delete the temporary folder:

```powershell
Remove-Item -Recurse -Force D:\Projects\font-book-tmp
```

### 3. Start Git, install, and run

Run `git init` before installing, because the husky setup in Part 2 needs the `.git` folder:

```powershell
cd D:\Projects\font-book
git init -b main
npm install
npm run dev
```

`npm install` also downloads the Electron binary (about 100 MB), so the first install is slow. A window titled "Electron" opens. Close it with the window's close button or Ctrl+C in the terminal.

Commit the untouched template, so later diffs show only your changes:

```powershell
git add -A
git commit -m "chore: scaffold electron-vite react-ts app"
```

Now work through roadmap milestone 1 before you continue.

## Part 2: Add the guardrails

### 4. Remove ESLint and Prettier

Biome replaces both. Delete their config files and packages:

```powershell
Remove-Item eslint.config.mjs, .prettierrc.yaml, .prettierignore
npm uninstall eslint prettier @electron-toolkit/eslint-config-prettier @electron-toolkit/eslint-config-ts eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-react-refresh
```

### 5. Install the tools at exact versions

`--save-exact` writes `2.6.3` instead of `^2.6.3`, so everyone (and CI) runs the same tool version, and an update happens only when you choose it:

```powershell
npm i -D --save-exact @biomejs/biome@2.6.3 dependency-cruiser@18.7.0 knip@6.43.0 vitest@5.0.5 husky@9.1.7 @commitlint/cli@21.2.4 @commitlint/config-conventional@21.2.4
```

### 6. Replace the scripts in `package.json`

Replace the whole `"scripts"` block with this. Keep the template's `postinstall` line as it is:

```json
"scripts": {
  "dev": "electron-vite dev",
  "start": "electron-vite preview",
  "build": "npm run typecheck && electron-vite build",
  "lint": "biome ci . --error-on-warnings",
  "lint:fix": "biome check --write .",
  "format": "biome format --write .",
  "typecheck:node": "tsc --noEmit -p tsconfig.node.json --composite false",
  "typecheck:web": "tsc --noEmit -p tsconfig.web.json --composite false",
  "typecheck": "npm run typecheck:node && npm run typecheck:web",
  "test": "vitest run --passWithNoTests",
  "knip": "knip",
  "deps:check": "depcruise src --config .dependency-cruiser.cjs",
  "check": "npm run lint && npm run typecheck && npm run deps:check && npm run knip && npm run test",
  "postinstall": "install-electron && electron-builder install-app-deps",
  "prepare": "husky",
  "build:unpack": "npm run build && electron-builder --dir",
  "build:mac": "npm run build && electron-builder --mac --arm64",
  "build:win": "npm run build && electron-builder --win --x64"
},
```

| Script | What it does |
| --- | --- |
| `dev` | Runs the app with hot reload. |
| `build` | Typechecks, then bundles main, preload, and renderer into `out/`. |
| `lint` | Checks formatting and lint rules without changing files. Fails on any error or warning. This is what CI and the pre-commit hook run. |
| `lint:fix` | Formats, sorts imports, and applies safe lint fixes. |
| `format` | Formats only. |
| `typecheck` | Runs the TypeScript checker on the Node side (main, preload) and the web side (renderer). |
| `test` | Runs the Vitest tests once. `--passWithNoTests` lets it pass before your first test exists; remove it once you have tests. |
| `knip` | Reports unused files, exports, and dependencies. |
| `deps:check` | Checks import boundaries with dependency-cruiser. |
| `check` | All of the checks above, in order. Run it before every push. |
| `prepare` | npm runs this after `npm install`; it switches on the husky hooks. |
| `build:mac` | Builds the Apple Silicon (`arm64`) `.dmg` and `.zip`. Only works on a Mac, so CI runs it. |
| `build:win` | Builds the Windows x64 installer. Works on your PC. |

While you are in `package.json`, set `"version": "0.1.0"` and replace `"author": "example.com"` and `"description"` with your own.

### 7. Make TypeScript stricter

In both `tsconfig.node.json` and `tsconfig.web.json`, add these lines inside `"compilerOptions"`:

```json
"strict": true,
"noImplicitAny": true,
"noUncheckedIndexedAccess": true,
"exactOptionalPropertyTypes": true,
"noImplicitOverride": true
```

- `strict` turns on TypeScript's core safety checks, such as treating `null` and `undefined` as separate types. The template's base config already sets it; writing it here makes it visible.
- `noImplicitAny` makes TypeScript report an error when it cannot work out a type, instead of silently using `any`. The template's base config (`@electron-toolkit/tsconfig`) turns this off, so you must turn it back on.
- `noUncheckedIndexedAccess` types `list[i]` and `record[key]` as possibly `undefined`, because that item may not exist.
- `exactOptionalPropertyTypes` makes `{ weight?: number }` mean "absent, or a number". You cannot set `weight: undefined` by accident.
- `noImplicitOverride` requires the `override` keyword on a class method that replaces a parent's method, so a rename in the parent is caught.

Also add `"src/shared/**/*"` to the `"include"` list in both files, so the shared contracts are checked by both sides.

### 8. Use the `@/` import alias

The docs import renderer code as `@/features/library`. The template calls this alias `@renderer`. Rename it in two places.

In `tsconfig.web.json`, replace the `"paths"` entry:

```json
"paths": {
  "@/*": ["src/renderer/src/*"]
}
```

In `electron.vite.config.ts`, replace the alias:

```ts
alias: {
  "@": resolve("src/renderer/src"),
},
```

dependency-cruiser reads the alias from `tsconfig.web.json`, so boundary checks understand `@/` imports too.

### 9. Configure the installers in `electron-builder.yml`

[electron-builder](https://www.electron.build/) turns the built app into installers. Replace the whole file with:

```yaml
# Placeholder: replace with a reverse-DNS id you control, e.g. com.yourname.fontbook.
# macOS uses it to tell apps apart, so keep it stable once she has installed one.
appId: com.example.fontbook
productName: font-book
directories:
  buildResources: build
files:
  - "!**/.vscode/*"
  - "!src/*"
  - "!electron.vite.config.{js,ts,mjs,cjs}"
  - "!{dev-app-update.yml,CHANGELOG.md,README.md}"
  - "!{.env,.env.*,.npmrc}"
  - "!{tsconfig.json,tsconfig.node.json,tsconfig.web.json}"
  # Tooling and docs never ship inside the app.
  - "!{biome.jsonc,knip.json,.dependency-cruiser.cjs,commitlint.config.cjs,.gitattributes}"
  - "!{AGENTS.md,CLAUDE.md,CONTEXT.md,CONTRIBUTING.md}"
  - "!{docs,tools,.husky,.github,.claude}/**/*"
asarUnpack:
  - resources/**
win:
  executableName: font-book
  target:
    - target: nsis
      arch:
        - x64
nsis:
  artifactName: ${name}-${version}-setup.${ext}
  shortcutName: ${productName}
  uninstallDisplayName: ${productName}
  createDesktopShortcut: always
mac:
  category: public.app-category.graphics-design
  target:
    - target: dmg
      arch:
        - arm64
    - target: zip
      arch:
        - arm64
  # No Apple Developer ID: ad-hoc sign ("-") so Apple Silicon will launch the
  # arm64 binary. Ad-hoc signing needs hardenedRuntime off. No notarization.
  identity: "-"
  hardenedRuntime: false
  notarize: false
  entitlementsInherit: build/entitlements.mac.plist
  extendInfo:
    NSDocumentsFolderUsageDescription: font-book reads font files you keep in Documents.
    NSDownloadsFolderUsageDescription: font-book reads font files you keep in Downloads.
dmg:
  artifactName: ${name}-${version}-${arch}.${ext}
npmRebuild: false
```

What changed from the template, and why:

- **`mac.target`**: one `dmg` (the installer she opens) and one `zip`, both `arm64` only, because her M5 MacBook Air is Apple Silicon.
- **`identity: "-"`**: there is no paid Apple Developer certificate, so the app is not signed by a known developer. Apple Silicon refuses to run code with no signature at all, so electron-builder signs it "ad-hoc": a signature that proves the files are intact but not who made them. (`identity: null` would skip signing entirely.) Ad-hoc signing requires `hardenedRuntime: false`.
- **`notarize: false`**: notarization is Apple's malware scan for signed apps. It needs a Developer account, so it is off.
- **`win.target`**: an NSIS installer (`font-book-0.1.0-setup.exe`) for 64-bit Windows.
- **Removed**: the Linux targets (not built), the camera and microphone permission texts (the app never uses them), and the `publish` block (the app has no auto-updater; the release workflow uploads the files).
- **`productName`**: the name shown in Finder and the Dock. You can change it, but do not use exactly "Font Book": that is the name of Apple's built-in font app.

### 10. Point VS Code at Biome

Replace `.vscode/settings.json` with:

```json
{
  "editor.defaultFormatter": "biomejs.biome",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "quickfix.biome": "explicit",
    "source.organizeImports.biome": "explicit"
  }
}
```

In `.vscode/extensions.json`, replace `"dbaeumer.vscode-eslint"` with `"biomejs.biome"`.

### 11. Switch on the Git hooks

```powershell
npm run prepare
```

This tells Git to run the hooks in `.husky/`. Do not run `npx husky init`: it overwrites `.husky/pre-commit` with `npm test`.

### 12. Format, then fix what is left

```powershell
npm run lint:fix
npm run lint
```

`lint:fix` reformats every file to Biome's style (double quotes, semicolons), sorts imports, and applies safe fixes. `lint` then lists what you must fix by hand. On a fresh template, expect these, all in demo code:

| Error | File | What to do |
| --- | --- | --- |
| `useNodejsImportProtocol` | `electron.vite.config.ts`, `src/main/index.ts` | Import Node's built-in modules with the `node:` prefix: `"node:path"` instead of `"path"`. It makes clear the module comes from Node, not npm. |
| `noConsole` | `src/main/index.ts` | The template's `ping` handler logs with `console.log`. Delete that demo handler. Real IPC comes in milestone 4. |
| `useValidAnchor`, `useKeyWithClickEvents`, `noStaticElementInteractions` | `src/renderer/src/App.tsx` | The "Send IPC" link is an `<a>` with no `href` that acts like a button, which keyboard and screen-reader users cannot use. Delete it with the `ping` handler, or make it a `<button type="button">`. |
| `useHtmlLang` | `src/renderer/index.html` | Add `lang="en"` to `<html>`, so screen readers use the right voice. |
| `noNonNullAssertion` | `src/renderer/src/main.tsx` | `getElementById("root")!` tells TypeScript "trust me, it exists". Instead, store the result, check it for `null`, and throw an `Error` with a clear message if it is missing. Do not swap `!` for `as HTMLElement`: the assertion plugin flags that too. |

Biome may also print `useLiteralKeys` notes about `process.env["ELECTRON_RENDERER_URL"]`. Those are info messages and do not fail `lint`; `process.env.ELECTRON_RENDERER_URL` is the suggested form.

Deleting the demo leaves the `ipcMain` import in `src/main/index.ts` and the `ipcHandle` function in `App.tsx` unused, so Biome flags them next (`noUnusedImports`, `noUnusedVariables`). Delete them too.

Rerun `npm run lint` until it prints no errors. When a rule's message is unclear, its name links to the Biome docs page for that rule.

### 13. Run every check

```powershell
npm run check
npm run build
```

`check` must end without errors: Biome, both typechecks, `no dependency violations found`, no Knip output, and Vitest's `No test files found, exiting with code 0`. If `typecheck` fails after step 7, read the error: it points to a line the stricter settings now reject.

### 14. Commit, and prove the hooks work

```powershell
git add -A
git commit -m "build: replace eslint and prettier with biome and add guardrails"
```

The pre-commit hook runs `npm run lint` first. Then prove the guardrails catch mistakes (roadmap milestone 2, "Done when"):

```powershell
git commit --allow-empty -m "stuff"   # rejected: "type may not be empty"
```

Add `const x: any = 1;` to any `.ts` file and run `npm run lint`: `noExplicitAny` fails. Remove the line.

## Part 3: Put it on GitHub

1. Create an empty **private** repository on GitHub named `font-book`, with no README, license, or .gitignore (the repository already has them).
2. Connect it and push:

   ```powershell
   git remote add origin https://github.com/<your-username>/font-book.git
   git push -u origin main
   ```

3. Open the repository's **Actions** tab. The **CI** workflow runs `npm ci`, `npm run check`, and `npm run build` on Ubuntu. It must be green.

`npm ci` installs exactly what `package-lock.json` says, so always commit `package-lock.json`. If CI says the lock file is out of sync, run `npm install` locally and commit the updated lock file.

## Part 4: First release

You can build the Windows installer on your PC with `npm run build:win` (output in `dist/`). The Mac build needs macOS, so GitHub Actions builds it on a `macos-latest` runner, which is Apple Silicon like her laptop.

**Test build, no release.** On GitHub: **Actions → Release → Run workflow**. When it finishes, the run page lists two artifacts: `mac-arm64` (the `.dmg` and `.zip`) and `windows-x64` (the `-setup.exe`).

**Real release.** Follow [CONTRIBUTING.md](../CONTRIBUTING.md#releases): `npm version patch` creates a `vX.Y.Z` tag, and pushing the tag runs the release workflow. It:

1. Checks that the tag matches `"version"` in `package.json`, then runs `npm run check`.
2. Builds the Mac `arm64` `.dmg` and `.zip` on macOS, and the Windows x64 installer on Windows, at the same time.
3. Publishes a GitHub Release with all three files and notes generated from the commit messages.

Builds use `--publish never`, and a separate `release` job uploads the files with [softprops/action-gh-release](https://github.com/softprops/action-gh-release). That way the two build machines never race to create the same release, and only the small upload job gets permission to write to the repository.

### Install on her Mac

The app is not signed by an identified developer or notarized, so macOS blocks the first launch. This is expected.

1. Download `font-book-<version>-arm64.dmg` from the GitHub Release, open it, and drag **font-book** into **Applications**.
2. Open font-book from Applications. macOS says it cannot verify the app. Click **Done** (not **Move to Trash**).
3. Open **System Settings → Privacy & Security**, scroll down to **Security**, and click **Open Anyway** next to the message about font-book. Confirm with her password or Touch ID, then click **Open**.

From then on it opens normally. Each new version may need step 3 again.

If macOS instead says **"font-book is damaged and can't be opened"**, the download's quarantine flag is the cause, not real damage. In **Terminal**, run:

```sh
xattr -cr /Applications/font-book.app
```

`xattr -cr` removes the "downloaded from the internet" flag from the app and everything inside it. Then open the app again.

### Install on Windows

Run `font-book-<version>-setup.exe`. If Windows SmartScreen says "Windows protected your PC", click **More info → Run anyway**. It warns because the installer is not code-signed.

## Troubleshooting

- **Every file shows as unformatted after a checkout.** Git converted line endings to CRLF. `.gitattributes` prevents this for new checkouts; to repair the current one, run `git add --renormalize .` and commit.
- **Hooks do not run.** Run `npm run prepare` again. `git config core.hooksPath` should print `.husky/_`.
- **`deps:check` reports `not-to-unresolvable` for an import that works.** The import uses an alias that is not in `tsconfig.web.json`'s `paths`. Add it there and in `electron.vite.config.ts`.
- **Knip reports a file as unused that you just created.** Nothing imports it yet. Import it, or delete it.
