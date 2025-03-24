import { Bitmask } from "./bitmask";

const VisitBitmask = Bitmask.define(
  [
    "ALWAYS_VISITED",
    "_",
    "MINEABLE",
    "ACTIVELY_VISITED",
    "WRECK",
    "ZONE",
    "FACTION",
    "ALWAYS_HIDDEN",
  ],
  "NOT_VISITED"
);

describe("Bitmask", () => {
  it("should create a bitmask", () => {
    const value = 5;
    const bitmask = VisitBitmask(value);
    expect(bitmask.hasAll("ALWAYS_VISITED", "MINEABLE")).toBe(true);
  });

  it("should create a bitmask with zero value", () => {
    const value = 0;
    const bitmask = VisitBitmask(value);
    expect(bitmask.has("NOT_VISITED")).toBe(true);
  });

  it("should serialize to JSON", () => {
    const value = 5;
    const bitmask = VisitBitmask(value);
    expect(JSON.stringify(bitmask)).toBe('["ALWAYS_VISITED","MINEABLE"]');
  });
});
