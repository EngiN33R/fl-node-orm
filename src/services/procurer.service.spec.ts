import { ObjectVisitBitmask } from "../models/common";
import { ICraftingRecipe, IEquipment } from "../types";
import { DataContextBuilder } from "../util/testing";
import { ProcurerService } from "./procurer.service";

const MOCK_EQUIPMENT: IEquipment = {
  type: "equipment",
  nickname: "li_gun_laser_light01",
  kind: "gun",
  name: "Justice",
  infocard: "",
  icon: "laser_light.3db",
  hardpoint: "hp_gun_special_1",
  hitpoints: 100,
  mass: 100,
  volume: 100,
  class: "laser",
  lootable: true,
};

const MOCK_COMMODITY: IEquipment = {
  type: "equipment",
  nickname: "commodity_scrap_metal",
  kind: "commodity",
  class: "commodity",
  lootable: true,
  name: "Scrap Metal",
  infocard: "",
  icon: "scrap_metal.3db",
  hardpoint: "hp_commodity",
  hitpoints: 100,
  mass: 100,
  volume: 100,
};

describe("ProcurerService", () => {
  it("should get procurement details for equipment sold at a base", async () => {
    const ctx = DataContextBuilder.begin()
      .withEntity("equipment", MOCK_EQUIPMENT)
      .withEntity("base", {
        nickname: "li01_01",
        name: "Planet Manhattan",
        infocard: "",
        infocards: [],
        system: "li01",
        faction: "li_n_grp",
        objectNickname: "li01",
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        archetype: "base",
        visit: ObjectVisitBitmask.from(["DISCOVERED"]),
      })
      .withMarketOffer(
        "li01_01",
        "li_gun_laser_light01",
        {
          price: 100,
          sold: true,
          rep: 100,
          addons: [],
        },
        100
      )
      .build();

    const procurer = new ProcurerService(ctx);
    const details = await procurer.getProcurementDetails(
      "li_gun_laser_light01"
    );
    expect(details).toBeDefined();
    expect(details?.length).toBe(1);
    expect(details?.[0].type).toBe("market");
    if (details?.[0].type === "market") {
      expect(details[0].base).toBe("li01_01");
      expect(details[0].system).toBe("li01");
      expect(details[0].position).toEqual([0, 0, 0]);
    }
  });

  it("should get procurement details for equipment in an NPC loadout", async () => {
    const ctx = DataContextBuilder.begin()
      .withEntity("equipment", MOCK_EQUIPMENT)
      .withEntity("npc", {
        nickname: "li_npc_loadout_01",
        faction: "li_n_grp",
        equipment: [
          { equipment: "li_gun_laser_light01", hardpoint: "hp_gun_special_1" },
        ],
        ship: "ge_fighter_01",
        cargo: [],
        level: 1,
      })
      .build();

    const procurer = new ProcurerService(ctx);
    const details = await procurer.getProcurementDetails(
      "li_gun_laser_light01"
    );
    expect(details).toBeDefined();
    expect(details?.length).toBe(1);
    expect(details?.[0].type).toBe("npc_loot");
    if (details?.[0].type === "npc_loot") {
      expect(details[0].faction).toBe("li_n_grp");
      expect(details[0].loadout).toBe("li_npc_loadout_01");
    }
  });

  it("should not get procurement details for equipment in an NPC loadout if equipment is not lootable", async () => {
    const ctx = DataContextBuilder.begin()
      .withEntity("equipment", { ...MOCK_EQUIPMENT, lootable: false })
      .withEntity("npc", {
        nickname: "li_npc_loadout_01",
        faction: "li_n_grp",
        equipment: [
          { equipment: "li_gun_laser_light01", hardpoint: "hp_gun_special_1" },
        ],
        ship: "ge_fighter_01",
        cargo: [],
        level: 1,
      })
      .build();

    const procurer = new ProcurerService(ctx);
    const details = await procurer.getProcurementDetails(
      "li_gun_laser_light01"
    );
    expect(details).toBeDefined();
    expect(details?.length).toBe(0);
  });

  it("should get procurement details for equipment in wreck loot", async () => {
    const ctx = DataContextBuilder.begin()
      .withEntity("equipment", MOCK_EQUIPMENT)
      .withIni("loadouts", [
        [
          "loadout",
          {
            nickname: "SECRET_lr_pi_freighter_li01",
            equip: [],
            cargo: [["li_gun_laser_light01", 1]],
          },
        ],
      ])
      .withEntity("object", {
        nickname: "Li01_suprise_lr_pi_freighter_drugs",
        loadout: "SECRET_lr_pi_freighter_li01",
        archetype: "suprise_pi_freighter",
        system: "li01",
        name: "Wreck",
        infocard: "",
        position: [0, 0, 0],
        visit: ObjectVisitBitmask.from(["DISCOVERED"]),
      })
      .build();

    const procurer = new ProcurerService(ctx);
    const details = await procurer.getProcurementDetails(
      "li_gun_laser_light01"
    );
    expect(details).toBeDefined();
    expect(details?.length).toBe(1);
    expect(details?.[0].type).toBe("wreck_loot");
    if (details?.[0].type === "wreck_loot") {
      expect(details[0].object).toBe("Li01_suprise_lr_pi_freighter_drugs");
      expect(details[0].system).toBe("li01");
      expect(details[0].position).toEqual([0, 0, 0]);
    }
  });

  it("should get procurement details for craftable equipment", async () => {
    const MOCK_CRAFTING_RECIPE: ICraftingRecipe = {
      type: "crafting_recipe",
      nickname: "justice",
      product: {
        good: "li_gun_laser_light01",
        amount: 1,
      },
      ingredients: [
        {
          good: "commodity_scrap_metal",
          amount: 2,
        },
      ],
      bases: ["li01_01"],
      cost: 50,
    };

    const ctx = DataContextBuilder.begin()
      .withEntity("equipment", MOCK_EQUIPMENT)
      .withEntity("crafting_recipe", MOCK_CRAFTING_RECIPE)
      .build();

    const procurer = new ProcurerService(ctx);
    const details = await procurer.getProcurementDetails(
      "li_gun_laser_light01"
    );
    expect(details).toBeDefined();
    expect(details?.length).toBe(1);
    expect(details?.[0].type).toBe("crafting");
    if (details?.[0].type === "crafting") {
      expect(details[0].recipe).toMatchObject(MOCK_CRAFTING_RECIPE);
    }
  });

  it("should get procurement details for equipment in a lootbox", async () => {
    const ctx = DataContextBuilder.begin()
      .withEntity("equipment", MOCK_EQUIPMENT)
      .withEntity("lootbox", {
        nickname: "li_lootbox_01",
        items: [
          { good: "li_gun_laser_light01", chance: 0.1, weight: 1 },
          { good: "commodity_scrap_metal", chance: 0.9, weight: 9 },
        ],
      })
      .build();

    const procurer = new ProcurerService(ctx);
    const details = await procurer.getProcurementDetails(
      "li_gun_laser_light01"
    );
    expect(details).toBeDefined();
    expect(details?.length).toBe(1);
    expect(details?.[0].type).toBe("lootbox");
    if (details?.[0].type === "lootbox") {
      expect(details[0].box).toBe("li_lootbox_01");
      expect(details[0].chance).toBe(0.1);
    }
  });

  it("should get procurement details for commodity from mining", async () => {
    const ctx = DataContextBuilder.begin()
      .withEntity("equipment", MOCK_COMMODITY)
      .withEntity("zone", {
        nickname: "Zone_Li01_Jersey_debris_001",
        system: "li01",
        position: [0, 0, 0],
        name: "Jersey Debris Field",
        size: [10000, 10000, 10000],
        sort: 1,
        shape: "ellipsoid",
        infocard: "",
        loot: {
          commodity: "commodity_scrap_metal",
          equipment: MOCK_COMMODITY,
          count: [1, 10],
          difficulty: 5,
        },
      })
      .build();

    const procurer = new ProcurerService(ctx);
    const details = await procurer.getProcurementDetails(
      "commodity_scrap_metal"
    );
    expect(details).toBeDefined();
    expect(details?.length).toBe(1);
    expect(details?.[0].type).toBe("mining");
    if (details?.[0].type === "mining") {
      expect(details[0].zone).toBe("Zone_Li01_Jersey_debris_001");
      expect(details[0].system).toBe("li01");
      expect(details[0].position).toEqual([0, 0, 0]);
      expect(details[0].difficulty).toBe(5);
    }
  });
});
