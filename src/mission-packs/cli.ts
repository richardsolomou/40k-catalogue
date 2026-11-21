import { readFileSync } from "node:fs";
import { compare } from "./compare.ts";
import { validatePack } from "./validate.ts";

const [command, packFile, casesFile] = process.argv.slice(2);
if (!((command === "validate" && packFile) || (command === "compare" && packFile && casesFile))) {
  console.error("usage: node src/mission-packs/cli.ts validate <pack.json> | compare <pack.json> <cases.json>");
  process.exit(2);
}

const result = validatePack(JSON.parse(readFileSync(packFile!, "utf8")));
if (!result.ok) {
  for (const error of result.errors) console.error(error);
  process.exit(1);
}
// Gaps are reported by path and count, never by note or value, so a private pack's report can be shared.
const gaps = result.gaps.map((g) => g.path.replace(/\/\d+/g, "/*"));
const counts = Object.fromEntries([...new Set(gaps)].map((path) => [path, gaps.filter((p) => p === path).length]));
if (command === "validate") {
  console.log(JSON.stringify({ gaps: result.gaps.length, byPath: counts }, null, 2));
} else {
  const report = compare(result.pack, JSON.parse(readFileSync(casesFile!, "utf8")));
  console.log(JSON.stringify({ gaps: result.gaps.length, ...report }, null, 2));
  if (Object.values(report).some((s) => s.differences.length > 0)) process.exit(1);
}
