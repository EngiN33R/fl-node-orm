import { IniShiparch } from "../ini-types";
import { IDataContext, IIniSection, IShip } from "../types";

const getClass = (arch: IniShiparch) => {
  let cls = "Unknown";
  if (arch.type === "FIGHTER") {
    if (arch.ship_class === 0) {
      cls = "Light Fighter";
    } else if (arch.ship_class === 1) {
      cls = "Heavy Fighter";
    } else if (arch.ship_class === 3) {
      cls = "Very Heavy Fighter";
    } else {
      cls = "Fighter";
    }
  } else if (arch.type === "FREIGHTER") {
    if (arch.ship_class === 2) {
      cls = "Freighter";
    } else if (arch.ship_class === 13) {
      cls = "Utility Vessel";
    }
  } else if (arch.type === "GUNBOAT") {
    cls = "Gunboat";
  } else if (arch.type === "CRUISER") {
    if (arch.ship_class === 5) {
      cls = "Cruiser";
    } else if (arch.ship_class === 6) {
      cls = "Destroyer";
    }
  } else if (arch.type === "CAPITAL") {
    if (arch.ship_class === 9) {
      cls = "Liner";
    } else if (arch.ship_class === 7) {
      cls = "Battleship";
    } else {
      cls = "Capital Vessel";
    }
  } else if (arch.type === "TRANSPORT") {
    if (arch.ship_class === 8) {
      cls = "Transport";
    } else if (arch.ship_class === 10) {
      cls = "Train";
    }
  } else if (arch.type === "MINING") {
    cls = "Mining Vessel";
  }

  if (arch.nomad) {
    cls = "Nomad " + cls;
  }

  return cls;
};

export class ShipModel implements IShip {
  public nickname!: string;
  public type = "ship" as const;

  public name!: string;
  public infocard!: string;
  public stats!: string;
  public class!: string;
  public hitPoints!: number;
  public maxNanobots!: number;
  public maxBatteries!: number;
  public holdSize!: number;
  public dockingType!: "DOCK" | "MED_MOOR" | "LARGE_MOOR";
  public hardpoints: Array<{
    id: string;
    type: string;
  }> = [];

  static async from(
    ctx: IDataContext,
    inputs: { arch: IIniSection<IniShiparch> }
  ) {
    const model = new ShipModel();

    const arch = inputs.arch.ini[1];

    model.nickname = arch.nickname;

    model.name = ctx.ids(arch.ids_name);
    model.infocard = ctx.ids(arch.ids_info1);
    model.stats = ctx.ids(arch.ids_info);
    model.class = getClass(arch);
    model.hitPoints = arch.hit_pts;
    model.maxBatteries = arch.shield_battery_limit;
    model.maxNanobots = arch.nanobot_limit;
    model.holdSize = arch.hold_size;
    if (arch.mission_property === "can_use_berths") {
      model.dockingType = "DOCK";
    } else if (arch.mission_property === "can_use_med_moors") {
      model.dockingType = "MED_MOOR";
    } else if (arch.mission_property === "can_use_large_moors") {
      model.dockingType = "LARGE_MOOR";
    }

    for (const [type, ...hardpoints] of inputs.arch.asArray("hp_type")) {
      for (const hp of hardpoints) {
        model.hardpoints.push({
          id: hp,
          type: type,
        });
      }
    }

    ctx.registerModel(model);

    return model;
  }
}
