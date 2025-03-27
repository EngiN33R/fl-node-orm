import { EntityType, IDataContext, IObject, ISystem, IZone } from "../types";
import { Bitmask } from "../util/bitmask";
import { rgbToHex } from "../util/color";
import { Section } from "../util/ini";
import { BaseModel } from "./base.model";
import {
  IniSystemObject,
  ObjectVisitBitmask,
  ZoneVisitBitmask,
} from "./common";

type IniEncounter = [string, number, number];
type IniFaction = [string, number];

type IniSystemZoneEllipsoidOrRing = {
  shape: "ellipsoid" | "ring";
  size: [number, number, number];
};

type IniSystemZoneCylinder = {
  shape: "cylinder";
  size: [number, number];
};

type IniSystemZoneSphere = {
  shape: "sphere";
  size: number;
};

type IniSystemZoneCommon = {
  nickname: string;
  ids_name?: number;
  ids_info?: number;
  pos: [number, number, number];
  rotate?: [number, number, number];
  sort: number;
  toughness?: number;
  density?: number;
  repop_time?: number;
  max_battle_size?: number;
  pop_type?: string | string[];
  music?: string;
  property_flags?: number;
  property_fog_color?: [number, number, number];
  spacedust?: string;
  spacedust_maxparticles?: number;
  edge_fraction?: number;
  visit?: number;
  damage?: number;
  relief_time?: number;
  density_restriction?: number;
  population_additive?: boolean;
  encounter?: IniEncounter | IniEncounter[];
  faction?: IniFaction | IniFaction[];
};

export type IniSystemZone = IniSystemZoneCommon &
  (IniSystemZoneEllipsoidOrRing | IniSystemZoneCylinder | IniSystemZoneSphere);

export type IniUniverseSystem = {
  nickname: string;
  file: string;
  pos: [number, number];
  visit?: number;
  strid_name: number;
  ids_info: number;
  navmapscale?: number;
  msg_id_prefix?: string;
};

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

  public nickname?: string;
  public type = "zone" as const;
  public system!: string;

  public name!: string;
  public infocard!: string;
  public position!: [number, number, number];
  public rotate?: [number, number, number];
  public shape!: "ellipsoid" | "ring" | "cylinder" | "sphere";
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

  static async from(
    ctx: IDataContext,
    inputs: { universe: Section; definition: Section }
  ) {
    const model = new ZoneModel();
    model.#ini = inputs.definition[1] as IniSystemZone;

    model.nickname = model.#ini.nickname;
    model.system = inputs.universe[1].nickname;

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

  static async from(
    ctx: IDataContext,
    inputs: { universe: Section; definition: Section }
  ) {
    const model = new ObjectModel();
    model.#ini = inputs.definition[1] as IniSystemObject;

    model.nickname = model.#ini.nickname;
    model.system = inputs.universe[1].nickname;
    model.name = model.#ini.ids_name ? ctx.ids(model.#ini.ids_name) : "";
    model.infocard = model.#ini.ids_info ? ctx.ids(model.#ini.ids_info) : "";

    model.position = model.#ini.pos;
    model.rotate = model.#ini.rotate;
    model.visit = ObjectVisitBitmask(model.#ini.visit ?? 0);
    model.archetype = model.#ini.archetype;
    model.faction = model.#ini.reputation;
    model.parent = model.#ini.parent;

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
      universe: Section;
      definition: Section[];
      bases: Section[];
    }
  ) {
    const model = new SystemModel();
    model.#ini = inputs.universe[1] as IniUniverseSystem;
    model.nickname = model.#ini.nickname;
    model.position = model.#ini.pos;
    model.size = 272000 / (model.#ini.navmapscale ?? 1);
    model.name = ctx.ids(model.#ini.strid_name);
    model.infocard = ctx.ids(model.#ini.ids_info);
    model.visit = ZoneVisitBitmask(model.#ini.visit ?? 0);

    const objects = inputs.definition.filter(
      (s) => s[0] === "object"
    ) as Section<IniSystemObject>[];
    const objectMap = objects.reduce(
      (acc, cur) => {
        if (cur[1].nickname) {
          acc[cur[1].nickname] = cur[1];
        }
        return acc;
      },
      {} as Record<string, IniSystemObject>
    );

    for (const [, object] of objects) {
      if (object.next_ring && !object.prev_ring) {
        let endPosition = object.pos;
        let latestRing = objectMap[object.next_ring];
        while (latestRing.next_ring) {
          latestRing = objectMap[latestRing.next_ring];
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
        const universeBase = inputs.bases.find(
          (b) => b[1].nickname === object.base
        );
        if (universeBase) {
          model.bases.push(
            await BaseModel.from(ctx, {
              universe: universeBase,
              object: ["object", object],
            })
          );
        }
      } else {
        model.objects.push(
          await ObjectModel.from(ctx, {
            universe: inputs.universe,
            definition: ["object", object],
          })
        );
      }
    }

    for (const zone of inputs.definition.filter((s) => s[0] === "zone")) {
      model.zones.push(
        await ZoneModel.from(ctx, {
          universe: inputs.universe,
          definition: zone,
        })
      );
    }

    ctx.registerModel(model);

    return model;
  }
}
