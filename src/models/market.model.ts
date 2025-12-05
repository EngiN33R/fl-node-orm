import {
  IniBaseGood,
  IniEquipmentGood,
  IniShipGood,
  IniShipHullGood,
} from "../ini-types";
import { IDataContext, IIniSection, IMarketQuerier } from "../types";
import { BiMapSet } from "../util/bimap";

type MapValue = {
  price: number;
  underlying: any;
  addons?: Array<{ equipment: string; hardpoint: string; count: number }>;
};

export class MarketModel implements IMarketQuerier {
  public nickname = "global_market";
  public type = "market" as const;

  #ctx: IDataContext;
  #map = new Map<string, MapValue>();
  #secondaryMap = new Map<string, MapValue>();
  #offers = new BiMapSet<string, any>();
  #meta = new Map<
    `${string}@${string}`,
    {
      price: number;
      sold: boolean;
      rep: number;
      addons?: Array<{ equipment: string; hardpoint: string; count: number }>;
    }
  >();

  constructor(ctx: IDataContext) {
    this.#ctx = ctx;
  }

  addOffers(basegood: IIniSection<IniBaseGood>) {
    if (!basegood.get("marketgood")) {
      return;
    }
    const nicknames = basegood
      .asArray("marketgood", true)
      .map(([good]) => good);
    this.#ctx
      .ini<{ good: IniEquipmentGood | IniShipGood }>("goods")
      ?.findAll("good", (s) => nicknames.includes(s.get("nickname")))
      .forEach((good) => {
        const values = good.raw;
        if ("equipment" in values) {
          const equipment = this.#ctx
            .entity("equipment")
            .findByNickname(values.equipment);
          if (!equipment) {
            return;
          }
          const value = {
            price: values.price,
            underlying: equipment,
          };
          this.#map.set(values.nickname, value);
          this.#secondaryMap.set(values.equipment, value);
        } else {
          const hull = this.#ctx
            .ini<{ good: IniShipHullGood }>("goods")
            ?.findByNickname("good", values.hull);
          if (!hull) {
            return;
          }
          const ship = this.#ctx
            .entity("ship")
            .findByNickname(hull.get("ship"));
          const value = {
            price: hull.get("price"),
            underlying: ship,
            addons: (good as IIniSection<IniShipGood>)
              .asArray("addon", true)
              .map(([equipment, hardpoint, count]) => ({
                equipment,
                hardpoint,
                count,
              })),
          };
          this.#map.set(values.nickname, value);
          this.#secondaryMap.set(hull.get("ship"), value);
        }
      });

    for (const [nickname, , rep, min, stock, , multiplier] of basegood.asArray(
      "marketgood",
      true
    )) {
      const good = this.#map.get(nickname);
      if (!good) {
        continue;
      }
      const { price: basePrice, underlying, addons } = good;
      const price = basePrice * multiplier;
      this.#offers.set(basegood.get("base"), underlying);
      this.#meta.set(`${underlying.nickname}@${basegood.get("base")}`, {
        price,
        sold: min > 0 && stock > 0,
        rep,
        addons,
      });
    }
  }

  getBases(equipment: string) {
    return [...(this.#offers.getReverse(equipment) ?? [])];
  }

  getPrice(base: string, equipment: string) {
    return Math.round(
      this.#meta.get(`${equipment}@${base}`)?.price ??
        this.#secondaryMap.get(equipment)?.price ??
        0
    );
  }

  getGood(base: string, equipment: string) {
    return {
      price: this.getPrice(base, equipment),
      basePrice: this.#map.get(equipment)?.price ?? 0,
      sold: this.#meta.get(`${equipment}@${base}`)?.sold ?? false,
      rep: this.#meta.get(`${equipment}@${base}`)?.rep ?? -1,
    };
  }

  getGoods(base: string) {
    return [...(this.#offers.get(base) ?? [])].map((e) => ({
      equipment: e,
      ...this.getGood(base, e.nickname),
    }));
  }

  getSoldAt(equipment: string) {
    const sold: string[] = [];
    for (const base of this.getBases(equipment)) {
      if (this.#meta.get(`${equipment}@${base}`)?.sold) {
        sold.push(base);
      }
    }
    return sold;
  }
}
