import { guessClassification } from "@shared/classification";
import type { Style } from "@shared/contracts/library";
import { describe, expect, it } from "vitest";
import { type Family, familyKey, groupIntoFamilies } from "@/features/library";
import { buildRows } from "./views";

function style(familyName: string, changes: Partial<Style> = {}): Style {
  const id = `${familyName}-${changes.styleName ?? "Regular"}-${changes.fontFile?.folderKind ?? "user"}`;
  return {
    id,
    faceIndex: 0,
    familyName,
    styleName: "Regular",
    postscriptName: id,
    weight: 400,
    width: 5,
    isItalic: false,
    axes: [],
    namedInstances: [],
    familyClass: 0,
    panose: [],
    isFixedPitch: false,
    designer: null,
    foundry: null,
    version: null,
    copyright: null,
    license: null,
    licenseUrl: null,
    embedding: "installable",
    ownScriptName: null,
    fontFile: {
      path: `/fonts/${id}.otf`,
      name: `${id}.otf`,
      folderPath: "/fonts",
      folderKind: "user",
      size: 1,
      faceCount: 1,
    },
    ...changes,
  };
}

const system = {
  path: "/s",
  name: "s",
  folderPath: "/System",
  folderKind: "system",
  size: 1,
  faceCount: 1,
} as const;
const styles = [
  style("Inter", { familyClass: 0x0805 }),
  style("Café Serif", { familyClass: 0x0205 }),
  style("Helvetica", { familyClass: 0x0805, fontFile: system }),
  style("Courier", { isFixedPitch: true, fontFile: system }),
];
const familiesByKey = new Map(
  groupIntoFamilies(styles).map((family) => [family.key, family]),
);
const classify = (family: Family) => ({
  classification: guessClassification(family.representative),
  isGuess: true,
});
const base = {
  styles,
  familiesByKey,
  refs: [],
  search: "",
  classification: "any",
  classify,
} as const;

describe("buildRows", () => {
  it("splits Families into My Fonts and System by Font folder", () => {
    const names = (kind: "all" | "my-fonts" | "system") =>
      buildRows({ ...base, view: { kind } }).rows.map((row) => row.key);

    expect(names("all")).toEqual([
      "café serif",
      "courier",
      "helvetica",
      "inter",
    ]);
    expect(names("my-fonts")).toEqual(["café serif", "inter"]);
    expect(names("system")).toEqual(["courier", "helvetica"]);
  });

  it("searches without regard to case or accents, and counts Classifications", () => {
    const result = buildRows({
      ...base,
      view: { kind: "all" },
      search: "CAFE",
    });

    expect(result.rows.map((row) => row.key)).toEqual(["café serif"]);
    expect(result.counts.get("serif")).toBe(1);
  });

  it("filters by Classification and reports the view's total", () => {
    const result = buildRows({
      ...base,
      view: { kind: "all" },
      classification: "sans-serif",
    });

    expect(result.rows.map((row) => row.key)).toEqual(["helvetica", "inter"]);
    expect(result.total).toBe(4);
    expect(
      buildRows({ ...base, view: { kind: "all" }, search: "inter" }).total,
    ).toBe(4);
    expect(result.counts.get("monospace")).toBe(1);
  });

  it("shows saved Styles as Style rows, and gone ones as Missing", () => {
    const inter = styles[0];
    if (!inter) throw new Error("fixture");
    const result = buildRows({
      ...base,
      view: { kind: "favorites" },
      refs: [
        { styleId: "gone", familyName: "Avenir", styleName: "Book" },
        { styleId: inter.id, familyName: "Inter", styleName: "Regular" },
      ],
    });

    expect(result.rows.map((row) => [row.kind, row.key])).toEqual([
      ["missing", "gone"],
      ["style", inter.id],
    ]);
    expect(familyKey("Inter")).toBe("inter");
  });
});
