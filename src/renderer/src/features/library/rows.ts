import type { Classification } from "@shared/classification";
import type { Style } from "@shared/contracts/library";
import type { StyleRef } from "@shared/contracts/storage";
import type { Family } from "./families";

/**
 * One row of the Library list. The Library's own views show Family rows;
 * Favorites and Collections hold Styles, so they show Style rows, and a Style
 * whose Font file is gone shows as a Missing row.
 */
export type ListRow =
  | {
      kind: "family";
      key: string;
      family: Family;
      classification: Classification;
    }
  | {
      kind: "style";
      key: string;
      style: Style;
      family: Family;
      classification: Classification;
    }
  | { kind: "missing"; key: string; ref: StyleRef };

/** The Style a row stands for: what Quick preview shows and Enter opens. */
export function rowStyle(row: ListRow): Style | null {
  if (row.kind === "family") return row.family.representative;
  if (row.kind === "style") return row.style;
  return null;
}

export function rowFamily(row: ListRow): Family | null {
  return row.kind === "missing" ? null : row.family;
}
