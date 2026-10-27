import type { FailedEntry } from "@shared/contracts/library";
import controls from "@/shared/ui/controls.module.css";
import styles from "./styles.module.css";

interface CouldntReadViewProps {
  failed: FailedEntry[];
  fileManagerName: string;
  onShowInFolder: (entry: FailedEntry) => void;
}

/** Font files in a Font folder that couldn't be parsed. They never stop a Scan. */
export function CouldntReadView({
  failed,
  fileManagerName,
  onShowInFolder,
}: CouldntReadViewProps): React.JSX.Element {
  return (
    <ul className={styles.list} aria-label="Font files Book couldn't read">
      {failed.map((entry) => (
        <li key={entry.path} className={styles.entry}>
          <div className={styles.text}>
            <p className={styles.name}>{entry.name}</p>
            <p className={styles.message}>
              This Font file couldn't be read. It may be damaged.
            </p>
            <p className={styles.path}>{entry.folderPath}</p>
          </div>
          <button
            type="button"
            className={controls.button}
            onClick={() => onShowInFolder(entry)}
          >
            Show in {fileManagerName}
          </button>
        </li>
      ))}
    </ul>
  );
}
