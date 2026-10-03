import fs from "node:fs";
import path from "node:path";

/** Server-only: does this file exist in /public? Lets slots show placeholders until media arrives. */
export function publicFileExists(publicPath: string) {
  return fs.existsSync(path.join(process.cwd(), "public", publicPath));
}

/** Returns which of `paths` exist in /public. */
export function availableFiles(paths: string[]) {
  return Object.fromEntries(paths.map((p) => [p, publicFileExists(p)])) as Record<string, boolean>;
}
