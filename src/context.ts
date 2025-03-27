import path from "path";
import {
  Entity,
  EntityType,
  IDataContext,
  IEntityQuerier,
  Model,
} from "./types";
import { parseIni } from "./util/ini";
import { ResourceDll } from "./util/resourcedll";
import { IniSectionsModel } from "./models/ini-section.model";
import { SystemModel } from "./models/system.model";
import { FactionModel } from "./models/faction.model";
import { parseUtf, UtfTree } from "./util/utf";

export class DataContext implements IDataContext {
  static readonly INSTANCE = new DataContext();

  public path!: string;

  private models: { [K in keyof Entity]: Entity[K][] } = {
    faction: [],
    system: [],
    object: [],
    zone: [],
    base: [],
    // commodity: [],
    // equipment: [],
  };
  private maps: { [K in keyof Entity]: Map<string, Entity[K]> } = {
    faction: new Map(),
    system: new Map(),
    object: new Map(),
    zone: new Map(),
    base: new Map(),
  };

  private strings: Map<number, string> = new Map();
  private infocards: Map<number, string> = new Map();

  private inis: Map<string, IniSectionsModel> = new Map();
  private utfs: Map<string, UtfTree> = new Map();
  private binaries: Map<string, ArrayBuffer> = new Map();

  private infocardMap: Map<number, number> = new Map();

  static async load(instancePath: string) {
    await DataContext.INSTANCE.init(instancePath);
  }

  async init(instancePath: string) {
    this.strings.clear();
    this.infocards.clear();
    this.inis.clear();
    for (const key in this.models) {
      this.models[key as EntityType] = [];
    }

    this.path = instancePath;

    const cfg = await this.parseIni("EXE/freelancer.ini", "freelancer");

    // Load IDS strings and infocards
    const resources = ["resources.dll"].concat(
      cfg?.findFirst("resources")?.asArray("dll") ?? []
    );
    let i = 0;
    for (const resource of resources) {
      const dll = await ResourceDll.fromFile(
        path.join(instancePath, "EXE", resource)
      );
      for (const [key, value] of dll.strings.entries()) {
        this.strings.set(key + i * 65536, value);
      }
      for (const [key, value] of dll.infocards.entries()) {
        this.infocards.set(key + i * 65536, value);
      }
      i++;
    }

    // Load assorted binary files
    const navmapUtf = await this.loadUtf(
      "DATA/INTERFACE/NEURONET/NAVMAP/NEWNAVMAP/nav_prettymap.3db",
      "navmap"
    );
    this.registerBinary(
      "navmap",
      navmapUtf.get("Texture library\\fancymap.tga\\MIPS")?.data
    );

    // Load mbases
    await this.parseIni("DATA/MISSIONS/mbases.ini", "mbases");

    // Load infocard map for supplementary base infocards
    const infocardMapIni = await this.parseIni(
      "DATA/INTERFACE/infocardmap.ini"
    );
    const map = infocardMapIni.findFirst("infocardmaptable")?.get("map") as [
      number,
      number,
    ][];
    for (const [key, value] of map) {
      this.infocardMap.set(key, value);
    }

    const factionProps = await this.parseIni(
      "DATA/MISSIONS/faction_prop.ini",
      "faction_prop"
    );
    const initialWorld = await this.parseIni(
      "DATA/initialworld.ini",
      "initialworld"
    );
    const empathy = await this.parseIni("DATA/MISSIONS/empathy.ini", "empathy");

    for (const group of initialWorld.findAll("group")) {
      const groupFactionProps = factionProps.findFirst(
        "factionprops",
        (s) => s.ini[1].affiliation === group.get<string>("nickname")
      )?.ini;
      const groupEmpathy = empathy.findFirst(
        "repchangeeffects",
        (s) => s.ini[1].group === group.get<string>("nickname")
      )?.ini;
      if (!groupFactionProps || !groupEmpathy) {
        continue;
      }

      await FactionModel.from(this, {
        group: group.ini,
        faction: groupFactionProps,
        empathy: groupEmpathy,
      });
    }

    const dataRoot = path.join(
      "EXE",
      (
        cfg?.findFirst("freelancer")?.get<string>("data path") as string
      ).replace(/\\/g, "/")
    );

    // Load systems and bases
    const universePath = (
      cfg?.findFirst("data")?.get<string>("universe") as string
    ).replace(/\\/g, "/");
    const universeRoot = path.dirname(path.join(dataRoot, universePath));
    const universeIni = await this.parseIni(
      `${dataRoot}/${universePath}`,
      "universe"
    );
    const systems = universeIni.findAll("system");
    const bases = universeIni.findAll("base");
    for (const ini of systems) {
      const filepath = ini.get<string>("file");
      if (!filepath) {
        continue;
      }

      try {
        const definition = await this.parseIni(
          path.join(universeRoot, filepath)
        );
        await SystemModel.from(this, {
          universe: ini.ini,
          definition: definition.sections.map((s) => s.ini),
          bases: bases
            .filter((b) => b.ini[1].system === ini.nickname)
            .map((b) => b.ini),
        });
      } catch (e) {
        console.warn(`Failed to load system ${ini.nickname}: ${e}`);
      }
    }
  }

  async parseIni(relativePath: string, nickname?: string) {
    relativePath = relativePath.replace(/\\/g, "/");
    const ini = await IniSectionsModel.from({
      sections: await parseIni(path.join(this.path, relativePath)),
      name: [relativePath, {}],
    });
    this.inis.set(relativePath, ini);
    if (nickname) {
      this.inis.set(nickname, ini);
    }
    return ini;
  }

  async loadUtf(relativePath: string, nickname?: string) {
    const filepath = path.join(this.path, relativePath);
    const tree = await parseUtf(filepath);
    this.utfs.set(relativePath, tree);
    if (nickname) {
      this.utfs.set(nickname, tree);
    }
    return tree;
  }

  registerModel<K extends EntityType>(model: Entity[K]) {
    this.models[model.type as K].push(model);
    if (model.nickname) {
      this.maps[model.type as K].set(model.nickname, model);
    }
  }

  registerBinary(handle: string, data?: ArrayBuffer) {
    if (data) {
      this.binaries.set(handle, data);
    }
  }

  ini(relativePath: string) {
    return this.inis.get(relativePath);
  }

  utf(relativePath: string, key: string) {
    return this.utfs.get(relativePath)?.get(key)?.data;
  }

  binary(handle: string) {
    return this.binaries.get(handle);
  }

  findByNickname<K extends EntityType>(type: K, nickname: string) {
    return this.maps[type].get(nickname);
  }

  entity<K extends EntityType>(type: K): IEntityQuerier<K> {
    return {
      findAll: () => this.models[type],
      findByNickname: (nickname: string) =>
        this.findByNickname<K>(type, nickname),
    };
  }

  ids(key: number) {
    return this.strings.get(key) ?? this.infocards.get(key) ?? `IDS#${key}`;
  }

  idsWithRelated(key: number): [string] | [string, string] {
    const self =
      this.infocards.get(key) ?? this.strings.get(key) ?? `IDS#${key}`;
    const relatedId = this.infocardMap.get(key);
    const related = relatedId
      ? (this.infocards.get(relatedId) ??
        this.strings.get(relatedId) ??
        `IDS#${relatedId}`)
      : undefined;
    return relatedId ? [self, related as string] : [self];
  }
}
