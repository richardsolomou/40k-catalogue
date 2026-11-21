import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { checkUpgrade, historyErrors, type Release } from "../src/catalogue-identity/identity.ts";
import { buildCatalogueRelease, type CatalogueRecord, type Manifest } from "../src/catalogue-releases/catalogue.ts";
import { validateDefinitions, type Definitions } from "../src/roster-definitions/definitions.ts";
import { checkRoster, importUnit, pointsGaps, rosterRefs, type Roster } from "../src/roster-definitions/roster.ts";
import type { PointsSnapshot } from "../src/points/snapshot.ts";
import { validateSnapshot } from "../src/points/validate.ts";

const fixtures = new URL("../fixtures/roster-definitions/", import.meta.url);
const json = (path: string): any => JSON.parse(readFileSync(new URL(path, fixtures), "utf8"));
const input = (version: string) => ({
  identity: json(`${version}/identity.json`) as Release,
  records: readdirSync(new URL(`${version}/records/rosters/`, fixtures)).map((f) => json(`${version}/records/rosters/${f}`) as CatalogueRecord),
});

function definitions(version: string): Definitions {
  const { identity, records } = input(version);
  const result = validateDefinitions(identity, records);
  if (!result.ok) assert.fail(result.errors.join("\n"));
  return result.definitions;
}

const v10 = definitions("1.0");
const v11 = definitions("1.1");
const legal10 = json("rosters/legal-1.0.json") as Roster;
const legal11 = json("rosters/legal-1.1.json") as Roster;
const WARDENS = "synthetic.ember-host.flame-wardens";
const WARDEN = `${WARDENS}.warden`;
const DRONES = "synthetic.ember-host.ash-drones";
const LORD = "synthetic.ember-host.pyre-lord";
const codes = (definitions: Definitions, roster: Roster) => checkRoster(definitions, roster).map((p) => `${p.unit ?? "-"} ${p.code}`);
const edited = (change: (roster: Roster) => void) => {
  const roster = structuredClone(legal11);
  change(roster);
  return roster;
};

test("both rules versions form a valid identity history", () => {
  assert.deepEqual(historyErrors([v10.identity, v11.identity]), []);
});

test("unit options stay in ID order when input records arrive in reverse order", () => {
  const { identity, records } = input("1.1");
  const result = validateDefinitions(identity, records.toReversed());
  if (!result.ok) assert.fail(result.errors.join("\n"));
  const ids = result.definitions.optionsOf(WARDENS).map(({ id }) => id);
  assert.deepEqual(ids, ["cannon", "carbines", "leader-weapon", "projector"].map((option) => `${WARDENS}.${option}`));
});

test("both rules versions build complete catalogue releases", () => {
  const dir = (version: string) => fileURLToPath(new URL(version, fixtures));
  const first = buildCatalogueRelease(dir("1.0"), { release: "0.1.0", commit: "0".repeat(40) });
  assert.ok(first.ok, JSON.stringify(first));
  const second = buildCatalogueRelease(dir("1.1"), { release: "0.2.0", commit: "0".repeat(40), previous: first.files });
  assert.ok(second.ok, JSON.stringify(second));
  const manifest = JSON.parse(second.files.get("manifest.json")!.toString()) as Manifest;
  assert.deepEqual(manifest.categories.map((c) => [c.name, c.status]), [["rosters", "complete"]]);
});

const invalid: Record<string, [(records: CatalogueRecord[], identity: Release) => void, string]> = {
  "an unknown data field": [(r) => Object.assign(find(r, "unit", WARDENS).data, { points: 90 }), `unit:${WARDENS} data must NOT have additional properties`],
  "a size its models cannot reach": [(r) => ((find(r, "unit", WARDENS).data as any).sizes = [5, 12]), `unit:${WARDENS} size 12 is outside its models' 5-10`],
  "a join its identity entry omits": [
    (_, identity) => (identity.entries.find((e) => e.id === WARDEN)!.references = [{ kind: "unit", id: WARDENS }]),
    `model:${WARDEN} names wargear:synthetic.ember-rifle but its identity entry does not reference it`,
  ],
  "a record for a retired entry": [
    (r) => r.push({ ...find(r, "roster-option", `${WARDENS}.cannon`), id: `${WARDENS}.heavy-weapon` }),
    `roster-option:${WARDENS}.heavy-weapon is retired in the identity release`,
  ],
  "a record for another rules version": [
    (r) => (find(r, "unit", WARDENS).rulesVersion = v10.identity.rulesVersion),
    `unit:${WARDENS} belongs to a different rules version`,
  ],
  "a cap on wargear its option does not offer": [
    (r) => ((find(r, "roster-option", `${DRONES}.payload`).data as any).caps[1].choices = ["synthetic.ember-rifle"]),
    `roster-option:${DRONES}.payload caps wargear:synthetic.ember-rifle, which it does not offer`,
  ],
  "a requirement on another unit's option": [
    (r) => ((find(r, "roster-option", `${LORD}.ward`).data as any).requires = { option: `${WARDENS}.leader-weapon`, choices: ["synthetic.twin-ash-blades"] }),
    `roster-option:${LORD}.ward requires roster-option:${WARDENS}.leader-weapon, which belongs to another unit`,
  ],
  "two limits for one battle size": [
    (r) => (find(r, "unit", WARDENS).data as any).limits.push({ battleSize: "synthetic.incursion", perRoster: 2 }),
    `unit:${WARDENS} limits battle-size:synthetic.incursion more than once`,
  ],
  "replacing wargear the carrier lacks": [
    (r) => ((find(r, "roster-option", `${WARDENS}.leader-weapon`).data as any).replaces = ["synthetic.ember-rifle"]),
    `roster-option:${WARDENS}.leader-weapon replaces wargear:synthetic.ember-rifle, which its carriers do not carry`,
  ],
};

function find(records: CatalogueRecord[], kind: string, id: string): CatalogueRecord {
  return records.find((r) => r.kind === kind && r.id === id)!;
}

for (const [name, [change, error]] of Object.entries(invalid)) {
  test(`definitions with ${name} fail with: ${error}`, () => {
    const { identity, records } = input("1.1");
    change(records, identity);
    const result = validateDefinitions(identity, records);
    assert.ok(!result.ok && result.errors.includes(error), JSON.stringify(result));
  });
}

test("a legal roster has no problems", () => {
  assert.deepEqual(codes(v11, legal11), []);
});

test("an identity without a unit definition does not let a roster pass", () => {
  const { identity, records } = input("1.1");
  const result = validateDefinitions(identity, records.filter((r) => r.kind === "faction" || r.kind === "detachment"));
  assert.ok(result.ok);
  assert.deepEqual(codes(result.definitions, { ...legal11, units: [legal11.units[0]!] }), ["0 missing-definition"]);
});

const SIGIL = "synthetic.kindled-vow.ash-sigil";
const MANTLE = "synthetic.kindled-vow.cinder-mantle";
const BRAND = "synthetic.kindled-vow.brand-of-ash";
const illegal: Record<string, [(roster: Roster) => void, string[]]> = {
  "a unit outside its sizes": [(r) => (r.units[0]!.models = { [WARDEN]: 6 }), ["0 unit-size"]],
  "a model above its maximum": [(r) => (r.units[4]!.models = { "synthetic.ember-host.ash-drones.drone": 4 }), ["4 model-count", "4 unit-size"]],
  "more selections than every five models allow": [(r) => (r.units[1]!.options = { [`${WARDENS}.cannon`]: { "synthetic.cinder-cannon": 2 } }), ["1 option-count"]],
  "more selections than carriers": [(r) => (r.units[1]!.options = { [`${WARDENS}.carbines`]: { "synthetic.ember-carbine": 5 } }), ["1 option-count"]],
  "a negative choice count": [
    (r) => (r.units[1]!.options = { [`${WARDENS}.cannon`]: { "synthetic.cinder-cannon": 1, "synthetic.ember-rifle": -1 } }),
    ["1 option-quantity"],
  ],
  "more of one choice than its carriers may take": [(r) => (r.units[4]!.options = { [`${DRONES}.payload`]: { "synthetic.ash-carbine": 3 } }), ["4 option-cap"]],
  "more of one choice than the unit may take": [(r) => (r.units[4]!.options = { [`${DRONES}.payload`]: { "synthetic.ember-carbine": 2 } }), ["4 option-cap"]],
  "an option its required choice has not opened": [(r) => (r.units[2]!.options![`${LORD}.ward`] = { "synthetic.ward-shield": 1 }), ["2 option-unavailable"]],
  "an option its required choice opens": [
    (r) => (r.units[2]!.options = { [`${LORD}.staff`]: { "synthetic.twin-ash-blades": 1 }, [`${LORD}.ward`]: { "synthetic.ward-shield": 1 } }),
    [],
  ],
  "a uniform option taken by only some carriers": [(r) => (r.units[1]!.options = { [`${WARDENS}.carbines`]: { "synthetic.ember-carbine": 2 } }), ["1 option-uniform"]],
  "a uniform option split between choices": [(r) => (r.units[1]!.options = { [`${WARDENS}.carbines`]: { "synthetic.ember-carbine": 2, "synthetic.ash-carbine": 2 } }), ["1 option-uniform"]],
  "wargear its option does not offer": [(r) => (r.units[2]!.options = { "synthetic.ember-host.pyre-lord.staff": { "synthetic.ember-maul": 1 } }), ["2 option-choice"]],
  "an option from another unit": [(r) => (r.units[3]!.options = { "synthetic.ember-host.pyre-lord.staff": { "synthetic.maul-and-shield": 1 } }), ["3 unit-option"]],
  "an enhancement that allows Epic Heroes": [(r) => (r.units[3]!.enhancement = MANTLE), []],
  "an enhancement that excludes Epic Heroes": [(r) => ((r.units[3]!.enhancement = SIGIL), delete r.units[2]!.enhancement), ["3 enhancement-keywords"]],
  "an enhancement on a unit without its keywords": [(r) => (r.units[4]!.enhancement = MANTLE), ["4 enhancement-keywords"]],
  "an enhancement on a unit barred from enhancements": [(r) => r.units.push({ unit: "synthetic.ember-host.ember-colossus", enhancement: MANTLE }), ["5 enhancement-keywords"]],
  "an enhancement taken twice": [(r) => r.units.push({ unit: "synthetic.ember-host.pyre-lord", enhancement: SIGIL }), ["5 enhancement-repeated"]],
  "an upgrade taken twice": [(r) => ((r.units[0]!.enhancement = BRAND), (r.units[1]!.enhancement = BRAND)), []],
  "more copies than its battle size allows": [(r) => (r.battleSize = "synthetic.incursion"), ["1 roster-limit"]],
  "a battle size without its own limit for the unit": [(r) => (r.battleSize = "synthetic.strike-force"), []],
  "a battle size the release does not define": [(r) => (r.battleSize = "synthetic.onslaught"), ["- not-current"]],
  "a second copy of a unit limited to one": [(r) => r.units.push({ unit: "synthetic.ember-host.the-kindler" }), ["5 roster-limit"]],
  "an ID the release retired": [(r) => (r.units[0]!.options = { [`${WARDENS}.heavy-weapon`]: { "synthetic.cinder-cannon": 1 } }), ["0 not-current"]],
};

for (const [name, [change, expected]] of Object.entries(illegal)) {
  test(`a roster with ${name} reports ${expected.join(", ") || "nothing"}`, () => {
    assert.deepEqual(codes(v11, edited(change)), expected);
  });
}

test("a roster saved under the earlier rules version stays legal there", () => {
  assert.deepEqual(codes(v10, legal10), []);
});

test("upgrading that roster lists the aliased wargear and the split option", () => {
  const findings = checkUpgrade(v11.identity, rosterRefs(legal10)).map((f) => `${f.ref.id} ${f.resolution.status}`);
  assert.deepEqual(findings, [`${WARDENS}.heavy-weapon retired`, "synthetic.paired-ash-blades aliased"]);
});

test("an import reads a printed unit into catalogue IDs", () => {
  const read = importUnit(v11, "synthetic.ember-host", { name: "flame warden squad", models: 10, wargear: { "Cinder Cannon": 1, "Ember Pistol": 1 } });
  assert.deepEqual(read, { ok: true, unit: { unit: WARDENS, models: { [`${WARDENS}.leader`]: 1, [WARDEN]: 9 }, options: { [`${WARDENS}.cannon`]: { "synthetic.cinder-cannon": 1 } } } });
});

test("a size-specific option bound can close a choice even with eligible carriers", () => {
  const { identity, records } = input("1.1");
  Object.assign(find(records, "roster-option", `${WARDENS}.cannon`).data, { bySize: [{ size: 5, min: 0, max: 0 }] });
  const validated = validateDefinitions(identity, records);
  if (!validated.ok) assert.fail(validated.errors.join("\n"));
  const roster = edited((r) => {
    r.units[1]!.options = { [`${WARDENS}.cannon`]: { "synthetic.cinder-cannon": 1 } };
  });
  assert.deepEqual(codes(validated.definitions, roster), ["1 option-count"]);
});

test("a cap uses the absolute maximum for its unit size", () => {
  const { identity, records } = input("1.1");
  const payload = find(records, "roster-option", `${DRONES}.payload`);
  Object.assign(payload.data, { caps: [{ choices: ["synthetic.ash-carbine"], max: 1, per: "carrier", bySize: [{ size: 2, max: 1 }] }] });
  const validated = validateDefinitions(identity, records);
  if (!validated.ok) assert.fail(validated.errors.join("\n"));
  assert.deepEqual(codes(validated.definitions, legal11), ["4 option-cap"]);
});

test("a saved model mix is checked against its total size", () => {
  const { identity, records } = input("1.1");
  const leader = `${WARDENS}.leader`;
  Object.assign(find(records, "model", leader).data, { max: 2, bySize: [{ size: 10, min: 2, max: 2 }] });
  const validated = validateDefinitions(identity, records);
  if (!validated.ok) assert.fail(validated.errors.join("\n"));
  assert.deepEqual(codes(validated.definitions, legal11), ["0 model-count"]);
});

test("model bounds for a selected size can make an import unambiguous", () => {
  const { identity, records } = input("1.1");
  const leader = `${WARDENS}.leader`;
  Object.assign(find(records, "model", leader).data, { max: 2, bySize: [{ size: 10, min: 2, max: 2 }] });
  const validated = validateDefinitions(identity, records);
  if (!validated.ok) assert.fail(validated.errors.join("\n"));
  assert.deepEqual(importUnit(validated.definitions, "synthetic.ember-host", { name: "Flame Warden Squad", models: 10 }), {
    ok: true, unit: { unit: WARDENS, models: { [leader]: 2, [WARDEN]: 8 } },
  });
});

test("a bound cannot name an unlisted unit size", () => {
  const { identity, records } = input("1.1");
  const id = `${WARDENS}.cannon`;
  Object.assign(find(records, "roster-option", id).data, { bySize: [{ size: 6, min: 0, max: 1 }] });
  assert.deepEqual(validateDefinitions(identity, records), { ok: false, errors: [`roster-option:${id} bySize names unlisted size 6`] });
});

test("an import does not match a unit's name from an earlier rules version", () => {
  assert.deepEqual(importUnit(v11, "synthetic.ember-host", { name: "Flame Wardens", models: 5 }), { ok: false, misses: [{ code: "unknown-unit", name: "Flame Wardens" }] });
});

test("an import cannot discard a mismatched count for a unit with fixed models", () => {
  assert.deepEqual(importUnit(v11, "synthetic.ember-host", { name: "Pyre Lord", models: 2 }), {
    ok: false,
    misses: [{ code: "model-count-mismatch", name: "Pyre Lord" }],
  });
});

test("an import reports wargear two options offer instead of choosing one", () => {
  const { identity, records } = input("1.1");
  (find(records, "roster-option", `${WARDENS}.projector`).data as any).choices.push("synthetic.cinder-cannon");
  identity.entries.find((e) => e.id === `${WARDENS}.projector`)!.references!.push({ kind: "wargear", id: "synthetic.cinder-cannon" });
  const result = validateDefinitions(identity, records);
  assert.ok(result.ok);
  assert.deepEqual(importUnit(result.definitions, "synthetic.ember-host", { name: "Flame Warden Squad", models: 5, wargear: { "cinder cannon": 1 } }), {
    ok: false,
    misses: [{ code: "ambiguous-wargear", name: "cinder cannon" }],
  });
});

test("points joins report every unpriced size, enhancement, and undefined priced unit", () => {
  const snapshot = validateSnapshot(json("points-1.1.json"));
  assert.ok(snapshot.ok);
  assert.deepEqual(pointsGaps(v11, (snapshot as { snapshot: PointsSnapshot }).snapshot), [
    { ref: { kind: "unit", id: "synthetic.ember-host.ash-drones" }, models: 3, reason: "no-size" },
    { ref: { kind: "enhancement", id: MANTLE }, reason: "unknown-enhancement" },
    { ref: { kind: "unit", id: "synthetic.ember-host.ash-wyrm" }, reason: "no-definition" },
  ]);
});
