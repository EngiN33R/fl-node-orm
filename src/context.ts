import path from "path";
import {
  AnyRecordMap,
  Entity,
  EntityType,
  IDataContext,
  IEntityQuerier,
  IIniSection,
  IIniSections,
  Model,
} from "./types";
import { parseFile, parseIni } from "./util/ini";
import { ResourceDll } from "./util/resourcedll";
import { IniSectionModel, IniSectionsModel } from "./models/ini-section.model";
import { SystemModel } from "./models/system.model";
import { FactionModel } from "./models/faction.model";
import { parseUtf, UtfTree } from "./util/utf";
import { parseSystemRange, parseTerritorySections } from "./util/data";
import { EquipmentModel, PARSED_SECTION_KEYS } from "./models/equipment.model";
import {
  IniBaseGood,
  IniConfigShape,
  IniEquipmentShape,
  IniNpcShip,
  IniShiparch,
  IniSystemShape,
  IniUniverseShape,
} from "./ini-types";
import { ShipModel } from "./models/ship.model";
import { MarketModel } from "./models/market.model";
import { NpcLoadoutModel } from "./models/npc-loadout.model";

export class DataContext implements IDataContext {
  static readonly INSTANCE = new DataContext();

  public path!: string;
  public dataPath!: string;

  private models: { [K in keyof Entity]: Entity[K][] } = {
    faction: [],
    system: [],
    object: [],
    zone: [],
    base: [],
    equipment: [],
    ship: [],
    npc: [],
  };
  private maps: { [K in keyof Entity]: Map<string, Entity[K]> } = {
    faction: new Map(),
    system: new Map(),
    object: new Map(),
    zone: new Map(),
    base: new Map(),
    equipment: new Map(),
    ship: new Map(),
    npc: new Map(),
  };
  public market: MarketModel = new MarketModel(this);

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

    const cfg = await IniSectionsModel.from<IniConfigShape>(this, {
      sections: await parseIni(path.join(this.path, "EXE/freelancer.ini")),
      name: ["freelancer", {}],
    });
    if (!cfg) {
      throw new Error("Failed to load freelancer.ini");
    }

    // Load IDS strings and infocards
    const resources = ["resources.dll"].concat(
      cfg.findFirst("resources")!.asArray("dll")
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

    this.dataPath = path.join(
      "EXE",
      (cfg?.findFirst("freelancer")?.get("data path") as string).replace(
        /\\/g,
        "/"
      )
    );

    // Load assorted binary files
    const navmapUtf = await this.loadUtf(
      "INTERFACE/NEURONET/NAVMAP/NEWNAVMAP/nav_prettymap.3db",
      "navmap"
    );
    this.registerBinary(
      "navmap",
      navmapUtf.get("Texture library\\fancymap.tga\\MIPS")?.data
    );

    // Load hardcoded INIs
    await this.parseIni("MISSIONS/mbases.ini", "mbases");
    await this.parseIni("MISSIONS/npcships.ini", "npcships");
    await this.parseIni("INTERFACE/knowledgemap.ini", "knowledgemap");
    await this.parseIni("RANDOMMISSIONS/diff2money.ini", "diff2money");

    // Load infocard map for supplementary base infocards
    const infocardMapIni = await this.parseIni("/INTERFACE/infocardmap.ini");
    const map = infocardMapIni.findFirst("infocardmaptable")?.get("map") as [
      number,
      number,
    ][];
    for (const [key, value] of map) {
      this.infocardMap.set(key, value);
    }

    // Load faction properties, reputations and empathy
    const factionProps = await this.parseIni(
      "MISSIONS/faction_prop.ini",
      "faction_prop"
    );
    const initialWorld = await this.parseIni(
      cfg?.findFirst("data")?.get("groups") ?? "initialworld.ini",
      "initialworld"
    );
    const empathy = await this.parseIni("MISSIONS/empathy.ini", "empathy");
    for (const group of initialWorld.findAll("group")) {
      const groupFactionProps = factionProps.findFirst(
        "factionprops",
        (s) => s.get("affiliation") === group.get("nickname")
      )?.ini;
      const groupEmpathy = empathy.findFirst(
        "repchangeeffects",
        (s) => s.get("group") === group.get("nickname")
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

    // Import equipment, ships and goods
    const equipmentPaths = cfg?.findFirst("data")?.asArray("equipment") ?? [];
    const shipsPaths = cfg?.findFirst("data")?.asArray("ships") ?? [];
    const goodsPaths = cfg?.findFirst("data")?.get("goods") ?? [];
    const marketsPaths = cfg?.findFirst("data")?.get("markets") ?? [];
    const loadoutsPaths = cfg?.findFirst("data")?.get("loadouts") ?? [];
    for (const path of equipmentPaths) {
      await this.parseIni(path, "equipment");
    }
    for (const path of shipsPaths) {
      await this.parseIni(path, "ships");
    }
    for (const path of goodsPaths) {
      await this.parseIni(path, "goods");
    }
    for (const path of marketsPaths) {
      await this.parseIni(path, "markets");
    }
    for (const path of loadoutsPaths) {
      await this.parseIni(path, "loadouts");
    }
    const ships = this.ini<{ ship: IniShiparch }>("ships");

    await EquipmentModel.fromAll(this);
    for (const arch of ships?.findAll("ship") ?? []) {
      await ShipModel.from(this, {
        arch,
      });
    }
    for (const basegood of this.ini<{ basegood: IniBaseGood }>(
      "markets"
    )?.findAll("basegood") ?? []) {
      this.market.addOffers(basegood);
    }
    for (const npcship of this.ini<{ npcshiparch: IniNpcShip }>(
      "npcships"
    )?.findAll("npcshiparch") ?? []) {
      await NpcLoadoutModel.from(this, { def: npcship });
    }

    // Load systems and bases
    const universePath = (
      cfg?.findFirst("data")?.get("universe") as string
    ).replace(/\\/g, "/");
    const universeRoot = path.dirname(universePath);
    const universeIni = await this.parseIni<IniUniverseShape>(
      universePath,
      "universe"
    );
    const territory = await parseFile(
      path.join(this.path, `${this.dataPath}/${universeRoot}/territory.ini`)
    );
    const territoryMap = parseTerritorySections(territory, this.ids.bind(this));
    for (const ini of universeIni.findAll("system")) {
      const filepath = ini.get("file");
      if (!filepath) {
        continue;
      }

      try {
        const definition = await this.parseIni<IniSystemShape>(
          path.join(universeRoot, filepath),
          `universe_${ini.nickname}`
        );
        await SystemModel.from(this, {
          universe: ini,
          definition,
          territory: ini.nickname ? territoryMap[ini.nickname] : "Unknown",
        });
      } catch (e) {
        console.warn(`Failed to load system ${ini.nickname}: ${e}`);
      }
    }
  }

  async parseIni<S extends AnyRecordMap = AnyRecordMap>(
    relativePath: string,
    nickname?: string
  ): Promise<IIniSections<S>> {
    relativePath = relativePath.replace(/\\/g, "/");
    const ini = await IniSectionsModel.from(this, {
      sections: await parseIni(
        path.join(this.path, this.dataPath, relativePath)
      ),
      name: [relativePath, {}],
    });
    this.inis.set(relativePath, ini);
    if (nickname) {
      if (this.inis.has(nickname)) {
        this.inis.get(nickname)!.append(ini);
      } else {
        this.inis.set(nickname, ini);
      }
    }
    return ini as unknown as IIniSections<S>;
  }

  async loadUtf(relativePath: string, nickname?: string) {
    const filepath = path.join(this.path, this.dataPath, relativePath);
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

  registerBinary(handle: string, data: ArrayBuffer | undefined) {
    if (data) {
      this.binaries.set(handle, data);
    }
  }

  ini<S extends AnyRecordMap = AnyRecordMap>(relativePath: string) {
    return this.inis.get(relativePath) as IIniSections<S> | undefined;
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
      findAll: (predicate) =>
        predicate
          ? this.models[type].filter((e) => predicate(e))
          : this.models[type],
      findFirst: (predicate) =>
        predicate
          ? this.models[type].find((e) => predicate(e))
          : this.models[type][0],
      findByNickname: (nickname: string) =>
        this.findByNickname<K>(type, nickname),
    };
  }

  ids(key: number) {
    return this.strings.get(key) ?? this.infocards.get(key) ?? `IDS#${key}`;
  }

  findIds(target: string) {
    for (const [key, value] of this.strings.entries()) {
      if (value === target) {
        return key;
      }
    }
    for (const [key, value] of this.infocards.entries()) {
      if (value === target) {
        return key;
      }
    }
    return -1;
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
