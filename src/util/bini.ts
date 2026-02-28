// Adapted from original flint code by biqqles

import * as fs from "fs";
import { resolveFilePathSync } from "./filepath";

// Types
type ValueType = 1 | 2 | 3; // integer, float, string pointer
type BinaryReader = {
  dataView: DataView;
  position: number;
  readInt8(): number;
  readInt16LE(): number;
  readInt32LE(): number;
  readFloatLE(): number;
  readBytes(length: number): Uint8Array;
  tell(): number;
  seek(position: number): void;
};

type Entry = [string, any];
type Section = [string, Entry[]];

// Maps a byte value type to a reader method name
const VALUE_TYPES: Record<
  ValueType,
  (reader: BinaryReader) => number | string
> = {
  1: (reader) => reader.readInt32LE(), // integer
  2: (reader) => reader.readFloatLE(), // float
  3: (reader) => reader.readInt32LE(), // string pointer (to be resolved)
};

/**
 * Creates a binary reader for an ArrayBuffer
 */
function createBinaryReader(arrayBuffer: ArrayBuffer): BinaryReader {
  const dataView = new DataView(arrayBuffer);

  return {
    dataView,
    position: 0,

    readInt8(): number {
      const value = this.dataView.getInt8(this.position);
      this.position += 1;
      return value;
    },

    readInt16LE(): number {
      const value = this.dataView.getInt16(this.position, true); // true for little-endian
      this.position += 2;
      return value;
    },

    readInt32LE(): number {
      const value = this.dataView.getInt32(this.position, true); // true for little-endian
      this.position += 4;
      return value;
    },

    readFloatLE(): number {
      const value = this.dataView.getFloat32(this.position, true); // true for little-endian
      this.position += 4;
      return value;
    },

    readBytes(length: number): Uint8Array {
      const bytes = new Uint8Array(arrayBuffer, this.position, length);
      this.position += length;
      return bytes;
    },

    tell(): number {
      return this.position;
    },

    seek(position: number): void {
      this.position = position;
    },
  };
}

/**
 * Converts a Uint8Array to a string using the specified encoding
 */
function uint8ArrayToString(
  array: Uint8Array,
  encoding: "latin1" | "utf8" = "latin1"
): string {
  if (encoding === "latin1") {
    // For Latin-1 encoding (similar to cp1252), we can directly map byte values to characters
    return Array.from(array)
      .map((byte) => String.fromCharCode(byte))
      .join("");
  } else {
    // For UTF-8, use the TextDecoder API
    const decoder = new TextDecoder(encoding);
    return decoder.decode(array);
  }
}

/**
 * Read the BINI file at `path` and produce an output of the form
 * {section_name -> [{entry_name -> entry_values}]}
 */
export function parseFile(
  filePath: string,
  foldValues = true,
  lower = true
): Section[] {
  // Read the file into an ArrayBuffer
  filePath = resolveFilePathSync(filePath);
  const fileBuffer = fs.readFileSync(filePath);
  const arrayBuffer = fileBuffer.buffer.slice(
    fileBuffer.byteOffset,
    fileBuffer.byteOffset + fileBuffer.byteLength
  );

  const reader = createBinaryReader(arrayBuffer);
  const result: Section[] = [];
  const stringTable: Record<number, string> = {};
  const fileSize = fs.statSync(filePath).size;

  // Read file header
  const magicBytes = reader.readBytes(4);
  const magic = uint8ArrayToString(magicBytes);
  const version = reader.readInt32LE();
  const strTableOffset = reader.readInt32LE();

  if (magic !== "BINI" || version !== 1) {
    throw new Error(`Invalid BINI file: ${filePath}`);
  }

  // Read string table, which stretches from strTableOffset to EOF
  reader.seek(strTableOffset);
  const rawTable = reader.readBytes(fileSize - strTableOffset - 1);

  // Parse string table by splitting on null bytes
  let count = 0;
  let start = 0;

  for (let i = 0; i < rawTable.length; i++) {
    if (rawTable[i] === 0) {
      // null byte
      if (i > start) {
        const stringBytes = rawTable.slice(start, i);
        const str = uint8ArrayToString(stringBytes, "latin1");
        stringTable[count] = lower ? str.toLowerCase() : str;
      }
      count += i - start + 1;
      start = i + 1;
    }
  }

  // Return to end of header to read sections
  reader.seek(12);

  while (reader.tell() < strTableOffset) {
    // Read section header
    const sectionNamePtr = reader.readInt16LE();
    const entryCount = reader.readInt16LE();
    const sectionName = stringTable[sectionNamePtr];

    const sectionEntries: Entry[] = [];
    for (let e = 0; e < entryCount; e++) {
      // Read entry
      const entryNamePtr = reader.readInt16LE();
      const valueCount = reader.readInt8();
      const entryName = stringTable[entryNamePtr];
      const entryValues: any[] = [];

      for (let v = 0; v < valueCount; v++) {
        // Read value
        const valueType = reader.readInt8() as ValueType;
        let valueData = VALUE_TYPES[valueType](reader);

        if (valueType === 3) {
          // It is a pointer relative to the string table
          valueData = stringTable[valueData as number];
        }

        entryValues.push(valueData);
      }

      let entryValue;
      if (valueCount > 1) {
        entryValue = entryValues;
      } else if (valueCount === 1) {
        entryValue = entryValues[0];
      } else {
        continue;
      }

      sectionEntries.push([entryName, entryValue]);
    }
    result.push([sectionName, sectionEntries]);
  }

  return result;
}

/**
 * Dump the BINI file at `path` to an INI-formatted string.
 */
export function dump(filePath: string): string {
  const bini = parseFile(filePath, false);

  const lines: string[] = [];
  for (const [sectionName, sections] of bini) {
    for (const entry of sections) {
      lines.push(`[${sectionName}]`);
      // Convert the entries in this section to strings and add to output
      for (const [key, values] of [entry]) {
        if (Array.isArray(values)) {
          const valuesStr = values.map((v) => String(v)).join(", ");
          lines.push(`${key} = ${valuesStr}`);
        } else {
          lines.push(`${key} = ${values}`);
        }
      }
      lines.push(""); // Add a blank line after each section
    }
  }
  return lines.join("\n");
}

/**
 * Returns whether the (.ini) file at `path` is a BINI by checking its magic number.
 */
export function isBini(filePath: string): boolean {
  try {
    filePath = resolveFilePathSync(filePath);
    if (!fs.existsSync(filePath)) {
      return false;
    }

    const fd = fs.openSync(filePath, "r");
    const buffer = Buffer.alloc(4);
    fs.readSync(fd, buffer, 0, 4, 0);
    fs.closeSync(fd);

    return buffer.toString("utf8", 0, 4) === "BINI";
  } catch (error) {
    console.error(`Error checking if file is BINI: ${error}`);
    return false;
  }
}
