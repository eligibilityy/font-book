// Builds Book's app icons from the SVG masters in build/icon-masters.
// Run with `bun run icons` after changing a master.
//
//   build/icon.icns   macOS (every size the Finder and Dock ask for)
//   build/icon.ico    Windows (16 to 256px)
//   build/icon.png    1024px, for Linux and as electron-builder's fallback
//   resources/icon.png            the window icon on Linux
//   src/renderer/src/shared/ui/book-icon.svg   the icon inside the app (About)
//
// Sizes of 32px and below use the "small" masters, whose ampersand is drawn
// larger: at full scale its hairlines disappear.
import { copyFile, readFile, writeFile } from "node:fs/promises";
import { Resvg } from "@resvg/resvg-js";

const MASTERS = "build/icon-masters";

async function render(master, size) {
  const svg = await readFile(`${MASTERS}/${master}`, "utf8");
  return new Resvg(svg, { fitTo: { mode: "width", value: size } })
    .render()
    .asPng();
}

/** Apple's icon container: a list of (four-letter type, PNG) entries. */
async function buildIcns() {
  const entries = [
    ["icp4", 16, "icon-small.svg"],
    ["icp5", 32, "icon-small.svg"],
    ["ic11", 32, "icon-small.svg"], // 16pt @2x
    ["icp6", 64, "icon.svg"],
    ["ic12", 64, "icon.svg"], // 32pt @2x
    ["ic07", 128, "icon.svg"],
    ["ic08", 256, "icon.svg"],
    ["ic13", 256, "icon.svg"], // 128pt @2x
    ["ic09", 512, "icon.svg"],
    ["ic14", 512, "icon.svg"], // 256pt @2x
    ["ic10", 1024, "icon.svg"], // 512pt @2x
  ];
  const chunks = [];
  for (const [type, size, master] of entries) {
    const png = await render(master, size);
    const header = Buffer.alloc(8);
    header.write(type, 0, "ascii");
    header.writeUInt32BE(png.length + 8, 4);
    chunks.push(header, png);
  }
  const body = Buffer.concat(chunks);
  const header = Buffer.alloc(8);
  header.write("icns", 0, "ascii");
  header.writeUInt32BE(body.length + 8, 4);
  return Buffer.concat([header, body]);
}

/** Windows' icon container: a directory of images, each stored as a PNG. */
async function buildIco() {
  const sizes = [16, 24, 32, 48, 64, 128, 256];
  const images = [];
  for (const size of sizes) {
    images.push(
      await render(
        size <= 32 ? "icon-windows-small.svg" : "icon-windows.svg",
        size,
      ),
    );
  }
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(images.length, 4);
  const directory = Buffer.alloc(16 * images.length);
  let offset = header.length + directory.length;
  images.forEach((png, index) => {
    const size = sizes[index];
    const entry = index * 16;
    directory.writeUInt8(size >= 256 ? 0 : size, entry); // 0 means 256
    directory.writeUInt8(size >= 256 ? 0 : size, entry + 1);
    directory.writeUInt8(0, entry + 2); // no palette
    directory.writeUInt8(0, entry + 3);
    directory.writeUInt16LE(1, entry + 4); // colour planes
    directory.writeUInt16LE(32, entry + 6); // bits per pixel
    directory.writeUInt32LE(png.length, entry + 8);
    directory.writeUInt32LE(offset, entry + 12);
    offset += png.length;
  });
  return Buffer.concat([header, directory, ...images]);
}

await writeFile("build/icon.icns", await buildIcns());
await writeFile("build/icon.ico", await buildIco());
await writeFile("build/icon.png", await render("icon.svg", 1024));
await writeFile("resources/icon.png", await render("icon-windows.svg", 512));
await copyFile(
  `${MASTERS}/icon-windows.svg`,
  "src/renderer/src/shared/ui/book-icon.svg",
);
console.log(
  "Built build/icon.icns, build/icon.ico, build/icon.png, resources/icon.png and book-icon.svg",
);
