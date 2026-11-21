import { readFileSync } from "node:fs";
import { placeLayout } from "./place.ts";
import type { DeploymentMap, TerrainRecord } from "./record.ts";
import { renderSvg } from "./svg.ts";
import { verify, verifyDataset } from "./verify.ts";

const [command, ...files] = process.argv.slice(2);
if ((command !== "verify" && command !== "place" && command !== "svg") || files.length === 0) {
  console.error("usage: node src/terrain/cli.ts verify|place|svg <record.json>...");
  process.exit(2);
}

const records: TerrainRecord[] = [];
for (const file of files) {
  const result = verify(JSON.parse(readFileSync(file, "utf8")));
  if (result.ok) records.push(result.record);
  else for (const error of result.errors) console.error(`${file}: ${error}`);
}
const datasetErrors = verifyDataset(records);
for (const error of datasetErrors) console.error(error);
if (records.length !== files.length || datasetErrors.length > 0) process.exit(1);

// svg writes one document per layout and draws the first deployment map given under it, so save one layout per run.
const deployment = records.find((r): r is DeploymentMap => r.kind === "deployment-map");
for (const record of records) {
  if (command === "verify") console.log(`${record.id}: valid ${record.kind}`);
  if (record.kind !== "terrain-layout") continue;
  if (command === "place") console.log(JSON.stringify(placeLayout(record), null, 2));
  if (command === "svg") console.log(renderSvg(placeLayout(record), deployment));
}
