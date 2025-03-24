import { Bitmask } from "../util/bitmask";

export const ZoneVisitBitmask = Bitmask.define(
  [
    "ALWAYS_VISITED",
    "_",
    "MINEABLE",
    "ACTIVELY_VISITED",
    "WRECK",
    "ZONE",
    "FACTION",
    "ALWAYS_HIDDEN",
  ],
  "NOT_VISITED"
);

export const ObjectVisitBitmask = Bitmask.define(
  [
    "DISCOVERED",
    "_",
    "COMMODITY_LIST",
    "EQUIPMENT_LIST",
    "SHIP_LIST",
    "ZONE",
    "FACTION",
    "ALWAYS_HIDDEN",
  ],
  "NOT_VISITED"
);

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
