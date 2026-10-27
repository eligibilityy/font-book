import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildCollection } from "./build-collection.test-helper";
import { extractFace, isCollection } from "./extract-face";
import { parseFontFile } from "./parse-font-file";

const fixture = (name: string): Buffer =>
  readFileSync(join(__dirname, "fixtures", name));

const pacifico = fixture("Pacifico-Regular.ttf");
const inconsolata = fixture("Inconsolata-Variable.ttf");

describe("parseFontFile", () => {
  it("reads a static Style's names, weight and credits", () => {
    const result = parseFontFile(pacifico);

    expect(result.status).toBe("parsed");
    if (result.status !== "parsed") return;
    expect(result.faceCount).toBe(1);
    expect(result.faces[0]).toMatchObject({
      faceIndex: 0,
      familyName: "Pacifico",
      styleName: "Regular",
      postscriptName: "Pacifico-Regular",
      weight: 400,
      isItalic: false,
      axes: [],
      isFixedPitch: false,
      designer: "Vernon Adams",
      embedding: "installable",
    });
    expect(result.faces[0]?.license).toMatch(/SIL Open Font License/);
  });

  it("reads Axes, Named instances and fixed pitch from a variable Style", () => {
    const result = parseFontFile(inconsolata);

    if (result.status !== "parsed") throw new Error("expected parsed");
    const face = result.faces[0];
    expect(face?.axes).toEqual([
      { tag: "wght", name: "Weight", min: 200, default: 400, max: 900 },
      { tag: "wdth", name: "Width", min: 50, default: 100, max: 200 },
    ]);
    expect(face?.namedInstances).toContainEqual({
      name: "UltraCondensed Bold",
      coordinates: { wght: 700, wdth: 50 },
    });
    expect(face?.isFixedPitch).toBe(true);
  });

  it("reads every face of a collection file", () => {
    const result = parseFontFile(
      Buffer.from(buildCollection([pacifico, inconsolata])),
    );

    if (result.status !== "parsed") throw new Error("expected parsed");
    expect(result.faceCount).toBe(2);
    expect(
      result.faces.map((face) => [face.faceIndex, face.familyName]),
    ).toEqual([
      [0, "Pacifico"],
      [1, "Inconsolata"],
    ]);
  });

  it("fails without throwing for a file that isn't a font", () => {
    expect(parseFontFile(Buffer.from("this is not a font"))).toEqual({
      status: "failed",
    });
    expect(parseFontFile(pacifico.subarray(0, 200))).toEqual({
      status: "failed",
    });
  });
});

describe("extractFace", () => {
  const collection = buildCollection([pacifico, inconsolata]);

  it("turns one face of a collection into a standalone font", () => {
    const second = extractFace(collection, 1);

    expect(isCollection(second)).toBe(false);
    const parsed = parseFontFile(Buffer.from(second));
    if (parsed.status !== "parsed") throw new Error("expected parsed");
    expect(parsed.faceCount).toBe(1);
    expect(parsed.faces[0]?.postscriptName).toBe("Inconsolata-Regular");
    expect(parsed.faces[0]?.axes).toHaveLength(2);
  });

  it("refuses a face index the collection doesn't have", () => {
    expect(() => extractFace(collection, 2)).toThrow();
    expect(() => extractFace(collection, -1)).toThrow();
  });

  it("refuses a file that isn't a collection", () => {
    expect(isCollection(pacifico)).toBe(false);
    expect(() => extractFace(pacifico, 0)).toThrow();
  });
});
