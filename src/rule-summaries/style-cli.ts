import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { styleReport } from "./style.ts";

// Reports the summaries in each records directory that break the house style; --strict fails when any do.
const args = process.argv.slice(2);
const strict = args.includes("--strict");
const dirs = args.filter((a) => a !== "--strict");
if (dirs.length === 0) {
  console.error("usage: node src/rule-summaries/style-cli.ts [--strict] <records dir>...");
  process.exit(2);
}
for (const dir of dirs) {
  const files = readdirSync(dir, { recursive: true, encoding: "utf8" }).filter((f) => f.endsWith(".json"));
  const report = styleReport(files.map((f) => JSON.parse(readFileSync(join(dir, f), "utf8"))));
  const breaking = new Set(Object.values(report.issues).flat());
  console.log(`${dir}: ${report.checked - breaking.size} of ${report.checked} summaries in house style`);
  for (const [rule, keys] of Object.entries(report.issues).sort(([, a], [, b]) => b.length - a.length))
    console.log(`  ${rule}: ${keys.length} (${keys.slice(0, 3).join(", ")}${keys.length > 3 ? ", …" : ""})`);
  if (strict && breaking.size > 0) process.exitCode = 1;
}
