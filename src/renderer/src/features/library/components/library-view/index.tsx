import type {
  FontFile,
  FontFileList,
  FontFolderReport,
} from "@shared/contracts/library";
import { useId } from "react";
import {
  type FontFileListState,
  useFontFileList,
} from "../../hooks/use-font-file-list";
import styles from "./styles.module.css";

const numberFormat = new Intl.NumberFormat();

function countOf(count: number, one: string, many: string): string {
  return `${numberFormat.format(count)} ${count === 1 ? one : many}`;
}

/** The Library list. For now: every Font file in every Font folder, by name. */
export function LibraryView(): React.JSX.Element {
  const { state, scanAgain } = useFontFileList();
  const titleId = useId();

  return (
    <section className={styles.view} aria-labelledby={titleId}>
      <header className={styles.header}>
        <h1 id={titleId} className={styles.title}>
          Font files
        </h1>
        <p className={styles.summary} aria-live="polite">
          {summarize(state)}
        </p>
        <button
          type="button"
          className={styles.button}
          onClick={scanAgain}
          disabled={state.status === "loading"}
        >
          Scan Again
        </button>
      </header>
      <div className={styles.body}>
        {state.status === "loading" && (
          <p className={styles.message}>Scanning Font folders...</p>
        )}
        {state.status === "error" && (
          <div className={styles.message}>
            <p className={styles.messageTitle}>
              Book couldn't scan your Font folders.
            </p>
            <p>Choose Scan Again. If it keeps happening, restart Book.</p>
          </div>
        )}
        {state.status === "ready" && <ScanResult list={state.list} />}
      </div>
    </section>
  );
}

function summarize(state: FontFileListState): string {
  if (state.status !== "ready") return "";
  if (state.isScanning) return "Scanning...";
  const scannedFolders = state.list.folders.filter(
    (report) => report.status === "scanned",
  );
  return `${countOf(state.list.fontFiles.length, "Font file", "Font files")} in ${countOf(scannedFolders.length, "Font folder", "Font folders")}`;
}

function ScanResult({ list }: { list: FontFileList }): React.JSX.Element {
  const unreadablePaths = [
    ...list.folders
      .filter((report) => report.status === "unreadable")
      .map((report) => report.folder.path),
    ...list.unreadableSubfolders,
  ];
  const filesByFolder = Map.groupBy(list.fontFiles, (file) => file.folderPath);

  return (
    <>
      {unreadablePaths.length > 0 && (
        <ul className={styles.notices}>
          {unreadablePaths.map((path) => (
            <li key={path}>
              Book couldn't read <span className={styles.path}>{path}</span>.
              Check its permissions, then choose Scan Again.
            </li>
          ))}
        </ul>
      )}
      {list.fontFiles.length === 0 ? (
        <EmptyLibrary folders={list.folders} />
      ) : (
        list.folders.map((report) => {
          const files = filesByFolder.get(report.folder.path);
          return files ? (
            <FolderGroup
              key={report.folder.path}
              report={report}
              files={files}
            />
          ) : null;
        })
      )}
    </>
  );
}

function FolderGroup({
  report,
  files,
}: {
  report: FontFolderReport;
  files: FontFile[];
}): React.JSX.Element {
  const headingId = useId();
  return (
    <section className={styles.group} aria-labelledby={headingId}>
      <h2 id={headingId} className={styles.groupHeader}>
        <span className={styles.kind}>
          {report.folder.kind === "system" ? "System" : "My Fonts"}
        </span>
        <span className={styles.path}>{report.folder.path}</span>
        <span className={styles.groupCount}>
          {countOf(files.length, "Font file", "Font files")}
        </span>
      </h2>
      <ul className={styles.files}>
        {files.map((file) => (
          <li key={file.path} className={styles.file} title={file.path}>
            {file.name}
          </li>
        ))}
      </ul>
    </section>
  );
}

function EmptyLibrary({
  folders,
}: {
  folders: FontFolderReport[];
}): React.JSX.Element {
  return (
    <div className={styles.message}>
      <p className={styles.messageTitle}>No Font files found yet.</p>
      <p>
        Install Font files or put them in a Font folder, then choose Scan Again.
      </p>
      <p>Book looked in:</p>
      <ul className={styles.folderList}>
        {folders.map((report) => (
          <li key={report.folder.path} className={styles.path}>
            {report.folder.path}
          </li>
        ))}
      </ul>
    </div>
  );
}
