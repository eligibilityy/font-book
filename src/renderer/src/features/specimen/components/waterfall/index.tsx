import type { Style } from "@shared/contracts/library";
import { sampleFontFamily } from "@/shared/font-faces/registry";
import styles from "./styles.module.css";

/** From caption to display: enough steps to see where the Style stops working. */
const WATERFALL_SIZES = [10, 12, 14, 16, 18, 24, 32, 48, 64, 96];

interface WaterfallProps {
  style: Style;
  text: string;
  tracking: number;
  /** font-variation-settings and friends for the Style's Axes. */
  variation: React.CSSProperties;
}

/**
 * The same line at several sizes, small to large, to judge whether a Style
 * is for text, for display, or both. Each line stays on one line and fades
 * at the right edge, like a Library row.
 */
export function Waterfall({
  style,
  text,
  tracking,
  variation,
}: WaterfallProps): React.JSX.Element {
  const line = text || `${style.familyName} ${style.styleName}`;
  return (
    <ol className={styles.waterfall} aria-label="Waterfall">
      {WATERFALL_SIZES.map((size) => (
        <li key={size} className={styles.line}>
          <span className={styles.size}>{size}</span>
          <p
            className={styles.text}
            dir="auto"
            style={{
              fontFamily: sampleFontFamily(style.id),
              fontSize: size,
              letterSpacing: `${tracking / 1000}em`,
              ...variation,
            }}
          >
            {line}
          </p>
        </li>
      ))}
    </ol>
  );
}
