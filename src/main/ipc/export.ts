import { dirname, join } from "node:path";
import { app, BrowserWindow, dialog, ipcMain } from "electron";
import { exportChannels } from "../../shared/contracts/channels";
import {
  type ExportPngResult,
  exportPngInputSchema,
} from "../../shared/contracts/export";
import { savePng } from "../export/save-png";

export function registerExportHandlers(): void {
  // The save dialog opens where she saved last, starting on the Desktop.
  let lastFolder = app.getPath("desktop");

  ipcMain.handle(
    exportChannels.savePng,
    async (event, input: unknown): Promise<ExportPngResult> => {
      const { rect, fileName } = exportPngInputSchema.parse(input);
      const window = BrowserWindow.fromWebContents(event.sender);
      if (!window) return { status: "failed" };

      // capturePage throws for a region that leaves the page, so keep it inside.
      const [pageWidth, pageHeight] = window.getContentSize();
      const x = Math.min(rect.x, (pageWidth ?? 1) - 1);
      const y = Math.min(rect.y, (pageHeight ?? 1) - 1);
      const clamped = {
        x,
        y,
        width: Math.max(1, Math.min(rect.width, (pageWidth ?? 1) - x)),
        height: Math.max(1, Math.min(rect.height, (pageHeight ?? 1) - y)),
      };

      return savePng(fileName, {
        async capture() {
          // In device pixels: twice the CSS size on her Retina display.
          const image = await event.sender.capturePage(clamped);
          const { width, height } = image.getSize();
          return { png: image.toPNG(), width, height };
        },
        async chooseSavePath(suggestedName) {
          const picked = await dialog.showSaveDialog(window, {
            title: "Export PNG",
            buttonLabel: "Export",
            defaultPath: join(lastFolder, suggestedName),
            filters: [{ name: "PNG image", extensions: ["png"] }],
          });
          if (picked.canceled || !picked.filePath) return null;
          lastFolder = dirname(picked.filePath);
          return picked.filePath;
        },
      });
    },
  );
}
