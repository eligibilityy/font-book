import { describe, expect, it } from "vitest";
import { defaultAxisValues, matchingInstance, variationStyle } from "./axes";

const style = {
  axes: [
    { tag: "wght", name: "Weight", min: 100, default: 400, max: 900 },
    { tag: "opsz", name: "Optical Size", min: 8, default: 14, max: 72 },
  ],
  namedInstances: [
    { name: "Regular", coordinates: { wght: 400, opsz: 14 } },
    { name: "Bold", coordinates: { wght: 700, opsz: 14 } },
  ],
};

describe("variable Style Axes", () => {
  it("starts at each Axis's default and matches the Named instance there", () => {
    const values = defaultAxisValues(style);

    expect(values).toEqual({ wght: 400, opsz: 14 });
    expect(matchingInstance(style, values)?.name).toBe("Regular");
    expect(matchingInstance(style, { ...values, wght: 700 })?.name).toBe(
      "Bold",
    );
    expect(matchingInstance(style, { ...values, wght: 650 })).toBeUndefined();
  });

  it("drives Axes through font-variation-settings, never font-weight", () => {
    expect(variationStyle(style, { wght: 700, opsz: 30 }, false)).toEqual({
      fontVariationSettings: '"wght" 700, "opsz" 30',
      fontOpticalSizing: "none",
    });
  });

  it("leaves opsz to the font size while Match Size is on", () => {
    expect(variationStyle(style, { wght: 700, opsz: 30 }, true)).toEqual({
      fontVariationSettings: '"wght" 700',
      fontOpticalSizing: "auto",
    });
  });

  it("adds nothing for a static Style", () => {
    expect(variationStyle({ axes: [], namedInstances: [] }, {}, true)).toEqual(
      {},
    );
  });
});
