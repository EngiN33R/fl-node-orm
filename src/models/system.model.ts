import { DataContext } from "../context";
import { Model } from "../types";
import { Bitmask } from "../util/bitmask";
import { rgbToHex } from "../util/color";
import { Section } from "../util/ini";
import { BaseModel } from "./base.model";
import { IniSystemObject, ZoneVisitBitmask } from "./common";

type IniEncounter = [string, number, number];
type IniFaction = [string, number];

type IniSystemZoneEllipsoidOrRing = {
  shape: "ellipsoid" | "ring";
  size: [number, number, number];
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
  (IniSystemZoneEllipsoidOrRing | IniSystemZoneSphere);

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

export class SystemZoneModel implements Model {
  #ini!: IniSystemZone;

  public nickname?: string;

  public name!: string;
  public infocard!: string;
  public position!: [number, number, number];
  public rotate?: [number, number, number];
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

  static async from(inputs: { definition: Section }) {
    const model = new SystemZoneModel();
    model.#ini = inputs.definition[1] as IniSystemZone;

    model.nickname = model.#ini.nickname;

    model.name = model.#ini.ids_name
      ? DataContext.INSTANCE.ids(model.#ini.ids_name)
      : "";
    model.infocard = model.#ini.ids_info
      ? DataContext.INSTANCE.ids(model.#ini.ids_info)
      : "";
    model.position = model.#ini.pos;
    model.rotate = model.#ini.rotate;
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

    return model;
  }
}

export class SystemObjectModel implements Model {
  #ini!: IniSystemObject;

  public nickname!: string;
  public name!: string;
  public infocard!: string;
  public position!: [number, number, number];
  public rotate?: [number, number, number];
  public visit!: ReturnType<typeof ZoneVisitBitmask>;

  static async from(inputs: { object: Section }) {
    const model = new SystemObjectModel();
    model.#ini = inputs.object[1] as IniSystemObject;

    model.nickname = model.#ini.nickname;
    model.name = model.#ini.ids_name
      ? DataContext.INSTANCE.ids(model.#ini.ids_name)
      : "";
    model.infocard = model.#ini.ids_info
      ? DataContext.INSTANCE.ids(model.#ini.ids_info)
      : "";

    model.position = model.#ini.pos;
    model.rotate = model.#ini.rotate;
    model.visit = ZoneVisitBitmask(model.#ini.visit ?? 0);

    return model;
  }
}

export class SystemModel implements Model {
  #ini!: IniUniverseSystem;

  public nickname!: string;
  public name!: string;
  public infocard!: string;
  public position!: [number, number];
  public visit!: ReturnType<typeof ZoneVisitBitmask>;

  public zones: SystemZoneModel[] = [];
  public bases: BaseModel[] = [];

  static async from(inputs: {
    universe: Section;
    definition: Section[];
    bases: Section[];
  }) {
    const model = new SystemModel();
    model.#ini = inputs.universe[1] as IniUniverseSystem;
    model.nickname = model.#ini.nickname;
    model.position = model.#ini.pos;
    model.name = DataContext.INSTANCE.ids(model.#ini.strid_name);
    model.infocard = DataContext.INSTANCE.ids(model.#ini.ids_info);
    model.visit = ZoneVisitBitmask(model.#ini.visit ?? 0);

    for (const zone of inputs.definition.filter((s) => s[0] === "zone")) {
      model.zones.push(await SystemZoneModel.from({ definition: zone }));
    }
    for (const object of inputs.definition.filter(
      (s) => s[0] === "object" && !!s[1].base
    )) {
      const universeBase = inputs.bases.find(
        (b) => b[1].nickname === object[1].base
      );
      if (universeBase) {
        model.bases.push(
          await BaseModel.from({
            universe: universeBase,
            object: object,
          })
        );
      }
    }
    return model;
  }
}
