import { BrowserWindow, Menu, type MenuItemConstructorOptions } from "electron";
import { libraryChannels } from "../shared/contracts/library";

interface MenuOptions {
  platform: NodeJS.Platform;
  isDevelopment: boolean;
}

/**
 * The application menu. Menu accelerators are Book's keyboard shortcuts, so
 * nothing else may intercept these keys (the template's
 * `optimizer.watchWindowShortcuts` did, and broke Mod+R in packaged builds).
 */
export function buildApplicationMenu({
  platform,
  isDevelopment,
}: MenuOptions): Menu {
  const isMac = platform === "darwin";

  const scanAgain: MenuItemConstructorOptions = {
    label: "Scan Again",
    accelerator: "CommandOrControl+R",
    click: (_item, window) => {
      // Menu clicks report a BaseWindow; only a BrowserWindow has a page to tell.
      if (window instanceof BrowserWindow) {
        window.webContents.send(libraryChannels.scanRequested);
      }
    },
  };

  const template: MenuItemConstructorOptions[] = [
    {
      label: "File",
      submenu: [
        scanAgain,
        { type: "separator" },
        isMac ? { role: "close" } : { role: "quit" },
      ],
    },
    { role: "editMenu" },
    { label: "View", submenu: [{ role: "togglefullscreen" }] },
    { role: "windowMenu" },
  ];

  if (isMac) {
    // The Book menu: About, Hide, Hide Others, Quit.
    template.unshift({ role: "appMenu" });
  } else {
    template.push({ role: "help", submenu: [{ role: "about" }] });
  }

  if (isDevelopment) {
    template.push({
      label: "Developer",
      submenu: [
        { role: "toggleDevTools", accelerator: "F12" },
        // Mod+R belongs to Scan Again, so reloading moves to Mod+Shift+R.
        { role: "reload", accelerator: "CommandOrControl+Shift+R" },
      ],
    });
  }

  return Menu.buildFromTemplate(template);
}
