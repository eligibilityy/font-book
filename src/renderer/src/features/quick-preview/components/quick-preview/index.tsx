import type { Style } from "@shared/contracts/library";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { sampleFontFamily } from "@/shared/font-faces/registry";
import { useStyleFace } from "@/shared/font-faces/use-style-face";
import { EASE_OUT } from "@/shared/motion";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  StarIcon,
} from "@/shared/ui/icons";
import styles from "./styles.module.css";

interface QuickPreviewProps {
  open: boolean;
  /** null for a Missing Style: its Font file is gone. */
  style: Style | null;
  /** Shown when there is no Style to name (a Missing Style's saved names). */
  fallbackTitle: string;
  /** The Family's Styles, when the row is a Family: Left and Right step through them. */
  familyStyles: Style[] | null;
  sampleText: string;
  lineHeight: number;
  tracking: number;
  paperReversed: boolean;
  onStep: (delta: number) => void;
  isFavorite: boolean;
  /** Stars the Style it shows; null when Collections are read-only. */
  onToggleFavorite: (() => void) | null;
  onOpenSpecimen: () => void;
  onClose: () => void;
}

const CHARACTERS = [
  "ABCDEFGHIJKLM",
  "NOPQRSTUVWXYZ",
  "abcdefghijklm",
  "nopqrstuvwxyz",
  "0123456789 &?!(@)",
];

const PARAGRAPH =
  "Good type disappears into the reading. Set small, a few lines of ordinary prose show what a single line can't: the texture of the page, the rhythm of the spacing, and how evenly the colour falls.";

/**
 * A larger look at the selected row without leaving the list. It docks on
 * the list's right side, so the selected row is never hidden, and it is a
 * plain region, not a dialog: focus stays in the list, and Up and Down keep
 * moving the selection while the preview follows.
 *
 * It slides in over 180ms and out over 120ms. Motion retargets mid-flight,
 * so pressing Space during either just reverses it.
 */
export function QuickPreview(props: QuickPreviewProps): React.JSX.Element {
  return (
    <AnimatePresence>
      {props.open && (
        <motion.section
          key="quick-preview"
          className={styles.panel}
          aria-label="Quick preview"
          initial={{ opacity: 0, x: 16 }}
          animate={{
            opacity: 1,
            x: 0,
            transition: { duration: 0.18, ease: EASE_OUT },
          }}
          exit={{
            opacity: 0,
            x: 12,
            transition: { duration: 0.12, ease: EASE_OUT },
          }}
          // Clicks inside must not take focus from the list, or the keys stop working.
          onMouseDown={(event) => event.preventDefault()}
        >
          <QuickPreviewContent {...props} />
        </motion.section>
      )}
    </AnimatePresence>
  );
}

function QuickPreviewContent({
  style,
  fallbackTitle,
  familyStyles,
  sampleText,
  lineHeight,
  tracking,
  paperReversed,
  onStep,
  isFavorite,
  onToggleFavorite,
  onOpenSpecimen,
  onClose,
}: QuickPreviewProps): React.JSX.Element {
  const status = useStyleFace(style, { priority: true });

  // Keep showing the last Style that loaded until the next one is ready, so
  // holding Down never flashes an empty panel between rows.
  const [shown, setShown] = useState<Style | null>(null);
  if (status === "ready" && style && shown?.id !== style.id) setShown(style);
  const shownStatus = useStyleFace(shown, { priority: true });
  const display =
    status === "ready"
      ? style
      : status === "loading" && shownStatus === "ready"
        ? shown
        : null;

  const index = style && familyStyles ? familyStyles.indexOf(style) : -1;
  const canStep = familyStyles !== null && familyStyles.length > 1;
  const ink = paperReversed ? "var(--specimen-paper)" : "var(--specimen-ink)";
  const paper = paperReversed ? "var(--specimen-ink)" : "var(--specimen-paper)";
  // --paper lets the bottom fade end in the paper colour, light or reversed.
  const paperStyle: React.CSSProperties & Record<"--paper", string> = {
    background: paper,
    color: ink,
    "--paper": paper,
  };
  const textStyle = display
    ? {
        fontFamily: sampleFontFamily(display.id),
        letterSpacing: `${tracking / 1000}em`,
      }
    : undefined;

  return (
    <>
      <header className={styles.header}>
        <div className={styles.titles}>
          <p className={styles.family}>
            {style ? style.familyName : fallbackTitle}
          </p>
          {style && <p className={styles.style}>{style.styleName}</p>}
        </div>
        {canStep && (
          <div className={styles.stepper}>
            <button
              type="button"
              tabIndex={-1}
              className={styles.iconButton}
              aria-label="Previous Style"
              onClick={() => onStep(-1)}
            >
              <ChevronLeftIcon />
            </button>
            <span className={styles.position}>
              {index + 1} of {familyStyles.length}
            </span>
            <button
              type="button"
              tabIndex={-1}
              className={styles.iconButton}
              aria-label="Next Style"
              onClick={() => onStep(1)}
            >
              <ChevronRightIcon />
            </button>
          </div>
        )}
        {style && onToggleFavorite && (
          <button
            type="button"
            tabIndex={-1}
            className={styles.iconButton}
            aria-label={
              isFavorite ? "Remove from Favorites" : "Add to Favorites"
            }
            aria-pressed={isFavorite}
            title="F"
            onClick={onToggleFavorite}
          >
            <StarIcon filled={isFavorite} />
          </button>
        )}
        <button
          type="button"
          tabIndex={-1}
          className={styles.iconButton}
          aria-label="Close Quick preview"
          onClick={onClose}
        >
          <CloseIcon />
        </button>
      </header>

      <div className={styles.paper} style={paperStyle}>
        {display && textStyle ? (
          <div
            className={styles.specimen}
            data-stale={display !== style ? "" : undefined}
          >
            {display.ownScriptName ? (
              // No Latin letters: her Sample text and the alphabet would be a
              // page of boxes, so show the script it does draw, and say why.
              <>
                <p
                  className={styles.sample}
                  style={{ ...textStyle, lineHeight }}
                  dir="auto"
                >
                  {display.ownScriptName.text}
                </p>
                <p className={styles.note}>
                  {display.familyName} has no Latin letters, so it shows{" "}
                  {display.ownScriptName.script} here. Open the Specimen to type
                  your own text.
                </p>
              </>
            ) : (
              <>
                <p
                  className={styles.sample}
                  style={{ ...textStyle, lineHeight }}
                >
                  {sampleText || `${display.familyName} ${display.styleName}`}
                </p>
                <p className={styles.characters} style={textStyle}>
                  {CHARACTERS.map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </p>
                <p className={styles.paragraph} style={textStyle}>
                  {PARAGRAPH}
                </p>
              </>
            )}
          </div>
        ) : (
          <p className={styles.message}>{messageFor(style, status)}</p>
        )}
      </div>

      <footer className={styles.footer}>
        <span className={styles.keys}>
          {canStep && (
            <>
              <kbd>←</kbd>
              <kbd>→</kbd>
              <span className={styles.keyLabel}>Styles</span>
            </>
          )}
          {style && onToggleFavorite && (
            <>
              <kbd>F</kbd>
              <span className={styles.keyLabel}>Favorite</span>
            </>
          )}
          {style && (
            <>
              <kbd>H</kbd>
              <kbd>B</kbd>
              <span className={styles.keyLabel}>Pair</span>
            </>
          )}
          <kbd>Space</kbd>
          <span className={styles.keyLabel}>Close</span>
        </span>
        <button
          type="button"
          tabIndex={-1}
          className={styles.openButton}
          disabled={!style}
          onClick={onOpenSpecimen}
        >
          Open Specimen <kbd>↵</kbd>
        </button>
      </footer>
    </>
  );
}

function messageFor(style: Style | null, status: string): string {
  if (!style || status === "missing") {
    return "This Style's Font file is no longer in your Font folders. It may have been moved or removed.";
  }
  if (status === "failed") {
    return "This Style can't be previewed. The Font file may be damaged, or use a format Book can't draw.";
  }
  return "";
}
