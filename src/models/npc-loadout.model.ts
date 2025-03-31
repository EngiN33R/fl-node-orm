import { IniLoadout, IniNpcShip } from "../ini-types";
import { IDataContext, IIniSection, INpc } from "../types";

export class NpcLoadoutModel implements INpc {
  public nickname!: string;
  public type = "npc" as const;

  public faction?: string;
  public level!: number;
  public ship!: string;
  public equipment!: Array<{
    equipment: string;
    hardpoint?: string;
  }>;
  public cargo!: Array<{
    equipment: string;
    count: number;
  }>;

  static async from(
    ctx: IDataContext,
    inputs: { def: IIniSection<IniNpcShip> }
  ) {
    const model = new NpcLoadoutModel();

    model.nickname = inputs.def.get("nickname");

    const loadout = ctx
      .ini<{ loadout: IniLoadout }>("loadouts")
      ?.findByNickname("loadout", inputs.def.get("loadout"));
    const faction = ctx
      .entity("faction")
      .findFirst((e) => e.npcShips?.includes(model.nickname) ?? false);

    if (!loadout) {
      return;
    }

    model.level = Number(inputs.def.get("level").replace("d", ""));
    model.faction = faction?.nickname;
    model.ship = inputs.def.get("ship_archetype");
    model.equipment = loadout
      .asArray("equip", true)
      .map(([equipment, hardpoint]) => ({
        equipment,
        hardpoint,
      }));
    model.cargo = loadout.asArray("cargo", true).map(([equipment, count]) => ({
      equipment,
      count,
    }));

    ctx.registerModel(model);
  }
}
