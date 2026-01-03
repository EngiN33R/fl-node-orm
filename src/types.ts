import { ObjectVisitBitmask, ZoneVisitBitmask } from "./models/common";
import { ZoneBitmask } from "./models/system.model";
import { Section } from "./util/ini";
import { UtfTree } from "./util/utf";

export type AnyRecord = Record<string, unknown>;
export type AnyRecordMap = Record<string, OptArray<AnyRecord>>;
export type OptArray<T> = Array<T> | T;
export type Key<T> = keyof T & string;

export interface Model<K extends EntityType> {
  nickname: string;
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
  shape: "ellipsoid" | "ring" | "cylinder" | "sphere" | "box";
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

  missionType?: string | string[];
  vignetteType?: string;

  loot?: {
    commodity: string;
    equipment: IEquipment;
    count: [number, number];
    difficulty: number;
  };
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
  loadout?: string;
  nextRing?: string;
  prevRing?: string;
  tradelaneSpaceName?: string;
  tradelaneIndex?: number;

  goto?: {
    system: string;
    object: string;
    effect: string;
  };
}

export interface IBase extends Model<"base"> {
  system: string;
  objectNickname: string;
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
  territory: string;
  position: [number, number];
  size: number;
  visit: ReturnType<typeof ZoneVisitBitmask>;

  connections: Array<{
    system: string;
    type: "jumpgate" | "jumphole" | "both";
    faction?: string;
  }>;
  tradelanes: Array<{
    startPosition: [number, number, number];
    endPosition: [number, number, number];
    rings: IObject[];
    names: [string, string];
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
  npcShips?: string[];
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

export interface IShip extends Model<"ship"> {
  name: string;
  infocard: string;
  icon: string;

  stats: string;
  class: string;
  mass: number;
  linearDrag: number;
  angularDrag: [number, number, number];
  rotationInertia: [number, number, number];
  steeringTorque: [number, number, number];
  nudgeForce: number;
  strafeForce: number;
  strafePowerUsage: number;
  hitPoints: number;
  maxNanobots: number;
  maxBatteries: number;
  holdSize: number;
  dockingType: "DOCK" | "MED_MOOR" | "LARGE_MOOR";
  hardpoints: Array<{
    id: string;
    type: string;
  }>;
}

export interface IEquipment extends Model<"equipment"> {
  name: string;
  infocard: string;
  icon: string;
  hardpoint: string;
  hitpoints: number;
  mass: number;
  volume: number;

  kind:
    | "gun"
    | "ammo"
    | "turret"
    | "missile"
    | "mine"
    | "mine_ammo"
    | "cm"
    | "cm_ammo"
    | "shield"
    | "power"
    | "engine"
    | "thruster"
    | "scanner"
    | "tractor"
    | "battery"
    | "nanobots"
    | "armor"
    | "cloak"
    | "commodity";
  class: string;
  lootable: boolean;

  gun?: {
    damageType: string;
    multipliers: {
      [shieldType: string]: number;
    };
    powerUsage: number;
    hullDamage: number;
    shieldDamage: number;
    refireRate: number;
    range: number;
    speed: number;
    turnRate: number;
  };
  turret?: {
    damageType: string;
    multipliers: {
      [shieldType: string]: number;
    };
    powerUsage: number;
    hullDamage: number;
    shieldDamage: number;
    refireRate: number;
    range: number;
    speed: number;
    turnRate: number;
  };
  missile?: {
    hullDamage: number;
    shieldDamage: number;
    refireRate: number;
    seekRange: number;
    speed: number;
    explosionRadius: number;
    munitionTurnRate: number;
  };
  mine?: {
    hullDamage: number;
    shieldDamage: number;
    seekRange: number;
    detonationDistance: number;
    explosionRadius: number;
    speed: number;
    refireRate: number;
    lifetime: number;
    safeTime: number;
  };
  cm?: {
    range: number;
    diversion: number;
    lifetime: number;
    refireRate: number;
    powerUsage: number;
  };
  shield?: {
    type: string;
    capacity: number;
    regeneration: number;
    rebuildTime: number;
    constantPowerUsage: number;
    rebuildPowerUsage: number;
    resistances: {
      [weaponType: string]: number;
    };
  };
  power?: {
    capacity: number;
    chargeRate: number;
    thrustCapacity: number;
    thrustChargeRate: number;
  };
  engine?: {
    cruiseSpeed: number;
    maxForce: number;
    linearDrag: number;
    speed: number;
    reverseSpeed: number;
    thrusterMult: number;
  };
  thruster?: {
    maxForce: number;
    speed: number;
    powerUsage: number;
  };
  scanner?: {
    range: number;
    cargoScanRange: number;
  };
  tractor?: {
    range: number;
    speed: number;
  };
  battery?: {
    hitpoints: number;
  };
  nanobots?: {
    hitpoints: number;
  };
  armor?: {
    scale: number;
  };
  cloak?: {
    powerUsage: number;
  };
  commodity?: {
    decayPerSecond: number;
    unitsPerContainer: number;
    podAppearance: string;
    lootAppearance: string;
  };
  good?: IGood;
}

export interface IGood extends Model<"good"> {
  equipment: string;
  category: "commodity" | "equipment";
  price: number;
  combinable: boolean;
  goodSellPrice?: number;
  badBuyPrice?: number;
  badSellPrice?: number;
  goodBuyPrice?: number;
}

export interface INpc extends Model<"npc"> {
  faction?: string;
  level: number;
  ship: string;
  equipment: Array<{
    equipment: string;
    hardpoint?: string;
  }>;
  cargo: Array<{
    equipment: string;
    count: number;
  }>;
}

export interface ICraftingRecipe extends Model<"crafting_recipe"> {
  product: {
    good: string;
    amount: number;
  };
  ingredients: Array<{
    good: string;
    amount: number;
  }>;
  bases: string[];
  cost: number;
}

export interface ILootBox extends Model<"lootbox"> {
  nickname: string;
  items: Array<{
    good: string;
    chance: number;
    weight: number;
  }>;
}

export type ForcedArray<T> = T extends Array<unknown> ? T : Array<T>;
export type Unarray<T> = T extends Array<infer K> ? K : T;

export interface IIniSection<
  S extends AnyRecord = AnyRecord,
  K extends string = string,
> {
  nickname?: string;
  ini: Section<S, K>;
  raw: S;
  name: string;

  has<K extends string>(key: K): K extends Key<S> ? true : false;
  get<K extends Key<S>>(key: K): S[K];
  ids<K extends Key<S>>(key: K): string;
  as<V, K extends Key<S> = Key<S>>(key: K): V;
  asArray<K extends Key<S>>(
    key: K,
    nested?: boolean
  ): ForcedArray<NonNullable<S[K]>>;
  asSingle<K extends Key<S>>(key: K): Unarray<S[K]>;
}

export interface IIniSections<S extends AnyRecordMap = AnyRecordMap> {
  path: string;
  keys: Key<S>[];
  sections: IIniSection<Unarray<S[Key<S>]>>[];

  append(sections: IIniSections<S>): void;
  findAll<K extends Key<S>>(
    name: K,
    predicate?: (s: IIniSection<Unarray<S[K]>, K>) => boolean
  ): IIniSection<Unarray<S[K]>, K>[];
  findByNickname<K extends Key<S>>(
    name: K,
    nickname: string
  ): IIniSection<Unarray<S[K]>, K> | undefined;
  findFirst<K extends Key<S>>(
    name: K,
    predicate?: (s: IIniSection<Unarray<S[K]>, K>) => boolean
  ): IIniSection<Unarray<S[K]>, K> | undefined;
  findFirstWithChildren<K extends Key<S>>(
    name: K,
    predicate?: (s: IIniSection<Unarray<S[K]>>) => boolean
  ):
    | [IIniSection<Unarray<S[K]>>, IIniSection<Unarray<S[Key<S>]>>[]]
    | [undefined, []];
}

export type Entity = {
  system: ISystem;
  zone: IZone;
  object: IObject;
  base: IBase;
  faction: IFaction;
  equipment: IEquipment;
  ship: IShip;
  npc: INpc;
  good: IGood;
  crafting_recipe: ICraftingRecipe;
  lootbox: ILootBox;
};

export type EntityType = keyof Entity;

export interface IEntityQuerier<K extends EntityType> {
  findAll(predicate?: (e: Entity[K]) => boolean): Entity[K][];
  findFirst(predicate?: (e: Entity[K]) => boolean): Entity[K] | undefined;
  findByNickname(nickname: string): Entity[K] | undefined;
}

export interface IMarketQuerier {
  getGood(
    base: string,
    equipment: string
  ): { price: number; sold: boolean; rep: number };
  getGoods(
    base: string
  ): Array<{ equipment: string; price: number; sold: boolean; rep: number }>;
  getBases(equipment: string): string[];
  getPrice(base: string, equipment: string): number;
  getSoldAt(equipment: string): string[];
}

export type ProcurementSource =
  | "market"
  | "ship_package"
  | "npc_loot"
  | "phantom_loot"
  | "wreck_loot"
  | "crafting"
  | "lootbox"
  | "mining";

export type ProcurementDetails =
  | {
      type: "market";
      base: string;
      system: string;
      position: [number, number, number];
      rep: number;
      price: number;
    }
  | {
      type: "ship_package";
      ship: string;
    }
  | {
      type: "npc_loot";
      loadout: string;
      faction: string;
      chance: number;
    }
  | {
      type: "phantom_loot";
      chance: number;
      min: number;
      max: number;
      minToughness: number;
      maxToughness: number;
    }
  | {
      type: "wreck_loot";
      object: string;
      system: string;
      position: [number, number, number];
    }
  | {
      type: "crafting";
      recipe: ICraftingRecipe;
    }
  | {
      type: "lootbox";
      box: string;
      chance: number;
    }
  | {
      type: "mining";
      zone: string;
      system: string;
      position: [number, number, number];
      difficulty: number;
    };

export interface IProcurementQuerier {
  getProcurementDetails(nickname: string): ProcurementDetails[];
}

export type NavigationLocation = {
  position: [number, number, number];
  system: string;
  object?: string;
  faction?: string;
  name?: string;
};

export type NavigationWaypoint = {
  type: "cruise" | "tradelane" | "jump";
  from: NavigationLocation;
  to: NavigationLocation;
  duration: number;
};

export interface IDataContext {
  path: string;
  dataPath: string;

  market: IMarketQuerier;

  /**
   * Register a model.
   * @param model Model to register.
   */
  registerModel<K extends EntityType>(model: Entity[K]): void;
  unregisterModel<K extends EntityType>(model: Entity[K]): void;
  /**
   * Register binary data.
   * @param data Data to register. If `undefined`, does nothing.
   */
  registerBinary(handle: string, data: ArrayBuffer | undefined): void;
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
   * Get supplementary IDS string for key. Used for supplementary DLLs with
   * included resource strings, such as certain mod DLLs (e.g. engclass.dll).
   * @param key IDS key.
   * @param dll DLL name.
   */
  supplementaryIds(key: number, dll: string): string;
  /**
   * Get model for raw INI file.
   * @param handle INI file handle or path relative to instance root.
   */
  ini<S extends AnyRecordMap = AnyRecordMap>(
    handle: string
  ): IIniSections<S> | undefined;
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
  parseIni<S extends AnyRecordMap = AnyRecordMap>(
    relativePath: string,
    nickname?: string
  ): Promise<IIniSections<S>>;
  loadUtf(relativePath: string, nickname?: string): Promise<UtfTree>;
  entity<K extends EntityType>(type: K): IEntityQuerier<K>;
  loadUtf(relativePath: string, nickname?: string): Promise<UtfTree>;
}
