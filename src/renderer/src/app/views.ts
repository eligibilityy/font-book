import type { Classification } from "@shared/classification";
import type { Style } from "@shared/contracts/library";
import type { Collection, StyleRef } from "@shared/contracts/storage";
import {
  type ClassificationFilter,
  type Family,
  type FamilyClassification,
  familyKey,
  groupIntoFamilies,
  type ListRow,
} from "@/features/library";
import { nameCollator, searchKey } from "@/shared/text";

/** What the main area lists. The Library filters, Couldn't Read, Favorites, or one Collection. */
export type View =
  | { kind: "all" }
  | { kind: "my-fonts" }
  | { kind: "system" }
  | { kind: "couldnt-read" }
  | { kind: "favorites" }
  | { kind: "collection"; id: string };

export function viewKey(view: View): string {
  return view.kind === "collection" ? `collection:${view.id}` : view.kind;
}

export function viewTitle(view: View, collections: Collection[]): string {
  switch (view.kind) {
    case "all":
      return "All";
    case "my-fonts":
      return "My Fonts";
    case "system":
      return "System";
    case "couldnt-read":
      return "Couldn't Read";
    case "favorites":
      return "Favorites";
    case "collection":
      return (
        collections.find((collection) => collection.id === view.id)?.name ??
        "Collection"
      );
  }
}

/** Family rows (the Library filters) or Style rows (Favorites, a Collection). */
export function showsFamilies(view: View): boolean {
  return (
    view.kind === "all" || view.kind === "my-fonts" || view.kind === "system"
  );
}

interface BuildRowsInput {
  view: View;
  styles: Style[];
  familiesByKey: ReadonlyMap<string, Family>;
  /** The Styles a Style-row view holds, in saved order. */
  refs: readonly StyleRef[];
  search: string;
  classification: ClassificationFilter;
  classify: (family: Family) => FamilyClassification;
}

export interface BuiltRows {
  rows: ListRow[];
  /** Rows in the view before search and the Classification filter: "8 of 312 Families". */
  total: number;
  /** Per Classification, after search, before the Classification filter. */
  counts: Map<Classification, number>;
}

/** The rows a view shows, after search and the Classification filter. */
export function buildRows({
  view,
  styles,
  familiesByKey,
  refs,
  search,
  classification,
  classify,
}: BuildRowsInput): BuiltRows {
  const query = searchKey(search.trim());
  const counts = new Map<Classification, number>();
  const count = (family: Family): Classification => {
    const value = classify(family).classification;
    counts.set(value, (counts.get(value) ?? 0) + 1);
    return value;
  };

  if (showsFamilies(view)) {
    const inView =
      view.kind === "all"
        ? styles
        : styles.filter((style) =>
            view.kind === "system"
              ? style.fontFile.folderKind === "system"
              : style.fontFile.folderKind === "user",
          );
    const families = groupIntoFamilies(inView);
    const matching = families.filter(
      (family) => query === "" || searchKey(family.name).includes(query),
    );
    const rows: ListRow[] = [];
    for (const family of matching) {
      const value = count(family);
      if (classification === "any" || value === classification) {
        rows.push({ kind: "family", key: family.key, family });
      }
    }
    return { rows, total: families.length, counts };
  }

  const stylesById = new Map(styles.map((style) => [style.id, style]));
  const resolved = refs
    .filter(
      (ref) =>
        query === "" ||
        searchKey(`${ref.familyName} ${ref.styleName}`).includes(query),
    )
    .map((ref): ListRow => {
      const style = stylesById.get(ref.styleId);
      const family = style
        ? familiesByKey.get(familyKey(style.familyName))
        : undefined;
      return style && family
        ? { kind: "style", key: ref.styleId, style, family }
        : { kind: "missing", key: ref.styleId, ref };
    })
    .sort((a, b) => {
      const nameA =
        a.kind === "style" ? a.style : a.kind === "missing" ? a.ref : null;
      const nameB =
        b.kind === "style" ? b.style : b.kind === "missing" ? b.ref : null;
      return (
        nameCollator.compare(
          nameA?.familyName ?? "",
          nameB?.familyName ?? "",
        ) ||
        nameCollator.compare(nameA?.styleName ?? "", nameB?.styleName ?? "")
      );
    });

  const rows = resolved.filter((row) => {
    if (row.kind !== "style") return classification === "any";
    const value = count(row.family);
    return classification === "any" || value === classification;
  });
  return { rows, total: refs.length, counts };
}
