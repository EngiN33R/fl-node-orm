import { ObjectVisitBitmask, ZoneVisitBitmask } from "./models/common";
import { ZoneBitmask } from "./models/system.model";
import { Section } from "./util/ini";

export interface Parser<T> {
  parse(data: ArrayBuffer): Promise<T>;
}

export interface Model {
  nickname?: string;
}

export interface ModelInstantiator {
  from(inputs: Record<string, Section | Section[]>): Promise<Model>;
}

export interface IZone {
  name: string;
  infocard: string;
  position: [number, number, number];
  rotate?: [number, number, number];
  visit?: ReturnType<typeof ZoneVisitBitmask>;
  sort: number;

  music?: string;
  properties?: ReturnType<typeof ZoneBitmask>;
  fogColor?: string;
  spacedust?: string;
  spacedustMaxParticles?: number;
  edgeFraction?: number;

  toughness?: number;
  density?: number;
  repopTime?: number;
  maxBattleSize?: number;
  popType?: string[];
  damage?: number;
  reliefTime?: number;
  densityRestriction?: number;
  populationAdditive?: boolean;
}

export interface IObject extends Model {
  name: string;
  infocard: string;
  position: [number, number, number];
  rotate?: [number, number, number];
  visit: ReturnType<typeof ZoneVisitBitmask>;
}

export interface IBase extends Model {
  name: string;
  infocards: string[];
  system: string;
  position: [number, number, number];
  rotation: [number, number, number];
  faction: string;
  visit: ReturnType<typeof ObjectVisitBitmask>;
}

export interface ISystem extends Model {
  name: string;
  infocard: string;
  position: [number, number];
  visit: ReturnType<typeof ZoneVisitBitmask>;
}

export interface IFaction extends Model {
  name: string;
  infocard: string;

  legality: "lawful" | "unlawful";
  nicknamePlurality: "singular" | "plural";
  msgIdPrefix: string;
  jumpPreference: "jumpgate" | "jumphole" | "any";
  npcShips: string[];
  mcCostume: string;
  voices: string[];
  firstNamesMale: string[];
  firstNamesFemale: string[];
  lastNames: string[];
  formations: string[];
  ranks: [string, string, string];

  reputation: Record<string, number>;

  objectDestructionRep: number;
  missionSuccessRep: number;
  missionFailureRep: number;
  missionAbortRep: number;
  empathy: Record<string, number>;
}

export interface IIniSection extends Model {
  ini: Section;
}

export interface IIniSections extends Model {
  path: string;
  keys: string[];
  sections: IIniSection[];
}

export type Entity = {
  system: ISystem;
  faction: IFaction;
};

export type EntityType = keyof Entity;

export interface IDataContext {
  findByNickname<K extends EntityType>(
    type: K,
    nickname: string
  ): Entity[K] | undefined;
  ids(key: number): string;
  idsWithRelated(key: number): [string] | [string, string];
  ini(relativePath: string): IIniSections | undefined;
}
