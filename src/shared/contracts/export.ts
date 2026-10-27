import { z } from "zod";

/**
 * Export: the part of the window to save as a PNG, in CSS pixels from the
 * page's top left, and the file name to suggest in the save dialog.
 */
export const exportPngInputSchema = z.object({
  rect: z.object({
    x: z.number().int().min(0).max(20_000),
    y: z.number().int().min(0).max(20_000),
    width: z.number().int().min(1).max(20_000),
    height: z.number().int().min(1).max(20_000),
  }),
  fileName: z.string().min(1).max(200),
});
export type ExportPngInput = z.infer<typeof exportPngInputSchema>;

/** The PNG's real size in pixels: twice the CSS size on a Retina display. */
export type ExportPngResult =
  | { status: "saved"; fileName: string; width: number; height: number }
  | { status: "cancelled" }
  | { status: "failed" };
