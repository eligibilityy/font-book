import { Menu } from "@base-ui/react/menu";
import { Menubar } from "@base-ui/react/menubar";
import type { AppMenuEntry } from "@shared/contracts/app";
import { useEffect, useRef, useState } from "react";
import bookIcon from "@/shared/ui/book-icon.svg";
import controls from "@/shared/ui/controls.module.css";
import { CheckIcon, ChevronRightIcon } from "@/shared/ui/icons";
import styles from "./styles.module.css";

interface TitleBarProps {
  /** File, Edit, View... and everything in them, from main. */
  menu: AppMenuEntry[];
  /** Runs a menu item in main. Resolves with the menu afterwards. */
  onClickMenuItem: (path: number[]) => Promise<AppMenuEntry[]>;
}

/**
 * The bar across the top of the window on Windows, like VS Code's: Book's
 * icon and the application menu, drawn in Book's own style. Windows draws its
 * minimize, maximize and close buttons over the right end. Empty space drags
 * the window.
 */
export function TitleBar({
  menu: initialMenu,
  onClickMenuItem,
}: TitleBarProps): React.JSX.Element {
  // Updated after each click, so a Theme checkmark moves.
  const [menu, setMenu] = useState(initialMenu);
  const barRef = useRef<HTMLElement>(null);
  // The last thing focused outside the menus. Edit > Copy and Paste act on
  // what is focused, so focus goes back there before an item runs.
  const lastFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const remember = (event: FocusEvent): void => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (barRef.current?.contains(target) || target.closest('[role="menu"]')) {
        return;
      }
      lastFocusRef.current = target;
    };
    document.addEventListener("focusin", remember);
    return () => document.removeEventListener("focusin", remember);
  }, []);

  const click = (path: number[]): void => {
    lastFocusRef.current?.focus();
    void onClickMenuItem(path).then(setMenu);
  };

  return (
    <header ref={barRef} className={styles.titleBar}>
      <img className={styles.titleBarIcon} src={bookIcon} alt="" />
      <Menubar className={styles.menuTitles}>
        {menu.map(
          (entry) =>
            entry.type === "submenu" && (
              <Menu.Root key={entry.path.join(".")}>
                <Menu.Trigger className={styles.menuTitle}>
                  {entry.label}
                </Menu.Trigger>
                <Menu.Portal>
                  <Menu.Positioner
                    className={controls.positioner}
                    side="bottom"
                    align="start"
                    sideOffset={2}
                  >
                    <Menu.Popup
                      className={`${controls.contextPopup} ${styles.titleBarMenu}`}
                      finalFocus={() => lastFocusRef.current ?? true}
                    >
                      <MenuEntries entries={entry.entries} onClick={click} />
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.Root>
            ),
        )}
      </Menubar>
    </header>
  );
}

/** One menu's entries; a submenu opens to the side, like the native one. */
function MenuEntries({
  entries,
  onClick,
}: {
  entries: AppMenuEntry[];
  onClick: (path: number[]) => void;
}): React.JSX.Element {
  return (
    <>
      {entries.map((entry) => {
        const key = entry.path.join(".");
        if (entry.type === "separator") {
          return <Menu.Separator key={key} className={controls.separator} />;
        }
        if (entry.type === "submenu") {
          return (
            <Menu.SubmenuRoot key={key}>
              <Menu.SubmenuTrigger className={controls.item}>
                <span className={controls.itemIndicator} />
                <span className={controls.itemLabel}>{entry.label}</span>
                <ChevronRightIcon />
              </Menu.SubmenuTrigger>
              <Menu.Portal>
                <Menu.Positioner
                  className={controls.positioner}
                  sideOffset={-4}
                  alignOffset={-4}
                >
                  <Menu.Popup
                    className={`${controls.contextPopup} ${styles.titleBarMenu}`}
                  >
                    <MenuEntries entries={entry.entries} onClick={onClick} />
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.SubmenuRoot>
          );
        }
        const label = (
          <>
            <span className={controls.itemLabel}>{entry.label}</span>
            {entry.shortcut && (
              <span className={`${controls.itemHint} ${styles.menuShortcut}`}>
                {entry.shortcut}
              </span>
            )}
          </>
        );
        if (entry.checked !== null) {
          return (
            <Menu.CheckboxItem
              key={key}
              className={controls.item}
              checked={entry.checked}
              disabled={!entry.enabled}
              closeOnClick
              onCheckedChange={() => onClick(entry.path)}
            >
              <span className={controls.itemIndicator}>
                <Menu.CheckboxItemIndicator>
                  <CheckIcon />
                </Menu.CheckboxItemIndicator>
              </span>
              {label}
            </Menu.CheckboxItem>
          );
        }
        return (
          <Menu.Item
            key={key}
            className={controls.item}
            disabled={!entry.enabled}
            onClick={() => onClick(entry.path)}
          >
            <span className={controls.itemIndicator} />
            {label}
          </Menu.Item>
        );
      })}
    </>
  );
}
