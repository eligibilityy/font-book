import { LibraryView } from "@/features/library";
import styles from "./styles.module.css";

export function App(): React.JSX.Element {
  return (
    <div className={styles.shell}>
      <header className={styles.toolbar}>
        <span className={styles.wordmark}>Book</span>
      </header>
      <main className={styles.main}>
        <LibraryView />
      </main>
    </div>
  );
}
