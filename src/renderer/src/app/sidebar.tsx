import { type Collections, CollectionsSection } from "@/features/collections";
import {
  ComputerIcon,
  GridIcon,
  ImportIcon,
  PairingIcon,
  PersonIcon,
  StarIcon,
  WarningIcon,
} from "@/shared/ui/icons";
import styles from "./styles.module.css";
import type { View } from "./views";

interface SidebarProps {
  view: View;
  onViewChange: (view: View) => void;
  failedCount: number;
  collections: Collections;
  isCreatingCollection: boolean;
  onCreatingCollectionChange: (isCreating: boolean) => void;
  recentlyAddedId: string | null;
  /** The Pairing is showing: it, not a view, is the current item. */
  isPairingOpen: boolean;
  onOpenPairing: () => void;
  /** Briefly true after a Style was put in the Pairing. */
  isPairingFlashing: boolean;
  /** The Collection Font files are being dragged over. */
  dropTargetCollectionId: string | null;
}

/** Chooses what the Library list shows. It never changes between views. */
export function Sidebar({
  view,
  onViewChange,
  failedCount,
  collections,
  isCreatingCollection,
  onCreatingCollectionChange,
  recentlyAddedId,
  isPairingOpen,
  onOpenPairing,
  isPairingFlashing,
  dropTargetCollectionId,
}: SidebarProps): React.JSX.Element {
  const item = (
    target: View,
    label: string,
    icon: React.ReactNode,
    count?: number,
  ): React.JSX.Element => (
    <li>
      <button
        type="button"
        className={styles.sidebarItem}
        aria-current={
          !isPairingOpen && view.kind === target.kind ? "page" : undefined
        }
        onClick={() => onViewChange(target)}
      >
        {icon}
        <span className={styles.sidebarLabel}>{label}</span>
        {count !== undefined && (
          <span className={styles.sidebarCount}>{count}</span>
        )}
      </button>
    </li>
  );

  return (
    <nav className={styles.sidebar} aria-label="Library">
      <div className={styles.sidebarTop} />
      <section className={styles.sidebarGroup}>
        <h2 className={styles.sidebarHeading}>Library</h2>
        <ul>
          {item({ kind: "all" }, "All", <GridIcon />)}
          {item({ kind: "my-fonts" }, "My Fonts", <PersonIcon />)}
          {item({ kind: "system" }, "System", <ComputerIcon />)}
          {item({ kind: "imported" }, "Imported", <ImportIcon />)}
          {failedCount > 0 &&
            item(
              { kind: "couldnt-read" },
              "Couldn't Read",
              <WarningIcon />,
              failedCount,
            )}
        </ul>
      </section>
      <section className={styles.sidebarGroup}>
        <ul>
          {item(
            { kind: "favorites" },
            "Favorites",
            <StarIcon />,
            collections.favorites.length,
          )}
          <li>
            <button
              type="button"
              className={styles.sidebarItem}
              aria-current={isPairingOpen ? "page" : undefined}
              data-recently-added={isPairingFlashing ? "" : undefined}
              onClick={onOpenPairing}
            >
              <PairingIcon />
              <span className={styles.sidebarLabel}>Pairing</span>
            </button>
          </li>
        </ul>
      </section>
      <CollectionsSection
        collections={collections}
        activeId={!isPairingOpen && view.kind === "collection" ? view.id : null}
        onOpen={(id) => onViewChange({ kind: "collection", id })}
        isCreating={isCreatingCollection}
        onCreatingChange={onCreatingCollectionChange}
        recentlyAddedId={recentlyAddedId}
        dropTargetId={dropTargetCollectionId}
      />
    </nav>
  );
}
