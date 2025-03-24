import { IDataContext, IFaction, Model } from "../types";
import { Section } from "../util/ini";

export type IniInitialWorldGroup = {
  nickname: string;
  ids_name: number;
  ids_info: number;
  ids_short_name: number;
  rep: Array<[number, string]>;
};

export type IniFactionProp = {
  affiliation: string;
  legality: string;
  nickname_plurality: string;
  msg_id_prefix: string;
  jump_preference: string;
  npc_ship: string | string[];
  voice: string | string[];
  mc_costume: string;
  space_costume: number | number[];
  firstname_male: [number, number];
  firstname_female: [number, number];
  lastname: [number, number];
  rank_desig: [number, number, number, number, number];
  formation_desig: [number, number];
  large_ship_desig: number | number[];
  large_ship_names: number | number[];
  scan_for_cargo: string | string[];
  scan_announce: "true" | "false";
  scan_chance: number;
  formation: [string, string] | [string, string][];
};

export type IniEmpathy = {
  group: string;
  event: Array<
    [
      (
        | "object_destruction"
        | "random_mission_success"
        | "random_mission_failure"
        | "random_mission_abortion"
      ),
      number,
    ]
  >;
  empathy_rate: Array<[string, number]>;
};

function genRange(range: [number, number] | undefined) {
  const values: number[] = [];
  if (range) {
    for (let i = range[0]; i <= range[1]; i++) {
      values.push(i);
    }
  }
  return values;
}

export class FactionModel implements IFaction {
  public nickname!: string;
  public name!: string;
  public infocard!: string;

  public legality!: "lawful" | "unlawful";
  public nicknamePlurality!: "singular" | "plural";
  public msgIdPrefix!: string;
  public jumpPreference!: "jumpgate" | "jumphole" | "any";
  public npcShips!: string[];
  public mcCostume!: string;
  public voices!: string[];
  public firstNamesMale!: string[];
  public firstNamesFemale!: string[];
  public lastNames!: string[];
  public formations!: string[];
  public ranks!: [string, string, string];

  public reputation: Record<string, number> = {};

  public objectDestructionRep!: number;
  public missionSuccessRep!: number;
  public missionFailureRep!: number;
  public missionAbortRep!: number;
  public empathy: Record<string, number> = {};

  static async from(
    ctx: IDataContext,
    inputs: {
      faction: Section;
      group: Section;
      empathy: Section;
    }
  ) {
    const model = new FactionModel();

    const group = inputs.group[1] as IniInitialWorldGroup;
    const factionProp = inputs.faction[1] as IniFactionProp;
    const empathy = inputs.empathy[1] as IniEmpathy;

    model.nickname = group.nickname;
    model.name = ctx.ids(group.ids_name);
    model.infocard = ctx.ids(group.ids_info);

    model.legality = factionProp.legality as "lawful" | "unlawful";
    model.nicknamePlurality = factionProp.nickname_plurality as
      | "singular"
      | "plural";
    model.msgIdPrefix = factionProp.msg_id_prefix;
    model.jumpPreference = factionProp.jump_preference as
      | "jumpgate"
      | "jumphole"
      | "any";
    model.npcShips = factionProp.npc_ship as string[];
    model.mcCostume = factionProp.mc_costume;
    model.voices = factionProp.voice as string[];

    const ids = ctx.ids.bind(ctx);
    model.firstNamesMale = genRange(factionProp.firstname_male).map(ids);
    model.firstNamesFemale = genRange(factionProp.firstname_female).map(ids);
    model.lastNames = genRange(factionProp.lastname).map(ids);
    model.formations = genRange(factionProp.formation_desig).map(ids);

    model.ranks = [
      ctx.ids(factionProp.rank_desig[0]),
      ctx.ids(factionProp.rank_desig[1]),
      ctx.ids(factionProp.rank_desig[2]),
    ];

    for (const [rep, fac] of group.rep) {
      model.reputation[fac] = rep;
    }

    model.objectDestructionRep =
      empathy.event.find((e) => e[0] === "object_destruction")?.[1] ?? 0;
    model.missionSuccessRep =
      empathy.event.find((e) => e[0] === "random_mission_success")?.[1] ?? 0;
    model.missionFailureRep =
      empathy.event.find((e) => e[0] === "random_mission_failure")?.[1] ?? 0;
    model.missionAbortRep =
      empathy.event.find((e) => e[0] === "random_mission_abortion")?.[1] ?? 0;

    for (const [fac, rep] of empathy.empathy_rate) {
      model.empathy[fac] = rep;
    }

    return model;
  }
}
