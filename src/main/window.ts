import { join } from "node:path";
import {
  BrowserWindow,
  type BrowserWindowConstructorOptions,
  nativeTheme,
} from "electron";
import icon from "../../resources/icon.png?asset";

/** Matches --gray-1 in the renderer's tokens, so the window never flashes. */
const WINDOW_BACKGROUND = { light: "#ffffff", dark: "#0a0a0a" };

/** Room for the macOS traffic lights at the left of the toolbar. */
const MAC_TITLEBAR_INSET = "80px";

interface MainWindowOptions {
  platform: NodeJS.Platform;
  /** The dev server's address in development; undefined loads the built files. */
  rendererUrl: string | undefined;
}

export function createMainWindow({
  platform,
  rendererUrl,
}: MainWindowOptions): BrowserWindow {
  const isMac = platform === "darwin";
  const options: BrowserWindowConstructorOptions = {
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    title: "Book",
    // Shown on ready-to-show, once the first frame is painted.
    show: false,
    backgroundColor: nativeTheme.shouldUseDarkColors
      ? WINDOW_BACKGROUND.dark
      : WINDOW_BACKGROUND.light,
    // macOS: no title bar; the toolbar sits beside the traffic lights.
    // Windows keeps its standard frame and menu bar.
    titleBarStyle: isMac ? "hiddenInset" : "default",
    trafficLightPosition: { x: 16, y: 16 },
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  };
  // Windows and macOS take the icon from the packaged app instead.
  if (platform === "linux") options.icon = icon;

  const window = new BrowserWindow(options);

  window.on("ready-to-show", () => window.show());

  // Book is offline and has one page: no pop-up windows, no navigating away.
  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  window.webContents.on("will-navigate", (event) => event.preventDefault());

  if (isMac) keepTitlebarInset(window);

  if (rendererUrl) {
    void window.loadURL(rendererUrl);
  } else {
    void window.loadFile(join(__dirname, "../renderer/index.html"));
  }

  return window;
}

/**
 * Sets --titlebar-inset on the page. Main sets it rather than the renderer, so
 * the renderer never needs to know which OS it runs on. In full screen the
 * traffic lights are hidden, so the inset goes back to 0.
 */
function keepTitlebarInset(window: BrowserWindow): void {
  let insertedKey: string | undefined;

  const apply = async (): Promise<void> => {
    if (insertedKey) {
      await window.webContents.removeInsertedCSS(insertedKey);
      insertedKey = undefined;
    }
    if (!window.isFullScreen()) {
      insertedKey = await window.webContents.insertCSS(
        `:root { --titlebar-inset: ${MAC_TITLEBAR_INSET}; }`,
      );
    }
  };

  // dom-ready fires on every load, including a reload.
  window.webContents.on("dom-ready", () => {
    insertedKey = undefined;
    void apply();
  });
  window.on("enter-full-screen", () => void apply());
  window.on("leave-full-screen", () => void apply());
}
