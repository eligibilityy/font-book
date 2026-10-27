import controls from "@/shared/ui/controls.module.css";
import { IconButton } from "@/shared/ui/icon-button";
import {
  ChevronLeftIcon,
  CloseIcon,
  SearchIcon,
  SidebarIcon,
  TextIcon,
} from "@/shared/ui/icons";
import styles from "./styles.module.css";

interface ToolbarProps {
  sidebarVisible: boolean;
  onToggleSidebar: () => void;
  /** The view to go back to, while the Specimen is showing. */
  backLabel: string | null;
  onBack: () => void;
  search: string;
  searchPlaceholder: string;
  onSearchChange: (value: string) => void;
  /** Down, Enter, or Escape on an empty field: back to the list. */
  onSearchExit: () => void;
  searchRef: React.RefObject<HTMLInputElement | null>;
  sampleText: string;
  onSampleTextChange: (text: string) => void;
}

/** The controls that never move. Empty space drags the window. */
export function Toolbar({
  sidebarVisible,
  onToggleSidebar,
  backLabel,
  onBack,
  search,
  searchPlaceholder,
  onSearchChange,
  onSearchExit,
  searchRef,
  sampleText,
  onSampleTextChange,
}: ToolbarProps): React.JSX.Element {
  return (
    <header className={styles.toolbar}>
      <IconButton
        label={sidebarVisible ? "Hide Sidebar" : "Show Sidebar"}
        aria-pressed={sidebarVisible}
        onClick={onToggleSidebar}
      >
        <SidebarIcon />
      </IconButton>
      {backLabel !== null && (
        <button
          type="button"
          className={styles.backButton}
          aria-label={`Back to ${backLabel}`}
          onClick={onBack}
        >
          <ChevronLeftIcon />
          <span>{backLabel}</span>
        </button>
      )}
      <div className={styles.toolbarSpacer} />
      <div className={styles.searchField}>
        <SearchIcon className={styles.searchIcon} />
        <input
          ref={searchRef}
          type="search"
          className={controls.field}
          value={search}
          placeholder={searchPlaceholder}
          aria-label="Search"
          spellCheck={false}
          onChange={(event) => onSearchChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              if (search !== "") onSearchChange("");
              else onSearchExit();
            } else if (event.key === "ArrowDown" || event.key === "Enter") {
              event.preventDefault();
              onSearchExit();
            }
          }}
        />
        {search !== "" && (
          <button
            type="button"
            className={styles.clearSearch}
            aria-label="Clear Search"
            onClick={() => {
              onSearchChange("");
              searchRef.current?.focus();
            }}
          >
            <CloseIcon />
          </button>
        )}
      </div>
      <div className={styles.sampleField}>
        <TextIcon className={styles.searchIcon} />
        <input
          className={controls.field}
          value={sampleText}
          maxLength={300}
          placeholder="Type your own Sample text"
          aria-label="Sample text"
          title="Sample text, shown in Quick preview and the Specimen"
          dir="auto"
          spellCheck={false}
          onChange={(event) =>
            onSampleTextChange(event.target.value.replace(/\s*\n\s*/g, " "))
          }
          onKeyDown={(event) => {
            if (event.key === "Escape" || event.key === "Enter") {
              event.preventDefault();
              onSearchExit();
            }
          }}
        />
      </div>
    </header>
  );
}
