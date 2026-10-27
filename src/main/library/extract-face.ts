/**
 * Collection files (.ttc, .otc) hold several faces that share tables. The
 * browser's FontFace API always draws the first face of a collection, so to
 * show any other Style, main copies that face's tables into a standalone font.
 *
 * Layout: https://learn.microsoft.com/en-us/typography/opentype/spec/otff#font-collections
 */

const COLLECTION_TAG = 0x74746366; // "ttcf"
const SFNT_HEADER_SIZE = 12;
const TABLE_RECORD_SIZE = 16;

export function isCollection(bytes: Uint8Array): boolean {
  return bytes.byteLength >= 12 && view(bytes).getUint32(0) === COLLECTION_TAG;
}

/**
 * Returns face `faceIndex` of a collection as a standalone font. Table data is
 * copied unchanged, so each table's checksum still holds. Throws if the file
 * is not a collection or its offsets point outside the file.
 */
export function extractFace(
  bytes: Uint8Array,
  faceIndex: number,
): Uint8Array<ArrayBuffer> {
  if (!isCollection(bytes)) throw new Error("Not a font collection.");
  const source = view(bytes);
  const faceCount = source.getUint32(8);
  if (!Number.isInteger(faceIndex) || faceIndex < 0 || faceIndex >= faceCount) {
    throw new Error(`Face ${faceIndex} is not in this collection.`);
  }

  const faceOffset = source.getUint32(12 + faceIndex * 4);
  const sfntVersion = source.getUint32(faceOffset);
  const tableCount = source.getUint16(faceOffset + 4);

  const tables = Array.from({ length: tableCount }, (_, i) => {
    const record = faceOffset + SFNT_HEADER_SIZE + i * TABLE_RECORD_SIZE;
    const table = {
      tag: source.getUint32(record),
      checksum: source.getUint32(record + 4),
      offset: source.getUint32(record + 8),
      length: source.getUint32(record + 12),
    };
    if (table.offset + table.length > bytes.byteLength) {
      throw new Error("A table points outside the file.");
    }
    return table;
  });

  const directorySize = SFNT_HEADER_SIZE + tableCount * TABLE_RECORD_SIZE;
  const totalSize = tables.reduce(
    (size, table) => size + padTo4(table.length),
    directorySize,
  );
  const output = new Uint8Array(totalSize);
  const target = view(output);

  // The sfnt header: version, table count, and the binary-search fields,
  // which are copied as they were.
  target.setUint32(0, sfntVersion);
  target.setUint16(4, tableCount);
  output.set(bytes.subarray(faceOffset + 6, faceOffset + 12), 6);

  let nextOffset = directorySize;
  tables.forEach((table, i) => {
    const record = SFNT_HEADER_SIZE + i * TABLE_RECORD_SIZE;
    target.setUint32(record, table.tag);
    target.setUint32(record + 4, table.checksum);
    target.setUint32(record + 8, nextOffset);
    target.setUint32(record + 12, table.length);
    output.set(
      bytes.subarray(table.offset, table.offset + table.length),
      nextOffset,
    );
    nextOffset += padTo4(table.length);
  });

  return output;
}

function padTo4(length: number): number {
  return (length + 3) & ~3;
}

function view(bytes: Uint8Array): DataView {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
}
