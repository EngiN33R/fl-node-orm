import path from "path";
import { parseIni } from "../src/util/ini";

describe("INI parser", () => {
  it("should parse a system INI file", async () => {
    const result = await parseIni(
      path.join(
        __dirname,
        "mock",
        "DATA",
        "UNIVERSE",
        "SYSTEMS",
        "BW11",
        "bw11.ini"
      )
    );
    console.log(
      result.find(
        ([name, value]) =>
          name === "zone" && value.nickname === "zone_bw011_pop_ambient"
      )?.[1].faction
    );
  });
});
