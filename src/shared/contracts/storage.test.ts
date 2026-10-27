import { describe, expect, it } from "vitest";
import { defaultPairing, prefsFileSchema } from "./storage";

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
