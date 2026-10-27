import { AlertDialog } from "@base-ui/react/alert-dialog";
import { ContextMenu } from "@base-ui/react/context-menu";
import type { Collection } from "@shared/contracts/storage";
import { useEffect, useRef, useState } from "react";
import { countOf } from "@/shared/text";
import controls from "@/shared/ui/controls.module.css";
import { IconButton } from "@/shared/ui/icon-button";
import { FolderIcon, PlusIcon } from "@/shared/ui/icons";
import type { Collections } from "../../hooks/use-collections";
import styles from "./styles.module.css";

interface CollectionsSectionProps {
  collections: Collections;
  activeId: string | null;
  onOpen: (collectionId: string) => void;
  /** True while the New Collection field is showing (the + button or Mod+N). */
  isCreating: boolean;
  onCreatingChange: (isCreating: boolean) => void;
  /** The Collection that just received a Style, for a one-time tint. */
  recentlyAddedId: string | null;
  /** The Collection Font files are being dragged over, to Import into it. */
  dropTargetId: string | null;
}

/** The sidebar's Collections: one row per Collection, plus New, Rename and Delete. */
export function CollectionsSection({
  collections,
  activeId,
  onOpen,
  isCreating,
  onCreatingChange,
  recentlyAddedId,
  dropTargetId,
}: CollectionsSectionProps): React.JSX.Element {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Collection | null>(null);
  const sorted = [...collections.collections].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, {
      sensitivity: "base",
      numeric: true,
    }),
  );

  return (
    <section className={styles.section} aria-label="Collections">
      <header className={styles.header}>
        <h2 className={styles.heading}>Collections</h2>
        <IconButton
          label="New Collection"
          className={`${controls.iconButton} ${styles.addButton}`}
          disabled={collections.isReadOnly}
          onClick={() => onCreatingChange(true)}
        >
          <PlusIcon />
        </IconButton>
      </header>

      {collections.isReadOnly && (
        <p className={styles.note}>
          These Collections were saved by a newer Book, or couldn't be read.
          Changes aren't saved.
        </p>
      )}

      <ul className={styles.list}>
        {sorted.map((collection) =>
          collection.id === renamingId ? (
            <li key={collection.id}>
              <NameField
                initialName={collection.name}
                label={`Rename ${collection.name}`}
                isTaken={(name) => collections.isNameTaken(name, collection.id)}
                onCommit={(name) => {
                  collections.renameCollection(collection.id, name);
                  setRenamingId(null);
                }}
                onCancel={() => setRenamingId(null)}
              />
            </li>
          ) : (
            <li key={collection.id}>
              <ContextMenu.Root>
                <ContextMenu.Trigger
                  render={
                    <button
                      type="button"
                      className={styles.item}
                      aria-current={
                        collection.id === activeId ? "page" : undefined
                      }
                      data-recently-added={
                        collection.id === recentlyAddedId ? "" : undefined
                      }
                      data-collection-id={collection.id}
                      data-drop-target={
                        collection.id === dropTargetId ? "" : undefined
                      }
                      onClick={() => onOpen(collection.id)}
                      title={
                        collection.note
                          ? `${collection.name}: ${collection.note}`
                          : collection.name
                      }
                    />
                  }
                >
                  <FolderIcon className={styles.icon} />
                  <span className={styles.itemName}>{collection.name}</span>
                  <span className={styles.count}>
                    {collection.styles.length}
                  </span>
                </ContextMenu.Trigger>
                <ContextMenu.Portal>
                  <ContextMenu.Positioner className={controls.positioner}>
                    <ContextMenu.Popup className={controls.contextPopup}>
                      <ContextMenu.Item
                        className={controls.item}
                        disabled={collections.isReadOnly}
                        onClick={() => setRenamingId(collection.id)}
                      >
                        Rename...
                      </ContextMenu.Item>
                      <ContextMenu.Item
                        className={controls.item}
                        disabled={collections.isReadOnly}
                        onClick={() => setDeleting(collection)}
                      >
                        Delete...
                      </ContextMenu.Item>
                    </ContextMenu.Popup>
                  </ContextMenu.Positioner>
                </ContextMenu.Portal>
              </ContextMenu.Root>
            </li>
          ),
        )}
        {isCreating && (
          <li>
            <NameField
              initialName=""
              label="New Collection name"
              isTaken={(name) => collections.isNameTaken(name)}
              onCommit={(name) => {
                const created = collections.createCollection(name);
                onCreatingChange(false);
                if (created) onOpen(created.id);
              }}
              onCancel={() => onCreatingChange(false)}
            />
          </li>
        )}
      </ul>

      {sorted.length === 0 && !isCreating && (
        <p className={styles.note}>Group Styles for a project.</p>
      )}

      <AlertDialog.Root
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      >
        <AlertDialog.Portal>
          <AlertDialog.Backdrop className={controls.backdrop} />
          <AlertDialog.Popup className={controls.dialog}>
            <AlertDialog.Title className={controls.dialogTitle}>
              Delete "{deleting?.name}"?
            </AlertDialog.Title>
            <AlertDialog.Description className={controls.dialogDescription}>
              {deleting && countOf(deleting.styles.length, "Style", "Styles")}{" "}
              stay in your Library. Only the Collection is removed.
            </AlertDialog.Description>
            <div className={controls.dialogActions}>
              <AlertDialog.Close className={controls.button}>
                Cancel
              </AlertDialog.Close>
              <button
                type="button"
                className={controls.dangerButton}
                onClick={() => {
                  if (deleting) collections.deleteCollection(deleting.id);
                  setDeleting(null);
                }}
              >
                Delete Collection
              </button>
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </section>
  );
}

interface NameFieldProps {
  initialName: string;
  label: string;
  isTaken: (name: string) => boolean;
  onCommit: (name: string) => void;
  onCancel: () => void;
}

/** An inline name field: Enter saves, Escape or clicking away cancels. */
function NameField({
  initialName,
  label,
  isTaken,
  onCommit,
  onCancel,
}: NameFieldProps): React.JSX.Element {
  const [name, setName] = useState(initialName);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const taken =
    name.trim() !== "" && name.trim() !== initialName && isTaken(name);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  return (
    <div className={styles.nameField}>
      <input
        ref={inputRef}
        className={controls.field}
        value={name}
        maxLength={200}
        aria-label={label}
        placeholder="Collection name"
        aria-invalid={taken}
        onChange={(event) => setName(event.target.value)}
        onBlur={onCancel}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            onCancel();
          } else if (event.key === "Enter") {
            event.preventDefault();
            if (name.trim() === "" || taken) return;
            onCommit(name);
          }
        }}
      />
      {taken && (
        <p className={styles.error} role="alert">
          A Collection named "{name.trim()}" already exists.
        </p>
      )}
    </div>
  );
}
