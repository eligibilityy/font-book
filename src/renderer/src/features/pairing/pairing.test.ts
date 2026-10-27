import { defaultPairing, type StyleRef } from "@shared/contracts/storage";
import { describe, expect, it } from "vitest";
import { assignRole, resolveSlot, swapRoles } from "./pairing";

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
