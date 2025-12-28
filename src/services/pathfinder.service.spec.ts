import { ObjectVisitBitmask, ZoneVisitBitmask } from "../models/common";
import { IObject, Model } from "../types";
import { DataContextBuilder } from "../util/testing";
import { PathfinderService } from "./pathfinder.service";

// X = Player
// { # } = Jump Gate
// ( # ) = Jump Hole
// T = Tradelane
// Each square is 10x10 units
// SYSTEM 1
// |   | A | B | C | D | E | F |
// | 1 | X |   |   |   ( 2 )   |
// | 2 |   | T |   |   |   |   |
// | 3 |   | T |   |   |   |   |
// | 4 |   | T |   |   |   |   |
// | 5 |   | T |   |   |   |   |
// | 6 |   | T { 2 }   |   |   |
// SYSTEM 2
// |   | A | B | C | D | E | F |
// | 1 | T | T | T | T | T { 1 }
// | 2 |   |   |   |   |   |   |
// | 3 |   |   |   |   |   |   |
// | 4 |   |   |   |   |   |   |
// | 5 |   |   |   |   |   |   |
// | 6 ( 1 )   |   ( 3 )   |   |
// SYSTEM 3
// |   | A | B | C | D | E | F |
// | 1 |   |   |   ( 2 )   |   |
// | 2 |   |   |   |   |   | T |
// | 3 |   |   |   |   |   | T |
// | 4 |   |   |   |   |   | T |
// | 5 |   |   |   |   |   | T |
// | 6 |   | T | T | T | T |   |

const MOCK_CONTEXT = DataContextBuilder.begin()
  .with((ctx) => {
    const JUMPGATE_1_2: IObject = {
      type: "object",
      nickname: "jumpgate_1_2",
      name: "1->2 Gate",
      infocard: "",
      position: [20, 50, 0],
      system: "system_1",
      archetype: "jumpgate",
      visit: ObjectVisitBitmask.from(["DISCOVERED"]),
      faction: "li_n_grp",
      goto: {
        system: "system_2",
        object: "jumpgate_2_1",
        effect: "jump_effect_bretonia",
      },
    };
    ctx.registerModel(JUMPGATE_1_2);
    const JUMPHOLE_1_2: IObject = {
      type: "object",
      nickname: "jumphole_1_2",
      name: "1->2 Hole",
      infocard: "",
      position: [40, 0, 0],
      system: "system_1",
      archetype: "jumphole",
      visit: ObjectVisitBitmask.from(["DISCOVERED"]),
      goto: {
        system: "system_2",
        object: "jumphole_2_1",
        effect: "jump_effect_bretonia",
      },
    };
    ctx.registerModel(JUMPHOLE_1_2);
    const TRADELANE_1: IObject[] = [];
    for (let y = 10; y <= 50; y += 10) {
      const tradelane: IObject = {
        type: "object",
        nickname: `tradelane_1_10_${y}`,
        name: `Trade Lane 1`,
        nextRing: y + 10 <= 50 ? `tradelane_1_10_${y + 10}` : undefined,
        prevRing: y - 10 >= 10 ? `tradelane_1_10_${y - 10}` : undefined,
        infocard: "",
        position: [10, y, 0],
        system: "system_1",
        archetype: "tradelane",
        visit: ObjectVisitBitmask.from(["DISCOVERED"]),
        faction: "li_n_grp",
      };
      TRADELANE_1.push(tradelane);
    }
    ctx.registerModel({
      type: "system",
      nickname: "system_1",
      name: "System 1",
      infocard: "",
      territory: "Liberty",
      position: [0, 0],
      size: 2.5,
      visit: ZoneVisitBitmask.from(["ALWAYS_VISITED"]),
      bases: [],
      connections: [
        {
          system: "system_2",
          type: "jumpgate",
          faction: "li_n_grp",
        },
        {
          system: "system_2",
          type: "jumphole",
        },
      ],
      tradelanes: [
        {
          startPosition: [10, 10, 0],
          endPosition: [10, 50, 0],
          rings: TRADELANE_1,
          faction: "li_n_grp",
        },
      ],
      objects: [JUMPGATE_1_2, JUMPHOLE_1_2],
      zones: [],
    });
  })
  .with((ctx) => {
    const JUMPGATE_2_1: IObject = {
      type: "object",
      nickname: "jumpgate_2_1",
      name: "2->1",
      infocard: "",
      position: [50, 0, 0],
      system: "system_2",
      archetype: "jumpgate",
      visit: ObjectVisitBitmask.from(["DISCOVERED"]),
      faction: "li_n_grp",
      goto: {
        system: "system_1",
        object: "jumpgate_1_2",
        effect: "jump_effect_bretonia",
      },
    };
    ctx.registerModel(JUMPGATE_2_1);
    const JUMPHOLE_2_1: IObject = {
      type: "object",
      nickname: "jumphole_2_1",
      name: "2->1 Hole",
      infocard: "",
      position: [0, 50, 0],
      system: "system_2",
      archetype: "jumphole",
      visit: ObjectVisitBitmask.from(["DISCOVERED"]),
    };
    ctx.registerModel(JUMPHOLE_2_1);
    const JUMPHOLE_2_3: IObject = {
      type: "object",
      nickname: "jumphole_2_3",
      name: "2->3 Hole",
      infocard: "",
      position: [30, 50, 0],
      system: "system_2",
      archetype: "jumphole",
      visit: ObjectVisitBitmask.from(["DISCOVERED"]),
      goto: {
        system: "system_3",
        object: "jumphole_3_2",
        effect: "jump_effect_bretonia",
      },
    };
    ctx.registerModel(JUMPHOLE_2_3);
    const TRADELANE_2: IObject[] = [];
    for (let x = 0; x <= 40; x += 10) {
      const tradelane: IObject = {
        type: "object",
        nickname: `tradelane_2_${x}_0`,
        name: `Trade Lane 2`,
        infocard: "",
        position: [x, 0, 0],
        system: "system_2",
        nextRing: x + 10 <= 40 ? `tradelane_2_${x + 10}_0` : undefined,
        prevRing: x - 10 >= 0 ? `tradelane_2_${x - 10}_0` : undefined,
        archetype: "tradelane",
        visit: ObjectVisitBitmask.from(["DISCOVERED"]),
        faction: "li_n_grp",
      };
      TRADELANE_2.push(tradelane);
    }
    ctx.registerModel({
      type: "system",
      nickname: "system_2",
      name: "System 2",
      infocard: "",
      territory: "Liberty",
      position: [2, 0],
      size: 2.5,
      visit: ZoneVisitBitmask.from(["ALWAYS_VISITED"]),
      connections: [
        {
          system: "system_1",
          type: "jumpgate",
          faction: "li_n_grp",
        },
        {
          system: "system_1",
          type: "jumphole",
        },
        {
          system: "system_3",
          type: "jumphole",
        },
      ],
      tradelanes: [
        {
          startPosition: [0, 0, 0],
          endPosition: [40, 0, 0],
          rings: TRADELANE_2,
          faction: "li_n_grp",
        },
      ],
      zones: [],
      objects: [JUMPGATE_2_1, JUMPHOLE_2_1, JUMPHOLE_2_3],
      bases: [],
    });
  })
  .with((ctx) => {
    const JUMPHOLE_3_2: IObject = {
      type: "object",
      nickname: "jumphole_3_2",
      name: "3->2 Hole",
      infocard: "",
      position: [30, 0, 0],
      system: "system_3",
      archetype: "jumphole",
      visit: ObjectVisitBitmask.from(["DISCOVERED"]),
      goto: {
        system: "system_2",
        object: "jumphole_2_3",
        effect: "jump_effect_bretonia",
      },
    };
    ctx.registerModel(JUMPHOLE_3_2);
    const TRADELANE_3A: IObject[] = [];
    for (let y = 10; y <= 40; y += 10) {
      const tradelane: IObject = {
        type: "object",
        nickname: `tradelane_3a_50_${y}`,
        name: `Trade Lane 3A`,
        nextRing: y + 10 <= 50 ? `tradelane_3a_50_${y + 10}` : undefined,
        prevRing: y - 10 >= 10 ? `tradelane_3a_50_${y - 10}` : undefined,
        infocard: "",
        position: [50, y, 0],
        system: "system_3",
        archetype: "tradelane",
        visit: ObjectVisitBitmask.from(["DISCOVERED"]),
        faction: "li_n_grp",
      };
      TRADELANE_3A.push(tradelane);
    }
    const TRADELANE_3B: IObject[] = [];
    for (let x = 40; x >= 10; x -= 10) {
      const tradelane: IObject = {
        type: "object",
        nickname: `tradelane_3b_${x}_50`,
        name: `Trade Lane 3B`,
        nextRing: x - 10 >= 10 ? `tradelane_3b_${x - 10}_50` : undefined,
        prevRing: x + 10 <= 40 ? `tradelane_3b_${x + 10}_50` : undefined,
        infocard: "",
        position: [x, 50, 0],
        system: "system_3",
        archetype: "tradelane",
        visit: ObjectVisitBitmask.from(["DISCOVERED"]),
        faction: "li_n_grp",
      };
      TRADELANE_3B.push(tradelane);
    }
    ctx.registerModel({
      type: "system",
      nickname: "system_3",
      name: "System 3",
      infocard: "",
      territory: "Liberty",
      position: [4, 0],
      size: 2.5,
      visit: ZoneVisitBitmask.from(["ALWAYS_VISITED"]),
      connections: [
        {
          system: "system_2",
          type: "jumphole",
        },
      ],
      tradelanes: [
        {
          startPosition: [50, 10, 0],
          endPosition: [50, 50, 0],
          rings: TRADELANE_3A,
          faction: "li_n_grp",
        },
        {
          startPosition: [40, 50, 0],
          endPosition: [10, 50, 0],
          rings: TRADELANE_3B,
          faction: "li_n_grp",
        },
      ],
      zones: [],
      objects: [JUMPHOLE_3_2],
      bases: [],
    });
  })
  .build();

describe("PathfinderService", () => {
  let pathfinder: PathfinderService;

  beforeEach(() => {
    pathfinder = new PathfinderService(MOCK_CONTEXT);
    pathfinder.cruiseSpeed = 1;
    pathfinder.tradelaneSpeed = 5;
  });

  describe("findPotentialJumps", () => {
    it("should return all potential jumps if no flags are provided", () => {
      const result = pathfinder.findPotentialJumps("system_1", "system_2");
      expect(result).toEqual([
        {
          type: "jump",
          from: {
            position: [20, 50, 0],
            system: "system_1",
            object: "jumpgate_1_2",
            faction: "li_n_grp",
          },
          to: {
            position: [50, 0, 0],
            system: "system_2",
            object: "jumpgate_2_1",
            faction: "li_n_grp",
          },
          duration: 0,
        },
        {
          type: "jump",
          from: {
            position: [40, 0, 0],
            system: "system_1",
            object: "jumphole_1_2",
          },
          to: {
            position: [0, 50, 0],
            system: "system_2",
            object: "jumphole_2_1",
          },
          duration: 0,
        },
      ]);
    });

    it("should return only jumpholes if the NO_JUMPGATE flag is provided", () => {
      const result = pathfinder.findPotentialJumps("system_1", "system_2", [
        "NO_JUMPGATE",
      ]);
      expect(result).toEqual([
        {
          type: "jump",
          from: {
            position: [40, 0, 0],
            system: "system_1",
            object: "jumphole_1_2",
          },
          to: {
            position: [0, 50, 0],
            system: "system_2",
            object: "jumphole_2_1",
          },
          duration: 0,
        },
      ]);
    });

    it("should return only jumpgates if the NO_JUMPHOLE flag is provided", () => {
      const result = pathfinder.findPotentialJumps("system_1", "system_2", [
        "NO_JUMPHOLE",
      ]);
      expect(result).toEqual([
        {
          type: "jump",
          from: {
            position: [20, 50, 0],
            system: "system_1",
            object: "jumpgate_1_2",
            faction: "li_n_grp",
          },
          to: {
            position: [50, 0, 0],
            system: "system_2",
            object: "jumpgate_2_1",
            faction: "li_n_grp",
          },
          duration: 0,
        },
      ]);
    });
  });

  describe("findPath", () => {
    it("should find a direct path with no objects", () => {
      const result = pathfinder.findPath(
        {
          position: [0, 0, 0],
          system: "system_1",
        },
        {
          position: [10, 0, 0],
          system: "system_1",
        }
      );

      expect(result).toEqual([
        {
          type: "cruise",
          from: { position: [0, 0, 0], system: "system_1" },
          to: { position: [10, 0, 0], system: "system_1" },
          duration: 10 / pathfinder.cruiseSpeed,
        },
      ]);
    });

    it("should find a direct path to a specified object", () => {
      const result = pathfinder.findPath(
        {
          position: [0, 0, 0],
          system: "system_1",
        },
        {
          position: [40, 0, 0],
          system: "system_1",
          object: "jumphole_1_2",
        }
      );

      expect(result).toEqual([
        {
          type: "cruise",
          from: { position: [0, 0, 0], system: "system_1" },
          to: {
            position: [40, 0, 0],
            system: "system_1",
            object: "jumphole_1_2",
          },
          duration: 40 / pathfinder.cruiseSpeed,
        },
      ]);
    });

    it("should prefer a path through a tradelane", () => {
      const result = pathfinder.findPath(
        {
          position: [0, 0, 0],
          system: "system_1",
        },
        {
          position: [20, 50, 0],
          system: "system_1",
          object: "jumpgate_1_2",
          faction: "li_n_grp",
        }
      );

      expect(result).toEqual([
        {
          type: "cruise",
          from: { position: [0, 0, 0], system: "system_1" },
          to: {
            position: [10, 10, 0],
            system: "system_1",
            faction: "li_n_grp",
            object: "tradelane_1_10_10",
          },
          duration: Math.sqrt(10 ** 2 + 10 ** 2) / pathfinder.cruiseSpeed,
        },
        {
          type: "tradelane",
          from: {
            position: [10, 10, 0],
            system: "system_1",
            faction: "li_n_grp",
            object: "tradelane_1_10_10",
          },
          to: {
            position: [10, 50, 0],
            system: "system_1",
            faction: "li_n_grp",
            object: "tradelane_1_10_50",
          },
          duration: 40 / pathfinder.tradelaneSpeed,
        },
        {
          type: "cruise",
          from: {
            position: [10, 50, 0],
            system: "system_1",
            faction: "li_n_grp",
            object: "tradelane_1_10_50",
          },
          to: {
            position: [20, 50, 0],
            system: "system_1",
            object: "jumpgate_1_2",
            faction: "li_n_grp",
          },
          duration: 10 / pathfinder.cruiseSpeed,
        },
      ]);
    });

    it("should find a path along a tradelane aborting midway", () => {
      const result = pathfinder.findPath(
        {
          position: [0, 0, 0],
          system: "system_1",
        },
        {
          position: [20, 30, 0],
          system: "system_1",
        }
      );

      expect(result).toEqual([
        {
          type: "cruise",
          from: { position: [0, 0, 0], system: "system_1" },
          to: {
            position: [10, 10, 0],
            system: "system_1",
            faction: "li_n_grp",
            object: "tradelane_1_10_10",
          },
          duration: Math.sqrt(10 ** 2 + 10 ** 2) / pathfinder.cruiseSpeed,
        },
        {
          type: "tradelane",
          from: {
            position: [10, 10, 0],
            system: "system_1",
            faction: "li_n_grp",
            object: "tradelane_1_10_10",
          },
          to: {
            position: [10, 30, 0],
            system: "system_1",
            faction: "li_n_grp",
            object: "tradelane_1_10_30",
          },
          duration: 20 / pathfinder.tradelaneSpeed,
        },
        {
          type: "cruise",
          from: {
            position: [10, 30, 0],
            system: "system_1",
            faction: "li_n_grp",
            object: "tradelane_1_10_30",
          },
          to: { position: [20, 30, 0], system: "system_1" },
          duration: 10 / pathfinder.cruiseSpeed,
        },
      ]);
    });

    it("should find a path through a jumpgate", () => {
      const result = pathfinder.findPath(
        {
          position: [0, 0, 0],
          system: "system_1",
        },
        {
          position: [50, 10, 0],
          system: "system_2",
        }
      );

      expect(result).toEqual([
        {
          type: "cruise",
          from: { position: [0, 0, 0], system: "system_1" },
          to: {
            position: [10, 10, 0],
            system: "system_1",
            faction: "li_n_grp",
            object: "tradelane_1_10_10",
          },
          duration: Math.sqrt(10 ** 2 + 10 ** 2) / pathfinder.cruiseSpeed,
        },
        {
          type: "tradelane",
          from: {
            position: [10, 10, 0],
            system: "system_1",
            faction: "li_n_grp",
            object: "tradelane_1_10_10",
          },
          to: {
            position: [10, 50, 0],
            system: "system_1",
            faction: "li_n_grp",
            object: "tradelane_1_10_50",
          },
          duration: 8, // distance 40 / speed 5
        },
        {
          type: "cruise",
          from: {
            position: [10, 50, 0],
            system: "system_1",
            faction: "li_n_grp",
            object: "tradelane_1_10_50",
          },
          to: {
            position: [20, 50, 0],
            system: "system_1",
            object: "jumpgate_1_2",
            faction: "li_n_grp",
          },
          duration: 10, // distance 10 / speed 1
        },
        {
          type: "jump",
          from: {
            position: [20, 50, 0],
            system: "system_1",
            object: "jumpgate_1_2",
            faction: "li_n_grp",
          },
          to: {
            position: [50, 0, 0],
            system: "system_2",
            object: "jumpgate_2_1",
            faction: "li_n_grp",
          },
          duration: 0,
        },
        {
          type: "cruise",
          from: {
            position: [50, 0, 0],
            system: "system_2",
            object: "jumpgate_2_1",
            faction: "li_n_grp",
          },
          to: { position: [50, 10, 0], system: "system_2" },
          duration: 10, // distance 10 / speed 1
        },
      ]);
    });

    it("should find a path through a jumpgate and abort along a tradelane", () => {
      const result = pathfinder.findPath(
        {
          position: [0, 0, 0],
          system: "system_1",
        },
        {
          position: [20, 10, 0],
          system: "system_2",
        }
      );

      expect(result).toEqual([
        {
          type: "cruise",
          from: { position: [0, 0, 0], system: "system_1" },
          to: {
            position: [10, 10, 0],
            system: "system_1",
            faction: "li_n_grp",
            object: "tradelane_1_10_10",
          },
          duration: Math.sqrt(200), // distance ~14.14 / speed 1
        },
        {
          type: "tradelane",
          from: {
            position: [10, 10, 0],
            system: "system_1",
            faction: "li_n_grp",
            object: "tradelane_1_10_10",
          },
          to: {
            position: [10, 50, 0],
            system: "system_1",
            faction: "li_n_grp",
            object: "tradelane_1_10_50",
          },
          duration: 40 / pathfinder.tradelaneSpeed,
        },
        {
          type: "cruise",
          from: {
            position: [10, 50, 0],
            system: "system_1",
            faction: "li_n_grp",
            object: "tradelane_1_10_50",
          },
          to: {
            position: [20, 50, 0],
            system: "system_1",
            object: "jumpgate_1_2",
            faction: "li_n_grp",
          },
          duration: 10 / pathfinder.cruiseSpeed,
        },
        {
          type: "jump",
          from: {
            position: [20, 50, 0],
            system: "system_1",
            object: "jumpgate_1_2",
            faction: "li_n_grp",
          },
          to: {
            position: [50, 0, 0],
            system: "system_2",
            object: "jumpgate_2_1",
            faction: "li_n_grp",
          },
          duration: 0,
        },
        {
          type: "cruise",
          from: {
            position: [50, 0, 0],
            system: "system_2",
            object: "jumpgate_2_1",
            faction: "li_n_grp",
          },
          to: {
            position: [40, 0, 0],
            system: "system_2",
            object: "tradelane_2_40_0",
            faction: "li_n_grp",
          },
          duration: 10 / pathfinder.cruiseSpeed,
        },
        {
          type: "tradelane",
          from: {
            position: [40, 0, 0],
            system: "system_2",
            object: "tradelane_2_40_0",
            faction: "li_n_grp",
          },
          to: {
            position: [20, 0, 0],
            system: "system_2",
            object: "tradelane_2_20_0",
            faction: "li_n_grp",
          },
          duration: 20 / pathfinder.tradelaneSpeed,
        },
        {
          type: "cruise",
          from: {
            position: [20, 0, 0],
            system: "system_2",
            object: "tradelane_2_20_0",
            faction: "li_n_grp",
          },
          to: { position: [20, 10, 0], system: "system_2" },
          duration: 10 / pathfinder.cruiseSpeed,
        },
      ]);
    });

    it("should find a path through an intermediate system", () => {
      const result = pathfinder.findPath(
        {
          position: [0, 0, 0],
          system: "system_1",
        },
        {
          position: [30, 20, 0],
          system: "system_3",
        }
      );

      expect(result).toEqual([
        {
          type: "cruise",
          from: { position: [0, 0, 0], system: "system_1" },
          to: {
            position: [10, 10, 0],
            system: "system_1",
            faction: "li_n_grp",
            object: "tradelane_1_10_10",
          },
          duration: Math.sqrt(10 ** 2 + 10 ** 2) / pathfinder.cruiseSpeed,
        },
        {
          type: "tradelane",
          from: {
            position: [10, 10, 0],
            system: "system_1",
            faction: "li_n_grp",
            object: "tradelane_1_10_10",
          },
          to: {
            position: [10, 50, 0],
            system: "system_1",
            faction: "li_n_grp",
            object: "tradelane_1_10_50",
          },
          duration: 40 / pathfinder.tradelaneSpeed,
        },
        {
          type: "cruise",
          from: {
            position: [10, 50, 0],
            system: "system_1",
            faction: "li_n_grp",
            object: "tradelane_1_10_50",
          },
          to: {
            position: [20, 50, 0],
            system: "system_1",
            object: "jumpgate_1_2",
            faction: "li_n_grp",
          },
          duration: 10 / pathfinder.cruiseSpeed,
        },
        {
          type: "jump",
          from: {
            position: [20, 50, 0],
            system: "system_1",
            object: "jumpgate_1_2",
            faction: "li_n_grp",
          },
          to: {
            position: [50, 0, 0],
            system: "system_2",
            object: "jumpgate_2_1",
            faction: "li_n_grp",
          },
          duration: 0,
        },
        // The trade lane is not used because the direct path is shorter
        {
          type: "cruise",
          from: {
            position: [50, 0, 0],
            system: "system_2",
            object: "jumpgate_2_1",
            faction: "li_n_grp",
          },
          to: {
            position: [30, 50, 0],
            system: "system_2",
            object: "jumphole_2_3",
          },
          duration: Math.sqrt(20 ** 2 + 50 ** 2) / pathfinder.cruiseSpeed,
        },
        {
          type: "jump",
          from: {
            position: [30, 50, 0],
            system: "system_2",
            object: "jumphole_2_3",
          },
          to: {
            position: [30, 0, 0],
            system: "system_3",
            object: "jumphole_3_2",
          },
          duration: 0,
        },
        {
          type: "cruise",
          from: {
            position: [30, 0, 0],
            system: "system_3",
            object: "jumphole_3_2",
          },
          to: { position: [30, 20, 0], system: "system_3" },
          duration: 20 / pathfinder.cruiseSpeed,
        },
      ]);
    });

    it("should find a path through two tradelanes", () => {
      const result = pathfinder.findPath(
        {
          position: [50, 0, 0],
          system: "system_3",
        },
        {
          position: [0, 50, 0],
          system: "system_3",
        }
      );

      expect(result).toEqual([
        {
          type: "cruise",
          from: { position: [50, 0, 0], system: "system_3" },
          to: {
            position: [50, 10, 0],
            system: "system_3",
            object: "tradelane_3a_50_10",
            faction: "li_n_grp",
          },
          duration: 10 / pathfinder.cruiseSpeed,
        },
        {
          type: "tradelane",
          from: {
            position: [50, 10, 0],
            system: "system_3",
            object: "tradelane_3a_50_10",
            faction: "li_n_grp",
          },
          to: {
            position: [50, 40, 0],
            system: "system_3",
            object: "tradelane_3a_50_40",
            faction: "li_n_grp",
          },
          duration: 30 / pathfinder.tradelaneSpeed,
        },
        {
          type: "cruise",
          from: {
            position: [50, 40, 0],
            system: "system_3",
            object: "tradelane_3a_50_40",
            faction: "li_n_grp",
          },
          to: {
            position: [40, 50, 0],
            system: "system_3",
            object: "tradelane_3b_40_50",
            faction: "li_n_grp",
          },
          duration: Math.sqrt(10 ** 2 + 10 ** 2) / pathfinder.cruiseSpeed,
        },
        {
          type: "tradelane",
          from: {
            position: [40, 50, 0],
            system: "system_3",
            object: "tradelane_3b_40_50",
            faction: "li_n_grp",
          },
          to: {
            position: [10, 50, 0],
            system: "system_3",
            object: "tradelane_3b_10_50",
            faction: "li_n_grp",
          },
          duration: 30 / pathfinder.tradelaneSpeed,
        },
        {
          type: "cruise",
          from: {
            position: [10, 50, 0],
            system: "system_3",
            object: "tradelane_3b_10_50",
            faction: "li_n_grp",
          },
          to: { position: [0, 50, 0], system: "system_3" },
          duration: 10 / pathfinder.cruiseSpeed,
        },
      ]);
    });
  });
});
