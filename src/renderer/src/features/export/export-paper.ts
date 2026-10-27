import type { ExportPngResult } from "@shared/contracts/export";

/** The element Export pictures: the Specimen's or the Pairing's paper. */
const EXPORT_REGION_ATTRIBUTE = "data-export-region";

/**
 * Saves the paper as she sees it, as a PNG. The inspector is left out when
 * it covers the paper's right edge. Returns null when nothing is showing
 * that can be Exported.
 */
export async function exportPaper(
  fileName: string,
): Promise<ExportPngResult | null> {
  const region = document.querySelector(`[${EXPORT_REGION_ATTRIBUTE}]`);
  if (!(region instanceof HTMLElement)) return null;

  const bounds = region.getBoundingClientRect();
  const inspector = region.parentElement?.querySelector(
    'aside[aria-label="Inspector"]',
  );
  const right = Math.min(
    inspector ? inspector.getBoundingClientRect().left : bounds.right,
    window.innerWidth,
  );
  const bottom = Math.min(bounds.bottom, window.innerHeight);
  const x = Math.max(0, Math.round(bounds.left));
  const y = Math.max(0, Math.round(bounds.top));

  // No caret, text selection or scrollbar in the picture.
  const focused = document.activeElement;
  if (focused instanceof HTMLElement) focused.blur();
  window.getSelection()?.removeAllRanges();
  region.setAttribute("data-exporting", "");
  await nextPaint();

  try {
    return await window.fontBook.export.savePng({
      rect: {
        x,
        y,
        width: Math.max(1, Math.round(right) - x),
        height: Math.max(1, Math.round(bottom) - y),
      },
      fileName,
    });
  } finally {
    region.removeAttribute("data-exporting");
    if (focused instanceof HTMLElement) focused.focus();
  }
}

/** Resolves once the page has painted the latest changes. */
function nextPaint(): Promise<void> {
  return new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );
}
