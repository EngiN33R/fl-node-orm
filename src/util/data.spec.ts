import { parseSystemRange } from "./data";

describe("misc data format parsing", () => {
  describe("parseSystemRange", () => {
    it("should parse well-formed range", () => {
      const range = "li01-05";
      const systems = parseSystemRange(range);
      expect(systems).toEqual(["li01", "li02", "li03", "li04", "li05"]);
    });

    it("should parse abbreviated range", () => {
      const range = "li01-5";
      const systems = parseSystemRange(range);
      expect(systems).toEqual(["li01", "li02", "li03", "li04", "li05"]);
    });
  });
});
