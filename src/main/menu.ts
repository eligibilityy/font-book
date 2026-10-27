import {
  type BaseWindow,
  BrowserWindow,
  Menu,
  type MenuItemConstructorOptions,
} from "electron";
import type { AppCommand } from "../shared/contracts/app";
import { appChannels } from "../shared/contracts/channels";
import type { Theme } from "./storage/stores";

interface MenuOptions {
  platform: NodeJS.Platform;
  isDevelopment: boolean;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
}

/**
 * The application menu, and the one list of Book's shortcuts. Each item sends
 * an AppCommand to the page, which decides what it means in the current view.
 *
 * Single keys (Space, Enter) are shown with `registerAccelerator: false`: the
 * menu lists them, but they never steal typing from a text field.
 */
export function buildApplicationMenu({
  platform,
  isDevelopment,
  theme,
  onThemeChange,
}: MenuOptions): Menu {
  const isMac = platform === "darwin";
  const fileManagerName = isMac ? "Finder" : "File Explorer";

  const command = (
    label: string,
    appCommand: AppCommand,
    accelerator?: string,
    registerAccelerator = true,
  ): MenuItemConstructorOptions => {
    const item: MenuItemConstructorOptions = {
      label,
      click: (_item, window) => send(window, appCommand),
    };
    if (accelerator !== undefined) {
      item.accelerator = accelerator;
      item.registerAccelerator = registerAccelerator;
    }
    return item;
  };

  const themeItem = (
    label: string,
    value: Theme,
  ): MenuItemConstructorOptions => ({
    label,
    type: "radio",
    checked: theme === value,
    click: () => onThemeChange(value),
  });

  const template: MenuItemConstructorOptions[] = [
    {
      label: "File",
      submenu: [
        command("New Collection", "new-collection", "CommandOrControl+N"),
        command("Scan Again", "scan-again", "CommandOrControl+R"),
        { type: "separator" },
        isMac ? { role: "close" } : { role: "quit" },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" },
        { type: "separator" },
        command("Find", "find", "CommandOrControl+F"),
      ],
    },
    {
      label: "View",
      submenu: [
        command(
          "Show or Hide Sidebar",
          "toggle-sidebar",
          "CommandOrControl+Alt+S",
        ),
        command(
          "Show or Hide Inspector",
          "toggle-inspector",
          "CommandOrControl+Alt+I",
        ),
        command(
          "Reverse Paper and Ink",
          "reverse-paper-and-ink",
          "CommandOrControl+Shift+P",
        ),
        { type: "separator" },
        command("Bigger", "size-bigger", "CommandOrControl+="),
        command("Smaller", "size-smaller", "CommandOrControl+-"),
        command("Default Size", "size-default", "CommandOrControl+0"),
        { type: "separator" },
        command("Reset Sample Text", "reset-sample-text"),
        {
          label: "Theme",
          submenu: [
            themeItem("System", "system"),
            themeItem("Light", "light"),
            themeItem("Dark", "dark"),
          ],
        },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "Go",
      submenu: [
        command("Back", "go-back", "CommandOrControl+["),
        { type: "separator" },
        command("All", "go-all", "CommandOrControl+1"),
        command("My Fonts", "go-my-fonts", "CommandOrControl+2"),
        command("System", "go-system", "CommandOrControl+3"),
        command("Favorites", "go-favorites", "CommandOrControl+4"),
      ],
    },
    {
      label: "Style",
      submenu: [
        command("Open Specimen", "open-specimen", "Enter", false),
        command("Quick Preview", "quick-preview", "Space", false),
        { type: "separator" },
        command(
          "Add to Favorites or Remove",
          "toggle-favorite",
          "CommandOrControl+D",
        ),
        command(
          "Add to Collection...",
          "add-to-collection",
          "CommandOrControl+Shift+A",
        ),
        { type: "separator" },
        command(`Show in ${fileManagerName}`, "show-in-folder"),
      ],
    },
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

function send(window: BaseWindow | undefined, command: AppCommand): void {
  // Menu clicks report a BaseWindow; only a BrowserWindow has a page to tell.
  const target =
    window instanceof BrowserWindow ? window : BrowserWindow.getAllWindows()[0];
  target?.webContents.send(appChannels.command, command);
}
