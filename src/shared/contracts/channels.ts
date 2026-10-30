// Every IPC channel name, in a file with no imports at all. The preload runs
// sandboxed and can't load packages, so it must never import a contract file
// that pulls in zod; it imports channel names from here and types elsewhere.

export const libraryChannels = {
  load: "library:load",
  scan: "library:scan",
  readStyleBytes: "library:read-style-bytes",
  showInFolder: "library:show-in-folder",
  importPaths: "library:import-paths",
  importWithDialog: "library:import-with-dialog",
  install: "library:install",
  uninstall: "library:uninstall",
  scanProgress: "library:scan-progress",
} as const;

export const storageChannels = {
  loadAll: "storage:load-all",
  saveCollections: "storage:save-collections",
  saveClassifications: "storage:save-classifications",
  savePrefs: "storage:save-prefs",
} as const;

export const exportChannels = {
  savePng: "export:save-png",
} as const;

export const appChannels = {
  getInfo: "app:get-info",
  command: "app:command",
  clickMenuItem: "app:click-menu-item",
} as const;
