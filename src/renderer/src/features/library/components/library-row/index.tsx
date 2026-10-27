import { classificationLabels } from "@shared/classification";
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
  hasFavorite: boolean;
  top: number;
  onSelect: (index: number) => void;
  onOpen: (index: number) => void;
}

/**
 * One 80px row: the name, set in the row's own Style, then its details in the
 * interface font. Sample text belongs to Quick preview and the Specimen; a
 * list of names in their own faces is quicker to scan.
 */
export const LibraryRow = memo(function LibraryRow({
  row,
  id,
  index,
  isSelected,
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
          <p className={`${styles.name} ${styles.missingName}`}>
            {row.ref.familyName} {row.ref.styleName}
          </p>
          <p className={styles.details}>
            Missing. The Font file was moved or removed.
          </p>
        </>
      ) : (
        <>
          <RowName
            style={
              row.kind === "family" ? row.family.representative : row.style
            }
            name={
              row.kind === "family"
                ? row.family.name
                : `${row.style.familyName} ${row.style.styleName}`
            }
          />
          <p className={styles.details}>
            {row.kind === "family" ? (
              <span>
                {countOf(row.family.styles.length, "Style", "Styles")}
              </span>
            ) : (
              <span>{row.style.styleName}</span>
            )}
            {(row.kind === "family"
              ? row.family.hasAxes
              : row.style.axes.length > 0) && <span>Variable</span>}
            <span>{classificationLabels[row.classification]}</span>
            {hasFavorite && <StarIcon filled className={styles.favorite} />}
          </p>
        </>
      )}
    </div>
  );
});

function RowName({
  style,
  name,
}: {
  style: Style;
  name: string;
}): React.JSX.Element {
  // Wait 100ms on screen before loading, so scrolling fast loads nothing.
  const status = useStyleFace(style, { delayMs: 100 });

  if (status === "ready") {
    return (
      <p
        className={styles.name}
        style={{ fontFamily: sampleFontFamily(style.id) }}
      >
        {name}
      </p>
    );
  }
  // Until the face arrives, or if it can't be drawn, the name is in the
  // interface font, dimmed, in the same space: nothing shifts when it loads.
  const note =
    status === "failed"
      ? "Can't be previewed"
      : status === "missing"
        ? "Missing"
        : status === "too-large"
          ? "Large file, opens in the Specimen"
          : null;
  return (
    <p className={`${styles.name} ${styles.placeholder}`}>
      {name}
      {note && <span className={styles.note}>{note}</span>}
    </p>
  );
}
