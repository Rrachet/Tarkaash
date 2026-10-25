import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

// House style: no em dashes or en dashes anywhere in the app's copy or code.
const ROOTS = ["app", "components", "lib"];
const DASH = new RegExp("[\\u2013\\u2014]");

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) return files(p);
    return /\.(tsx?|css|md)$/.test(name) ? [p] : [];
  });
}

describe("copy style", () => {
  it("uses no em or en dashes", () => {
    const offenders = ROOTS.flatMap(files).flatMap((f) =>
      readFileSync(f, "utf8").split("\n").flatMap((line, i) => (DASH.test(line) ? [`${f}:${i + 1}`] : [])),
    );
    expect(offenders).toEqual([]);
  });
});
