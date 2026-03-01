import {
  IniEquipmentArmor,
  IniEquipmentBattery,
  IniEquipmentCloak,
  IniEquipmentCMAmmo,
  IniEquipmentCMDropper,
  IniEquipmentCommodity,
  IniEquipmentEngine,
  IniEquipmentGood,
  IniEquipmentGun,
  IniEquipmentMineAmmo,
  IniEquipmentMineDropper,
  IniEquipmentMunition,
  IniEquipmentNanobots,
  IniEquipmentPower,
  IniEquipmentScanner,
  IniEquipmentShape,
  IniEquipmentShield,
  IniEquipmentThruster,
  IniEquipmentTractor,
  IniShipHullGood,
  IniWeaponModDbType,
} from "../ini-types";
import { IDataContext, IEquipment, IGood, IIniSection } from "../types";

export type EquipmentSection =
  | IIniSection<IniEquipmentGun, "gun">
  | IIniSection<IniEquipmentMunition, "munition">
  | IIniSection<IniEquipmentCMDropper, "countermeasuredropper">
  | IIniSection<IniEquipmentCMAmmo, "countermeasure">
  | IIniSection<IniEquipmentEngine, "engine">
  | IIniSection<IniEquipmentArmor, "armor">
  | IIniSection<IniEquipmentCloak, "cloak">
  | IIniSection<IniEquipmentPower, "power">
  | IIniSection<IniEquipmentScanner, "scanner">
  | IIniSection<IniEquipmentShield, "shieldgenerator">
  | IIniSection<IniEquipmentThruster, "thruster">
  | IIniSection<IniEquipmentMineDropper, "minedropper">
  | IIniSection<IniEquipmentMineAmmo, "mine">
  | IIniSection<IniEquipmentTractor, "tractor">
  | IIniSection<IniEquipmentBattery, "shieldbattery">
  | IIniSection<IniEquipmentNanobots, "repairkit">
  | IIniSection<IniEquipmentCommodity, "commodity">;

export const PARSED_SECTION_KEYS = [
  "gun",
  "countermeasuredropper",
  "engine",
  "armor",
  "cloak",
  "power",
  "scanner",
  "shieldgenerator",
  "thruster",
  "minedropper",
  "tractor",
  "battery",
  "nanobots",
  "commodity",
] as const;

export class EquipmentModel implements IEquipment {
  public nickname!: string;
  public type = "equipment" as const;

  public name!: string;
  public infocard!: string;
  public icon!: string;

  public hardpoint?: string;
  public hitpoints!: number;
  public mass!: number;
  public volume!: number;
  public lootable!: boolean;

  public kind!: IEquipment["kind"];
  public class!: string;

  public gun?: IEquipment["gun"];
  public turret?: IEquipment["turret"];
  public missile?: IEquipment["missile"];
  public mine?: IEquipment["mine"];
  public cm?: IEquipment["cm"];
  public shield?: IEquipment["shield"];
  public power?: IEquipment["power"];
  public engine?: IEquipment["engine"];
  public thruster?: IEquipment["thruster"];
  public scanner?: IEquipment["scanner"];
  public tractor?: IEquipment["tractor"];
  public battery?: IEquipment["battery"];
  public nanobots?: IEquipment["nanobots"];
  public armor?: IEquipment["armor"];
  public cloak?: IEquipment["cloak"];
  public commodity?: IEquipment["commodity"];

  public good?: IGood;

  static async fromAll(ctx: IDataContext) {
    const equipment = ctx.ini<IniEquipmentShape>("equipment");
    for (const def of equipment?.findAll("gun") ?? []) {
      await EquipmentModel.from(ctx, {
        def,
      });
    }
    for (const def of equipment?.findAll("munition") ?? []) {
      await EquipmentModel.from(ctx, {
        def,
      });
    }
    for (const def of equipment?.findAll("countermeasuredropper") ?? []) {
      await EquipmentModel.from(ctx, {
        def,
      });
    }
    for (const def of equipment?.findAll("countermeasure") ?? []) {
      await EquipmentModel.from(ctx, {
        def,
      });
    }
    for (const def of equipment?.findAll("engine") ?? []) {
      await EquipmentModel.from(ctx, {
        def,
      });
    }
    for (const def of equipment?.findAll("armor") ?? []) {
      await EquipmentModel.from(ctx, {
        def,
      });
    }
    for (const def of equipment?.findAll("cloak") ?? []) {
      await EquipmentModel.from(ctx, {
        def,
      });
    }
    for (const def of equipment?.findAll("power") ?? []) {
      await EquipmentModel.from(ctx, {
        def,
      });
    }
    for (const def of equipment?.findAll("scanner") ?? []) {
      await EquipmentModel.from(ctx, {
        def,
      });
    }
    for (const def of equipment?.findAll("shieldgenerator") ?? []) {
      await EquipmentModel.from(ctx, {
        def,
      });
    }
    for (const def of equipment?.findAll("thruster") ?? []) {
      await EquipmentModel.from(ctx, {
        def,
      });
    }
    for (const def of equipment?.findAll("minedropper") ?? []) {
      await EquipmentModel.from(ctx, {
        def,
      });
    }
    for (const def of equipment?.findAll("mine") ?? []) {
      await EquipmentModel.from(ctx, {
        def,
      });
    }
    for (const def of equipment?.findAll("tractor") ?? []) {
      await EquipmentModel.from(ctx, {
        def,
      });
    }
    for (const def of equipment?.findAll("shieldbattery") ?? []) {
      await EquipmentModel.from(ctx, {
        def,
      });
    }
    for (const def of equipment?.findAll("repairkit") ?? []) {
      await EquipmentModel.from(ctx, {
        def,
      });
    }
    for (const def of equipment?.findAll("commodity") ?? []) {
      await EquipmentModel.from(ctx, {
        def,
      });
    }
    for (const def of equipment?.findAll("commodity") ?? []) {
      await EquipmentModel.from(ctx, {
        def,
      });
    }
  }

  static async from(
    ctx: IDataContext,
    {
      def,
    }: {
      def: EquipmentSection;
    },
  ) {
    const values = def.ini[1];

    const moddb = ctx.ini<{ weapontype: IniWeaponModDbType }>("weaponmoddb");
    const weaponMod = moddb?.findAll("weapontype");

    const equipment = ctx.ini<IniEquipmentShape>("equipment");
    const goods = ctx.ini<{ good: IniEquipmentGood }>("goods");
    const good = goods?.findFirst(
      "good",
      (s) => s.raw.equipment === values.nickname,
    );

    const model = new EquipmentModel();

    model.nickname = values.nickname;
    if ("ids_name" in values) {
      model.name = ctx.ids(values.ids_name);
      model.infocard = ctx.ids(values.ids_info);
    } else {
      model.name = values.nickname;
      model.infocard = "No information available.";
    }
    model.icon = (good?.get("item_icon") ?? "").replace(/\\/g, "/");
    if (model.icon && !ctx.binary(`${model.nickname}_icon`)) {
      try {
        const utf = await ctx.loadUtf(model.icon);
        ctx.registerBinary(
          `${model.nickname}_icon`,
          utf.get("Texture library")?.first()?.first()?.data,
        );
      } catch (e) {
        console.warn(`Failed to load item icon for ${model.nickname}: ${e}`);
      }
    }

    model.mass = "mass" in values ? values.mass : 0;
    model.volume = "volume" in values ? values.volume : 0;
    model.lootable = "lootable" in values ? values.lootable : false;

    if (def.ini[0] === "gun") {
      const gun = def.ini[1];
      const munition = equipment?.findFirst(
        "munition",
        (s) => s.get("nickname") === gun.projectile_archetype,
      );
      if (!munition) {
        return;
      }
      const motor = equipment?.findFirst(
        "motor",
        (s) => s.get("nickname") === munition.get("motor"),
      );
      const explosion = equipment?.findFirst(
        "explosion",
        (s) => s.get("nickname") === munition.get("explosion_arch"),
      );
      model.hardpoint = gun.hp_gun_type;
      model.kind = motor
        ? "missile"
        : model.hardpoint?.includes("turret")
          ? "turret"
          : "gun";
      let barrelCount = 1;
      const cmpPath = gun.da_archetype.replace(/\\/g, "/");
      if (cmpPath) {
        try {
          const gunUtf = await ctx.loadUtf(cmpPath);
          if (gunUtf) {
            barrelCount = new Set(
              gunUtf
                .listLeaves()
                .map((l) => l.fullPath.toLowerCase().match(/hpfire\d+/)?.[0])
                .filter(Boolean),
            ).size;
          }
        } catch (e) {
          // console.warn(
          //   `could not find da_archetype of ${gun.nickname} '${gun.da_archetype}'`,
          // );
        } finally {
          barrelCount ||= 1;
        }
      }
      if (model.kind === "missile") {
        model[model.kind] = {
          hullDamage: explosion!.get("hull_damage"),
          shieldDamage:
            explosion!.get("energy_damage") ||
            explosion!.get("hull_damage") / 2,
          refireRate: gun.refire_delay,
          seekRange: munition!.get("seeker_range")!,
          speed: gun.muzzle_velocity * 3,
          explosionRadius: explosion!.get("radius"),
          munitionTurnRate:
            (munition!.get("max_angular_velocity")! * 180) / Math.PI,
        };
      } else {
        const damageType = munition!.get("weapon_type")!;
        const multipliers = Object.fromEntries(
          weaponMod
            ?.find((s) => s.get("nickname") === damageType)
            ?.asArray("shield_mod", true) ?? [],
        );
        model[model.kind] = {
          powerUsage: gun.power_usage,
          hullDamage: munition!.get("hull_damage")! * barrelCount,
          barrelCount,
          shieldDamage:
            (munition!.get("energy_damage") ||
              munition!.get("hull_damage")! / 2) * barrelCount,
          refireRate: gun.refire_delay,
          damageType,
          multipliers,
          range: munition!.get("lifetime") * 600,
          speed: gun.muzzle_velocity,
          turnRate: gun.turn_rate,
        };
      }
    } else if (def.ini[0] === "countermeasuredropper") {
      const cm = def.ini[1];
      const countermeasure = equipment?.findFirst(
        "countermeasure",
        (s) => s.get("nickname") === cm.projectile_archetype,
      )!;
      model.hardpoint = "hp_countermeasure_dropper";
      model.kind = "cm";
      model.cm = {
        powerUsage: cm.power_usage,
        range: countermeasure.get("range"),
        diversion: countermeasure.get("diversion_pctg"),
        refireRate: cm.refire_delay,
        lifetime: countermeasure.get("lifetime"),
      };
    } else if (def.ini[0] === "cloak") {
      const cloak = def.ini[1];
      model.hardpoint = "hp_countermeasure_dropper";
      model.kind = "cloak";
      model.cloak = {
        powerUsage: cloak.power_usage,
      };
    } else if (def.ini[0] === "engine") {
      const engine = def.ini[1];
      model.hardpoint = engine.hp_type;
      model.kind = "engine";
      const multiplier = 600 / engine.linear_drag;
      model.engine = {
        speed: (engine.max_force / 600) * multiplier,
        maxForce: engine.max_force,
        linearDrag: engine.linear_drag,
        reverseSpeed:
          (engine.max_force / 600) * engine.reverse_fraction * multiplier,
        cruiseSpeed: engine.cruise_speed,
        thrusterMult: multiplier,
      };
    } else if (def.ini[0] === "armor") {
      const armor = def.ini[1];
      model.hardpoint = "hp_armor";
      model.kind = "armor";
      model.armor = {
        scale: armor.hit_pts_scale,
      };
    } else if (def.ini[0] === "power") {
      const power = def.ini[1];
      model.hardpoint = power.hp_type;
      model.kind = "power";
      model.power = {
        capacity: power.capacity,
        chargeRate: power.charge_rate,
        thrustCapacity: power.thrust_capacity,
        thrustChargeRate: power.thrust_charge_rate,
      };
    } else if (def.ini[0] === "scanner") {
      const scanner = def.ini[1];
      model.hardpoint = "hp_scanner";
      model.kind = "scanner";
      model.scanner = {
        range: scanner.range,
        cargoScanRange: scanner.cargo_scan_range,
      };
    } else if (def.ini[0] === "shieldgenerator") {
      const shield = def.ini[1];
      const shieldType = shield.shield_type;
      const resistances = Object.fromEntries(
        weaponMod
          ?.flatMap((s) =>
            s
              .asArray("shield_mod", true)
              .map(
                ([shieldType, multiplier]) =>
                  [s.get("nickname"), shieldType, multiplier] as [
                    weaponType: string,
                    shieldType: string,
                    multiplier: number,
                  ],
              ),
          )
          .filter(([, type]) => type === shieldType)
          .map(
            ([weaponType, , multiplier]) =>
              [weaponType, multiplier] as [string, number],
          ) ?? [],
      );
      model.hardpoint = shield.hp_type;
      model.kind = "shield";
      model.shield = {
        type: shieldType,
        resistances,
        capacity: shield.max_capacity,
        regeneration: shield.regeneration_rate,
        rebuildTime: shield.offline_rebuild_time,
        constantPowerUsage: shield.constant_power_draw,
        rebuildPowerUsage: shield.rebuild_power_draw,
      };
    } else if (def.ini[0] === "thruster") {
      const thruster = def.ini[1];
      model.hardpoint = "hp_thruster";
      model.kind = "thruster";
      model.thruster = {
        maxForce: thruster.max_force,
        speed: thruster.max_force / 600,
        powerUsage: thruster.power_usage,
      };
    } else if (def.ini[0] === "minedropper") {
      const dropper = def.ini[1];
      const mine = equipment?.findFirst(
        "mine",
        (s) => s.get("nickname") === dropper.projectile_archetype,
      )!;
      const explosion = equipment?.findFirst(
        "explosion",
        (s) => s.get("nickname") === mine.get("explosion_arch"),
      )!;
      model.hardpoint = "hp_mine_dropper";
      model.kind = "mine";
      model.mine = {
        speed: dropper.muzzle_velocity,
        seekRange: mine.get("seek_dist"),
        detonationDistance: mine.get("detonation_dist"),
        explosionRadius: dropper.explosion_resistance,
        refireRate: dropper.refire_delay,
        lifetime: mine.get("lifetime"),
        safeTime: mine.get("owner_safe_time"),
        hullDamage: explosion.get("hull_damage"),
        shieldDamage: explosion.get("energy_damage"),
      };
    } else if (def.ini[0] === "tractor") {
      const tractor = def.ini[1];
      model.hardpoint = "hp_tractor";
      model.kind = "tractor";
      model.tractor = {
        speed: tractor.max_length,
        range: tractor.reach_speed,
      };
    } else if (def.ini[0] === "shieldbattery") {
      const battery = def.ini[1];
      model.hardpoint = "hp_battery";
      model.kind = "battery";
      model.battery = {
        hitpoints: battery.hit_pts,
      };
    } else if (def.ini[0] === "repairkit") {
      const nanobots = def.ini[1];
      model.hardpoint = "hp_nanobots";
      model.kind = "nanobots";
      model.nanobots = {
        hitpoints: nanobots.hit_pts,
      };
    } else if (def.ini[0] === "commodity") {
      const commodity = def.ini[1];
      model.kind = "commodity";
      model.hardpoint = "hp_commodity";
      model.commodity = {
        decayPerSecond: commodity.decay_per_second,
        unitsPerContainer: commodity.units_per_container,
        podAppearance: commodity.pod_appearance,
        lootAppearance: commodity.loot_appearance,
      };
    } else if (def.ini[0] === "munition" && def.ini[1].requires_ammo) {
      model.kind = "ammo";
    } else if (def.ini[0] === "countermeasure") {
      model.kind = "cm_ammo";
    } else if (def.ini[0] === "mine") {
      model.kind = "mine_ammo";
    }

    const goodIni = ctx
      .ini<{ good: IniEquipmentGood }>("goods")
      ?.findFirst("good", (g) => g.get("equipment") === model.nickname);
    if (goodIni) {
      model.good = await GoodModel.from(ctx, {
        def: goodIni,
      });
    }

    ctx.registerModel(model);

    return model;
  }
}

export class GoodModel implements IGood {
  public nickname!: string;
  public type = "good" as const;

  public equipment!: string;
  public category!: "commodity" | "equipment";
  public price!: number;
  public combinable!: boolean;
  public goodSellPrice?: number;
  public badBuyPrice?: number;
  public badSellPrice?: number;
  public goodBuyPrice?: number;

  static async from(
    ctx: IDataContext,
    {
      def,
    }: {
      def: IIniSection<IniEquipmentGood, "good">;
    },
  ) {
    const model = new GoodModel();

    model.nickname = def.get("nickname");
    model.equipment = def.get("equipment");
    model.category = def.get("category");
    model.price = def.get("price");
    model.combinable = def.get("combinable");
    model.goodSellPrice = def.get("good_sell_price");
    model.badBuyPrice = def.get("bad_buy_price");
    model.badSellPrice = def.get("bad_sell_price");
    model.goodBuyPrice = def.get("good_buy_price");

    ctx.registerModel(model);
    if (def.get("item_icon")) {
      try {
        const itemIconUtf = await ctx.loadUtf(
          def.get("item_icon").replace(/\\/g, "/"),
        );
        const icon = itemIconUtf
          ?.listLeaves()
          .find(
            (l) =>
              l.path.includes("MIP") &&
              l.fullPath.toLowerCase().includes(".tga"),
          );
        if (icon) {
          ctx.registerBinary(model.nickname + "_icon", icon.data);
        }
      } catch (e) {
        console.warn(
          `Failed to load item icon for ${model.nickname}: ${e}`,
          (e as Error).stack,
        );
      }
    }

    return model;
  }
}
