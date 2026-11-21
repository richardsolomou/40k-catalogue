import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { compareSnapshots } from "./compare.ts";
import { historyErrors, snapshotDigest } from "./history.ts";
import { fromMfmFork, type ForkFaction } from "./mfm-fork.ts";
import type { PointsSnapshot } from "./snapshot.ts";
import { validateHistory, validateSnapshot } from "./validate.ts";

const USAGE = `usage:
  node src/points/cli.ts validate <snapshot.json>...
  node src/points/cli.ts digest <snapshot.json>
  node src/points/cli.ts history <history.json> <snapshot.json>...
  node src/points/cli.ts compare <candidate.json> <baseline.json>
  node src/points/cli.ts from-mfm-fork <json-dir> --id <id> --edition <e> --update <u> --published <date> --title <t> --url <url> --revision <sha> --basis <text>`;

const read = (file: string): unknown => JSON.parse(readFileSync(file, "utf8"));
const fail = (message: string): never => {
  console.error(message);
  process.exit(1);
};

function snapshot(file: string): PointsSnapshot {
  const result = validateSnapshot(read(file));
  return result.ok ? result.snapshot : fail(result.errors.map((e) => `${file}: ${e}`).join("\n"));
}

const [command, ...rest] = process.argv.slice(2);
switch (command) {
  case "validate":
    for (const file of rest) {
      const result = validateSnapshot(read(file));
      if (!result.ok) {
        for (const error of result.errors) console.error(`${file}: ${error}`);
        process.exitCode = 1;
        continue;
      }
      console.log(`${file}: valid, ${result.gaps.length} unresolved`);
      for (const gap of result.gaps) console.log(`${file}: unresolved at ${gap.path}: ${gap.note}`);
    }
    break;
  case "digest":
    console.log(snapshotDigest(snapshot(rest[0] ?? fail(USAGE))));
    break;
  case "history": {
    const [manifest, ...files] = rest;
    const history = validateHistory(read(manifest ?? fail(USAGE)));
    if (!history.ok) fail(history.errors.join("\n"));
    else {
      const errors = historyErrors(history.history, files.map(snapshot));
      if (errors.length) fail(errors.join("\n"));
      console.log(`${history.history.updates.length} updates retained unchanged`);
    }
    break;
  }
  case "compare": {
    const [candidate, baseline] = rest;
    if (!candidate || !baseline) fail(USAGE);
    const report = compareSnapshots(snapshot(candidate!), snapshot(baseline!));
    console.log(`baseline rows ${report.baselineRows}, candidate rows ${report.candidateRows}`);
    console.log(`matched ${report.matched} (${(report.matchRate * 100).toFixed(2)}%)`);
    for (const d of report.differ) console.log(`differs ${d.key}: candidate ${d.candidate ?? "unresolved"}, baseline ${d.baseline ?? "unresolved"}`);
    for (const key of report.missing) console.log(`missing ${key}`);
    for (const key of report.extra) console.log(`extra ${key}`);
    break;
  }
  case "from-mfm-fork": {
    const { positionals, values } = parseArgs({
      args: rest,
      allowPositionals: true,
      options: Object.fromEntries(["id", "edition", "update", "published", "title", "url", "revision", "basis"].map((k) => [k, { type: "string" as const }])),
    });
    const dir = positionals[0] ?? fail(USAGE);
    const factions = readdirSync(dir)
      .filter((f) => f.endsWith(".json"))
      .map((f) => read(join(dir, f)) as ForkFaction);
    const need = (k: string) => values[k] ?? fail(`missing --${k}\n${USAGE}`);
    const { snapshot: built, issues } = fromMfmFork(factions, {
      id: need("id"),
      rulesVersion: { edition: need("edition"), update: need("update") },
      published: need("published"),
      source: { title: need("title"), url: need("url"), revision: need("revision") },
      basis: need("basis"),
    });
    for (const issue of issues) console.error(`issue: ${issue}`);
    const result = validateSnapshot(built);
    if (!result.ok) fail(result.errors.join("\n"));
    console.log(JSON.stringify(built, null, 2));
    break;
  }
  default:
    fail(USAGE);
}
