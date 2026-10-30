import type { InstallSummary } from "@shared/contracts/library";
import { countOf } from "@/shared/text";

/** The toast after Install or Uninstall: what happened, and what it means for other apps. */
export function installMessage(
  action: "install" | "uninstall",
  { doneCount, skippedCount, failedCount }: InstallSummary,
): string {
  const sentences: string[] = [];
  const files = (count: number): string =>
    countOf(count, "Font file", "Font files");

  if (action === "install") {
    if (doneCount > 0)
      sentences.push(
        `Installed ${files(doneCount)}. Illustrator and your other apps can use ${doneCount === 1 ? "it" : "them"} now.`,
      );
    if (skippedCount > 0)
      sentences.push(
        `${files(skippedCount)} ${skippedCount === 1 ? "was" : "were"} already in your Fonts folder.`,
      );
  } else {
    if (doneCount > 0)
      sentences.push(
        `Uninstalled ${files(doneCount)}. ${doneCount === 1 ? "It stays" : "They stay"} in Book.`,
      );
    if (skippedCount > 0)
      sentences.push(
        `${files(skippedCount)} changed since Book Installed ${skippedCount === 1 ? "it, so it was" : "them, so they were"} left in your Fonts folder.`,
      );
  }
  if (failedCount > 0)
    sentences.push(
      `Book couldn't ${action === "install" ? "Install" : "Uninstall"} ${files(failedCount)}. Try again in a moment.`,
    );
  return sentences.join(" ") || "Nothing to change.";
}
