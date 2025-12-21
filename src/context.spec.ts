import { DataContext } from "./context";
import { IDataContext } from "./types";

describe("DataContext", () => {
  let ctx: IDataContext;

  beforeAll(async () => {
    await DataContext.INSTANCE.init(process.env.FL_ROOT as string);
    ctx = DataContext.INSTANCE;
  });

  describe("loading and parsing", () => {
    it("should load data", async () => {
      expect(ctx.entity("faction").findAll().length).toBeGreaterThan(0);
      expect(ctx.entity("system").findAll().length).toBeGreaterThan(0);
    });

    it("should find faction by nickname", async () => {
      const faction = ctx.entity("faction").findByNickname("li_n_grp");
      expect(faction).toBeDefined();
      expect(faction?.nickname).toBe("li_n_grp");
    });

    it("should find system by nickname", async () => {
      const faction = ctx.entity("system").findByNickname("li01");
      expect(faction).toBeDefined();
      expect(faction?.nickname).toBe("li01");
    });

    it("should return navmap texture", async () => {
      const texture = ctx.utf("navmap", "Texture library\\fancymap.tga\\MIPS");
      expect(texture).toBeDefined();
      expect(texture?.byteLength).toBeGreaterThan(0);
    });

    it("should find commodity by nickname", async () => {
      const commodity = ctx
        .entity("equipment")
        .findByNickname("commodity_gold");
      expect(commodity).toBeDefined();
      expect(commodity?.nickname).toBe("commodity_gold");
    });
  });
});
