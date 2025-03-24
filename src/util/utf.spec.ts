import path from "path";
import { dumpUtf } from "./utf";

describe("utf", () => {
  it("should parse a test utf file", async () => {
    const file = path.join(__dirname, "mock", "DATA", "AUDIO", "test.utf");
    const records = await dumpUtf(file);
    expect(records["\\\\"]).toBeDefined();
    expect(records["0x8503E7CA"]).toBeDefined();
    expect(records["0x8503E7CA"].byteLength).toBeGreaterThan(0);
  });
});
