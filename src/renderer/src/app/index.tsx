import { Tooltip } from "@base-ui/react/tooltip";
import type { AppInfo } from "@shared/contracts/app";
import type { StoredData } from "@shared/contracts/storage";
import { MotionConfig } from "motion/react";
import { useEffect, useState } from "react";
import { useLibrary } from "@/features/library";
import { formatNumber } from "@/shared/text";
import controls from "@/shared/ui/controls.module.css";
import { BookApp } from "./book-app";
import { StoredFileNotice } from "./stored-file-notice";
import styles from "./styles.module.css";

type Startup =
  | { status: "loading" }
  | { status: "ready"; stored: StoredData; appInfo: AppInfo }
  | { status: "error" };

export function App(): React.JSX.Element {
  const { state: library, scanAgain } = useLibrary();
  const [startup, setStartup] = useState<Startup>({ status: "loading" });

  useEffect(() => {
    Promise.all([
      window.fontBook.storage.loadAll(),
      window.fontBook.app.getInfo(),
    ]).then(
      ([stored, appInfo]) => setStartup({ status: "ready", stored, appInfo }),
      (error: unknown) => {
        console.error("Couldn't load Book's files", error);
        setStartup({ status: "error" });
      },
    );
  }, []);

  return (
    // Reduced motion: transforms jump, short fades stay. Matches tokens.css.
    <MotionConfig reducedMotion="user">
      <Tooltip.Provider delay={600}>
        {startup.status === "ready" && library.status === "ready" ? (
          <>
            <BookApp
              library={library.library}
              isScanning={library.isScanning}
              stored={startup.stored}
              appInfo={startup.appInfo}
              onScanAgain={scanAgain}
            />
            <StoredFileNotice stored={startup.stored} />
          </>
        ) : (
          <div className={styles.shell}>
            <header className={styles.toolbar} />
            <div className={styles.startup}>
              {library.status === "error" || startup.status === "error" ? (
                <>
                  <p className={styles.emptyTitle}>
                    Book couldn't scan your Font folders.
                  </p>
                  <p>Choose Scan Again. If it keeps happening, restart Book.</p>
                  <button
                    type="button"
                    className={controls.button}
                    onClick={scanAgain}
                  >
                    Scan Again
                  </button>
                </>
              ) : (
                <>
                  <p className={styles.emptyTitle}>Scanning Font folders...</p>
                  <p className={styles.progress}>
                    {library.status === "loading" &&
                    library.progress &&
                    library.progress.total > 0
                      ? `${formatNumber(library.progress.done)} of ${formatNumber(library.progress.total)} Font files`
                      : " "}
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </Tooltip.Provider>
    </MotionConfig>
  );
}
