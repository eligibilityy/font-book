import { useEffect, useRef, useState } from "react";
import { ImportIcon } from "@/shared/ui/icons";
import styles from "./styles.module.css";

interface ImportDropZoneProps {
  /** Collection names by id, to say where a drop on a Collection goes. */
  collectionNames: ReadonlyMap<string, string>;
  /** True while Font files are being copied and Scanned. */
  isImporting: boolean;
  /** The Collection row under the pointer, so the sidebar can mark it. */
  onDropTargetChange: (collectionId: string | null) => void;
  onDrop: (files: File[], collectionId: string | null) => void;
}

/**
 * Import by drag and drop: anywhere in the window, or onto a Collection in
 * the sidebar to Import and add in one step. The overlay never takes the
 * pointer (`pointer-events: none`), so the element under it, such as a
 * Collection row, is what the drag is over.
 */
export function ImportDropZone({
  collectionNames,
  isImporting,
  onDropTargetChange,
  onDrop,
}: ImportDropZoneProps): React.JSX.Element {
  const [isDragging, setIsDragging] = useState(false);
  const [targetId, setTargetId] = useState<string | null>(null);
  // dragenter and dragleave fire for every child the pointer crosses; only
  // when they balance has the drag really left the window.
  const depth = useRef(0);

  const latest = useRef({ onDrop, onDropTargetChange });
  latest.current = { onDrop, onDropTargetChange };

  useEffect(() => {
    const carriesFiles = (event: DragEvent) =>
      event.dataTransfer?.types.includes("Files") ?? false;
    const setTarget = (id: string | null) => {
      setTargetId(id);
      latest.current.onDropTargetChange(id);
    };
    const collectionUnder = (event: DragEvent): string | null => {
      const element =
        event.target instanceof Element
          ? event.target.closest("[data-collection-id]")
          : null;
      return element?.getAttribute("data-collection-id") ?? null;
    };

    const onDragEnter = (event: DragEvent) => {
      if (!carriesFiles(event)) return;
      depth.current += 1;
      setIsDragging(true);
    };
    const onDragOver = (event: DragEvent) => {
      if (!carriesFiles(event)) return;
      // Without this the browser refuses the drop, or opens the file.
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
      setTarget(collectionUnder(event));
    };
    const onDragLeave = (event: DragEvent) => {
      if (!carriesFiles(event)) return;
      depth.current = Math.max(0, depth.current - 1);
      if (depth.current === 0) {
        setIsDragging(false);
        setTarget(null);
      }
    };
    const onDropEvent = (event: DragEvent) => {
      if (!carriesFiles(event)) return;
      event.preventDefault();
      depth.current = 0;
      setIsDragging(false);
      const target = collectionUnder(event);
      setTarget(null);
      const files = [...(event.dataTransfer?.files ?? [])];
      if (files.length > 0) latest.current.onDrop(files, target);
    };

    window.addEventListener("dragenter", onDragEnter);
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("drop", onDropEvent);
    return () => {
      window.removeEventListener("dragenter", onDragEnter);
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("drop", onDropEvent);
      window.removeEventListener("dragleave", onDragLeave);
    };
  }, []);

  const targetName = targetId ? collectionNames.get(targetId) : undefined;
  const isVisible = isDragging || isImporting;

  return (
    <div
      className={styles.overlay}
      data-visible={isVisible ? "" : undefined}
      data-over-collection={targetName ? "" : undefined}
      aria-hidden={!isVisible}
    >
      <div className={styles.card} role="status">
        {isVisible && (
          <>
            <ImportIcon className={styles.icon} />
            <p className={styles.title}>
              {isImporting
                ? "Importing..."
                : targetName
                  ? `Import into ${targetName}`
                  : "Drop to Import"}
            </p>
            <p className={styles.detail}>
              {isImporting
                ? "Copying Font files and adding them to your Library."
                : "Book keeps its own copy of each Font file. The originals stay where they are."}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
