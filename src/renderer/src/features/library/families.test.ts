import type { Style } from "@shared/contracts/library";
import { describe, expect, it } from "vitest";
import {
  findDuplicates,
  groupIntoFamilies,
  pickRepresentativeStyle,
} from "./families";

let nextId = 0;
function style(
  familyName: string,
  styleName: string,
  changes: Partial<Style> = {},
): Style {
  nextId += 1;
  return {
    id: `style-${nextId}`,
    faceIndex: 0,
    familyName,
    styleName,
    postscriptName: `${familyName}-${styleName}`.replace(/\s/g, ""),
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
      path: `/fonts/${familyName}-${styleName}.otf`,
      name: `${familyName}-${styleName}.otf`,
      folderPath: "/fonts",
      folderKind: "user",
      size: 1000,
      faceCount: 1,
    },
    ...changes,
  };
}

describe("groupIntoFamilies", () => {
  it("groups by Family name, ignoring case and Unicode form, sorted by name", () => {
    const families = groupIntoFamilies([
      style("Zapfino", "Regular"),
      style("Inter", "Bold", { weight: 700 }),
      style("inter", "Regular"),
      style("Café", "Regular"),
      style("Café", "Italic", { isItalic: true }),
    ]);

    expect(
      families.map((family) => [family.name, family.styles.length]),
    ).toEqual([
      ["Café", 2],
      ["inter", 2],
      ["Zapfino", 1],
    ]);
  });

  it("orders Styles by weight, uprights before italics", () => {
    const [family] = groupIntoFamilies([
      style("Inter", "Bold Italic", { weight: 700, isItalic: true }),
      style("Inter", "Bold", { weight: 700 }),
      style("Inter", "Italic", { isItalic: true }),
      style("Inter", "Light", { weight: 300 }),
      style("Inter", "Regular"),
    ]);

    expect(family?.styles.map((s) => s.styleName)).toEqual([
      "Light",
      "Regular",
      "Bold",
      "Italic",
      "Bold Italic",
    ]);
    expect(family?.representative.styleName).toBe("Regular");
  });
});

describe("pickRepresentativeStyle", () => {
  it("picks the upright closest to 400, preferring Regular", () => {
    expect(
      pickRepresentativeStyle([
        style("Inter", "Medium", { weight: 400 }),
        style("Inter", "Regular", { weight: 400 }),
        style("Inter", "Italic", { isItalic: true }),
      ])?.styleName,
    ).toBe("Regular");
    expect(
      pickRepresentativeStyle([
        style("Display", "Black", { weight: 900 }),
        style("Display", "Bold", { weight: 700 }),
      ])?.styleName,
    ).toBe("Bold");
  });

  it("falls back to an italic when every Style is italic", () => {
    expect(
      pickRepresentativeStyle([
        style("Script", "Bold Italic", { weight: 700, isItalic: true }),
        style("Script", "Italic", { isItalic: true }),
      ])?.styleName,
    ).toBe("Italic");
  });
});

describe("findDuplicates", () => {
  it("finds the same Style installed in two Font folders", () => {
    const user = style("Inter", "Regular");
    const system = style("Inter", "Regular", {
      fontFile: {
        ...user.fontFile,
        folderPath: "/System/Library/Fonts",
        folderKind: "system",
      },
    });
    const other = style("Inter", "Bold", { weight: 700 });

    const duplicates = findDuplicates([user, system, other]);

    expect(duplicates.get(user.id)).toEqual([user, system]);
    expect(duplicates.has(other.id)).toBe(false);
  });
});
