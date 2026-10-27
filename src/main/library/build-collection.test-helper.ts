/**
 * Test helper: packs standalone fonts into one .ttc-style collection, the
 * inverse of extractFace. Each face keeps its own copy of every table, which
 * is valid (real collections share tables to save space).
 */
export function buildCollection(fonts: Uint8Array[]): Uint8Array {
  const headerSize = 12 + fonts.length * 4;
  const total = fonts.reduce(
    (size, font) => size + padTo4(font.byteLength),
    headerSize,
  );
  const output = new Uint8Array(total);
  const target = new DataView(output.buffer);

  target.setUint32(0, 0x74746366); // "ttcf"
  target.setUint16(4, 1);
  target.setUint16(6, 0);
  target.setUint32(8, fonts.length);

  let offset = headerSize;
  fonts.forEach((font, index) => {
    target.setUint32(12 + index * 4, offset);
    output.set(font, offset);
    // Table offsets in a collection count from the start of the file.
    const source = new DataView(font.buffer, font.byteOffset, font.byteLength);
    const tableCount = source.getUint16(4);
    for (let table = 0; table < tableCount; table += 1) {
      const record = 12 + table * 16;
      target.setUint32(
        offset + record + 8,
        source.getUint32(record + 8) + offset,
      );
    }
    offset += padTo4(font.byteLength);
  });

  return output;
}

function padTo4(length: number): number {
  return (length + 3) & ~3;
}
