import { type Collections, CollectionsSection } from "@/features/collections";
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
}: SidebarProps): React.JSX.Element {
  const item = (
    target: View,
    label: string,
    count?: number,
  ): React.JSX.Element => (
    <li>
      <button
        type="button"
        className={styles.sidebarItem}
        aria-current={view.kind === target.kind ? "page" : undefined}
        onClick={() => onViewChange(target)}
      >
        <span className={styles.sidebarLabel}>{label}</span>
        {count !== undefined && (
          <span className={styles.sidebarCount}>{count}</span>
        )}
      </button>
    </li>
  );

  return (
    <nav className={styles.sidebar} aria-label="Library">
      <section className={styles.sidebarGroup}>
        <h2 className={styles.sidebarHeading}>Library</h2>
        <ul>
          {item({ kind: "all" }, "All")}
          {item({ kind: "my-fonts" }, "My Fonts")}
          {item({ kind: "system" }, "System")}
          {failedCount > 0 &&
            item({ kind: "couldnt-read" }, "Couldn't Read", failedCount)}
        </ul>
      </section>
      <section className={styles.sidebarGroup}>
        <ul>
          {item(
            { kind: "favorites" },
            "Favorites",
            collections.favorites.length,
          )}
        </ul>
      </section>
      <CollectionsSection
        collections={collections}
        activeId={view.kind === "collection" ? view.id : null}
        onOpen={(id) => onViewChange({ kind: "collection", id })}
        isCreating={isCreatingCollection}
        onCreatingChange={onCreatingCollectionChange}
        recentlyAddedId={recentlyAddedId}
      />
    </nav>
  );
}
