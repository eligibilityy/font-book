import { Popover } from "@base-ui/react/popover";
import type { Style } from "@shared/contracts/library";
import { useId, useState } from "react";
import controls from "@/shared/ui/controls.module.css";
import type { Collections } from "../../hooks/use-collections";
import styles from "./styles.module.css";

interface AddToCollectionPopoverProps {
  style: Style;
  collections: Collections;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The button that opens it, when there is one (the Specimen header). */
  trigger?: React.ReactElement;
  /** Otherwise, what it points at (a selected Library row). */
  anchor?: Element | null;
  /** Called after a change, for the sidebar's add feedback. */
  onAdded?: (collectionId: string) => void;
}

/** A checklist of Collections for one Style, plus a field to make a new one. */
export function AddToCollectionPopover({
  style,
  collections,
  open,
  onOpenChange,
  trigger,
  anchor,
  onAdded,
}: AddToCollectionPopoverProps): React.JSX.Element {
  const [newName, setNewName] = useState("");
  const titleId = useId();
  const isDuplicate = newName.trim() !== "" && collections.isNameTaken(newName);

  const create = (): void => {
    const collection = collections.createCollection(newName);
    if (!collection) return;
    collections.setInCollection(collection.id, style, true);
    onAdded?.(collection.id);
    setNewName("");
  };

  return (
    <Popover.Root
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setNewName("");
      }}
    >
      {trigger && <Popover.Trigger render={trigger} />}
      <Popover.Portal>
        <Popover.Positioner
          className={controls.positioner}
          sideOffset={6}
          align="end"
          {...(anchor ? { anchor } : {})}
        >
          <Popover.Popup
            className={`${controls.popup} ${styles.popup}`}
            aria-labelledby={titleId}
          >
            <Popover.Title id={titleId} className={styles.title}>
              Add {style.familyName} {style.styleName} to
            </Popover.Title>
            {collections.collections.length > 0 && (
              <ul className={styles.list}>
                {collections.collections.map((collection) => {
                  const isIncluded = collection.styles.some(
                    (ref) => ref.styleId === style.id,
                  );
                  return (
                    <li key={collection.id}>
                      <label className={styles.option}>
                        <input
                          type="checkbox"
                          checked={isIncluded}
                          disabled={collections.isReadOnly}
                          onChange={(event) => {
                            collections.setInCollection(
                              collection.id,
                              style,
                              event.target.checked,
                            );
                            if (event.target.checked) onAdded?.(collection.id);
                          }}
                        />
                        <span className={styles.name}>{collection.name}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
            <form
              className={styles.create}
              onSubmit={(event) => {
                event.preventDefault();
                create();
              }}
            >
              <input
                className={controls.field}
                value={newName}
                maxLength={200}
                placeholder="New Collection name"
                aria-label="New Collection name"
                disabled={collections.isReadOnly}
                onChange={(event) => setNewName(event.target.value)}
              />
              <button
                type="submit"
                className={controls.button}
                disabled={
                  newName.trim() === "" || isDuplicate || collections.isReadOnly
                }
              >
                Create
              </button>
            </form>
            {isDuplicate && (
              <p className={styles.error} role="alert">
                A Collection named "{newName.trim()}" already exists.
              </p>
            )}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
