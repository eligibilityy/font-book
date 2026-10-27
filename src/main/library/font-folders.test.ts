import { describe, expect, it } from "vitest";
import { listFontFolders } from "./font-folders";

describe("listFontFolders", () => {
  it("lists the user, local and system Font folders on macOS", () => {
    expect(
      listFontFolders({ platform: "darwin", homePath: "/Users/someone" }),
    ).toEqual([
      { path: "/Users/someone/Library/Fonts", kind: "user" },
      { path: "/Library/Fonts", kind: "user" },
      { path: "/System/Library/Fonts", kind: "system" },
    ]);
  });

  it("lists the per-user and system Font folders on Windows", () => {
    expect(
      listFontFolders({
        platform: "win32",
        homePath: "C:\\Users\\someone",
        windowsPath: "D:\\Win",
        localAppDataPath: "C:\\Users\\someone\\AppData\\Local",
      }),
    ).toEqual([
      {
        path: "C:\\Users\\someone\\AppData\\Local\\Microsoft\\Windows\\Fonts",
        kind: "user",
      },
      { path: "D:\\Win\\Fonts", kind: "system" },
    ]);
  });

  it("falls back to the default Windows folders when the variables are unset", () => {
    expect(
      listFontFolders({ platform: "win32", homePath: "C:\\Users\\someone" }),
    ).toEqual([
      {
        path: "C:\\Users\\someone\\AppData\\Local\\Microsoft\\Windows\\Fonts",
        kind: "user",
      },
      { path: "C:\\Windows\\Fonts", kind: "system" },
    ]);
  });
});
