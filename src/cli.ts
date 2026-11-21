import { readFileSync } from "node:fs";
import { renderSummary } from "./render.ts";
import { validate } from "./validate.ts";

const [command, ...files] = process.argv.slice(2);
if ((command !== "validate" && command !== "render") || files.length === 0) {
  console.error("usage: node src/cli.ts validate|render <record.json>...");
  process.exit(2);
}

for (const file of files) {
  const result = validate(JSON.parse(readFileSync(file, "utf8")));
  if (!result.ok) {
    for (const error of result.errors) console.error(`${file}: ${error}`);
    process.exitCode = 1;
    continue;
  }
  if (command === "render") {
    console.log(renderSummary(result.record));
    continue;
  }
  console.log(`${file}: valid, ${result.gaps.length} gap${result.gaps.length === 1 ? "" : "s"}`);
  for (const gap of result.gaps) console.log(`${file}: gap at ${gap.path}: ${gap.note}`);
}
