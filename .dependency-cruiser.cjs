// dependency-cruiser checks who may import whom (`bun run deps:check`).
// It replaces Pond's scripts/check-architecture.mjs with config: Electron runs
// three separate programs (main, preload, renderer), and an import across that
// line either breaks the build or leaks Node power into the web page.

const RENDERER = "^src/renderer/";
const MAIN = "^src/main/";
const PRELOAD = "^src/preload/";
const SHARED = "^src/shared/";
const ELECTRON = "^node_modules/(electron|@electron-toolkit/[^/]+)/";

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "renderer-not-to-main-or-preload",
      comment:
        "The renderer is a web page. It reaches main only through window.api, which preload exposes. Shared types belong in src/shared.",
      severity: "error",
      from: { path: RENDERER },
      to: { path: [MAIN, PRELOAD] },
    },
    {
      name: "renderer-not-to-node",
      comment:
        "The renderer runs sandboxed without Node. File and font access goes through IPC to main.",
      severity: "error",
      from: { path: RENDERER },
      to: { dependencyTypes: ["core"] },
    },
    {
      name: "renderer-not-to-electron",
      comment:
        "Electron APIs exist only in main and preload. The renderer calls window.api instead.",
      severity: "error",
      from: { path: RENDERER },
      to: { path: ELECTRON },
    },
    {
      name: "main-not-to-renderer",
      comment:
        "Main is the Node process. React code is bundled separately and never runs there.",
      severity: "error",
      from: { path: MAIN },
      to: { path: RENDERER },
    },
    {
      name: "preload-not-to-main-or-renderer",
      comment:
        "Preload is a thin bridge: it forwards calls with ipcRenderer and holds no app logic. Contracts live in src/shared.",
      severity: "error",
      from: { path: PRELOAD },
      to: { path: [MAIN, RENDERER] },
    },
    {
      name: "shared-not-to-process-code",
      comment:
        "src/shared holds contracts (types, zod schemas, IPC channel names) that every process loads, so it imports no process code or Electron.",
      severity: "error",
      from: { path: SHARED },
      to: { path: [MAIN, PRELOAD, RENDERER, ELECTRON] },
    },
    {
      name: "shared-not-to-node",
      comment:
        "src/shared also runs in the renderer, which has no Node built-ins.",
      severity: "error",
      from: { path: SHARED },
      to: { dependencyTypes: ["core"] },
    },
    {
      name: "main-entry-not-imported",
      comment:
        "src/main/index.ts is the startup file. Import the module that owns the code instead.",
      severity: "error",
      from: { pathNot: "^src/main/index\\.ts$" },
      to: { path: "^src/main/index\\.ts$" },
    },
    {
      name: "renderer-shared-not-to-features",
      comment:
        "src/renderer/src/shared is reusable UI. It must not depend on a feature; move the code into the feature or pass it in as a prop.",
      severity: "error",
      from: { path: "^src/renderer/src/shared/" },
      to: { path: "^src/renderer/src/features/" },
    },
    {
      name: "feature-entry-only",
      comment:
        "A feature may use another feature only through its index.ts, so each feature controls its public API.",
      severity: "error",
      from: { path: "^src/renderer/src/features/([^/]+)/" },
      to: {
        path: "^src/renderer/src/features/[^/]+/",
        pathNot: [
          "^src/renderer/src/features/$1/",
          "^src/renderer/src/features/[^/]+/index\\.tsx?$",
        ],
      },
    },
    {
      name: "no-circular",
      comment:
        "A runtime import cycle makes load order fragile. Type-only cycles are allowed because they vanish at build time.",
      severity: "error",
      from: {},
      to: { circular: true, viaOnly: { dependencyTypesNot: ["type-only"] } },
    },
    {
      name: "not-to-test",
      comment: "App code must not import test files.",
      severity: "error",
      from: { pathNot: "\\.test\\.tsx?$" },
      to: { path: "\\.test\\.tsx?$" },
    },
    {
      name: "not-to-unresolvable",
      comment: "The import points at a file or package that does not exist.",
      severity: "error",
      from: {},
      to: { couldNotResolve: true },
    },
    {
      name: "no-non-package-json",
      comment:
        "The package is installed but not listed in package.json. Add it with bun add.",
      severity: "error",
      from: {},
      to: { dependencyTypes: ["npm-no-pkg", "npm-unknown"] },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    // Read type-only imports too, so boundary rules cover them and the cycle
    // rule can tell them apart.
    tsPreCompilationDeps: true,
    // tsconfig.web.json declares the @renderer/* alias.
    tsConfig: { fileName: "tsconfig.web.json" },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default", "types"],
      mainFields: ["module", "main", "types", "typings"],
      extensions: [".ts", ".tsx", ".d.ts", ".js", ".mjs", ".cjs", ".json"],
    },
    reporterOptions: {
      text: { highlightFocused: true },
    },
  },
};
