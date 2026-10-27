import type { SaveResult, StoredFile } from "@shared/contracts/storage";
import { useCallback, useEffect, useRef, useState } from "react";

interface SavedFileOptions<T> {
  save: (data: T) => Promise<SaveResult>;
  /** Called when a save fails; the last saved state has already been put back. */
  onSaveFailed: () => void;
  /** Wait this long after the last change before saving (for sliders, typing). */
  debounceMs?: number;
}

export interface SavedFile<T> {
  data: T;
  /** Applies a change at once and saves it in the background. */
  update: (change: (data: T) => T) => void;
  isReadOnly: boolean;
}

/**
 * Optimistic editing of a file main stores: the UI changes first, the save
 * follows, and if the save fails the last saved version comes back. Read-only
 * files (from a newer Book, or unreadable) ignore changes.
 */
export function useSavedFile<T>(
  stored: StoredFile<T>,
  { save, onSaveFailed, debounceMs = 0 }: SavedFileOptions<T>,
): SavedFile<T> {
  const [data, setData] = useState(stored.data);
  const current = useRef(stored.data);
  const lastSaved = useRef(stored.data);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const isReadOnly =
    stored.state.status === "read-only" || stored.state.status === "unreadable";

  const flush = useCallback(() => {
    const next = current.current;
    save(next)
      .then((result) => {
        if (result.status !== "saved") throw new Error("Save failed");
        lastSaved.current = next;
      })
      .catch(() => {
        current.current = lastSaved.current;
        setData(lastSaved.current);
        onSaveFailed();
      });
  }, [save, onSaveFailed]);

  const update = useCallback(
    (change: (data: T) => T) => {
      if (isReadOnly) return;
      current.current = change(current.current);
      setData(current.current);
      clearTimeout(timer.current);
      if (debounceMs > 0) timer.current = setTimeout(flush, debounceMs);
      else flush();
    },
    [isReadOnly, debounceMs, flush],
  );

  // Don't lose a debounced change when the window closes or reloads.
  useEffect(() => {
    if (debounceMs === 0) return;
    const saveNow = (): void => {
      if (current.current !== lastSaved.current) {
        clearTimeout(timer.current);
        flush();
      }
    };
    window.addEventListener("beforeunload", saveNow);
    return () => window.removeEventListener("beforeunload", saveNow);
  }, [debounceMs, flush]);

  return { data, update, isReadOnly };
}
