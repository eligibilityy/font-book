import { ContextMenu } from "@base-ui/react/context-menu";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useCallback, useEffect, useId, useLayoutEffect, useRef } from "react";
import controls from "@/shared/ui/controls.module.css";
import type { ListRow } from "../../rows";
import { LibraryRow } from "../library-row";
import styles from "./styles.module.css";

const ROW_HEIGHT = 80;

export interface LibraryListHandle {
  focus: () => void;
}

interface LibraryListProps {
  rows: ListRow[];
  selectedIndex: number;
  /** Style IDs she has starred, for the star on each row. */
  favoriteIds: ReadonlySet<string>;
  label: string;
  isQuickPreviewOpen: boolean;
  onSelect: (index: number) => void;
  onOpen: (index: number) => void;
  onToggleQuickPreview: () => void;
  onCloseQuickPreview: () => void;
  /** Focus moved to something outside the list (the sidebar, the toolbar). */
  onFocusLeave: () => void;
  /** Left and Right while Quick preview shows a Family: step through its Styles. */
  onStepQuickPreview: (delta: number) => void;
  onToggleFavorite: () => void;
  /** H and B: the selected row's Style (or Quick preview's) into the Pairing. */
  onUseAs: (role: "heading" | "body") => void;
  /** Menu items for the selected row, shown on right-click. */
  contextMenuItems: React.ReactNode;
  /** Where the list was scrolled the last time this view was open. */
  initialScrollOffset: number;
  onScrollOffsetChange: (offset: number) => void;
  listRef: React.RefObject<LibraryListHandle | null>;
}

/**
 * The Library list: a listbox of 80px rows, virtualized so only the rows on
 * screen exist. Focus stays on the list itself; the selected row is announced
 * through aria-activedescendant, so keys work no matter which rows exist.
 */
export function LibraryList({
  rows,
  selectedIndex,
  favoriteIds,
  label,
  isQuickPreviewOpen,
  onSelect,
  onOpen,
  onToggleQuickPreview,
  onCloseQuickPreview,
  onFocusLeave,
  onStepQuickPreview,
  onToggleFavorite,
  onUseAs,
  contextMenuItems,
  initialScrollOffset,
  onScrollOffsetChange,
  listRef,
}: LibraryListProps): React.JSX.Element {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const idPrefix = useId();

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollerRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 6,
    initialOffset: initialScrollOffset,
  });

  useEffect(() => {
    listRef.current = { focus: () => scrollerRef.current?.focus() };
    // Focus lands on the list whenever it appears, so the keys work at once,
    // unless she is typing: search switches from the Specimen to the list on
    // the first letter, and the rest of the word must still reach the field.
    const active = document.activeElement;
    const isTyping =
      active instanceof HTMLInputElement ||
      active instanceof HTMLTextAreaElement;
    if (!isTyping) scrollerRef.current?.focus();
  }, [listRef]);

  // Keep the selected row in view as it moves.
  useLayoutEffect(() => {
    if (selectedIndex >= 0 && selectedIndex < rows.length) {
      virtualizer.scrollToIndex(selectedIndex, { align: "auto" });
    }
  }, [selectedIndex, rows.length, virtualizer]);

  const pageSize = Math.max(
    1,
    Math.floor((scrollerRef.current?.clientHeight ?? 600) / ROW_HEIGHT) - 1,
  );

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const last = rows.length - 1;
    const move = (index: number): void => {
      event.preventDefault();
      if (last >= 0) onSelect(Math.min(last, Math.max(0, index)));
    };
    switch (event.key) {
      case "ArrowDown":
        return move(selectedIndex + 1);
      case "ArrowUp":
        return move(selectedIndex - 1);
      case "Home":
        return move(0);
      case "End":
        return move(last);
      case "PageDown":
        return move(selectedIndex + pageSize);
      case "PageUp":
        return move(selectedIndex - pageSize);
      case "Enter":
        event.preventDefault();
        if (selectedIndex >= 0) onOpen(selectedIndex);
        return;
      case " ":
        event.preventDefault();
        onToggleQuickPreview();
        return;
      case "Escape":
        if (isQuickPreviewOpen) {
          event.preventDefault();
          onCloseQuickPreview();
        }
        return;
      case "ArrowLeft":
      case "ArrowRight":
        if (isQuickPreviewOpen) {
          event.preventDefault();
          onStepQuickPreview(event.key === "ArrowLeft" ? -1 : 1);
        }
        return;
      case "f":
      case "F":
        event.preventDefault();
        onToggleFavorite();
        return;
      case "h":
      case "H":
      case "b":
      case "B":
        event.preventDefault();
        onUseAs(event.key.toLowerCase() === "h" ? "heading" : "body");
        return;
    }
  };

  const handleSelect = useCallback(
    (index: number) => onSelect(index),
    [onSelect],
  );
  const handleOpen = useCallback((index: number) => onOpen(index), [onOpen]);

  const selectedRowId =
    selectedIndex >= 0 ? `${idPrefix}-row-${selectedIndex}` : undefined;

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger
        ref={scrollerRef}
        role="listbox"
        aria-label={label}
        aria-activedescendant={selectedRowId}
        tabIndex={0}
        className={styles.scroller}
        onKeyDown={handleKeyDown}
        onBlur={(event) => {
          const next = event.relatedTarget;
          if (!(next instanceof Node) || !event.currentTarget.contains(next))
            onFocusLeave();
        }}
        onScroll={(event) =>
          onScrollOffsetChange(event.currentTarget.scrollTop)
        }
      >
        <div
          className={styles.rows}
          style={{ height: virtualizer.getTotalSize() }}
        >
          {virtualizer.getVirtualItems().map((item) => {
            const row = rows[item.index];
            if (!row) return null;
            return (
              <LibraryRow
                key={row.key}
                id={`${idPrefix}-row-${item.index}`}
                index={item.index}
                row={row}
                top={item.start}
                isSelected={item.index === selectedIndex}
                hasFavorite={rowHasFavorite(row, favoriteIds)}
                onSelect={handleSelect}
                onOpen={handleOpen}
              />
            );
          })}
        </div>
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Positioner className={controls.positioner}>
          <ContextMenu.Popup className={controls.contextPopup}>
            {contextMenuItems}
          </ContextMenu.Popup>
        </ContextMenu.Positioner>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}

function rowHasFavorite(
  row: ListRow,
  favoriteIds: ReadonlySet<string>,
): boolean {
  if (row.kind === "family")
    return row.family.styles.some((style) => favoriteIds.has(style.id));
  if (row.kind === "style") return favoriteIds.has(row.style.id);
  return favoriteIds.has(row.ref.styleId);
}
