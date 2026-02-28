// Adapted from original flint code by biqqles

import * as fs from "fs/promises";
import { resolveFilePath } from "./filepath";

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

export class UtfTree {
  public path: string;
  public parent?: UtfTree;
  public children: Record<string, UtfTree>;
  public data?: ArrayBuffer;

  constructor(path: string, parent?: UtfTree, data?: ArrayBuffer) {
    this.path = path;
    this.parent = parent;
    this.data = data;
    this.children = {};
  }

  get fullPath() {
    let current: UtfTree = this;
    const path: string[] = [];
    while (current) {
      path.unshift(current.path);
      if (!current.parent || current.parent.path === "\\") {
        break;
      }
      current = current.parent;
    }
    return path.join("\\");
  }

  put(path: string, data?: ArrayBuffer) {
    const parts = path.split("\\");
    let current: UtfTree = this;
    for (const part of parts) {
      if (!current.children[part]) {
        current.children[part] = new UtfTree(path, current);
      }
      current = current.children[part];
    }
    current.data = data;
    return current;
  }

  get(path: string) {
    const parts = path.split("\\");
    let current: UtfTree = this;
    for (const part of parts) {
      if (!current.children[part]) {
        return undefined;
      }
      current = current.children[part];
    }
    return current;
  }

  first() {
    return Object.values(this.children)[0];
  }

  list(path?: string) {
    let current: UtfTree = this;
    if (path) {
      const parts = path.split("\\");
      for (const part of parts) {
        if (!current.children[part]) {
          return [];
        }
        current = current.children[part];
      }
    }
    return Object.values(current.children);
  }

  listLeaves() {
    let current: UtfTree = this;
    const list: UtfTree[] = [];
    if (Object.keys(current.children).length === 0) {
      list.push(current);
    } else {
      for (const child of Object.values(current.children)) {
        list.push(...child.listLeaves().flat());
      }
    }
    return list;
  }

  toJSON() {
    return {
      ...this,
      fullPath: this.fullPath,
    };
  }
}

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
export async function parseUtf(path: string): Promise<UtfTree> {
  const resolvedPath = await resolveFilePath(path);
  const fileHandle = await fs.open(resolvedPath, "r");
  const root = new UtfTree("\\");
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

    let current = root;
    let currentTreeEnd: number = 0;

    // Read data tree
    for (let e = 0; e < entryCount; e++) {
      const entryBuffer = new ArrayBuffer(44);
      const entryView = new DataView(entryBuffer);
      await fileHandle.read(entryView, 0, 44, header.TreeOffset + e * 44);

      const entry = readStruct(entryView, UTF_ENTRY_FIELDS);

      const name = names[entry.DictionaryNameOffset];
      if (name === "\\") {
        continue;
      }

      const dataBuffer = new ArrayBuffer(entry.UsedDataSize);
      const dataView = new DataView(dataBuffer);
      await fileHandle.read(
        dataView,
        0,
        entry.UsedDataSize,
        entry.ChildOrDataOffset + header.DataStartOffset
      );
      const created = current.put(name, dataView.buffer);
      if (entry.EntryType === 16) {
        currentTreeEnd = entry.NextSiblingOffset;
        current = created;
      } else if (entry.NextSiblingOffset === 0) {
        current = current.parent!;
        if (currentTreeEnd === 0) {
          current = current.parent!;
        }
      }
    }
  } finally {
    await fileHandle.close();
    return root;
  }
}

export { TYPE_CHILD, TYPE_DATA };
