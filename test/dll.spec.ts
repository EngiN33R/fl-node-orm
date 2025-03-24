import path from "path";
import { ResourceDll } from "../src/util/resourcedll";

describe("ResourceDll", () => {
  it("should parse dll file", async () => {
    const dll = await ResourceDll.fromFile(
      path.join(__dirname, "mock", "EXE", "EngiModResources.dll")
    );

    console.log(dll.strings);
    console.log(dll.infocards);
  });
});
