import { OptArray } from "./types";

export type IniConfigShape = {
  freelancer: {
    "data path": string;
  };
  resources: {
    dll: string[];
  };
  data: {
    universe: string;
    equipment: string[];
    ships: string[];
    goods: string[];
    markets: string[];
  };
};

type IniEncounter = [string, number, number];
type IniFaction = [string, number];

type IniSystemZoneThreeSized = {
  shape: "ellipsoid" | "ring" | "box";
  size: [number, number, number];
};

type IniSystemZoneTwoSized = {
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
  pop_type?: OptArray<string>;
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
  encounter?: OptArray<IniEncounter>;
  faction?: OptArray<IniFaction>;
  mission_type?: string;
  vignette_type?: string;
};

export type IniSystemZone = IniSystemZoneCommon &
  (IniSystemZoneThreeSized | IniSystemZoneTwoSized | IniSystemZoneSphere);

export type IniSystemObject = {
  nickname: string;
  ids_name?: number;
  ids_info?: number;
  pos: [number, number, number];
  rotate?: [number, number, number];
  ambient_color?: [number, number, number];
  archetype: string;
  star?: string;
  spin?: [number, number, number];
  msg_id_prefix?: string;
  jump_effect?: string;
  atmosphere_range?: number;
  prev_ring?: string;
  next_ring?: string;
  ring?: [string, string];
  base?: string;
  dock_with?: string;
  ambient?: [number, number, number];
  visit?: number;
  reputation?: string;
  tradelane_space_name?: string;
  behavior?: string;
  voice?: string;
  space_costume?: [string, string];
  difficulty_level?: number;
  goto?: [string, string, string];
  loadout?: string;
  pilot?: string;
  parent?: string;
};

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

export type IniUniverseBase = {
  nickname: string;
  system: string;
  strid_name: number;
  file: string;
  BGCS_base_run_by?: string;
};

export type IniSystemShape = {
  zone: IniSystemZone[];
  object: IniSystemObject[];
  systeminfo: {
    space_color: [number, number, number];
    local_faction: string;
  };
  archetype: {
    ship: OptArray<string>;
    solar: OptArray<string>;
  };
  encounterparameters: OptArray<{
    nickname: string;
    filename: string;
  }>;
  asteroids: OptArray<{
    file: string;
    zone: string;
  }>;
};

export type IniUniverseShape = {
  system: IniUniverseSystem[];
  base: IniUniverseBase[];
};

export type IniInitialWorldGroup = {
  nickname: string;
  ids_name: number;
  ids_info: number;
  ids_short_name: number;
  rep: Array<[number, string]>;
};

export type IniFactionProp = {
  affiliation: string;
  legality: string;
  nickname_plurality: string;
  msg_id_prefix: string;
  jump_preference: string;
  npc_ship: OptArray<string>;
  voice: OptArray<string>;
  mc_costume: string;
  space_costume: OptArray<number>;
  firstname_male: [number, number];
  firstname_female: [number, number];
  lastname: [number, number];
  rank_desig: [number, number, number, number, number];
  formation_desig: [number, number];
  large_ship_desig: OptArray<number>;
  large_ship_names: OptArray<number>;
  scan_for_cargo: OptArray<string>;
  scan_announce: "true" | "false";
  scan_chance: number;
  formation: OptArray<[string, string]>;
};

export type IniEmpathy = {
  group: string;
  event: Array<
    [
      (
        | "object_destruction"
        | "random_mission_success"
        | "random_mission_failure"
        | "random_mission_abortion"
      ),
      number,
    ]
  >;
  empathy_rate: Array<[string, number]>;
};

export type IniEquipmentGun = {
  nickname: string;
  ids_name: number;
  ids_info: number;
  volume: number;
  mass: number;
  hp_gun_type: string;
  power_usage: number;
  refire_delay: number;
  muzzle_velocity: number;
  toughness: number;
  projectile_archetype: string;
  hit_pts: number;
  turn_rate: number;
  dispersion_angle: number;
};

export type IniEquipmentMunition = {
  nickname: string;
  requires_ammo: boolean;
  hull_damage?: number;
  energy_damage?: number;
  mass: number;
  volume: number;
  lootable: boolean;
  lifetime: number;
  explosion_arch?: string;
  weapon_type?: string;
  motor?: string;
  seeker?: "DUMB" | "LOCK";
  time_to_lock?: number;
  seeker_range?: number;
  seeker_fov_deg?: number;
  max_angular_velocity?: number;
  detonation_dist?: number;
};

export type IniEquipmentMotor = {
  nickname: string;
  lifetime: number;
  accel: number;
  delay: number;
};

export type IniEquipmentMineDropper = {
  nickname: string;
  ids_name: number;
  ids_info: number;
  hit_pts: number;
  explosion_resistance: number;
  parent_impulse: number;
  child_impulse: number;
  volume: number;
  mass: number;
  damage_per_fire: number;
  power_usage: number;
  refire_delay: number;
  muzzle_velocity: number;
  toughness: number;
  projectile_archetype: string;
  lootable: boolean;
};

export type IniEquipmentMineAmmo = {
  nickname: string;
  ids_name: number;
  ids_info: number;
  units_per_container: number;
  requires_ammo: boolean;
  explosion_arch: string;
  hit_pts: number;
  detonation_dist: number;
  lifetime: number;
  mass: number;
  volume: number;
  owner_safe_time: number;
  linear_drag: number;
  seek_dist: number;
  top_speed: number;
  acceleration: number;
  ammo_limit: number;
  lootable: boolean;
};

export type IniEquipmentCMDropper = {
  nickname: string;
  ids_name: number;
  ids_info: number;
  hit_pts: number;
  explosion_resistance: number;
  volume: number;
  mass: number;
  power_usage: number;
  refire_delay: number;
  muzzle_velocity: number;
  projectile_archetype: string;
  AI_range: number;
  lootable: boolean;
};

export type IniEquipmentCMAmmo = {
  nickname: string;
  hit_pts: number;
  lifetime: number;
  ids_name: number;
  ids_info: number;
  mass: number;
  volume: number;
  owner_safe_time: number;
  force_gun_ori: boolean;
  requires_ammo: boolean;
  linear_drag: number;
  range: number;
  diversion_pctg: number;
};

export type IniEquipmentPower = {
  nickname: string;
  ids_name: number;
  ids_info: number;
  volume: number;
  mass: number;
  capacity: number;
  charge_rate: number;
  thrust_capacity: number;
  thrust_charge_rate: number;
  lootable: boolean;
  hp_type: string;
};

export type IniEquipmentScanner = {
  nickname: string;
  ids_name: number;
  ids_info: number;
  volume: number;
  mass: number;
  range: number;
  cargo_scan_range: number;
  lootable: boolean;
};

export type IniEquipmentTractor = {
  nickname: string;
  ids_name: number;
  ids_info: number;
  volume: number;
  mass: number;
  max_length: number;
  reach_speed: number;
  color: [number, number, number];
  operating_effect: string;
  tractor_complete_snd: string;
  lootable: boolean;
};

export type IniEquipmentLight = {
  nickname: string;
  inherit: string;
  bulb_size?: 0.1;
  glow_size?: 0.75;
  color?: [number, number, number];
  min_color?: [number, number, number];
  flare_cone?: [number, number];
  avg_delay?: number;
  blink_duration?: number;
};

export type IniEquipmentEngine = {
  nickname: string;
  ids_name: number;
  ids_info: number;
  volume: number;
  mass: number;
  max_force: number;
  linear_drag: number;
  power_usage: number;
  reverse_fraction: number;
  flame_effect: string;
  trail_effect: string;
  trail_effect_player: string;
  cruise_charge_time: number;
  cruise_power_usage: number;
  cruise_start_sound: string;
  cruise_loop_sound: string;
  cruise_stop_sound: string;
  cruise_speed: number;
  indestructible: boolean;
  hp_type: string;
};

export type IniEquipmentArmor = {
  nickname: string;
  hit_pts_scale: number;
};

export type IniEquipmentCloak = {
  nickname: string;
  ids_name: number;
  ids_info: number;
  hit_pts: number;
  mass: number;
  volume: number;
  power_usage: number;
  cloakin_time: number;
  cloakout_time: number;
  cloakin_fx: string;
  cloakout_fx: string;
};

export type IniEquipmentBattery = {
  nickname: string;
  ids_name: number;
  ids_info: number;
  volume: number;
  mass: number;
  hit_pts: number;
  lootable: boolean;
};

export type IniEquipmentNanobots = {
  nickname: string;
  ids_name: number;
  ids_info: number;
  volume: number;
  mass: number;
  hit_pts: number;
  lootable: boolean;
};

export type IniEquipmentShield = {
  nickname: string;
  ids_name: number;
  ids_info: number;
  hit_pts: number;
  explosion_resistance: number;
  debris_type: string;
  parent_impulse: number;
  child_impulse: number;
  volume: number;
  mass: number;
  regeneration_rate: number;
  max_capacity: number;
  toughness: number;
  hp_type: string;
  offline_rebuild_time: number;
  offline_threshold: number;
  constant_power_draw: number;
  rebuild_power_draw: number;
  shield_type: string;
  lootable: boolean;
};

export type IniEquipmentThruster = {
  nickname: string;
  ids_name: number;
  ids_info: number;
  hit_pts: number;
  explosion_resistance: number;
  volume: number;
  mass: number;
  max_force: number;
  power_usage: number;
  lootable: boolean;
};

export type IniEquipmentShape = {
  armor: IniEquipmentArmor[];
  light: IniEquipmentLight[];
  cloak: IniEquipmentCloak[];
  scanner: IniEquipmentScanner[];
  tractor: IniEquipmentTractor[];

  engine: IniEquipmentEngine[];
  power: IniEquipmentPower[];

  countermeasuredropper: IniEquipmentCMDropper[];
  countermeasure: IniEquipmentCMAmmo[];
  minedropper: IniEquipmentMineDropper[];
  mine: IniEquipmentMineAmmo[];
  thruster: IniEquipmentThruster[];
  shieldgenerator: IniEquipmentShield[];

  gun: IniEquipmentGun[];
  munition: IniEquipmentMunition[];
  motor: IniEquipmentMotor[];

  explosion: Array<{
    nickname: string;
    strength: number;
    radius: number;
    hull_damage: number;
    energy_damage: number;
    impulse: number;
  }>;

  battery: OptArray<IniEquipmentBattery>;
  nanobots: OptArray<IniEquipmentNanobots>;
};

export type IniShiparch = {
  nickname: string;
  ids_name: number;
  ids_info: number;
  ids_info1: number;
  ship_class: number;
  type:
    | "FIGHTER"
    | "FREIGHTER"
    | "CRUISER"
    | "GUNBOAT"
    | "CAPITAL"
    | "TRANSPORT"
    | "MINING";
  nanobot_limit: number;
  shield_battery_limit: number;
  hold_size: number;
  hit_pts: number;
  mission_property:
    | "can_use_berths"
    | "can_use_med_moors"
    | "can_use_large_moors";
  nomad?: "true";

  mass: number;
  linear_drag: number;
  steering_torque: [number, number, number];
  angular_drag: [number, number, number];
  rotation_inertia: [number, number, number];
  nudge_force: number;
  strafe_force: number;
  strafe_power_usage: number;

  hp_type: Array<[type: string, ...hardpoints: string[]]>;
};
