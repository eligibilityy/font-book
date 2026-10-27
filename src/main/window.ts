import { join } from "node:path";
import {
  BrowserWindow,
  type BrowserWindowConstructorOptions,
  nativeTheme,
  type Rectangle,
  screen,
} from "electron";
import icon from "../../resources/icon.png?asset";

/** Matches --gray-1 in the renderer's tokens, so the window never flashes. */
const WINDOW_BACKGROUND = { light: "#ffffff", dark: "#0a0a0a" };

/** Room for the macOS traffic lights at the left of the toolbar. */
const MAC_TITLEBAR_INSET = "80px";

export interface WindowPlacement {
  bounds: Rectangle | null;
  isMaximized: boolean;
}

interface MainWindowOptions {
  platform: NodeJS.Platform;
  /** The dev server's address in development; undefined loads the built files. */
  rendererUrl: string | undefined;
  /** Where the window was last time. */
  placement: WindowPlacement;
  onPlacementChange: (placement: WindowPlacement) => void;
}

export function createMainWindow({
  platform,
  rendererUrl,
  placement,
  onPlacementChange,
}: MainWindowOptions): BrowserWindow {
  const isMac = platform === "darwin";
  const bounds = visibleBounds(placement.bounds);
  const options: BrowserWindowConstructorOptions = {
    width: bounds?.width ?? 1280,
    height: bounds?.height ?? 800,
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
  if (bounds) {
    options.x = bounds.x;
    options.y = bounds.y;
  }

  const window = new BrowserWindow(options);

  window.on("ready-to-show", () => {
    if (placement.isMaximized) window.maximize();
    window.show();
  });
  rememberPlacement(window, onPlacementChange);

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

/** Saves the window's place a moment after she stops moving or resizing it. */
function rememberPlacement(
  window: BrowserWindow,
  onPlacementChange: (placement: WindowPlacement) => void,
): void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const save = (): void => {
    if (window.isDestroyed() || window.isMinimized() || window.isFullScreen())
      return;
    onPlacementChange({
      // While maximized, keep the size it returns to.
      bounds: window.getNormalBounds(),
      isMaximized: window.isMaximized(),
    });
  };
  const saveSoon = (): void => {
    clearTimeout(timer);
    timer = setTimeout(save, 400);
  };
  window.on("resize", saveSoon);
  window.on("move", saveSoon);
  window.on("maximize", saveSoon);
  window.on("unmaximize", saveSoon);
  window.on("close", () => {
    clearTimeout(timer);
    save();
  });
}

/**
 * The saved bounds, if they still land on a connected display. A window saved
 * on an external monitor would otherwise open off-screen on the laptop alone.
 */
function visibleBounds(bounds: Rectangle | null): Rectangle | null {
  if (!bounds) return null;
  const { workArea } = screen.getDisplayMatching(bounds);
  const overlapsX =
    bounds.x < workArea.x + workArea.width - 100 &&
    bounds.x + bounds.width > workArea.x + 100;
  const overlapsY =
    bounds.y >= workArea.y - 10 &&
    bounds.y < workArea.y + workArea.height - 100;
  if (!overlapsX || !overlapsY) return null;
  return {
    ...bounds,
    width: Math.min(bounds.width, workArea.width),
    height: Math.min(bounds.height, workArea.height),
  };
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
