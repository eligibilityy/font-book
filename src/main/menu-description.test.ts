import { describe, expect, it } from "vitest";
import {
  type DescribableMenuItem,
  describeMenu,
  shortcutLabel,
} from "./menu-description";

function item(changes: Partial<DescribableMenuItem> = {}): DescribableMenuItem {
  return {
    label: "Item",
    type: "normal",
    accelerator: null,
    enabled: true,
    visible: true,
    checked: false,
    ...changes,
  };
}

describe("shortcutLabel", () => {
  it("writes modifiers the Windows way", () => {
    expect(shortcutLabel("CommandOrControl+Shift+R")).toBe("Ctrl+Shift+R");
    expect(shortcutLabel("CmdOrCtrl+Alt+I")).toBe("Ctrl+Alt+I");
    expect(shortcutLabel("Control+Y")).toBe("Ctrl+Y");
  });

  it("capitalizes letters and keeps named keys", () => {
    expect(shortcutLabel("CommandOrControl+f")).toBe("Ctrl+F");
    expect(shortcutLabel("F12")).toBe("F12");
    expect(shortcutLabel("Space")).toBe("Space");
    expect(shortcutLabel("CommandOrControl+Plus")).toBe("Ctrl++");
  });
});

describe("describeMenu", () => {
  it("gives every entry its path through the menu", () => {
    const menu = describeMenu([
      item({
        label: "View",
        type: "submenu",
        submenu: {
          items: [
            item({ label: "Find", accelerator: "CommandOrControl+F" }),
            item({ type: "separator" }),
            item({
              label: "Theme",
              type: "submenu",
              submenu: {
                items: [
                  item({ label: "Light", type: "radio", checked: true }),
                  item({ label: "Dark", type: "radio" }),
                ],
              },
            }),
          ],
        },
      }),
    ]);

    expect(menu).toEqual([
      {
        type: "submenu",
        path: [0],
        label: "View",
        entries: [
          {
            type: "item",
            path: [0, 0],
            label: "Find",
            shortcut: "Ctrl+F",
            enabled: true,
            checked: null,
          },
          { type: "separator", path: [0, 1] },
          {
            type: "submenu",
            path: [0, 2],
            label: "Theme",
            entries: [
              {
                type: "item",
                path: [0, 2, 0],
                label: "Light",
                shortcut: null,
                enabled: true,
                checked: true,
              },
              {
                type: "item",
                path: [0, 2, 1],
                label: "Dark",
                shortcut: null,
                enabled: true,
                checked: false,
              },
            ],
          },
        ],
      },
    ]);
  });

  it("leaves hidden items out but keeps the others' paths", () => {
    const menu = describeMenu([
      item({ label: "Hidden", visible: false }),
      item({ label: "Shown" }),
    ]);
    expect(menu).toEqual([
      expect.objectContaining({ label: "Shown", path: [1] }),
    ]);
  });
});
