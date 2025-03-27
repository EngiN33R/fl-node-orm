import { ObjectVisitBitmask, ZoneVisitBitmask } from "./models/common";
import { ZoneBitmask } from "./models/system.model";
import { Section } from "./util/ini";

export interface Parser<T> {
  parse(data: ArrayBuffer): Promise<T>;
}

export interface Model<K extends EntityType> {
  nickname?: string;
  type: K;
}

export interface ModelInstantiator {
  from<K extends EntityType>(
    inputs: Record<string, Section | Section[]>
  ): Promise<Model<K>>;
}

export interface IZone extends Model<"zone"> {
  system: string;

  name: string;
  infocard: string;
  position: [number, number, number];
  rotate?: [number, number, number];
  visit?: ReturnType<typeof ZoneVisitBitmask>;
  sort: number;
  shape: "ellipsoid" | "ring" | "cylinder" | "sphere";
  size: [number, number, number] | [number, number] | number;

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

export interface IObject extends Model<"object"> {
  system: string;
  name: string;
  infocard: string;
  position: [number, number, number];
  rotate?: [number, number, number];
  visit: ReturnType<typeof ObjectVisitBitmask>;
  archetype: string;
  faction?: string;
  parent?: string;
}

export interface IBase extends Model<"base"> {
  system: string;
  name: string;
  infocard: string;
  infocards: string[];
  position: [number, number, number];
  rotation: [number, number, number];
  faction: string;
  archetype: string;
  visit: ReturnType<typeof ObjectVisitBitmask>;
}

export interface ISystem extends Model<"system"> {
  name: string;
  infocard: string;
  position: [number, number];
  size: number;
  visit: ReturnType<typeof ZoneVisitBitmask>;

  connections: Array<{
    system: string;
    type: "jumpgate" | "jumphole";
    faction?: string;
  }>;
  tradelanes: Array<{
    startPosition: [number, number, number];
    endPosition: [number, number, number];
    faction?: string;
  }>;

  zones: IZone[];
  objects: IObject[];
  bases: IBase[];
}

export interface IFaction extends Model<"faction"> {
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

export interface IIniSection {
  nickname?: string;
  ini: Section;
}

export interface IIniSections {
  path: string;
  keys: string[];
  sections: IIniSection[];

  findAll(name: string, predicate?: (s: IIniSection) => boolean): IIniSection[];
  findFirst(
    name: string,
    predicate?: (s: IIniSection) => boolean
  ): IIniSection | undefined;
  findFirstWithChildren(
    name: string,
    predicate?: (s: IIniSection) => boolean
  ): [IIniSection, IIniSection[]] | [undefined, []];
}

export type Entity = {
  system: ISystem;
  zone: IZone;
  object: IObject;
  base: IBase;
  faction: IFaction;
};

export type EntityType = keyof Entity;

export interface IEntityQuerier<K extends EntityType> {
  findAll(): Entity[K][];
  findByNickname(nickname: string): Entity[K] | undefined;
}

export interface IDataContext {
  /**
   * Register a model.
   * @param model Model to register.
   */
  registerModel<K extends EntityType>(model: Entity[K]): void;
  /**
   * Find first entity of type by nickname.
   * @param type Entity type.
   * @param nickname Entity nickname.
   */
  findByNickname<K extends EntityType>(
    type: K,
    nickname: string
  ): Entity[K] | undefined;
  /**
   * Get IDS string for key.
   * @param key IDS key.
   */
  ids(key: number): string;
  /**
   * Get IDS string and related string for key (used for base infocards).
   * @param key IDS key.
   */
  idsWithRelated(key: number): [string] | [string, string];
  /**
   * Get model for raw INI file.
   * @param handle INI file handle or path relative to instance root.
   */
  ini(handle: string): IIniSections | undefined;
  /**
   * Get data for a UTF node.
   * @param handle File handle or path relative to instance root.
   */
  utf(handle: string, key: string): ArrayBuffer | undefined;
  /**
   * Get well-known binary data directly.
   * @param handle Binary data handle.
   */
  binary(handle: string): ArrayBuffer | undefined;
  entity<K extends EntityType>(type: K): IEntityQuerier<K>;
}
