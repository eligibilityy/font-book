import type { StyleFontFile } from "@shared/contracts/library";
import { describe, expect, it } from "vitest";
import { installStatus } from "./install-status";

function style(fontFile: Partial<StyleFontFile>): {
  fontFile: StyleFontFile;
} {
  return {
    fontFile: {
      path: "/f",
      name: "f.otf",
      folderPath: "/",
      folderKind: "user",
      size: 1,
      modifiedMs: 0,
      faceCount: 1,
      isInstalled: false,
      ...fontFile,
    },
  };
}

describe("installStatus", () => {
  it("has nothing to Install for Styles already in a Font folder", () => {
    expect(installStatus([style({ folderKind: "user" })])).toBe("not-imported");
  });

  it("is installed only when every Imported Style is", () => {
    const installed = style({ folderKind: "imported", isInstalled: true });
    const notYet = style({ folderKind: "imported" });

    expect(installStatus([installed])).toBe("installed");
    expect(installStatus([installed, notYet])).toBe("not-installed");
    // A Family with Styles in her Fonts folder as well as Imported ones.
    expect(installStatus([installed, style({ folderKind: "user" })])).toBe(
      "installed",
    );
  });
});
