import {
  IIniSection,
  IIniSections,
  ForcedArray,
  IDataContext,
  AnyRecordMap,
  AnyRecord,
  Unarray,
} from "../types";
import { Section } from "../util/ini";

export class IniSectionModel<
  S extends AnyRecord = AnyRecord,
  K extends string = string,
> implements IIniSection<S>
{
  /**
   * Section nickname. Set to the nickname property of the INI if present,
   * or undefined otherwise.
   */
  public nickname?: string;
  public ini!: Section<S, K>;

  #ctx!: IDataContext;

  static async from<S extends AnyRecord = AnyRecord, K extends string = string>(
    ctx: IDataContext,
    inputs: { section: Section }
  ) {
    const model = new IniSectionModel<S, K>();
    model.#ctx = ctx;
    model.nickname = inputs.section[1].nickname;
    model.ini = inputs.section as Section<S, K>;
    return model;
  }

  /**
   * Name of the INI section.
   */
  public get name() {
    return this.ini[0];
  }

  public get<K extends keyof S>(key: K) {
    return this.ini[1][key as string] as S[K];
  }

  public ids<K extends keyof S>(key: K) {
    return this.#ctx.ids(this.get(key) as number);
  }

  public as<V, K extends keyof S>(key: K) {
    return this.ini[1][key as string] as V;
  }

  public asArray<K extends keyof S>(key: K, nested?: boolean) {
    const val = this.get(key);
    if (!val) return [] as ForcedArray<NonNullable<S[K]>>;
    if (nested) {
      return (
        Array.isArray((val as Array<unknown>)[0]) ? val : [val]
      ) as ForcedArray<NonNullable<S[K]>>;
    } else {
      return (Array.isArray(val) ? val : [val]) as ForcedArray<
        NonNullable<S[K]>
      >;
    }
  }

  public asSingle<K extends keyof S>(key: K) {
    const val = this.get(key);
    return (Array.isArray(val) ? val[0] : val) as Unarray<S[K]>;
  }
}

export class IniSectionsModel<S extends AnyRecordMap = AnyRecordMap>
  implements IIniSections<S>
{
  #rawSections: IIniSection<Unarray<S[keyof S]>>[] = [];
  #sections = new Map<keyof S, IIniSection<Unarray<S[keyof S]>>[]>();
  #sectionNicknameLookup = new Map<string, IIniSection<Unarray<S[keyof S]>>>();

  nickname?: string;

  public path!: string;

  public get keys() {
    return [...this.#sections.keys()];
  }

  public get sections(): IIniSection<Unarray<S[keyof S]>>[] {
    return this.#rawSections;
  }

  static async from<S extends AnyRecordMap = AnyRecordMap>(
    ctx: IDataContext,
    inputs: { sections: Section[]; name: Section }
  ) {
    const model = new IniSectionsModel<S>();
    model.path = inputs.name[0];
    for (const section of inputs.sections) {
      const sectionModel = await IniSectionModel.from<Unarray<S[keyof S]>>(
        ctx,
        {
          section,
        }
      );
      model.#rawSections.push(sectionModel);

      if (!model.#sections.has(section[0])) {
        model.#sections.set(section[0], []);
      }
      model.#sections.get(section[0])?.push(sectionModel);

      if (sectionModel.nickname) {
        model.#sectionNicknameLookup.set(
          `${section[0]};${sectionModel.nickname}`,
          sectionModel
        );
      }
    }
    return model;
  }

  append(other: IIniSections<S>) {
    for (const section of other.sections) {
      this.#rawSections.push(section);

      if (!this.#sections.has(section.ini[0])) {
        this.#sections.set(section.ini[0], []);
      }
      this.#sections.get(section.ini[0])?.push(section);
    }
  }

  findAll<K extends keyof S>(
    name: K,
    predicate?: (
      s: IIniSection<Unarray<S[K]>, K extends string ? K : string>
    ) => boolean
  ) {
    return (this.#rawSections.filter(
      (s) =>
        s.name === name &&
        (!predicate ||
          predicate(
            s as IIniSection<Unarray<S[K]>, K extends string ? K : string>
          ))
    ) ?? []) as IIniSection<Unarray<S[K]>, K extends string ? K : string>[];
  }

  findFirst<K extends keyof S>(
    name: K,
    predicate?: (
      s: IIniSection<Unarray<S[K]>, K extends string ? K : string>
    ) => boolean
  ) {
    return this.#rawSections.find(
      (s) =>
        s.name === name &&
        (!predicate ||
          predicate(
            s as IIniSection<Unarray<S[K]>, K extends string ? K : string>
          ))
    ) as IIniSection<Unarray<S[K]>, K extends string ? K : string> | undefined;
  }

  findFirstWithChildren<K extends keyof S>(
    name: K,
    predicate?: (s: IIniSection<Unarray<S[K]>>) => boolean
  ):
    | [IIniSection<Unarray<S[K]>>, IIniSection<Unarray<S[keyof S]>>[]]
    | [undefined, []] {
    const index = this.#rawSections.findIndex(
      (s) =>
        s.name === name &&
        (!predicate || predicate(s as IIniSection<Unarray<S[K]>>))
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
    return [parent as IIniSection<Unarray<S[K]>>, children];
  }

  findByNickname<K extends keyof S>(name: K, nickname: string) {
    return this.#sectionNicknameLookup.get(`${String(name)};${nickname}`) as
      | IIniSection<Unarray<S[K]>, K extends string ? K : string>
      | undefined;
  }
}
