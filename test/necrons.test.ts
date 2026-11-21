import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { renderSummary } from "../src/render.ts";
import { validate } from "../src/validate.ts";

const records = new URL("../data/necrons/pantheon-of-woe/", import.meta.url);
const read = (path: string) => readFileSync(new URL(path, records), "utf8");
const record = (name: string) => JSON.parse(read(`${name}.json`));
const names = readdirSync(records).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5));

function errors(value: unknown): string[] {
  const result = validate(value);
  return result.ok ? [] : result.errors;
}

function gaps(value: unknown) {
  const result = validate(value);
  if (!result.ok) assert.fail(result.errors.join("\n"));
  return result.gaps;
}

for (const name of names) {
  test(`${name} renders its reviewed summary`, () => {
    const result = validate(record(name));
    if (!result.ok) assert.fail(result.errors.join("\n"));
    assert.equal(renderSummary(result.record), read(`${name}.summary.txt`).trimEnd());
  });
}

test("Disharmonisation Cascade cannot target the destroyed model unless a model's destruction triggers it", () => {
  const cascade = record("disharmonisation-cascade");
  const unitTrigger = { ...cascade, trigger: { kind: "unit-destroyed", unit: { side: "friendly" }, by: { side: "enemy" } } };
  assert.ok(errors(unitTrigger).includes("/target/unit refers to a triggering model, but the trigger has none"));
});

test("the destroyed-model exception cannot apply to a different target", () => {
  const cascade = record("disharmonisation-cascade");
  assert.ok(errors({ ...cascade, target: { unit: "this-unit", allowDestroyed: true } }).length);
});

test("Mass Transmogrification measures from the unit that made the kill only when a destruction triggers it", () => {
  const phaseTrigger = { ...record("mass-transmogrification"), trigger: { kind: "phase-end", phase: "fight", turn: "any" } };
  assert.ok(errors(phaseTrigger).includes("/target/select/within/of refers to a destroying unit, but the trigger has none"));
});

test("Phase Melding's tests must belong to a unit the trigger introduces", () => {
  const phaseTrigger = { ...record("phase-melding"), trigger: { kind: "phase-start", phase: "movement", turn: "opponent" } };
  assert.ok(errors(phaseTrigger).includes("/effect/unit refers to a triggering unit, but the trigger has none"));
});

test("each pilot record has no outstanding mechanics gaps", () => {
  for (const name of names) assert.deepEqual(gaps(record(name)), [], name);
});

test("a recorded Battle-shock penalty applies to each Desperate Escape test", () => {
  const melding = record("phase-melding");
  assert.match(renderSummary(melding), /if it is Battle-shocked, subtract 1 from each test\.$/);
});

test("Reletavistic Tether's charge restriction is checked even when the distance boundary is unresolved", () => {
  const tether = { ...record("reletavistic-tether"), effect: { unresolved: "boundary under review" } };
  assert.match(renderSummary(tether), /within 8" of an enemy unit at the end of that move, it cannot declare a charge/);
});
