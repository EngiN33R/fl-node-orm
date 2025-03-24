import { DataContext } from "../context";
import { Model } from "../types";
import { Section } from "../util/ini";
import { IniSystemObject, ObjectVisitBitmask } from "./common";

type IniUniverseBase = {
  nickname: string;
  system: string;
  strid_name: number;
  file: string;
};

export class BaseModel implements Model {
  public nickname!: string;

  public name!: string;
  public infocards!: string[];
  public system!: string;
  public position!: [number, number, number];
  public rotation!: [number, number, number];
  public faction!: string;
  public visit!: ReturnType<typeof ObjectVisitBitmask>;

  static async from(inputs: { universe: Section; object: Section }) {
    const model = new BaseModel();

    const universe = inputs.universe[1] as IniUniverseBase;
    const object = inputs.object[1] as IniSystemObject;

    model.nickname = universe.nickname;

    model.name = DataContext.INSTANCE.ids(universe.strid_name);
    model.infocards = object.ids_info
      ? DataContext.INSTANCE.idsWithRelated(object.ids_info)
      : [""];
    model.system = universe.system;
    model.position = object.pos;
    model.rotation = object.rotate ?? [0, 0, 0];
    model.faction = object.reputation ?? "fc_uk_grp";
    model.visit = ObjectVisitBitmask(object.visit ?? 0);

    return model;
  }
}
