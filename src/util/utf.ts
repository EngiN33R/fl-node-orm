// Adapted from original flint code by biqqles

import * as fs from "fs/promises";

const UTF_HEADER_FIELDS = {
  Signature: "uint32",
  Version: "uint32",
  TreeOffset: "uint32",
  TreeSize: "uint32",
  _0: "uint32",
  EntrySize: "uint32",
  NamesOffset: "uint32",
  NamesAllocatedSize: "uint32",
  NamesUsedSize: "uint32",
  DataStartOffset: "uint32",
  _1: "uint32",
  _2: "uint32",
  FiletimeLow: "uint32",
  FiletimeHigh: "uint32",
};

const UTF_ENTRY_FIELDS = {
  NextSiblingOffset: "uint32",
  DictionaryNameOffset: "uint32",
  EntryType: "uint32",
  SharingAttributes: "uint32",
  ChildOrDataOffset: "uint32",
  AllocatedDataSize: "uint32",
  UsedDataSize: "uint32",
  UncompressedDataSize: "uint32",
  CreationTime: "uint32",
  LastAccessTime: "uint32",
  LastWriteTime: "uint32",
};

function readStruct<K extends string>(
  view: DataView,
  fields: Record<K, string>
) {
  const instance = {} as Record<K, any>;
  let offset = 0;

  for (const [key, type] of Object.entries(fields)) {
    if (key.startsWith("_")) {
      // Skip fields that start with underscore (like _0, _1, etc.)
      offset += 4; // Assuming they're all uint32
      continue;
    }

    let value: any;
    switch (type) {
      case "uint32":
        value = view.getUint32(offset, true);
        offset += 4;
        break;
      default:
        value = view.getUint32(offset, true); // Default case, can be expanded
        offset += 4;
        break;
    }

    instance[key as K] = value;
  }

  return instance;
}

// Constants
const TYPE_CHILD = 0x80; // utf tree types
const TYPE_DATA = 0x10;

// Generator function to parse the file
export async function* parseUtf(
  path: string
): AsyncGenerator<[string, DataView]> {
  const fileHandle = await fs.open(path, "r");
  try {
    const headerBuffer = new ArrayBuffer(56);
    const view = new DataView(headerBuffer);
    await fileHandle.read(view, 0, 56, 0);

    const header = readStruct(view, UTF_HEADER_FIELDS);

    const entryCount = Math.floor(header.TreeSize / header.EntrySize);

    // Read name dictionary
    const namesDictBuffer = new ArrayBuffer(header.NamesUsedSize);
    const namesDictView = new DataView(namesDictBuffer);
    await fileHandle.read(
      namesDictView,
      0,
      header.NamesUsedSize,
      header.NamesOffset
    );

    const dictionary: ArrayBuffer[] = [];
    let startPos = 0;

    for (let i = 0; i < namesDictView.byteLength; i++) {
      if (namesDictView.getUint8(i) === 0) {
        dictionary.push(namesDictBuffer.slice(startPos, i));
        startPos = i + 1;
      }
    }

    // Create names dictionary with positions
    const names: Record<number, string> = {};
    let position = 0;

    const decoder = new TextDecoder("ascii");
    for (const name of dictionary) {
      names[position] = decoder.decode(name);
      position += name.byteLength + 1;
    }

    // Read data tree
    for (let e = 0; e < entryCount; e++) {
      const entryBuffer = new ArrayBuffer(44);
      const entryView = new DataView(entryBuffer);
      await fileHandle.read(entryView, 0, 44, header.TreeOffset + e * 44);

      const entry = readStruct(entryView, UTF_ENTRY_FIELDS);

      const name = names[entry.DictionaryNameOffset];

      const dataBuffer = new ArrayBuffer(entry.UsedDataSize);
      const dataView = new DataView(dataBuffer);
      await fileHandle.read(
        dataView,
        0,
        entry.UsedDataSize,
        entry.ChildOrDataOffset + header.DataStartOffset
      );

      yield [name, dataView];
    }
  } finally {
    await fileHandle.close();
  }
}

// Extract specific directory
export async function extractUtf(
  path: string,
  targetDirectory: string
): Promise<ArrayBuffer> {
  for await (const [dirName, dirData] of parseUtf(path)) {
    if (dirName === targetDirectory) {
      return dirData.buffer;
    }
  }
  throw new Error(`Directory '${targetDirectory}' not found`);
}

// Dump all data
export async function dumpUtf(
  path: string
): Promise<Record<string, ArrayBuffer>> {
  const result: Record<string, ArrayBuffer> = {};
  for await (const [name, data] of parseUtf(path)) {
    result[name] = data.buffer;
  }
  return result;
}

export { TYPE_CHILD, TYPE_DATA };
