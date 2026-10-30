import { join } from "node:path";
import { app, BrowserWindow, ipcMain, Menu, nativeTheme } from "electron";
import {
  type AppInfo,
  type AppMenuEntry,
  menuItemPathSchema,
} from "../shared/contracts/app";
import { appChannels, libraryChannels } from "../shared/contracts/channels";
import { registerExportHandlers } from "./ipc/export";
import { registerLibraryHandlers } from "./ipc/library";
import { registerStorageHandlers } from "./ipc/storage";
import { installFolderFor, listFontFolders } from "./library/font-folders";
import { createLibraryService } from "./library/library-service";
import { buildApplicationMenu, clickMenuItem } from "./menu";
import { describeMenu } from "./menu-description";
import { type AppState, openStores, type Theme } from "./storage/stores";
import { createMainWindow, drawsWindowControlsOverToolbar } from "./window";

const isDevelopment = !app.isPackaged;

// Both must happen before the app is ready.
if (isDevelopment) {
  // Dev builds keep their own data, so `bun run dev` never reads or writes the
  // installed Book's Collections.
  app.setName("Book Dev");
  app.setPath("userData", join(app.getPath("appData"), "Book Dev"));
}
if (process.env.BOOK_USER_DATA_DIR) {
  // The smoke test passes a throwaway folder, so it never touches real data.
  app.setPath("userData", process.env.BOOK_USER_DATA_DIR);
}

// A second copy of Book would write the same files; focus this one instead.
if (app.requestSingleInstanceLock()) {
  startBook();
} else {
  app.quit();
}

function startBook(): void {
  let mainWindow: BrowserWindow | undefined;
  const stores = openStores(app.getPath("userData"));

  // Imported Font files are copies Book owns, so they live under userData.
  const importedFolder = join(app.getPath("userData"), "imported-fonts");
  const fontFolderEnvironment = {
    platform: process.platform,
    homePath: app.getPath("home"),
    windowsPath: process.env.WINDIR,
    localAppDataPath: process.env.LOCALAPPDATA,
  };
  const folders = listFontFolders(fontFolderEnvironment);
  // BOOK_INSTALL_FOLDER Installs into a stand-in Fonts folder instead, so
  // Install can be tried on Windows and in the smoke test.
  const installFolder =
    process.env.BOOK_INSTALL_FOLDER ?? installFolderFor(fontFolderEnvironment);
  if (
    installFolder &&
    !folders.some((folder) => folder.path === installFolder)
  ) {
    folders.push({ path: installFolder, kind: "user" });
  }
  const library = createLibraryService({
    folders: [...folders, { path: importedFolder, kind: "imported" }],
    importedFolder,
    indexFile: stores.libraryIndex,
    installFolder,
    installedFile: stores.installed,
    onProgress: (progress) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send(libraryChannels.scanProgress, progress);
      }
    },
  });

  app.on("second-instance", () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });

  void app.whenReady().then(async () => {
    // Groups Book's windows and notifications under one taskbar entry.
    if (process.platform === "win32") {
      app.setAppUserModelId("studio.yiliya.book");
    }

    // Start the Scan now, so it is often done by the time the page asks.
    void library.load();

    const stored = await stores.appState.load().catch(() => null);
    let appState: AppState = stored?.data ?? {
      version: 1,
      theme: "system",
      windowBounds: null,
      isMaximized: false,
    };
    const saveAppState = (
      changes: Partial<Omit<AppState, "version">>,
    ): void => {
      appState = { ...appState, ...changes };
      stores.appState.save(appState).catch((error: unknown) => {
        console.warn("Couldn't save the window state", error);
      });
    };

    // The page follows the theme through prefers-color-scheme, which
    // themeSource controls, so the renderer needs no theme code of its own.
    nativeTheme.themeSource = appState.theme;

    registerLibraryHandlers(library);
    registerStorageHandlers(stores);
    registerExportHandlers();
    ipcMain.handle(
      appChannels.getInfo,
      (): AppInfo => ({
        fileManagerName:
          process.platform === "darwin" ? "Finder" : "File Explorer",
        version: app.getVersion(),
        canInstall: installFolder !== null,
        menu: drawsWindowControlsOverToolbar(process.platform)
          ? describeMenu(Menu.getApplicationMenu()?.items ?? [])
          : [],
      }),
    );
    ipcMain.handle(
      appChannels.clickMenuItem,
      (event, input: unknown): AppMenuEntry[] => {
        const path = menuItemPathSchema.parse(input);
        const window = BrowserWindow.fromWebContents(event.sender);
        if (window) clickMenuItem(path, window);
        return describeMenu(Menu.getApplicationMenu()?.items ?? []);
      },
    );

    Menu.setApplicationMenu(
      buildApplicationMenu({
        platform: process.platform,
        isDevelopment,
        theme: appState.theme,
        onThemeChange: (theme: Theme) => {
          nativeTheme.themeSource = theme;
          saveAppState({ theme });
        },
      }),
    );

    const openMainWindow = (): void => {
      mainWindow = createMainWindow({
        platform: process.platform,
        rendererUrl: isDevelopment
          ? process.env.ELECTRON_RENDERER_URL
          : undefined,
        placement: {
          bounds: appState.windowBounds,
          isMaximized: appState.isMaximized,
        },
        onPlacementChange: ({ bounds, isMaximized }) => {
          saveAppState({ windowBounds: bounds, isMaximized });
        },
      });
    };
    openMainWindow();

    // macOS: clicking the Dock icon with no windows open reopens one.
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) openMainWindow();
    });
  });

  // macOS apps keep running with no windows until she quits with Cmd+Q.
  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
}
