import { IniBaseGood, IniGood } from "../ini-types";
import { IDataContext, IIniSection, IMarketQuerier } from "../types";
import { BiMapSet } from "../util/bimap";

export class MarketModel implements IMarketQuerier {
  public nickname = "global_market";
  public type = "market" as const;

  #ctx: IDataContext;
  #goods = new Map<string, IIniSection<IniGood, "good">>();
  #equipmentGoods = new Map<string, IIniSection<IniGood, "good">>();
  #offers = new BiMapSet<string, string>();
  #meta = new Map<
    `${string}@${string}`,
    { price: number; sold: boolean; rep: number }
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
      .ini<{ good: IniGood }>("goods")
      ?.findAll("good", (s) => nicknames.includes(s.get("nickname")))
      .forEach((good) => {
        this.#goods.set(good.get("nickname"), good);
        this.#equipmentGoods.set(good.get("equipment"), good);
      });

    for (const [nickname, , rep, min, stock, , multiplier] of basegood.asArray(
      "marketgood",
      true
    )) {
      const good = this.#goods.get(nickname)!;
      const price = good.get("price") * multiplier;
      this.#offers.set(basegood.get("base"), good.get("equipment"));
      this.#meta.set(`${good.get("equipment")}@${basegood.get("base")}`, {
        price,
        sold: min > 0 && stock > 0,
        rep,
      });
    }
  }

  getBases(equipment: string) {
    return [...(this.#offers.getReverse(equipment) ?? [])];
  }

  getPrice(base: string, equipment: string) {
    return (
      this.#meta.get(`${equipment}@${base}`)?.price ??
      this.#equipmentGoods.get(equipment)?.get("price") ??
      0
    );
  }

  getGood(base: string, equipment: string) {
    return {
      price: this.getPrice(base, equipment),
      sold: this.#meta.get(`${equipment}@${base}`)?.sold ?? false,
      rep: this.#meta.get(`${equipment}@${base}`)?.rep ?? -1,
    };
  }

  getGoods(base: string) {
    return [...(this.#offers.get(base) ?? [])].map((e) => ({
      equipment: e,
      ...this.getGood(base, e),
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
