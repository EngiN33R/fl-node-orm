import { Section } from "./util/ini";

export interface Parser<T> {
  parse(data: ArrayBuffer): Promise<T>;
}

export interface Model {
  nickname?: string;
}

export interface ModelInstantiator {
  from(inputs: Record<string, Section | Section[]>): Promise<Model>;
}

export type EntityType = "system" | "faction";
