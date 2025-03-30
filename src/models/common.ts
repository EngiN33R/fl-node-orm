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
