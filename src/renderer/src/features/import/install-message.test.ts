import type { InstallSummary } from "@shared/contracts/library";
import { describe, expect, it } from "vitest";
import { installMessage } from "./install-message";

const none: InstallSummary = { doneCount: 0, skippedCount: 0, failedCount: 0 };

describe("installMessage", () => {
  it("says the Font files are ready in other apps", () => {
    expect(installMessage("install", { ...none, doneCount: 2 })).toBe(
      "Installed 2 Font files. Illustrator and your other apps can use them now.",
    );
  });

  it("says an Uninstalled Font file stays in Book", () => {
    expect(installMessage("uninstall", { ...none, doneCount: 1 })).toBe(
      "Uninstalled 1 Font file. It stays in Book.",
    );
  });

  it("explains a copy left alone because it changed", () => {
    expect(installMessage("uninstall", { ...none, skippedCount: 1 })).toBe(
      "1 Font file changed since Book Installed it, so it was left in your Fonts folder.",
    );
  });

  it("names failures", () => {
    expect(
      installMessage("install", { ...none, doneCount: 1, failedCount: 1 }),
    ).toBe(
      "Installed 1 Font file. Illustrator and your other apps can use it now. Book couldn't Install 1 Font file. Try again in a moment.",
    );
  });
});
