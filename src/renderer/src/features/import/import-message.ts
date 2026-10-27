import type { ImportSummary } from "@shared/contracts/library";
import { countOf } from "@/shared/text";

/**
 * The toast after an Import: what happened, in one or two short sentences.
 * `collectionName` is set when she dropped onto a Collection.
 */
export function importMessage(
  summary: ImportSummary,
  collectionName: string | null,
): string {
  const { importedCount, alreadyImportedCount, failedCount, skippedCount } =
    summary;
  const into = collectionName ? ` into ${collectionName}` : "";
  const sentences: string[] = [];

  if (importedCount > 0) {
    sentences.push(
      `Imported ${countOf(importedCount, "Font file", "Font files")}${into}.`,
    );
    if (alreadyImportedCount > 0)
      sentences.push(`${alreadyImportedCount} already in Book.`);
  } else if (alreadyImportedCount > 0) {
    sentences.push(
      collectionName
        ? `Already in Book, so added to ${collectionName}.`
        : alreadyImportedCount === 1
          ? "That Font file is already in Book."
          : "Those Font files are already in Book.",
    );
  } else {
    sentences.push("Book found no Font files to Import there.");
  }

  if (failedCount > 0)
    sentences.push(
      `${countOf(failedCount, "file", "files")} couldn't be read, so ${failedCount === 1 ? "it was" : "they were"} left out.`,
    );
  if (skippedCount > 0 && importedCount + alreadyImportedCount > 0)
    sentences.push(
      `Skipped ${countOf(skippedCount, "file", "files")} that ${skippedCount === 1 ? "isn't a Font file" : "aren't Font files"} Book can preview.`,
    );
  else if (skippedCount > 0)
    sentences.push("It imports .ttf, .otf, .ttc, .woff and .woff2 files.");

  return sentences.join(" ");
}
