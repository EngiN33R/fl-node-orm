// Adapted from original flint code by biqqles

import * as fs from "fs/promises";
import * as util from "util";
import * as bini from "./bini";

// Constants
const DELIMITER_KEY_VALUE = "=";
const DELIMITER_COMMENT = ";";
const SECTION_NAME_START = "[";
const SECTION_NAME_END = "]";

// Types
type PathInput = string | string[];
type Value = string | number | boolean;
export type Entry = [string, Value | Value[]];
export type Section<
  T extends Record<string, any> = Record<string, any>,
  K extends string = string,
> = [K, T];
export type ParsedSection = [string, Entry[]];

// Cache implementation
const cache = new Map<string, any>();
function cached<T extends (...args: any[]) => any>(
  target: T
): (...args: Parameters<T>) => ReturnType<T> {
  return function (...args: Parameters<T>): ReturnType<T> {
    const key = util.inspect(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = target(...args);
    cache.set(key, result);
    return result;
  };
}

/**
 * Parse the Freelancer-style INI file(s) at `paths` and group sections of the same name together.
 *
 * The result is a dict mapping a section name to a list of dictionaries representing the contents of each section
 * "instance". If `foldSections` is true, this list will be "folded" into one dict for sections with only one
 * instance.
 *
 * If `foldValues` is true (the default), the same logic applies to entries and their values: if an entry is only
 * defined once in a section, its value is "folded" into a primitive (a float, int, bool or string) rather than being a
 * list.
 */
export const sections = cached(
  (
    paths: PathInput,
    foldSections = false,
    foldValues = true
  ): Record<string, any> => {
    return parseIni(paths, foldValues).then((sections) =>
      foldDict(sections, foldSections)
    );
  }
);

/**
 * Parse an INI file, or a collection of INIs, to a list of tuples of the form (section_name, section_contents),
 * where section_contents is a dict of the entries in that section. If foldValues is true (the default), the
 * entries dict will be "folded" (see the docstring for `foldDict`).
 */
export async function parseIni(
  paths: PathInput,
  foldValues = true
): Promise<Section[]> {
  const pathArray = Array.isArray(paths) ? paths : [paths];

  // Parse each file
  const allSections: ParsedSection[] = [];
  for (const path of pathArray) {
    const sections = await parseFile(path);
    for (const section of sections) {
      if (section) {
        allSections.push(section);
      }
    }
  }

  // Convert to final format with folded values
  return allSections
    .filter(Boolean)
    .map(([name, entries]) => [name, foldDict(entries, foldValues)]);
}

/**
 * Similar to `parse` but groups contiguous sequences of the same section name together.
 */
export async function group(
  paths: PathInput,
  foldSections = true,
  foldValues = true
): Promise<Section[]> {
  const parsed = await parseIni(paths, foldValues);

  // Group by section name
  const result: Section[] = [];
  let currentGroup: [string, Entry[]][] = [];
  let currentName: string | null = null;

  for (const [name, contents] of parsed) {
    if (name !== currentName && currentName !== null) {
      result.push([currentName, foldDict(currentGroup, foldSections)]);
      currentGroup = [];
    }
    currentName = name;
    currentGroup.push([name, Object.entries(contents)]);
  }

  if (currentName !== null) {
    result.push([currentName, foldDict(currentGroup, foldSections)]);
  }

  return result;
}

/**
 * Takes a path to an INI or BINI file and outputs a list of tuples containing a section name and a list of tuples
 * of entry/value pairs.
 */
export async function parseFile(path: string): Promise<ParsedSection[]> {
  if (bini.isBini(path)) {
    return bini.parseFile(path);
  }

  const contents = await fs.readFile(path, { encoding: "latin1" }); // files are case insensitive
  const cleanedContents = contents
    .toLowerCase()
    .replace(DELIMITER_COMMENT + SECTION_NAME_START, ""); // delete commented section markers
  return cleanedContents
    .split(SECTION_NAME_START)
    .map(parseSection)
    .filter(Boolean) as ParsedSection[];
}

/**
 * Takes a raw section string (minus the [) and outputs a tuple containing the section name and a list of tuples
 * of entry/value pairs. If the section is invalid, null will be returned.
 */
export function parseSection(section: string): ParsedSection | null {
  const parts = section.split(SECTION_NAME_END, 2);
  if (parts.length < 2 || parts[0].includes(DELIMITER_COMMENT)) {
    return null;
  }

  const sectionName = parts[0].trim();
  const entriesStr = parts[1];

  try {
    const entries = entriesStr
      .split("\n")
      .map(parseEntry)
      .filter(Boolean) as Entry[];
    return [sectionName, entries];
  } catch (error) {
    console.warn(`Couldn't parse line in section '${sectionName}': ${error}`);
    return null;
  }
}

/**
 * Takes an entry string consisting of a delimiter separated key/value pair and outputs a tuple of the
 * name and value. If the entry is invalid, null will be returned.
 */
export function parseEntry(entry: string): Entry | null {
  // Remove comments
  const commentParts = entry.split(DELIMITER_COMMENT, 1);
  const cleanEntry = commentParts[0];

  const parts = cleanEntry.split(DELIMITER_KEY_VALUE, 2);
  if (parts.length < 2) {
    return null;
  }

  const key = parts[0].trim();
  const value = parseValue(parts[1]);

  return [key, value];
}

/**
 * Parse an entry value (consisting either of a string, int or float or a tuple of such) and return it as a
 * TypeScript object.
 */
export function parseValue(entryValue: string): Value | Value[] {
  if (entryValue.includes(",")) {
    return entryValue.split(",").map(autoCast);
  }
  return autoCast(entryValue);
}

/**
 * Interpret and coerce a string value to a JavaScript type. If the value cannot be interpreted as a valid type,
 * an error will be thrown.
 */
export function autoCast(value: string): Value {
  const trimmedValue = value.trim();

  // Check for boolean values
  if (trimmedValue === "true") return true;
  if (trimmedValue === "false") return false;

  // Check if it's a number
  const firstChar = trimmedValue.charAt(0);
  if (firstChar === "-" || !isNaN(parseInt(firstChar, 10))) {
    // Try parsing as integer
    const intValue = parseInt(trimmedValue, 10);
    if (!isNaN(intValue) && intValue.toString() === trimmedValue) {
      return intValue;
    }

    // Try parsing as float
    const floatValue = parseFloat(trimmedValue);
    if (!isNaN(floatValue)) {
      return floatValue;
    }
  }

  // Default to string
  return trimmedValue;
}

/**
 * Construct a dict out of a sequence of tuples of the form (key, value). If `foldValues` is false, or multiple
 * values are given for the same key, those values are collected into a list. If `foldValues` is true (the default),
 * the value for keys with only one value (i.e. they appear only once in the sequence) are "folded" into a primitive
 * instead of being a list of one element.
 */
export function foldDict<T>(
  sequence: [string, T][],
  foldValues = true
): Record<string, T | T[]> {
  const result: Record<string, T | T[]> = {};

  for (const [key, value] of sequence) {
    if (!key) continue;

    if (!foldValues || (key in result && Array.isArray(result[key]))) {
      // If we're not folding values or we already have an array for this key
      if (
        !Array.isArray(result[key]) ||
        (Array.isArray(value) && !Array.isArray(result[key][0]))
      ) {
        result[key] = [result[key] as T];
      }
      (result[key] as T[]).push(value);
    } else if (key in result) {
      const preexisting =
        Array.isArray(value) && !Array.isArray(result[key])
          ? [result[key]]
          : result[key];
      // If the key exists but isn't an array yet, convert it
      result[key] = [preexisting as T, value];
    } else {
      // First occurrence of this key
      result[key] = value;
    }
  }

  return result;
}
