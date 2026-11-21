import { readFileSync } from "node:fs";
import { validateLocalisation } from "./validate.ts";

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("usage: node src/localisation/cli.ts <names.json>...");
  process.exit(2);
}

for (const file of files) {
  const result = validateLocalisation(JSON.parse(readFileSync(file, "utf8")));
  if (!result.ok) {
    for (const error of result.errors) console.error(`${file}: ${error}`);
    process.exitCode = 1;
    continue;
  }
  console.log(`${file}: valid, ${result.ambiguities.length} ambiguous name${result.ambiguities.length === 1 ? "" : "s"}`);
  for (const a of result.ambiguities) console.log(`${file}: ${a.kind} "${a.name}" names ${a.ids.join(", ")}`);
}
