import path from "path";
import { ResourceDll } from "./resourcedll";

describe("ResourceDll", () => {
  it("should parse dll file", async () => {
    const dll = await ResourceDll.fromFile(
      path.join(__dirname, "mock", "EXE", "test.dll")
    );

    expect(dll.strings.size).toBeGreaterThan(0);
    expect(dll.infocards.size).toBeGreaterThan(0);
  });
});
