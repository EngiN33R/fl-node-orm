import { IniSystemObject } from "../ini-types";
import { IBase, IDataContext, IIniSection } from "../types";
import { ObjectVisitBitmask } from "./common";

type IniUniverseBase = {
  nickname: string;
  system: string;
  strid_name: number;
  file: string;
};

export class BaseModel implements IBase {
  public nickname!: string;
  public type = "base" as const;

  public name!: string;
  public infocard!: string;
  public infocards!: string[];
  public system!: string;
  public objectNickname!: string;
  public position!: [number, number, number];
  public rotation!: [number, number, number];
  public faction!: string;
  public archetype!: string;
  public loadout?: string;
  public visit!: ReturnType<typeof ObjectVisitBitmask>;

  static async from(
    ctx: IDataContext,
    inputs: {
      universe: IIniSection<IniUniverseBase>;
      definition: IIniSection<IniSystemObject>;
    },
  ) {
    const model = new BaseModel();

    const universe = inputs.universe.ini[1];
    const object = inputs.definition.ini[1];

    model.nickname = universe.nickname;

    model.name = ctx.ids(universe.strid_name);
    model.infocards = object.ids_info
      ? ctx.idsWithRelated(object.ids_info)
      : [""];
    model.infocard = model.infocards.join("");
    model.system = universe.system;
    model.objectNickname = object.nickname;
    model.position = object.pos;
    model.rotation = object.rotate ?? [0, 0, 0];
    model.faction = object.reputation ?? "fc_uk_grp";
    model.archetype = object.archetype;
    model.loadout = object.loadout;
    model.visit = ObjectVisitBitmask(object.visit ?? 0);

    ctx.registerModel(model);

    return model;
  }
}
