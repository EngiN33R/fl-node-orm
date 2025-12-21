import {
  IniLoadout,
  IniSystemObject,
  IniSystemShape,
  IniSystemZone,
  IniUniverseShape,
  IniUniverseSystem,
} from "../ini-types";
import {
  EntityType,
  IDataContext,
  IEquipment,
  IIniSection,
  IIniSections,
  IObject,
  ISystem,
  IZone,
} from "../types";
import { Bitmask } from "../util/bitmask";
import { rgbToHex } from "../util/color";
import { Section } from "../util/ini";
import { BaseModel } from "./base.model";
import { ObjectVisitBitmask, ZoneVisitBitmask } from "./common";

export const ZoneBitmask = Bitmask.define([
  "DENSITY_LOW",
  "DENSITY_MEDIUM",
  "DENSITY_HIGH",
  "DANGER_LOW",
  "DANGER_MEDIUM",
  "DANGER_HIGH",
  "ROCK",
  "DEBRIS",
  "ICE",
  "LAVA",
  "NOMAD",
  "CRYSTAL",
  "MINES",
  "BADLANDS",
  "GAS_POCKETS",
  "NEBULA",
  "EXCLUSION1",
  "EXCLUSION2",
]);

export class ZoneModel implements IZone {
  #ini!: IniSystemZone;

  public nickname!: string;
  public type = "zone" as const;
  public system!: string;

  public name!: string;
  public infocard!: string;
  public position!: [number, number, number];
  public rotate?: [number, number, number];
  public shape!: "ellipsoid" | "ring" | "cylinder" | "sphere" | "box";
  public size!: [number, number, number] | [number, number] | number;
  public visit?: ReturnType<typeof ZoneVisitBitmask>;
  public sort!: number;

  public music?: string;
  public properties?: ReturnType<typeof ZoneBitmask>;
  public fogColor?: string;
  public spacedust?: string;
  public spacedustMaxParticles?: number;
  public edgeFraction?: number;

  public toughness?: number;
  public density?: number;
  public repopTime?: number;
  public maxBattleSize?: number;
  public popType?: string[];
  public damage?: number;
  public reliefTime?: number;
  public densityRestriction?: number;
  public populationAdditive?: boolean;

  public missionType?: string;
  public vignetteType?: string;

  public loot?: {
    commodity: string;
    equipment: IEquipment;
    count: [number, number];
    difficulty: number;
  };

  static async from(
    ctx: IDataContext,
    inputs: { system: string; definition: IIniSection<IniSystemZone> }
  ) {
    const model = new ZoneModel();
    model.#ini = inputs.definition.ini[1];

    model.nickname = model.#ini.nickname;
    model.system = inputs.system;

    model.name = model.#ini.ids_name ? ctx.ids(model.#ini.ids_name) : "";
    model.infocard = model.#ini.ids_info ? ctx.ids(model.#ini.ids_info) : "";
    model.position = model.#ini.pos;
    model.rotate = model.#ini.rotate;
    model.shape = model.#ini.shape;
    model.size = model.#ini.size;
    model.visit = ZoneVisitBitmask(model.#ini.visit ?? 0);
    model.sort = model.#ini.sort;

    model.music = model.#ini.music;
    model.properties = ZoneBitmask(model.#ini.property_flags ?? 0);
    model.fogColor = model.#ini.property_fog_color
      ? rgbToHex(model.#ini.property_fog_color)
      : undefined;
    model.spacedust = model.#ini.spacedust;
    model.spacedustMaxParticles = model.#ini.spacedust_maxparticles;
    model.edgeFraction = model.#ini.edge_fraction;

    model.toughness = model.#ini.toughness;
    model.density = model.#ini.density;
    model.repopTime = model.#ini.repop_time;
    model.maxBattleSize = model.#ini.max_battle_size;
    model.popType = !model.#ini.pop_type
      ? undefined
      : Array.isArray(model.#ini.pop_type)
        ? model.#ini.pop_type
        : [model.#ini.pop_type];
    model.damage = model.#ini.damage;
    model.reliefTime = model.#ini.relief_time;
    model.densityRestriction = model.#ini.density_restriction;
    model.populationAdditive = model.#ini.population_additive;

    model.missionType = model.#ini.mission_type;
    model.vignetteType = model.#ini.vignette_type;

    const zoneDefPath = ctx
      .ini<IniSystemShape>(`universe_${model.system}`)
      ?.findFirst("asteroids", (s) => s.get("zone") === model.nickname)
      ?.get("file");
    if (zoneDefPath) {
      const zoneDef = await ctx.parseIni(zoneDefPath);
      const loot = zoneDef.findFirst("lootablezone");
      const commodity = loot?.get("dynamic_loot_commodity") as string;
      const equipment = ctx.findByNickname("equipment", commodity);
      if (loot && equipment) {
        model.loot = {
          commodity,
          equipment,
          count: loot?.get("dynamic_loot_count") as [number, number],
          difficulty: loot?.get("dynamic_loot_difficulty") as number,
        };
      }
    }

    ctx.registerModel(model);

    return model;
  }
}

export class ObjectModel implements IObject {
  #ini!: IniSystemObject;

  public nickname!: string;
  public type = "object" as const;
  public system!: string;

  public name!: string;
  public infocard!: string;
  public position!: [number, number, number];
  public rotate?: [number, number, number];
  public archetype!: string;
  public visit!: ReturnType<typeof ObjectVisitBitmask>;
  public faction?: string;
  public parent?: string;
  public loadout?: string;

  public goto?: {
    system: string;
    object: string;
    effect: string;
  };

  static async from(
    ctx: IDataContext,
    inputs: { system: string; definition: IIniSection<IniSystemObject> }
  ) {
    const model = new ObjectModel();
    model.#ini = inputs.definition.ini[1];

    model.nickname = model.#ini.nickname;
    model.system = inputs.system;
    model.name = model.#ini.ids_name ? ctx.ids(model.#ini.ids_name) : "";
    model.infocard = model.#ini.ids_info ? ctx.ids(model.#ini.ids_info) : "";

    model.position = model.#ini.pos;
    model.rotate = model.#ini.rotate;
    model.visit = ObjectVisitBitmask(model.#ini.visit ?? 0);
    model.archetype = model.#ini.archetype;
    model.faction = model.#ini.reputation;
    model.loadout = model.#ini.loadout;
    model.parent = model.#ini.parent;
    model.loadout = model.#ini.loadout;

    if (model.#ini.goto) {
      model.goto = {
        system: model.#ini.goto[0],
        object: model.#ini.goto[1],
        effect: model.#ini.goto[2],
      };
    }

    ctx.registerModel(model);

    return model;
  }
}

export class SystemModel implements ISystem {
  #ini!: IniUniverseSystem;

  public nickname!: string;
  public type = "system" as const;

  public name!: string;
  public infocard!: string;
  public territory!: string;
  public position!: [number, number];
  public size!: number;
  public visit!: ReturnType<typeof ZoneVisitBitmask>;

  public connections: Array<{ system: string; type: "jumpgate" | "jumphole" }> =
    [];
  public tradelanes: Array<{
    startPosition: [number, number, number];
    endPosition: [number, number, number];
  }> = [];

  public zones: ZoneModel[] = [];
  public objects: ObjectModel[] = [];
  public bases: BaseModel[] = [];

  static async from(
    ctx: IDataContext,
    inputs: {
      universe: IIniSection<IniUniverseSystem>;
      definition: IIniSections<IniSystemShape>;
      territory: string;
    }
  ) {
    const bases =
      ctx
        .ini<IniUniverseShape>("universe")
        ?.findAll(
          "base",
          (s) => s.get("system") === inputs.universe.get("nickname")
        ) ?? [];

    const model = new SystemModel();
    model.#ini = inputs.universe.ini[1];
    model.nickname = model.#ini.nickname;
    model.position = model.#ini.pos;
    model.size = 272000 / (model.#ini.navmapscale ?? 1);
    model.name = ctx.ids(model.#ini.strid_name);
    model.infocard = ctx.ids(model.#ini.ids_info);
    model.territory = inputs.territory;
    model.visit = ZoneVisitBitmask(model.#ini.visit ?? 0);

    const objects = inputs.definition.findAll("object");
    const objectMap = objects.reduce(
      (acc, cur) => {
        acc[cur.get("nickname")] = cur;
        return acc;
      },
      {} as Record<string, IIniSection<IniSystemObject>>
    );

    for (const definition of objects) {
      const object = definition.ini[1];
      if (object.next_ring && !object.prev_ring) {
        let endPosition = object.pos;
        let latestRing = objectMap[object.next_ring].ini[1];
        while (latestRing.next_ring) {
          latestRing = objectMap[latestRing.next_ring].ini[1];
        }
        endPosition = latestRing.pos;
        model.tradelanes.push({ startPosition: object.pos, endPosition });
      }
      if (object.goto) {
        model.connections.push({
          system: object.goto[0],
          type: object.archetype.includes("hole") ? "jumphole" : "jumpgate",
        });
      }

      if (
        object.base &&
        object.archetype !== "docking_fixture" &&
        object.archetype !== "docking_ring" &&
        !object.parent
      ) {
        const universeBase = bases.find(
          (b) => b.get("nickname") === object.base
        );
        if (universeBase) {
          model.bases.push(
            await BaseModel.from(ctx, {
              universe: universeBase,
              definition,
            })
          );
        }
      } else {
        model.objects.push(
          await ObjectModel.from(ctx, {
            system: inputs.universe.get("nickname"),
            definition,
          })
        );
      }
    }

    for (const definition of inputs.definition.findAll("zone")) {
      model.zones.push(
        await ZoneModel.from(ctx, {
          system: inputs.universe.get("nickname"),
          definition,
        })
      );
    }

    ctx.registerModel(model);

    return model;
  }
}
