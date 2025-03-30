import { ParsedSection } from "./ini";

export function parseSystemRange(range: string) {
  if (!range.includes("-")) {
    return [range];
  }
  const systems: string[] = [];
  const [prefix, start, end] =
    range.match(/([^\d]+)(\d{1,2})-(\d{1,2})/)?.slice(1) ?? [];
  for (let i = Number(start); i <= Number(end); i++) {
    systems.push(`${prefix}${String(i).padStart(2, "0")}`);
  }
  return systems;
}

export function parseTerritorySections(
  territory: ParsedSection[],
  ids: (id: number) => string
) {
  const territoryMap: Record<string, string> = {};
  for (const [key, section] of territory) {
    const currentProperties = {
      house_id: 0,
      house: "",
      format: "",
      systems: [] as string[],
    };
    if (key === "settings") {
      continue;
    }
    if (key === "houses" || key === "systems") {
      for (const [entry, value] of section) {
        if (entry === "house_id") {
          currentProperties[entry] = value as number;
        }
        if (entry === "house") {
          currentProperties[entry] = value as string;
        }
        if (entry === "format") {
          currentProperties[entry] = value as string;
        }
        if (entry === "format_id") {
          currentProperties.format = ids(value as number);
        }
        if (entry === "systems") {
          const name =
            currentProperties.house ||
            (currentProperties.house_id
              ? ids(currentProperties.house_id)
              : "") ||
            currentProperties.format
              .toLowerCase()
              .replace(/\%s system[\^,]?/, "")
              .trim()
              .split(" ")
              .slice(0, -1)
              .join(" ");
          const systems = Array.isArray(value)
            ? value.flatMap((v) => parseSystemRange(v as string))
            : parseSystemRange(value as string);
          for (const system of systems) {
            territoryMap[system] = name
              ? name
                  .split(" ")
                  .map((s) =>
                    ["of", "and", "the", "a", "an"].includes(s)
                      ? s
                      : capitalize(s)
                  )
                  .join(" ")
              : "Unknown";
          }
        }
      }
    }
  }
  return territoryMap;
}

export function capitalize(str: string) {
  return str.charAt(0).toLocaleUpperCase() + str.slice(1).toLocaleLowerCase();
}
