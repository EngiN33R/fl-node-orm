import * as fs from "fs";
import * as fsPromises from "fs/promises";
import * as path from "path";

// Cache of directory listings: parent dir -> array of entry names
const dirCache = new Map<string, string[]>();

function readdirCached(dir: string): string[] {
  let entries = dirCache.get(dir);
  if (entries === undefined) {
    entries = fs.readdirSync(dir);
    dirCache.set(dir, entries);
  }
  return entries;
}

async function readdirCachedAsync(dir: string): Promise<string[]> {
  let entries = dirCache.get(dir);
  if (entries === undefined) {
    entries = await fsPromises.readdir(dir);
    dirCache.set(dir, entries);
  }
  return entries;
}

function findCaseInsensitiveMatch(
  entries: string[],
  segment: string
): string | undefined {
  const lower = segment.toLowerCase();
  return entries.find((e) => e.toLowerCase() === lower);
}

/**
 * Resolve a potentially wrong-case file path to the actual filesystem path
 * by walking the directory tree and doing case-insensitive segment matching.
 * Sync variant for fs sync consumers (bini.ts).
 */
export function resolveFilePathSync(filePath: string): string {
  // Fast path: if the path already exists as-is, return it
  try {
    fs.accessSync(filePath);
    return filePath;
  } catch {
    // Path doesn't exist as-is, try case-insensitive resolution
  }

  const parsed = path.parse(filePath);
  const segments = filePath.slice(parsed.root.length).split(path.sep);
  let resolved = parsed.root;

  for (const segment of segments) {
    const candidate = path.join(resolved, segment);
    try {
      fs.accessSync(candidate);
      resolved = candidate;
      continue;
    } catch {
      // Segment doesn't exist as-is, search case-insensitively
    }

    try {
      const entries = readdirCached(resolved);
      const match = findCaseInsensitiveMatch(entries, segment);
      if (match) {
        resolved = path.join(resolved, match);
      } else {
        // No match found, return original path (will fail at actual fs call)
        return filePath;
      }
    } catch {
      // Can't read directory, return original path
      return filePath;
    }
  }

  return resolved;
}

/**
 * Resolve a potentially wrong-case file path to the actual filesystem path
 * by walking the directory tree and doing case-insensitive segment matching.
 * Async variant for fs/promises consumers.
 */
export async function resolveFilePath(filePath: string): Promise<string> {
  // Fast path: if the path already exists as-is, return it
  try {
    await fsPromises.access(filePath);
    return filePath;
  } catch {
    // Path doesn't exist as-is, try case-insensitive resolution
  }

  const parsed = path.parse(filePath);
  const segments = filePath.slice(parsed.root.length).split(path.sep);
  let resolved = parsed.root;

  for (const segment of segments) {
    const candidate = path.join(resolved, segment);
    try {
      await fsPromises.access(candidate);
      resolved = candidate;
      continue;
    } catch {
      // Segment doesn't exist as-is, search case-insensitively
    }

    try {
      const entries = await readdirCachedAsync(resolved);
      const match = findCaseInsensitiveMatch(entries, segment);
      if (match) {
        resolved = path.join(resolved, match);
      } else {
        return filePath;
      }
    } catch {
      return filePath;
    }
  }

  return resolved;
}

/**
 * Clear the directory listing cache. Useful for tests or re-initialization.
 */
export function clearFilePathCache(): void {
  dirCache.clear();
}
