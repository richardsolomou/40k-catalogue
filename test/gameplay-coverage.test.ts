import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { coverage, validateInventory, type Inventory, type Mapping } from "../src/gameplay-coverage/coverage.ts";
import { inventoryFromDatacards, type DatacardsCore, type DatacardsFaction } from "../src/gameplay-coverage/datacards.ts";
import type { MechanicRecord } from "../src/record.ts";
import { validate } from "../src/validate.ts";

const json = (path: string): unknown => JSON.parse(readFileSync(new URL(`../fixtures/${path}`, import.meta.url), "utf8"));

function record(name: string): MechanicRecord {
  const result = validate(json(`valid/${name}.json`));
  if (!result.ok) assert.fail(result.errors.join("\n"));
  return result.record;
}

const inventory = json("gameplay-coverage/ashen-choir.inventory.json") as Inventory;
const mapping = json("gameplay-coverage/mapping.json") as Mapping;
const wake = record("end-of-move-trigger");
const veil = record("unresolved-gaps");
const status = (records: MechanicRecord[], entry: string, map: Mapping = mapping) =>
  coverage(inventory, records, map).entries.find((e) => e.id === entry)?.status;

test("a datacards file gives the inventory of its entry names and IDs", () => {
  const extracted = inventoryFromDatacards(
    json("gameplay-coverage/ashen-choir.datacards.json") as DatacardsFaction,
    json("gameplay-coverage/core.datacards.json") as DatacardsCore,
    { rulesVersion: inventory.rulesVersion, source: inventory.source },
  );
  assert.deepEqual(extracted, inventory);
});

test("the extracted inventory validates", () => {
  assert.equal(validateInventory(inventory).ok, true);
});

test("an inventory that repeats an entry ID is invalid", () => {
  const [first] = inventory.entries;
  assert.deepEqual(validateInventory({ ...inventory, entries: [first, first] }), { ok: false, errors: [`/entries/1/id repeats "${first?.id}"`] });
});

test("a mapped record for the same rules version covers its entry", () => {
  assert.equal(status([wake], "strat-wake"), "covered");
});

test("a mapped record with unresolved parts leaves its entry with gaps", () => {
  assert.equal(status([veil], "strat-veil"), "gaps");
});

test("an entry with no mapped record is missing", () => {
  assert.equal(status([wake], "strat-tide"), "missing");
});

test("a record checked against another update is ambiguous", () => {
  assert.equal(status([{ ...wake, rulesVersion: { edition: "synthetic", update: "1.1" } }], "strat-wake"), "ambiguous");
});

test("two records mapped to one entry are ambiguous", () => {
  assert.equal(status([wake, veil], "strat-wake", { [wake.id]: "strat-wake", [veil.id]: "strat-wake" }), "ambiguous");
});

test("mappings to unknown entries and unmapped records are problems", () => {
  const { problems } = coverage(inventory, [wake, veil], { [wake.id]: "strat-gone" });
  assert.deepEqual(problems, [`record "${wake.id}" maps to "strat-gone", which the inventory lacks`, `record "${veil.id}" has no mapping`]);
});

test("a group's name is counted even if it matches an object property", () => {
  const [first] = inventory.entries;
  const result = coverage({ ...inventory, entries: [{ ...first!, group: "constructor" }] }, [], {});
  assert.equal(Object.entries(result.byGroup).find(([name]) => name === "constructor")?.[1].missing, 1);
});
