import { describe, expect, it } from "vitest";
import {
  type ClassificationHints,
  guessClassification,
} from "./classification";

const blank: ClassificationHints = {
  familyName: "Example",
  isFixedPitch: false,
  familyClass: 0,
  panose: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
};

describe("guessClassification", () => {
  it("trusts the fixed-pitch flag first", () => {
    expect(
      guessClassification({
        ...blank,
        isFixedPitch: true,
        familyClass: 0x0805,
      }),
    ).toBe("monospace");
  });

  it("reads the IBM class from sFamilyClass's high byte", () => {
    expect(guessClassification({ ...blank, familyClass: 0x020f })).toBe(
      "serif",
    ); // Cambria
    expect(guessClassification({ ...blank, familyClass: 0x0805 })).toBe(
      "sans-serif",
    ); // Segoe UI
    expect(guessClassification({ ...blank, familyClass: 0x0501 })).toBe(
      "slab-serif",
    );
    expect(guessClassification({ ...blank, familyClass: 0x0a05 })).toBe(
      "script",
    );
    expect(guessClassification({ ...blank, familyClass: 0x0900 })).toBe(
      "display",
    );
  });

  it("falls through Symbolic to PANOSE", () => {
    expect(
      guessClassification({
        ...blank,
        familyClass: 0x0c00,
        panose: [2, 11, 5, 2, 4, 2, 4, 2, 2, 3],
      }),
    ).toBe("sans-serif");
  });

  it("reads PANOSE family type and serif style", () => {
    const panose = (familyType: number, serifStyle: number): number[] => [
      familyType,
      serifStyle,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
    ];
    expect(guessClassification({ ...blank, panose: panose(3, 0) })).toBe(
      "script",
    );
    expect(guessClassification({ ...blank, panose: panose(4, 0) })).toBe(
      "display",
    );
    expect(guessClassification({ ...blank, panose: panose(2, 2) })).toBe(
      "serif",
    );
    expect(guessClassification({ ...blank, panose: panose(2, 6) })).toBe(
      "slab-serif",
    );
    expect(guessClassification({ ...blank, panose: panose(2, 12) })).toBe(
      "sans-serif",
    );
  });

  it("uses words in the Family name as a last resort", () => {
    const named = (familyName: string) =>
      guessClassification({ ...blank, familyName });
    expect(named("Roboto Mono")).toBe("monospace");
    expect(named("Roboto Slab")).toBe("slab-serif");
    expect(named("Noto Sans")).toBe("sans-serif");
    expect(named("Schibsted Grotesk")).toBe("sans-serif");
    expect(named("Source Serif 4")).toBe("serif");
    expect(named("Playfair Display")).toBe("display");
  });

  it("says unclassified when nothing in the file says otherwise", () => {
    expect(guessClassification(blank)).toBe("unclassified");
    expect(guessClassification({ ...blank, panose: [] })).toBe("unclassified");
  });
});
