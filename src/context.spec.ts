import { DataContext } from "./context";

describe("DataContext", () => {
  describe("loading and parsing", () => {
    it("should load data", async () => {
      await DataContext.INSTANCE.init(process.env.FL_ROOT as string);
    });
  });
});
