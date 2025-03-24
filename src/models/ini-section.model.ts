import { IIniSection, IIniSections, Model } from "../types";
import { Section } from "../util/ini";

export class IniSectionModel implements IIniSection {
  /**
   * Section nickname. Set to the nickname property of the INI if present,
   * or undefined otherwise.
   */
  public nickname?: string;
  public ini!: Section;

  static async from(inputs: { section: Section }) {
    const model = new IniSectionModel();
    model.nickname = inputs.section[1].nickname;
    model.ini = inputs.section as Section;
    return model;
  }

  /**
   * Name of the INI section.
   */
  public get name() {
    return this.ini[0];
  }

  public get<T = unknown>(key: string): T {
    return this.ini[1][key];
  }

  public asArray(key: string) {
    const val = this.ini[1][key];
    return Array.isArray(val) ? val : [val];
  }
}

export class IniSectionsModel implements IIniSections {
  #rawSections: IniSectionModel[] = [];
  #sections = new Map<string, IniSectionModel[]>();

  nickname?: string;

  public path!: string;

  public get keys() {
    return [...this.#sections.keys()];
  }

  public get sections() {
    return this.#rawSections;
  }

  static async from(inputs: { sections: Section[]; name: Section }) {
    const model = new IniSectionsModel();
    model.path = inputs.name[0];
    for (const section of inputs.sections) {
      const sectionModel = await IniSectionModel.from({
        section,
      });
      model.#rawSections.push(sectionModel);

      if (!model.#sections.has(section[0])) {
        model.#sections.set(section[0], []);
      }
      model.#sections.get(section[0])?.push();
    }
    return model;
  }

  findAll(name: string, predicate?: (s: IniSectionModel) => boolean) {
    return (
      this.#rawSections.filter(
        (s) => s.name === name && (!predicate || predicate(s))
      ) ?? []
    );
  }

  findFirst(name: string, predicate?: (s: IniSectionModel) => boolean) {
    return this.#rawSections.find(
      (s) => s.name === name && (!predicate || predicate(s))
    );
  }

  findFirstWithChildren(
    name: string,
    predicate?: (s: IniSectionModel) => boolean
  ): [IniSectionModel, IniSectionModel[]] | [undefined, []] {
    const index = this.#rawSections.findIndex(
      (s) => s.name === name && (!predicate || predicate(s))
    );
    if (index === -1) {
      return [undefined, []];
    }
    const next = this.#rawSections
      .slice(index + 1)
      .findIndex((s) => s.name === name);
    const [parent, ...children] = this.#rawSections.slice(
      index,
      next === -1 ? undefined : next + 1
    );
    return [parent, children];
  }
}
