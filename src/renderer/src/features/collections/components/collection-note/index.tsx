import { useState } from "react";
import styles from "./styles.module.css";

interface CollectionNoteProps {
  collectionName: string;
  note: string;
  isReadOnly: boolean;
  onChange: (note: string) => void;
}

/**
 * The Collection's one-line note, beside its title: plain text until she
 * clicks it. Saved when she leaves the field or presses Enter, not on every
 * keystroke; Escape puts the saved note back.
 */
export function CollectionNote({
  collectionName,
  note,
  isReadOnly,
  onChange,
}: CollectionNoteProps): React.JSX.Element {
  const [draft, setDraft] = useState(note);
  // A different Collection, or the saved note changed: show that instead.
  const [shownNote, setShownNote] = useState(note);
  if (note !== shownNote) {
    setShownNote(note);
    setDraft(note);
  }

  return (
    <input
      className={styles.note}
      value={draft}
      maxLength={200}
      placeholder={isReadOnly ? "" : "Add a note"}
      aria-label={`Note for ${collectionName}`}
      disabled={isReadOnly}
      spellCheck={false}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => {
        if (draft.trim() !== note) onChange(draft);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
        if (event.key === "Escape") {
          event.preventDefault();
          setDraft(note);
          // Blur after the revert has rendered, so leaving saves nothing.
          const input = event.currentTarget;
          requestAnimationFrame(() => input.blur());
        }
      }}
    />
  );
}
