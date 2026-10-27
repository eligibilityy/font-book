import type { ImportSummary } from "@shared/contracts/library";
import { describe, expect, it } from "vitest";
import { importMessage } from "./import-message";

const none: ImportSummary = {
  importedCount: 0,
  alreadyImportedCount: 0,
  failedCount: 0,
  skippedCount: 0,
  styleIds: [],
};

describe("importMessage", () => {
  it("says how many Font files arrived, and where", () => {
    expect(importMessage({ ...none, importedCount: 3 }, null)).toBe(
      "Imported 3 Font files.",
    );
    expect(importMessage({ ...none, importedCount: 1 }, "Typography II")).toBe(
      "Imported 1 Font file into Typography II.",
    );
  });

  it("says when everything was already there", () => {
    expect(importMessage({ ...none, alreadyImportedCount: 2 }, null)).toBe(
      "Those Font files are already in Book.",
    );
    expect(
      importMessage({ ...none, alreadyImportedCount: 1 }, "Poster brief"),
    ).toBe("Already in Book, so added to Poster brief.");
  });

  it("mentions files left out, without blaming her", () => {
    expect(
      importMessage(
        { ...none, importedCount: 4, failedCount: 1, skippedCount: 2 },
        null,
      ),
    ).toBe(
      "Imported 4 Font files. 1 file couldn't be read, so it was left out. Skipped 2 files that aren't Font files Book can preview.",
    );
  });

  it("explains what Book can Import when nothing was a Font file", () => {
    expect(importMessage({ ...none, skippedCount: 1 }, null)).toBe(
      "Book found no Font files to Import there. It imports .ttf, .otf, .ttc, .woff and .woff2 files.",
    );
  });
});
