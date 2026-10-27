import type { Style } from "@shared/contracts/library";
import { sampleFontFamily } from "@/shared/font-faces/registry";
import { useStyleFace } from "@/shared/font-faces/use-style-face";
import styles from "./styles.module.css";

interface QuickPreviewProps {
  /** null for a Missing Style: its Font file is gone. */
  style: Style | null;
  title: string;
  /** Position among the Family's Styles, when the row is a Family. */
  stepper: { index: number; count: number } | null;
  sampleText: string;
  lineHeight: number;
  tracking: number;
  paperReversed: boolean;
}

/**
 * A larger look at the selected row without leaving the list. It is a plain
 * region, not a dialog, so focus stays in the list and Up/Down keep working.
 * It appears and disappears instantly: Space is pressed far too often to
 * wait for an animation.
 */
export function QuickPreview({
  style,
  title,
  stepper,
  sampleText,
  lineHeight,
  tracking,
  paperReversed,
}: QuickPreviewProps): React.JSX.Element {
  const status = useStyleFace(style, { priority: true });
  const ink = paperReversed ? "var(--specimen-paper)" : "var(--specimen-ink)";
  const paper = paperReversed ? "var(--specimen-ink)" : "var(--specimen-paper)";

  return (
    <section
      className={styles.panel}
      aria-label="Quick preview"
      style={{ background: paper, color: ink }}
    >
      <header className={styles.header}>
        <span className={styles.title}>{title}</span>
        {stepper && stepper.count > 1 && (
          <span className={styles.stepper}>
            {stepper.index + 1} of {stepper.count} Styles
          </span>
        )}
      </header>
      <div className={styles.body}>
        {style && status === "ready" ? (
          <p
            className={styles.sample}
            style={{
              fontFamily: sampleFontFamily(style.id),
              lineHeight,
              letterSpacing: `${tracking / 1000}em`,
            }}
          >
            {sampleText || `${style.familyName} ${style.styleName}`}
          </p>
        ) : (
          <p className={styles.message}>{messageFor(style, status)}</p>
        )}
      </div>
      <footer className={styles.footer}>
        {stepper && stepper.count > 1
          ? "Left and Right for Styles. Space to close."
          : "Space to close."}
      </footer>
    </section>
  );
}

function messageFor(style: Style | null, status: string): string {
  if (!style || status === "missing") {
    return "This Style's Font file is no longer in your Font folders. It may have been moved or removed.";
  }
  if (status === "failed") {
    return "This Style can't be previewed. The Font file may be damaged, or use a format Book can't draw.";
  }
  return `${style.familyName} ${style.styleName}`;
}
