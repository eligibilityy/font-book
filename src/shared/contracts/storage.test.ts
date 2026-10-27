import { describe, expect, it } from "vitest";
import {
  collectionsFileSchema,
  defaultPairing,
  prefsFileSchema,
} from "./storage";

describe("prefs.json", () => {
  it("reads a file saved by Book v0.1, before the Pairing existed", () => {
    const savedByV01 = {
      version: 1,
      sampleText: "Hamburgefonstiv",
      specimenSize: 96,
      lineHeight: 1.2,
      tracking: 10,
      paperReversed: true,
      inspectorOpen: false,
      sidebarVisible: true,
      firstLaunchHintSeen: true,
      dedicationSeen: true,
    };

    const prefs = prefsFileSchema.parse(savedByV01);

    expect(prefs.sampleText).toBe("Hamburgefonstiv");
    expect(prefs.pairing).toEqual(defaultPairing);
  });
});

describe("collections.json", () => {
  it("reads a file saved by Book v0.1, before Collection notes existed", () => {
    const savedByV01 = {
      version: 1,
      favorites: [],
      collections: [
        {
          id: "c1",
          name: "Typography II",
          styles: [{ styleId: "s1", familyName: "Inter", styleName: "Bold" }],
        },
      ],
    };

    const file = collectionsFileSchema.parse(savedByV01);

    expect(file.collections[0]?.note).toBe("");
    expect(file.collections[0]?.styles).toHaveLength(1);
  });
});
