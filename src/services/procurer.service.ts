import {
  IniLoadout,
  IniLootProps,
  IniPhantomLootProps,
  IniShipGood,
  IniShipHullGood,
} from "../ini-types";
import {
  IDataContext,
  IProcurementQuerier,
  ProcurementDetails,
} from "../types";

/**
 * The Procurer service is responsible for determining the details
 * of how to procure a given piece of equipment or commodity.
 */
export class ProcurerService implements IProcurementQuerier {
  #ctx: IDataContext;

  constructor(ctx: IDataContext) {
    this.#ctx = ctx;
  }

  getProcurementDetails(nickname: string) {
    const results: ProcurementDetails[] = [];
    const equipment = this.#ctx.entity("equipment").findByNickname(nickname);

    if (!equipment) {
      return results;
    }

    // Find bases that sell the good
    const bases = this.#ctx.market.getBases(nickname);
    for (const baseNickname of bases) {
      const base = this.#ctx.entity("base").findByNickname(baseNickname);
      if (!base) {
        continue;
      }
      const good = this.#ctx.market.getGood(baseNickname, nickname);
      if (!good.sold) {
        continue;
      }
      results.push({
        type: "market",
        base: base.nickname,
        position: base.position,
        price: good.price,
        rep: good.rep,
        system: base.system,
      });
    }

    // Find ship packages that contain the equipment
    const shipGoods =
      this.#ctx
        .ini<{ good: IniShipGood }>("goods")
        ?.findAll(
          "good",
          (g) =>
            g.get("category") === "ship" &&
            g.asArray("addon", true).some((addon) => addon[0] === nickname)
        ) ?? [];
    for (const shipGood of shipGoods) {
      const shiphullGood = this.#ctx
        .ini<{ good: IniShipHullGood }>("goods")
        ?.findByNickname("good", shipGood.get("hull"));
      if (!shiphullGood) {
        continue;
      }
      const ship = shiphullGood.get("ship");
      if (!!this.#ctx.market.getSoldAt(ship)?.length) {
        results.push({
          type: "ship_package",
          ship,
        });
      }
    }

    // Find NPC loadouts that contain the equipment
    if (equipment.lootable) {
      const lootProps = this.#ctx
        .ini<{ mlootprops: IniLootProps }>("lootprops")
        ?.findByNickname("mlootprops", nickname);
      const npcLoadouts = this.#ctx
        .entity("npc")
        .findAll(
          (n) =>
            (n.equipment.some((e) => e.equipment === nickname) ||
              n.cargo.some((e) => e.equipment === nickname)) &&
            n.faction !== undefined
        );
      if (npcLoadouts.length > 0) {
        results.push({
          type: "npc_loot",
          loadout: npcLoadouts[0].nickname,
          faction: npcLoadouts[0].faction!,
          chance: (lootProps?.get("drop_properties")?.[0] ?? 0) / 100,
        });
      }
    }
    const phantomLootProps = this.#ctx
      .ini<{ phantomloot: IniPhantomLootProps }>("lootprops")
      ?.findByNickname("phantomloot", nickname);
    if (phantomLootProps) {
      results.push({
        type: "phantom_loot",
        chance: (phantomLootProps.get("percent_chance") ?? 0) / 100,
        min: phantomLootProps.get("num_to_drop")?.[0] ?? 0,
        max: phantomLootProps.get("num_to_drop")?.[1] ?? 0,
        minToughness: phantomLootProps.get("toughness_range")?.[0] ?? 0,
        maxToughness: phantomLootProps.get("toughness_range")?.[1] ?? 0,
      });
    }

    // Find wrecks that contain the equipment
    const wrecks = this.#ctx
      .entity("object")
      .findAll(
        (o) =>
          !!o.loadout &&
          (o.archetype.includes("surprise") || o.archetype.includes("suprise"))
      );
    for (const object of wrecks) {
      const loadout = this.#ctx
        .ini<{ loadout: IniLoadout }>("loadouts")
        ?.findByNickname("loadout", object.loadout!);
      const cargo = loadout?.asArray("cargo", true);
      if (
        cargo?.some(([equipment, count]) => equipment === nickname && count > 0)
      ) {
        results.push({
          type: "wreck_loot",
          object: object.nickname,
          position: object.position,
          system: object.system,
        });
      }
    }

    // Find zones that drop the equipment
    const zones = this.#ctx
      .entity("zone")
      .findAll((z) => z.loot?.equipment?.nickname === nickname);
    for (const zone of zones) {
      results.push({
        type: "mining",
        zone: zone.nickname,
        position: zone.position,
        system: zone.system,
        difficulty: zone.loot?.difficulty ?? 1,
      });
    }

    // Find crafting recipes that produce the equipment
    const craftingRecipes = this.#ctx
      .entity("crafting_recipe")
      .findAll((r) => r.product.good === nickname);
    for (const recipe of craftingRecipes) {
      results.push({
        type: "crafting",
        recipe,
      });
    }

    // Find lootboxes that contain the equipment
    const lootboxes = this.#ctx
      .entity("lootbox")
      .findAll((l) => l.items.some((i) => i.good === nickname));
    for (const lootbox of lootboxes) {
      results.push({
        type: "lootbox",
        box: lootbox.nickname,
        chance: lootbox.items.find((i) => i.good === nickname)?.chance ?? 0,
      });
    }

    return results;
  }
}
