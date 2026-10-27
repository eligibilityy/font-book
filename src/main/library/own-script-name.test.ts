import { describe, expect, it } from "vitest";
import { findOwnScriptName } from "./own-script-name";

/** A Style that has Glyphs for exactly the characters in these texts. */
function drawing(...texts: string[]): (codePoint: number) => boolean {
  const codePoints = new Set(
    texts.flatMap((text) => [...text].map((c) => c.codePointAt(0))),
  );
  return (codePoint) => codePoints.has(codePoint);
}

const LATIN = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

describe("findOwnScriptName", () => {
  it("leaves a Style that draws its Family name alone", () => {
    expect(findOwnScriptName("Inter", [], drawing(LATIN))).toBeNull();
  });

  it("still draws a name with one missing accented letter", () => {
    expect(findOwnScriptName("Café Sans", [], drawing(LATIN))).toBeNull();
  });

  it("prefers the Family name the Font file gives in the Style's own script", () => {
    expect(
      findOwnScriptName("Al Bayan", ["البيان"], drawing("البيانعربية")),
    ).toEqual({ text: "البيان", script: "Arabic" });
  });

  it("skips a localized name the Style can't draw either", () => {
    expect(
      findOwnScriptName("Hiragino", ["ヒラギノ"], drawing("العربية")),
    ).toEqual({ text: "العربية", script: "Arabic" });
  });

  it("names a script the Style covers when the Font file has no other name", () => {
    expect(findOwnScriptName("Kohinoor", [], drawing("देवनागरी"))).toEqual({
      text: "देवनागरी",
      script: "Devanagari",
    });
  });

  it("checks Korean and Japanese before the Han characters they share with Chinese", () => {
    expect(findOwnScriptName("Gothic", [], drawing("한국어中文"))).toEqual({
      text: "한국어",
      script: "Korean",
    });
    expect(findOwnScriptName("Mincho", [], drawing("ひらがな中文"))).toEqual({
      text: "ひらがな",
      script: "Japanese",
    });
  });

  it("gives up when the Style covers no script it knows, and the name draws as boxes", () => {
    expect(findOwnScriptName("Dingbats", [], drawing("★☆"))).toBeNull();
  });
});
