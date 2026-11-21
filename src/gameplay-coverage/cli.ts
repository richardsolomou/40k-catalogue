import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import type { MechanicRecord } from "../record.ts";
import { validate } from "../validate.ts";
import { coverage, validateInventory, type Mapping } from "./coverage.ts";
import { inventoryFromDatacards, type DatacardsCore, type DatacardsFaction } from "./datacards.ts";
import { stageDatacards } from "./stage.ts";

const USAGE = `usage:
  node src/gameplay-coverage/cli.ts inventory <datacards-faction.json> --edition <e> --update <u> --title <t> [--revision <sha>] [--core <core.json>]
  node src/gameplay-coverage/cli.ts stage <datacards-directory> --edition <e> --update <u> --title <t> --revision <sha>
  node src/gameplay-coverage/cli.ts report <inventory.json> <mapping.json> <record-file-or-dir>... [--entries]`;

const read = (file: string): unknown => JSON.parse(readFileSync(file, "utf8"));
const fail = (message: string): never => {
  console.error(message);
  process.exit(1);
};
const recordFiles = (path: string) =>
  statSync(path).isDirectory()
    ? readdirSync(path)
        .filter((f) => f.endsWith(".json"))
        .sort()
        .map((f) => join(path, f))
    : [path];

const [command, ...rest] = process.argv.slice(2);
switch (command) {
  case "inventory":
  case "stage": {
    const { positionals, values } = parseArgs({
      args: rest,
      allowPositionals: true,
      options: { edition: { type: "string" }, update: { type: "string" }, title: { type: "string" }, revision: { type: "string" }, core: { type: "string" } },
    });
    const file = positionals[0] ?? fail(USAGE);
    const revision = values.revision ?? (command === "stage" ? fail(USAGE) : undefined);
    const meta = {
      rulesVersion: { edition: values.edition ?? fail(USAGE), update: values.update ?? fail(USAGE) },
      source: { title: values.title ?? fail(USAGE), ...(revision ? { revision } : {}) },
    };
    const result = command === "stage"
      ? stageDatacards(file, meta)
      : inventoryFromDatacards(read(file) as DatacardsFaction, values.core ? (read(values.core) as DatacardsCore) : undefined, meta);
    console.log(JSON.stringify(result, null, 2));
    break;
  }
  case "report": {
    const { positionals, values } = parseArgs({ args: rest, allowPositionals: true, options: { entries: { type: "boolean" } } });
    const [inventoryFile = fail(USAGE), mappingFile = fail(USAGE), ...paths] = positionals;
    if (paths.length === 0) fail(USAGE);
    const checked = validateInventory(read(inventoryFile));
    const all = checked.ok ? checked.inventory : fail(checked.errors.map((e) => `${inventoryFile}: ${e}`).join("\n"));
    const mapping = read(mappingFile);
    if (!mapping || typeof mapping !== "object" || Array.isArray(mapping) || Object.values(mapping).some((id) => typeof id !== "string" || !id.trim())) {
      fail(`${mappingFile}: expected an object mapping record IDs to inventory entry IDs`);
    }
    const records: MechanicRecord[] = [];
    for (const file of paths.flatMap(recordFiles)) {
      const result = validate(read(file));
      if (result.ok) records.push(result.record);
      else fail(result.errors.map((e) => `${file}: ${e}`).join("\n"));
    }
    const { entries, ...report } = coverage(all, records, mapping as Mapping);
    console.log(JSON.stringify(values.entries ? { ...report, entries } : report, null, 2));
    if (report.problems.length > 0) process.exitCode = 1;
    break;
  }
  default:
    fail(USAGE);
}
