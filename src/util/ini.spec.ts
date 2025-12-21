import path from "path";
import { parseIni } from "./ini";

describe("INI parser", () => {
  it("should parse a system INI file", async () => {
    const result = await parseIni(
      path.join(
        __dirname,
        "mock",
        "DATA",
        "UNIVERSE",
        "SYSTEMS",
        "LI01",
        "li01.ini"
      )
    );
    expect(
      result.find(
        ([name, value]) =>
          name === "zone" && value.nickname === "zone_li01_badlands_nebula"
      )?.[1]?.faction
    ).toEqual(["fc_lr_grp", 1]);
  });
});
