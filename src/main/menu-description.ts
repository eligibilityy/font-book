import type { AppMenuEntry } from "../shared/contracts/app";

/** The parts of Electron's MenuItem the description reads. */
export interface DescribableMenuItem {
  label: string;
  type: string;
  accelerator: string | null;
  enabled: boolean;
  visible: boolean;
  checked: boolean;
  submenu?: { items: readonly DescribableMenuItem[] } | null | undefined;
}

/**
 * The application menu as plain data, so the page can draw it in Book's own
 * style. Each entry keeps its path (its index at every level), which is how
 * the page names the item to click. Hidden items are left out.
 */
export function describeMenu(
  items: readonly DescribableMenuItem[],
  parentPath: readonly number[] = [],
): AppMenuEntry[] {
  const entries: AppMenuEntry[] = [];
  items.forEach((item, index) => {
    if (!item.visible) return;
    const path = [...parentPath, index];
    if (item.type === "separator") {
      entries.push({ type: "separator", path });
    } else if (item.submenu) {
      entries.push({
        type: "submenu",
        path,
        label: item.label,
        entries: describeMenu(item.submenu.items, path),
      });
    } else {
      entries.push({
        type: "item",
        path,
        label: item.label,
        shortcut: item.accelerator ? shortcutLabel(item.accelerator) : null,
        enabled: item.enabled,
        checked:
          item.type === "checkbox" || item.type === "radio"
            ? item.checked
            : null,
      });
    }
  });
  return entries;
}

const KEY_LABELS: Record<string, string> = {
  CommandOrControl: "Ctrl",
  CmdOrCtrl: "Ctrl",
  Control: "Ctrl",
  Ctrl: "Ctrl",
  Alt: "Alt",
  Option: "Alt",
  AltGr: "AltGr",
  Shift: "Shift",
  Super: "Win",
  Meta: "Win",
  Plus: "+",
};

/** An Electron accelerator as Windows writes it: "CommandOrControl+Shift+R" is "Ctrl+Shift+R". */
export function shortcutLabel(accelerator: string): string {
  return accelerator
    .split("+")
    .map(
      (key) => KEY_LABELS[key] ?? (key.length === 1 ? key.toUpperCase() : key),
    )
    .join("+");
}
