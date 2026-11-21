import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Inventory } from "./coverage.ts";
import { inventoryFromDatacards, type DatacardsCore, type DatacardsFaction, type DatacardsStratagem } from "./datacards.ts";

/** A private comparison input containing IDs, labels and structured usage fields from one pin. */
export function stageDatacards(directory: string, meta: Pick<Inventory, "rulesVersion" | "source">) {
  const read = (file: string) => JSON.parse(readFileSync(join(directory, file), "utf8"));
  const jsonFiles = (folder: string) => readdirSync(folder, { withFileTypes: true })
    .filter((file) => file.isFile() && file.name.endsWith(".json"))
    .map((file) => file.name)
    .sort();
  const core = read("core.json") as DatacardsCore;
  const factions = jsonFiles(directory)
    .filter((file) => file !== "core.json")
    .map((file) => ({ file, faction: read(file) as DatacardsFaction }))
    .filter(({ faction }) => typeof faction?.id === "string" && Array.isArray(faction.datasheets));
  if (!factions.length) throw new Error(`${directory}: no faction data files`);

  const entries = [
    ...factions.flatMap(({ file, faction }) => inventoryFromDatacards(faction, undefined, meta).entries.map((entry) => ({ ...entry, faction: file }))),
    ...inventoryFromDatacards({}, core, meta).entries,
  ];
  const usage = [
    ...factions.flatMap(({ file, faction }) => (faction.stratagems ?? []).map((card) => ({ ...stratagemUsage(card), faction: file }))),
    ...(core.stratagems ?? []).map(stratagemUsage),
  ];
  const coreDirectory = join(directory, "core");
  return {
    ...meta,
    factions: factions.length,
    entries,
    usage,
    documents: existsSync(coreDirectory) ? jsonFiles(coreDirectory) : [],
    keywordEntries: existsSync(join(directory, "keywords.json")) ? read("keywords.json").keywords.length : 0,
    faqEntries: existsSync(join(directory, "faqs.json")) ? read("faqs.json").faqs.length : 0,
  };
}

function stratagemUsage({ id, cost, phase, turn }: DatacardsStratagem) {
  return {
    id,
    cost: typeof cost === "number" && Number.isInteger(cost) && cost >= 0 ? cost : undefined,
    phase: Array.isArray(phase) && phase.every((name): name is string => typeof name === "string") ? phase : undefined,
    turn: typeof turn === "string" ? turn : undefined,
  };
}
