import { join } from "node:path";
import { app, BrowserWindow, Menu } from "electron";
import { registerLibraryHandlers } from "./ipc/library";
import { listFontFolders } from "./library/font-folders";
import { buildApplicationMenu } from "./menu";
import { createMainWindow } from "./window";

const isDevelopment = !app.isPackaged;

if (isDevelopment) {
  // Dev builds keep their own data, so `bun run dev` never reads or writes the
  // installed Book's Collections. Must happen before the app is ready.
  app.setName("Book Dev");
  app.setPath("userData", join(app.getPath("appData"), "Book Dev"));
}

// A second copy of Book would write the same files; focus this one instead.
if (app.requestSingleInstanceLock()) {
  startBook();
} else {
  app.quit();
}

function startBook(): void {
  let mainWindow: BrowserWindow | undefined;

  const openMainWindow = (): void => {
    mainWindow = createMainWindow({
      platform: process.platform,
      rendererUrl: isDevelopment
        ? process.env.ELECTRON_RENDERER_URL
        : undefined,
    });
  };

  app.on("second-instance", () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });

  void app.whenReady().then(() => {
    // Groups Book's windows and notifications under one taskbar entry.
    if (process.platform === "win32") {
      app.setAppUserModelId("studio.yiliya.book");
    }

    registerLibraryHandlers(
      listFontFolders({
        platform: process.platform,
        homePath: app.getPath("home"),
        windowsPath: process.env.WINDIR,
        localAppDataPath: process.env.LOCALAPPDATA,
      }),
    );
    Menu.setApplicationMenu(
      buildApplicationMenu({ platform: process.platform, isDevelopment }),
    );
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
