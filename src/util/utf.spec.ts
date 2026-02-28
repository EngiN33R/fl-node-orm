import path from "path";
import { parseUtf } from "./utf";

describe("utf", () => {
  it("should parse a 3db file", async () => {
    const file = path.join(
      process.env.FL_ROOT as string,
      "DATA/INTERFACE/NEURONET/NAVMAP/NEWNAVMAP/nav_prettymap.3db",
    );
    const records = await parseUtf(file);
    expect(records.path).toBe("\\");
    expect(records.children["Texture library"]).toBeDefined();
    expect(
      records.get("Texture library\\fancymap.tga\\MIPS")?.data,
    ).toBeDefined();
  });

  it("should parse a cmp file", async () => {
    const file = path.join(
      path.join(__dirname, "mock"),
      "DATA/EQUIPMENT/MODELS/TURRET/rh_turret01.cmp",
    );
    const records = await parseUtf(file);
    const childNames = Object.keys(records.children);
    expect(childNames).toHaveLength(5);
    expect(childNames).toContain("VMeshLibrary");
    expect(childNames).toContain("barrel021119204130.3db");
    expect(childNames).toContain("base021119204130.3db");
    expect(childNames).toContain("Cmpnd");
    expect(childNames).toContain("Exporter Version");

    // Exporter Version should be a leaf with data
    const exporterVersion = records.children["Exporter Version"];
    expect(exporterVersion.data).toBeDefined();
    expect(Object.keys(exporterVersion.children)).toHaveLength(0);

    // Cmpnd should be an intermediate node with children
    const cmpnd = records.children["Cmpnd"];
    expect(Object.keys(cmpnd.children).length).toBeGreaterThan(0);
  });
});
