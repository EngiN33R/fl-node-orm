import { createHashId } from "./hash";

describe("hash", () => {
  it("should create the correct hash id", async () => {
    const hash = createHashId("gcs_refer_base_Li05_01_base-");
    expect(hash).toBe("0x8503E7CA");
  });
});
