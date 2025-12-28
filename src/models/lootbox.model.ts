import { IniLootBox } from "../ini-types";
import { IDataContext, IIniSection, ILootBox } from "../types";

export class LootBoxModel implements ILootBox {
  public nickname!: string;
  public type = "lootbox" as const;

  public items!: Array<{
    good: string;
    chance: number;
    weight: number;
  }>;

  static async from(
    ctx: IDataContext,
    inputs: { lootbox: IIniSection<IniLootBox> }
  ) {
    const lootbox = new LootBoxModel();

    lootbox.nickname = inputs.lootbox.get("box_nickname");
    const items = inputs.lootbox.asArray("loot_item", true);
    const totalWeight = items.reduce(
      (acc, [_, weight]) => acc + Number(weight),
      0
    );
    lootbox.items = inputs.lootbox
      .asArray("loot_item", true)
      .map(([good, weight]) => ({
        good,
        chance: Number(weight) / totalWeight,
        weight: Number(weight),
      }));

    ctx.registerModel(lootbox);

    return lootbox;
  }
}
