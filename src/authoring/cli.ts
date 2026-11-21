import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { decide, publication } from "./proposal.ts";

const [command, ...args] = process.argv.slice(2);
const publishing = command === "publish" && args.length === 3;
if (!publishing && !(command === "check" && args.length > 0)) {
  console.error("usage: node src/authoring/cli.ts check <proposal.json>... | publish <proposal.json> <records-dir> <reviews-dir>");
  process.exit(2);
}

const files = publishing ? args.slice(0, 1) : args;
for (const file of files) {
  const decision = decide(JSON.parse(readFileSync(file, "utf8")));
  if (decision.outcome === "held") {
    for (const reason of decision.reasons) console.error(`${file}: held: ${reason}`);
    process.exitCode = 1;
    continue;
  }
  console.log(`${file}: approved`);
  if (!publishing) continue;
  const [, records, reviews] = args;
  for (const [name, content] of Object.entries(publication(decision))) {
    const dir = name === `${decision.record.id}.review.json` ? reviews : records;
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, name), content);
    console.log(`${file}: wrote ${join(dir, name)}`);
  }
}
