// Translated from original LibreLancer C# code by Callum McGing
import * as fs from "fs/promises";

// Constants
const RT_RCDATA = 23;
const RT_VERSION = 16;
const RT_STRING = 6;
const RT_MENU = 4;
const RT_DIALOG = 5;
const IMAGE_RESOURCE_NAME_IS_STRING = 0x80000000;
const IMAGE_RESOURCE_DATA_IS_DIRECTORY = 0x80000000;

// Struct definitions
interface ImageResourceDirectory {
  characteristics: number;
  timeDateStamp: number;
  majorVersion: number;
  minorVersion: number;
  numberOfNamedEntries: number;
  numberOfIdEntries: number;
}

interface ImageResourceDirectoryEntry {
  name: number;
  offsetToData: number; // Relative to rsrc
}

interface ImageResourceDataEntry {
  offsetToData: number; // Relative to start of dll
  size: number;
  codePage: number;
  reserved: number;
}

// Resource classes
class ResourceTable {
  type: number;
  resources: Resource[] = [];

  constructor(type: number) {
    this.type = type;
  }
}

class Resource {
  name: number;
  locales: ResourceData[] = [];

  constructor(name: number) {
    this.name = name;
  }
}

class ResourceData {
  locale: number;
  data: Uint8Array;

  constructor(locale: number, data: Uint8Array) {
    this.locale = locale;
    this.data = data;
  }
}

export class BinaryResource {
  name: number;
  data: Uint8Array;

  constructor(name: number, data: Uint8Array) {
    this.name = name;
    this.data = data;
  }
}

export class VersionInfoResource {
  data: Uint8Array;

  constructor(data: Uint8Array) {
    this.data = data;
  }
}

export class ResourceDll {
  strings: Map<number, string> = new Map();
  infocards: Map<number, string> = new Map();
  // dialogs: BinaryResource[] = [];
  // menus: BinaryResource[] = [];
  // versionInfo?: VersionInfoResource;

  static async fromFile(filePath: string): Promise<ResourceDll> {
    if (!filePath) {
      throw new Error("Path cannot be null or undefined");
    }

    const fileData = await fs.readFile(filePath);
    const arrayBuffer = new Uint8Array(fileData).buffer;
    return ResourceDll.fromArrayBuffer(arrayBuffer);
  }

  static fromArrayBuffer(buffer: ArrayBuffer): ResourceDll {
    const dll = new ResourceDll();

    const [rsrcOffset, rsrc] = ResourceDll.readPE(buffer);
    const directory = ResourceDll.readResourceDirectory(rsrc, 0);

    const resources: ResourceTable[] = [];

    for (
      let i = 0;
      i < directory.numberOfNamedEntries + directory.numberOfIdEntries;
      i++
    ) {
      const off = 16 + i * 8;
      const entry = ResourceDll.readResourceDirectoryEntry(rsrc, off);

      if (
        (IMAGE_RESOURCE_NAME_IS_STRING & entry.name) ===
        IMAGE_RESOURCE_NAME_IS_STRING
      )
        continue;

      resources.push(
        ResourceDll.readResourceTable(
          rsrcOffset,
          ResourceDll.dirOffset(entry.offsetToData),
          rsrc,
          entry.name
        )
      );
    }

    for (const table of resources) {
      if (table.type === RT_RCDATA) {
        for (const res of table.resources) {
          const data = res.locales[0].data;
          let idx = 0;
          let count = data.length;

          if (data.length > 2) {
            if (data.length % 2 === 1 && data[data.length - 1] === 0) {
              // Skip extra NULL byte
              count--;
            }
            if (data[0] === 0xff && data[1] === 0xfe) {
              // Skip BOM
              idx += 2;
              count -= 2;
            }
          }

          try {
            const text = ResourceDll.decodeUTF16LE(
              data.slice(idx, idx + count)
            );
            dll.infocards.set(res.name, text);
          } catch (e) {
            console.error(`Infocard Corrupt: ${res.name}`);
          }
        }
      } else if (table.type === RT_STRING) {
        for (const res of table.resources) {
          const blockId = (res.name - 1) * 16;
          const data = res.locales[0].data;

          // Use a DataView to read the data
          const view = new DataView(
            data.buffer,
            data.byteOffset,
            data.byteLength
          );
          let offset = 0;

          for (let j = 0; j < 16; j++) {
            const length = view.getUint16(offset, true) * 2;
            offset += 2;

            if (length !== 0) {
              const bytes = data.slice(offset, offset + length);
              const str = ResourceDll.decodeUTF16LE(bytes);
              dll.strings.set(blockId + j, str);
            }

            offset += length;
          }
        }
        // } else if (table.type === RT_VERSION && table.resources.length > 0) {
        //   dll.versionInfo = new VersionInfoResource(
        //     table.resources[0].locales[0].data
        //   );
        // } else if (table.type === RT_DIALOG) {
        //   for (const dlg of table.resources) {
        //     dll.dialogs.push(new BinaryResource(dlg.name, dlg.locales[0].data));
        //   }
        // } else if (table.type === RT_MENU) {
        //   for (const menu of table.resources) {
        //     dll.menus.push(new BinaryResource(menu.name, menu.locales[0].data));
        //   }
      }
    }

    return dll;
  }

  private static dirOffset(a: number): number {
    return a & 0x7fffffff;
  }

  private static readResourceDirectory(
    buffer: ArrayBuffer,
    offset: number
  ): ImageResourceDirectory {
    const view = new DataView(buffer, offset);
    return {
      characteristics: view.getUint32(0, true),
      timeDateStamp: view.getUint32(4, true),
      majorVersion: view.getUint16(8, true),
      minorVersion: view.getUint16(10, true),
      numberOfNamedEntries: view.getUint16(12, true),
      numberOfIdEntries: view.getUint16(14, true),
    };
  }

  private static readResourceDirectoryEntry(
    buffer: ArrayBuffer,
    offset: number
  ): ImageResourceDirectoryEntry {
    const view = new DataView(buffer, offset);
    return {
      name: view.getUint32(0, true),
      offsetToData: view.getUint32(4, true),
    };
  }

  private static readResourceDataEntry(
    buffer: ArrayBuffer,
    offset: number
  ): ImageResourceDataEntry {
    const view = new DataView(buffer, offset);
    return {
      offsetToData: view.getUint32(0, true),
      size: view.getUint32(4, true),
      codePage: view.getUint32(8, true),
      reserved: view.getUint32(12, true),
    };
  }

  private static readResourceTable(
    rsrcOffset: number,
    offset: number,
    rsrc: ArrayBuffer,
    type: number
  ): ResourceTable {
    const directory = ResourceDll.readResourceDirectory(rsrc, offset);
    const table = new ResourceTable(type);

    for (
      let i = 0;
      i < directory.numberOfNamedEntries + directory.numberOfIdEntries;
      i++
    ) {
      const off = offset + 16 + i * 8;
      const entry = ResourceDll.readResourceDirectoryEntry(rsrc, off);
      const res = new Resource(entry.name);

      if (
        (IMAGE_RESOURCE_DATA_IS_DIRECTORY & entry.offsetToData) ===
        -IMAGE_RESOURCE_DATA_IS_DIRECTORY
      ) {
        const langDirectory = ResourceDll.readResourceDirectory(
          rsrc,
          ResourceDll.dirOffset(entry.offsetToData)
        );

        for (
          let j = 0;
          j <
          langDirectory.numberOfIdEntries + langDirectory.numberOfNamedEntries;
          j++
        ) {
          const langOff =
            ResourceDll.dirOffset(entry.offsetToData) + 16 + j * 8;
          const langEntry = ResourceDll.readResourceDirectoryEntry(
            rsrc,
            langOff
          );

          if (
            (IMAGE_RESOURCE_DATA_IS_DIRECTORY & langEntry.offsetToData) ===
            IMAGE_RESOURCE_DATA_IS_DIRECTORY
          ) {
            throw new Error("Malformed .rsrc section");
          }

          const dataEntry = ResourceDll.readResourceDataEntry(
            rsrc,
            langEntry.offsetToData
          );
          const data = new Uint8Array(
            rsrc,
            dataEntry.offsetToData - rsrcOffset,
            dataEntry.size
          );
          res.locales.push(new ResourceData(langEntry.name, data));
        }
      } else {
        console.log(
          (IMAGE_RESOURCE_DATA_IS_DIRECTORY & entry.offsetToData).toString(16)
        );
        throw new Error("Malformed .rsrc section");
      }

      table.resources.push(res);
    }

    return table;
  }

  private static readPE(buffer: ArrayBuffer): [number, ArrayBuffer] {
    const view = new DataView(buffer);
    const u8Array = new Uint8Array(buffer);

    // Check for MZ header
    if (u8Array[0] !== 0x4d || u8Array[1] !== 0x5a) {
      throw new Error("Not a valid PE file");
    }

    // Get PE header offset
    const peOffset = view.getUint32(0x3c, true);

    // Verify PE signature
    const peSignature = String.fromCharCode(
      u8Array[peOffset],
      u8Array[peOffset + 1],
      u8Array[peOffset + 2],
      u8Array[peOffset + 3]
    );

    if (peSignature !== "PE\0\0") {
      throw new Error("Not a valid PE file");
    }

    // Skip to the section headers
    const numberOfSections = view.getUint16(peOffset + 6, true);
    let sectionHeadersOffset =
      peOffset + 24 + view.getUint16(peOffset + 20, true);

    // Find .rsrc section
    let rsrcVirtualAddress = 0;
    let rsrcPointerToRawData = 0;

    for (let i = 0; i < numberOfSections; i++) {
      const sectionOffset = sectionHeadersOffset + i * 40;

      // Read section name (8 bytes)
      let sectionName = "";
      for (let j = 0; j < 8; j++) {
        const char = u8Array[sectionOffset + j];
        if (char !== 0) {
          sectionName += String.fromCharCode(char);
        }
      }

      if (sectionName === ".rsrc") {
        rsrcVirtualAddress = view.getUint32(sectionOffset + 12, true);
        rsrcPointerToRawData = view.getUint32(sectionOffset + 20, true);
        break;
      }
    }

    if (rsrcVirtualAddress === 0) {
      throw new Error("No .rsrc section found");
    }

    // Extract .rsrc section
    return [rsrcVirtualAddress, buffer.slice(rsrcPointerToRawData)];
  }

  private static decodeUTF16LE(buffer: Uint8Array): string {
    const decoder = new TextDecoder("utf-16le");
    return decoder.decode(buffer);
  }
}
