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
const v12 = definitions("1.2");
const legal10 = json("rosters/legal-1.0.json") as Roster;
const legal11 = json("rosters/legal-1.1.json") as Roster;
const legal12 = json("rosters/legal-1.2.json") as Roster;
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

test("all three rules versions form a valid identity history", () => {
  assert.deepEqual(historyErrors([v10.identity, v11.identity, v12.identity]), []);
});

test("unit options stay in ID order when input records arrive in reverse order", () => {
  const { identity, records } = input("1.1");
  const result = validateDefinitions(identity, records.toReversed());
  if (!result.ok) assert.fail(result.errors.join("\n"));
  const ids = result.definitions.optionsOf(WARDENS).map(({ id }) => id);
  assert.deepEqual(ids, ["cannon", "carbines", "leader-weapon", "projector"].map((option) => `${WARDENS}.${option}`));
});

test("all three rules versions build complete catalogue releases", () => {
  const dir = (version: string) => fileURLToPath(new URL(version, fixtures));
  const first = buildCatalogueRelease(dir("1.0"), { release: "0.1.0", commit: "0".repeat(40) });
  assert.ok(first.ok, JSON.stringify(first));
  const second = buildCatalogueRelease(dir("1.1"), { release: "0.2.0", commit: "0".repeat(40), previous: first.files });
  assert.ok(second.ok, JSON.stringify(second));
  const third = buildCatalogueRelease(dir("1.2"), { release: "0.3.0", commit: "0".repeat(40), previous: second.files });
  assert.ok(third.ok, JSON.stringify(third));
  const manifest = JSON.parse(third.files.get("manifest.json")!.toString()) as Manifest;
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
  "an option group with another unit's option": [
    (r, identity) => {
      (find(r, "unit", WARDENS).data as any).optionGroups[0].options[1] = { option: `${LORD}.staff` };
      identity.entries.find((e) => e.id === WARDENS)!.references!.push({ kind: "roster-option", id: `${LORD}.staff` });
    },
    `unit:${WARDENS} optionGroups/0 names roster-option:${LORD}.staff, which belongs to another unit`,
  ],
  "an option group with wargear its option does not offer": [
    (r, identity) => {
      (find(r, "unit", WARDENS).data as any).optionGroups[0].options[0].choices = ["synthetic.scorch-projector"];
      identity.entries.find((e) => e.id === WARDENS)!.references!.push({ kind: "wargear", id: "synthetic.scorch-projector" });
    },
    `unit:${WARDENS} optionGroups/0 names wargear:synthetic.scorch-projector, which roster-option:${WARDENS}.cannon does not offer`,
  ],
  "an option group naming one option twice": [
    (r) => ((find(r, "unit", WARDENS).data as any).optionGroups[0].options[1] = { option: `${WARDENS}.cannon` }),
    `unit:${WARDENS} optionGroups/0 names roster-option:${WARDENS}.cannon more than once`,
  ],
  "a bundle that includes itself through another bundle": [
    (r, identity) => {
      (find(r, "wargear", "synthetic.ember-maul").data as any).includes = ["synthetic.maul-and-shield", "synthetic.ward-shield"];
      identity.entries.find((e) => e.id === "synthetic.ember-maul")!.references = [{ kind: "wargear", id: "synthetic.maul-and-shield" }, { kind: "wargear", id: "synthetic.ward-shield" }];
    },
    "wargear:synthetic.maul-and-shield includes itself",
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
  "more selections across options than their group allows": [
    (r) => (r.units[0]!.options![`${WARDENS}.cannon`] = { "synthetic.cinder-cannon": 2 }),
    ["0 option-group-count"],
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

test("an option group counts only the choices it names", () => {
  const { identity, records } = input("1.1");
  (find(records, "unit", WARDENS).data as any).optionGroups = [{ options: [{ option: `${WARDENS}.leader-weapon`, choices: ["synthetic.twin-ash-blades"] }, { option: `${WARDENS}.cannon` }], max: 1 }];
  identity.entries.find((e) => e.id === WARDENS)!.references!.push({ kind: "roster-option", id: `${WARDENS}.leader-weapon` }, { kind: "wargear", id: "synthetic.twin-ash-blades" });
  const validated = validateDefinitions(identity, records);
  if (!validated.ok) assert.fail(validated.errors.join("\n"));
  const withMaul = edited((r) => (r.units[0]!.options![`${WARDENS}.leader-weapon`] = { "synthetic.ember-maul": 1 }));
  assert.deepEqual([codes(validated.definitions, legal11), codes(validated.definitions, withMaul)], [["0 option-group-count"], []]);
});

test("a saved model mix is checked against its total size", () => {
  const { identity, records } = input("1.1");
  const leader = `${WARDENS}.leader`;
  Object.assign(find(records, "model", leader).data, { max: 2, bySize: [{ size: 10, min: 2, max: 2 }] });
  const validated = validateDefinitions(identity, records);
  if (!validated.ok) assert.fail(validated.errors.join("\n"));
  assert.deepEqual(codes(validated.definitions, legal11), ["0 model-count"]);
});

test("a shared model bound counts regular and alternate loadouts together", () => {
  const { identity, records } = input("1.1");
  const alternate = `${WARDENS}.alternate-warden`;
  const leader = `${WARDENS}.leader`;
  const original = find(records, "model", WARDEN);
  const originalEntry = identity.entries.find(({ id }) => id === WARDEN)!;
  identity.entries.push({ ...originalEntry, id: alternate, name: "Alternate Warden" });
  records.push({ ...original, id: alternate, data: { ...original.data, min: 0 } });
  Object.assign(find(records, "model", WARDEN).data, { min: 0 });
  Object.assign(find(records, "model", leader).data, { max: 2 });
  Object.assign(find(records, "unit", WARDENS).data, {
    modelGroups: [{ models: [WARDEN, alternate], min: 4, max: 4, bySize: [{ size: 10, min: 9, max: 9 }] }],
  });
  const unitEntry = identity.entries.find(({ id }) => id === WARDENS)!;
  unitEntry.references!.push({ kind: "model", id: WARDEN }, { kind: "model", id: alternate });
  const result = validateDefinitions(identity, records);
  if (!result.ok) assert.fail(result.errors.join("\n"));
  const mixed = { ...legal11, units: [{ unit: WARDENS, models: { [WARDEN]: 7, [alternate]: 2, [leader]: 1 } }] };
  assert.deepEqual(codes(result.definitions, mixed), []);
  mixed.units[0]!.models[leader] = 2;
  mixed.units[0]!.models[alternate] = 1;
  assert.deepEqual(codes(result.definitions, mixed), ["0 model-group-count"]);
});

test("a shared model bound cannot include models from two units", () => {
  const { identity, records } = input("1.1");
  const foreign = `${LORD}.lord`;
  Object.assign(find(records, "unit", WARDENS).data, { modelGroups: [{ models: [WARDEN, foreign], min: 3, max: 9 }] });
  identity.entries.find(({ id }) => id === WARDENS)!.references!.push({ kind: "model", id: WARDEN }, { kind: "model", id: foreign });
  assert.deepEqual(validateDefinitions(identity, records), {
    ok: false, errors: [`unit:${WARDENS} modelGroups/0 names model:${foreign}, which belongs to another unit`],
  });
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

test("an import preserves a printed mix of named models", () => {
  const { identity, records } = input("1.1");
  const leader = `${WARDENS}.leader`;
  Object.assign(find(records, "model", leader).data, { max: 2 });
  const result = validateDefinitions(identity, records);
  if (!result.ok) assert.fail(result.errors.join("\n"));
  const printed = { name: "Flame Warden Squad", models: 10, modelCounts: { "Warden Leader": 2, warden: 8 } };
  assert.deepEqual(importUnit(result.definitions, "synthetic.ember-host", printed), {
    ok: true, unit: { unit: WARDENS, models: { [leader]: 2, [WARDEN]: 8 } },
  });
});

test("an import reports an unknown printed model", () => {
  const printed = { name: "Flame Warden Squad", models: 5, modelCounts: { "Sentry": 1, "Warden": 4 } };
  assert.deepEqual(importUnit(v11, "synthetic.ember-host", printed), {
    ok: false, misses: [{ code: "unknown-model", name: "Sentry" }],
  });
});

test("an import rejects a printed mix that disagrees with the unit total", () => {
  const printed = { name: "Flame Warden Squad", models: 5, modelCounts: { "Warden Leader": 1, "Warden": 5 } };
  assert.deepEqual(importUnit(v11, "synthetic.ember-host", printed), {
    ok: false, misses: [{ code: "model-count-mismatch", name: "Flame Warden Squad" }],
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

// Format version 2: counted wargear, conditions, shared and per-size bounds, substitutes, compositions.
const COLOSSUS = "synthetic.ember-host.ember-colossus";
const PACK = "synthetic.ember-host.cinder-pack";
const ASH_PACT = "synthetic.ash-pact";
const BANNER = "synthetic.kindled-vow.vanguard-banner";
const LORD_MODEL = `${LORD}.lord`;
const edited12 = (change: (roster: Roster) => void) => {
  const roster = structuredClone(legal12);
  change(roster);
  return roster;
};
const ashPact = (units: Roster["units"]): Roster => ({ faction: "synthetic.ember-host", detachment: ASH_PACT, battleSize: "synthetic.incursion", units });

test("version 1 wargear lists read as counts of one", () => {
  assert.deepEqual(v11.get("model", `${WARDENS}.leader`)!.data.wargear, { "synthetic.ember-pistol": 1, "synthetic.ash-blade": 1 });
});

test("a version 2 model carries a count of each wargear", () => {
  assert.deepEqual(v12.get("model", `${COLOSSUS}.colossus`)!.data.wargear, { "synthetic.cinder-cannon": 2 });
});

test("definitions mixing format versions fail", () => {
  const { identity, records } = input("1.2");
  find(records, "wargear", "synthetic.ash-blade").data = {};
  assert.deepEqual(validateDefinitions(identity, records), { ok: false, errors: ["records mix roster definition format versions 1 and 2"] });
});

const invalid12: Record<string, [(records: CatalogueRecord[], identity: Release) => void, string]> = {
  "a replacement of more than a carrier carries": [
    (r) => ((find(r, "roster-option", `${COLOSSUS}.cannons`).data as any).replaces["synthetic.cinder-cannon"] = 3),
    `roster-option:${COLOSSUS}.cannons replaces 3 of wargear:synthetic.cinder-cannon, but its carriers carry 2`,
  ],
  "a bundle of a single item": [
    (r) => ((find(r, "wargear", "synthetic.twin-scorch-projectors").data as any).includes["synthetic.scorch-projector"] = 1),
    "wargear:synthetic.twin-scorch-projectors includes fewer than two items",
  ],
  "substitutes on an option that is not uniform": [
    (r) => delete (find(r, "roster-option", `${WARDENS}.carbines`).data as any).uniform,
    `roster-option:${WARDENS}.carbines has substitutes but is not uniform`,
  ],
  "a limit after a row that always applies": [
    (r) => (find(r, "unit", DRONES).data as any).limits.reverse(),
    `unit:${DRONES} limits battle-size:synthetic.incursion after a row that always applies`,
  ],
  "an option group scaled per carrier without a carrier": [
    (r) => ((find(r, "unit", WARDENS).data as any).optionGroups[0].per = "carrier"),
    `unit:${WARDENS} optionGroups/0 names a carrier exactly when it scales per carrier`,
  ],
  "a size no composition reaches": [
    (r) => {
      const compositions = (find(r, "unit", PACK).data as any).compositions;
      compositions.splice(1, 2, compositions[0]);
    },
    `unit:${PACK} size 6 fits none of its compositions`,
  ],
};

for (const [name, [change, error]] of Object.entries(invalid12)) {
  test(`version 2 definitions with ${name} fail with: ${error}`, () => {
    const { identity, records } = input("1.2");
    change(records, identity);
    const result = validateDefinitions(identity, records);
    assert.ok(!result.ok && result.errors.includes(error), JSON.stringify(result));
  });
}

test("a legal version 2 roster has no problems", () => {
  assert.deepEqual(codes(v12, legal12), []);
});

const illegal12: Record<string, [Roster, string[]]> = {
  "a counted replacement taken twice": [edited12((r) => (r.units[5]!.options![`${COLOSSUS}.cannons`]!["synthetic.twin-scorch-projectors"] = 2)), ["5 option-count"]],
  "two heavy weapons in five models": [edited12((r) => (r.units[1]!.options![`${WARDENS}.cannon`] = { "synthetic.cinder-cannon": 1 }, r.units[1]!.options![`${WARDENS}.projector`] = { "synthetic.scorch-projector": 1 })), ["1 option-group-count"]],
  "a uniform choice short of the models without a substitute": [edited12((r) => (r.units[1]!.options![`${WARDENS}.carbines`] = { "synthetic.ember-carbine": 2, "synthetic.cinder-lance": 1 })), ["1 option-uniform"]],
  "a substitute without the uniform choice": [edited12((r) => (r.units[1]!.options![`${WARDENS}.carbines`] = { "synthetic.cinder-lance": 1 })), []],
  "a model mix no composition offers": [edited12((r) => (r.units[6]!.models = { [`${PACK}.hunter`]: 4, [`${PACK}.hound`]: 2 })), ["6 unit-composition"]],
  "a unit no roster may hold": [edited12((r) => r.units.push({ unit: "synthetic.ember-host.ember-herald" })), ["7 roster-limit"]],
  "more units with a faction's limited keywords than it allows": [edited12((r) => r.units.push({ unit: LORD })), ["7 unit-limit"]],
  "an enhancement a warlord's condition has not opened": [edited12((r) => (r.units[0]!.enhancement = BANNER)), ["0 enhancement-keywords"]],
  "an enhancement a warlord's condition opens": [edited12((r) => ((r.units[0]!.enhancement = BANNER), (r.units[2]!.warlord = LORD_MODEL))), []],
  "a warlord model from another unit": [edited12((r) => (r.units[0]!.warlord = LORD_MODEL)), ["0 unit-model"]],
  "two warlords": [edited12((r) => ((r.units[2]!.warlord = LORD_MODEL), (r.units[3]!.warlord = "synthetic.ember-host.the-kindler.kindler"))), ["2 warlord-repeated", "3 warlord-repeated"]],
  "two copies limited to one outside the detachment that raises it": [{ ...ashPact([{ unit: DRONES }, { unit: DRONES }]), detachment: "synthetic.kindled-vow" }, ["1 roster-limit"]],
  "two copies in the detachment that raises their limit": [ashPact([{ unit: DRONES }, { unit: DRONES }]), []],
  "fewer units with a detachment's required keywords than it needs": [ashPact([{ unit: LORD }]), ["- unit-limit"]],
  "more units than a detachment's own bound allows": [ashPact([{ unit: DRONES }, { unit: LORD }, { unit: "synthetic.ember-host.the-kindler" }]), ["2 unit-limit"]],
};

for (const [name, [roster, expected]] of Object.entries(illegal12)) {
  test(`a version 2 roster with ${name} reports ${expected.join(", ") || "nothing"}`, () => {
    assert.deepEqual(codes(v12, roster), expected);
  });
}

test("a version 2 import keeps counted default wargear off the roster", () => {
  assert.deepEqual(importUnit(v12, "synthetic.ember-host", { name: "Ember Colossus", models: 1, wargear: { "Cinder Cannon": 2 } }), {
    ok: true, unit: { unit: COLOSSUS, models: { [`${COLOSSUS}.colossus`]: 1 } },
  });
});

test("points joins skip a unit no roster may hold", () => {
  const snapshot = validateSnapshot(json("points-1.2.json"));
  assert.ok(snapshot.ok);
  assert.deepEqual(pointsGaps(v12, (snapshot as { snapshot: PointsSnapshot }).snapshot), [
    { ref: { kind: "enhancement", id: MANTLE }, reason: "unknown-enhancement" },
    { ref: { kind: "unit", id: "synthetic.ember-host.ash-wyrm" }, reason: "no-definition" },
  ]);
});

test("an option without a carrier may replace wargear the unit itself carries", () => {
  const { identity, records } = input("1.2");
  Object.assign(find(records, "unit", PACK).data, { wargear: { "synthetic.ember-staff": 1 } });
  identity.entries.find((e) => e.id === PACK)!.references!.push({ kind: "wargear", id: "synthetic.ember-staff" });
  records.push({ ...find(records, "roster-option", `${COLOSSUS}.cannons`), id: `${PACK}.staff`, data: { formatVersion: 2, unit: PACK, choose: { min: 0, max: 1 }, replaces: { "synthetic.ember-staff": 1 }, choices: ["synthetic.ember-maul"] } as any });
  identity.entries.push({ kind: "roster-option", id: `${PACK}.staff`, name: "Staff", references: [{ kind: "unit", id: PACK }, { kind: "wargear", id: "synthetic.ember-staff" }, { kind: "wargear", id: "synthetic.ember-maul" }] });
  assert.deepEqual(validateDefinitions(identity, records).ok, true);
});

test("a weighted option group member counts each selection that many times", () => {
  const { identity, records } = input("1.2");
  (find(records, "unit", WARDENS).data as any).optionGroups = [{ options: [{ option: `${WARDENS}.cannon`, weight: 2 }, { option: `${WARDENS}.projector` }], max: 2 }];
  const validated = validateDefinitions(identity, records);
  if (!validated.ok) assert.fail(validated.errors.join("\n"));
  assert.deepEqual(codes(validated.definitions, legal12), ["0 option-group-count"]);
});
