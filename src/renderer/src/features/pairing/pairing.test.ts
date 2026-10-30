import type { Style } from "@shared/contracts/library";
import { defaultPairing, type StyleRef } from "@shared/contracts/storage";
import { describe, expect, it } from "vitest";
import {
  assignRole,
  resolveSlot,
  stepCandidate,
  stepStyle,
  swapRoles,
} from "./pairing";

const inter: StyleRef = {
  styleId: "inter-bold",
  familyName: "Inter",
  styleName: "Bold",
};
const sourceSerif: StyleRef = {
  styleId: "source-serif-regular",
  familyName: "Source Serif 4",
  styleName: "Regular",
};

describe("Pairing", () => {
  it("puts a Style in a role with the Axis values it was chosen with", () => {
    const pairing = assignRole(defaultPairing, "heading", inter, { wght: 650 });
    expect(pairing.heading).toEqual({
      style: inter,
      axisValues: { wght: 650 },
    });
    expect(pairing.body.style).toBeNull();
  });

  it("swaps the Styles but keeps each role's size and line height", () => {
    const pairing = assignRole(
      assignRole(
        { ...defaultPairing, headingSize: 64, bodySize: 14 },
        "heading",
        inter,
        {},
      ),
      "body",
      sourceSerif,
      {},
    );
    const swapped = swapRoles(pairing);
    expect(swapped.heading.style).toEqual(sourceSerif);
    expect(swapped.body.style).toEqual(inter);
    expect(swapped.headingSize).toBe(64);
    expect(swapped.bodySize).toBe(14);
  });

  it("tells an empty role from one whose Font file is gone", () => {
    expect(resolveSlot(defaultPairing.heading, new Map())).toEqual({
      status: "empty",
    });
    expect(resolveSlot({ style: inter, axisValues: {} }, new Map())).toEqual({
      status: "missing",
      ref: inter,
    });
  });
});

function style(familyName: string, styleName = "Regular"): Style {
  const id = `${familyName}-${styleName}`;
  return {
    id,
    faceIndex: 0,
    familyName,
    styleName,
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
      modifiedMs: 0,
      faceCount: 1,
      isInstalled: false,
    },
  };
}

describe("stepping a role", () => {
  const candidates = [style("Arial"), style("Georgia"), style("Inter")];

  it("moves to the next Family in the list she came from", () => {
    expect(stepCandidate(candidates, style("Georgia"), 1)?.familyName).toBe(
      "Inter",
    );
    expect(stepCandidate(candidates, style("Georgia"), -1)?.familyName).toBe(
      "Arial",
    );
  });

  it("finds a Family by any of its Styles, not just the one in the row", () => {
    expect(
      stepCandidate(candidates, style("Georgia", "Bold Italic"), 1)?.familyName,
    ).toBe("Inter");
  });

  it("stops at the ends of the list", () => {
    expect(stepCandidate(candidates, style("Inter"), 1)?.familyName).toBe(
      "Inter",
    );
  });

  it("starts at the top, or the bottom, when the role's Style isn't listed", () => {
    expect(stepCandidate(candidates, null, 1)?.familyName).toBe("Arial");
    expect(stepCandidate(candidates, style("Zapfino"), -1)?.familyName).toBe(
      "Inter",
    );
    expect(stepCandidate([], null, 1)).toBeNull();
  });

  it("steps through a Family's Styles and wraps around", () => {
    const inter = [
      style("Inter"),
      style("Inter", "Bold"),
      style("Inter", "Black"),
    ];
    expect(stepStyle(inter, style("Inter", "Black"), 1).styleName).toBe(
      "Regular",
    );
    expect(stepStyle(inter, style("Inter"), -1).styleName).toBe("Black");
  });
});
