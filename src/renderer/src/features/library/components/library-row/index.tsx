import type { Style } from "@shared/contracts/library";
import { memo } from "react";
import { sampleFontFamily } from "@/shared/font-faces/registry";
import { useStyleFace } from "@/shared/font-faces/use-style-face";
import { countOf } from "@/shared/text";
import { StarIcon } from "@/shared/ui/icons";
import type { ListRow } from "../../rows";
import styles from "./styles.module.css";

interface LibraryRowProps {
  row: ListRow;
  id: string;
  index: number;
  isSelected: boolean;
  sampleText: string;
  hasFavorite: boolean;
  top: number;
  onSelect: (index: number) => void;
  onOpen: (index: number) => void;
}

/** One 80px row: Sample text in the row's Style, then its names in the UI font. */
export const LibraryRow = memo(function LibraryRow({
  row,
  id,
  index,
  isSelected,
  sampleText,
  hasFavorite,
  top,
  onSelect,
  onOpen,
}: LibraryRowProps): React.JSX.Element {
  return (
    // biome-ignore lint/a11y/useFocusableInteractive: the listbox holds focus and points at the selected row with aria-activedescendant.
    <div
      id={id}
      role="option"
      aria-selected={isSelected}
      data-row-index={index}
      className={styles.row}
      style={{ transform: `translateY(${top}px)` }}
      onMouseDown={(event) => {
        // Right-click selects too, so the context menu acts on this row.
        if (event.button === 0 || event.button === 2) onSelect(index);
      }}
      onDoubleClick={() => onOpen(index)}
    >
      {row.kind === "missing" ? (
        <>
          <p className={styles.notice}>
            Missing. The Font file was moved or removed.
          </p>
          <p className={styles.names}>
            <span className={styles.familyName}>{row.ref.familyName}</span>
            <span>{row.ref.styleName}</span>
          </p>
        </>
      ) : (
        <>
          <RowSample
            style={
              row.kind === "family" ? row.family.representative : row.style
            }
            text={
              sampleText ||
              (row.kind === "family" ? row.family.name : row.style.styleName)
            }
          />
          <p className={styles.names}>
            <span className={styles.familyName}>{row.family.name}</span>
            {row.kind === "family" ? (
              <span>
                {countOf(row.family.styles.length, "Style", "Styles")}
                {row.family.hasAxes && ", Variable"}
              </span>
            ) : (
              <span>{row.style.styleName}</span>
            )}
            {hasFavorite && <StarIcon filled className={styles.favorite} />}
          </p>
        </>
      )}
    </div>
  );
});

function RowSample({
  style,
  text,
}: {
  style: Style;
  text: string;
}): React.JSX.Element {
  // Wait 100ms on screen before loading, so scrolling fast loads nothing.
  const status = useStyleFace(style, { delayMs: 100 });

  if (status === "ready") {
    return (
      <p
        className={styles.sample}
        style={{ fontFamily: sampleFontFamily(style.id) }}
      >
        {text}
      </p>
    );
  }
  if (status === "failed")
    return <p className={styles.notice}>Can't be previewed</p>;
  if (status === "missing") {
    return (
      <p className={styles.notice}>
        Missing. The Font file was moved or removed.
      </p>
    );
  }
  if (status === "too-large") {
    return <p className={styles.notice}>Large file. Opens in the Specimen.</p>;
  }
  // Loading: keep the line's height so nothing shifts when the face arrives.
  return <p className={styles.notice} aria-hidden="true" />;
}
