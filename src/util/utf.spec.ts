import path from "path";
import { parseUtf } from "./utf";

describe("utf", () => {
  it("should parse a 3db file", async () => {
    const file = path.join(
      process.env.FL_ROOT as string,
      "DATA/INTERFACE/NEURONET/NAVMAP/NEWNAVMAP/nav_prettymap.3db"
    );
    const records = await parseUtf(file);
    expect(records.path).toBe("\\");
    expect(records.children["Texture library"]).toBeDefined();
    expect(
      records.get("Texture library\\fancymap.tga\\MIPS")?.data
    ).toBeDefined();
  });
});
