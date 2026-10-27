import { describe, expect, it } from "vitest";
import { pngFileName, savePng } from "./save-png";

const image = { png: Buffer.from("png"), width: 2400, height: 1200 };

describe("savePng", () => {
  it("captures before the save dialog opens, then writes the PNG", async () => {
    const steps: string[] = [];
    const written: string[] = [];

    const result = await savePng("Inter Bold", {
      capture: async () => {
        steps.push("capture");
        return image;
      },
      chooseSavePath: async (suggested) => {
        steps.push(`dialog ${suggested}`);
        return "/Users/pau/Desktop/Inter Bold.png";
      },
      write: async (path) => {
        written.push(path);
      },
    });

    expect(steps).toEqual(["capture", "dialog Inter Bold.png"]);
    expect(written).toEqual(["/Users/pau/Desktop/Inter Bold.png"]);
    expect(result).toEqual({
      status: "saved",
      fileName: "Inter Bold.png",
      width: 2400,
      height: 1200,
    });
  });

  it("writes nothing when she cancels", async () => {
    let wrote = false;
    const result = await savePng("Inter", {
      capture: async () => image,
      chooseSavePath: async () => null,
      write: async () => {
        wrote = true;
      },
    });
    expect(result).toEqual({ status: "cancelled" });
    expect(wrote).toBe(false);
  });

  it("reports a failed capture or write instead of throwing", async () => {
    await expect(
      savePng("Inter", {
        capture: () => Promise.reject(new Error("off-screen")),
        chooseSavePath: async () => "/x.png",
      }),
    ).resolves.toEqual({ status: "failed" });
    await expect(
      savePng("Inter", {
        capture: async () => image,
        chooseSavePath: async () => "/read-only/x.png",
        write: () => Promise.reject(new Error("EACCES")),
      }),
    ).resolves.toEqual({ status: "failed" });
  });
});

describe("pngFileName", () => {
  it("removes characters macOS or Windows won't accept", () => {
    expect(pngFileName('Inter: Bold/Italic "Display"')).toBe(
      "Inter  Bold Italic  Display.png",
    );
    expect(pngFileName("  ")).toBe("Specimen.png");
  });
});
