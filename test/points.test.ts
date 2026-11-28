import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { compareSnapshots } from "../src/points/compare.ts";
import { historyErrors, pointsAt, snapshotDigest } from "../src/points/history.ts";
import { lookupPoints, type PointsRef } from "../src/points/lookup.ts";
import { fromMfmFork, type ForkFaction } from "../src/points/mfm-fork.ts";
import type { PointsHistory, PointsSnapshot } from "../src/points/snapshot.ts";
import { validateHistory, validateSnapshot } from "../src/points/validate.ts";

const fixtures = new URL("../fixtures/points/", import.meta.url);
const json = (path: string): unknown => JSON.parse(readFileSync(new URL(path, fixtures), "utf8"));
const names = (dir: string) => readdirSync(new URL(dir, fixtures)).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5));

function snapshot(name: string): PointsSnapshot {
  const result = validateSnapshot(json(`valid/${name}.json`));
  if (!result.ok) assert.fail(result.errors.join("\n"));
  return result.snapshot;
}

const current = snapshot("synthetic-1-1");
const retired = snapshot("synthetic-1-0");
const history = json("history.json") as PointsHistory;
const unit = (unit: string, models: number, extra: Partial<Extract<PointsRef, { kind: "unit" }>> = {}): PointsRef => ({
  kind: "unit",
  faction: "ashen-choir",
  unit,
  models,
  ...extra,
});

for (const name of names("valid")) {
  test(`${name} validates`, () => {
    assert.equal(validateSnapshot(json(`valid/${name}.json`)).ok, true);
  });
}

const expectedErrors: Record<string, string> = {
  "missing-basis": "/ must have required property 'basis'",
  "mix-not-model-count": "/factions/0/units/0/tiers/0/costs/1/mix counts 5 models, not 6",
  "negative-points": "/factions/0/detachments/0/enhancements/0/points must match a schema in anyOf",
  "open-tier-before-last": `/factions/0/units/0/tiers/0/copies must have "to" unless it is the last tier`,
  "repeated-unit-id": `/factions/0/units/1/id repeats "cinder-wardens"`,
  "shared-model-count-without-composition": "/factions/0/units/0/tiers/0/costs/0 shares its model count with another row, so it needs a composition",
  "tier-gap": "/factions/0/units/0/tiers/1/copies/from must be 3",
};

test("every invalid points fixture has an expected error", () => {
  assert.deepEqual(names("invalid"), Object.keys(expectedErrors).sort());
});

for (const [name, error] of Object.entries(expectedErrors)) {
  test(`${name} fails validation with: ${error}`, () => {
    const result = validateSnapshot(json(`invalid/${name}.json`));
    assert.ok(!result.ok && result.errors.includes(error), JSON.stringify(result));
  });
}

test("unresolved values are reported as gaps", () => {
  const result = validateSnapshot(json("valid/synthetic-1-1.json"));
  assert.deepEqual(result.ok && result.gaps.map((g) => g.path), [
    "/factions/0/detachments/0/enhancements/2/points",
    "/factions/0/detachments/1/dp",
    "/factions/0/units/4/tiers/0/costs/0/points",
  ]);
});

test("the first copies of a unit cost the first tier", () => {
  assert.deepEqual(lookupPoints(current, unit("cinder-wardens", 5, { copy: 2 })), { ok: true, points: 80 });
});

test("a copy past the threshold costs the later tier", () => {
  assert.deepEqual(lookupPoints(current, unit("cinder-wardens", 5, { copy: 3 })), { ok: true, points: 90 });
});

test("a closed final tier prices its last copy and leaves later copies unpriced", () => {
  const capped = structuredClone(current);
  capped.factions[0]!.units[0]!.tiers[1]!.copies.to = 3;
  const result = validateSnapshot(capped);
  if (!result.ok) assert.fail(result.errors.join("\n"));
  assert.deepEqual([3, 4].map((copy) => lookupPoints(result.snapshot, unit("cinder-wardens", 5, { copy }))), [
    { ok: true, points: 90 },
    { ok: false, reason: "no-tier" },
  ]);
});

test("a count between the rows of a two-row table costs the upper row", () => {
  assert.deepEqual(lookupPoints(current, unit("cinder-wardens", 7)), { ok: true, points: 150 });
});

test("a count a longer table does not print has no price", () => {
  assert.deepEqual(lookupPoints(current, unit("kiln-drones", 3)), { ok: false, reason: "no-size" });
});

test("a count above the largest row has no price", () => {
  assert.deepEqual(lookupPoints(current, unit("cinder-wardens", 11)), { ok: false, reason: "no-size" });
});

test("rows that share a model count need a composition", () => {
  assert.deepEqual(lookupPoints(current, unit("pyre-hounds", 6)), { ok: false, reason: "ambiguous-size" });
});

test("a mix of models picks one of the rows that share a model count", () => {
  assert.deepEqual(lookupPoints(current, unit("pyre-hounds", 6, { mix: { "pyre-hounds.handler": 3, "pyre-hounds.hound": 3 } })), { ok: true, points: 95 });
});

test("a model a mix leaves out counts as none", () => {
  assert.deepEqual(lookupPoints(current, unit("pyre-hounds", 6, { mix: { "pyre-hounds.handler": 6 } })), { ok: true, points: 115 });
});

test("a row with no mix is still matched by its model count", () => {
  assert.deepEqual(lookupPoints(current, unit("pyre-hounds", 3, { mix: { "pyre-hounds.handler": 3 } })), { ok: true, points: 60 });
});

test("a mix no row gives prices none, not the circumstance row beside it", () => {
  assert.deepEqual(lookupPoints(current, unit("vigil-hounds", 6, { mix: { "vigil-hounds.handler": 3, "vigil-hounds.hound": 3 } })), { ok: false, reason: "no-size" });
});

test("a composition picks one of the rows that share a model count", () => {
  assert.deepEqual(lookupPoints(current, unit("pyre-hounds", 6, { composition: "3 Handlers, 3 Hounds" })), { ok: true, points: 95 });
});

test("an unresolved cost is a miss that carries its note", () => {
  assert.deepEqual(lookupPoints(current, unit("grey-reliquary", 1)), {
    ok: false,
    reason: "unresolved",
    note: "the first-copy cost is missing from the tariff",
  });
});

test("a unit the snapshot does not list is unknown rather than free", () => {
  assert.deepEqual(lookupPoints(current, unit("pyre-hounds-of-the-north", 3)), { ok: false, reason: "unknown-unit" });
});

test("an upgrade is priced like an enhancement", () => {
  const ref: PointsRef = { kind: "enhancement", faction: "ashen-choir", detachment: "lantern-vigil", enhancement: "cinder-litany" };
  assert.deepEqual(lookupPoints(current, ref), { ok: true, points: 10 });
});

test("wargear is priced per item", () => {
  const ref: PointsRef = { kind: "wargear", faction: "ashen-choir", unit: "ashen-herald", item: "Ember Lance" };
  assert.deepEqual(lookupPoints(current, ref), { ok: true, points: 10 });
});

test("a retired update still recovers its own points", () => {
  assert.deepEqual(pointsAt([current, retired], "synthetic-1-0", unit("cinder-wardens", 5, { copy: 3 })), { ok: true, points: 75 });
});

test("an unknown update never falls back to current points", () => {
  assert.deepEqual(pointsAt([current, retired], "synthetic-0-9", unit("cinder-wardens", 5)), { ok: false, reason: "unknown-update" });
});

test("the history fixture is a valid history", () => {
  assert.equal(validateHistory(history).ok, true);
});

test("a history needs exactly one current update", () => {
  const result = validateHistory({ ...history, updates: history.updates.map((u) => ({ ...u, status: "retired" })) });
  assert.ok(!result.ok && result.errors.includes("/updates must have exactly one current update, found 0"));
});

test("both retained snapshots match their recorded digests", () => {
  assert.deepEqual(historyErrors(history, [current, retired]), []);
});

test("an edited retained snapshot fails the history check", () => {
  const edited = structuredClone(retired);
  edited.factions[0]!.detachments[0]!.enhancements[0]!.points = 25;
  assert.deepEqual(historyErrors(history, [current, edited]), ["synthetic-1-0 no longer matches its recorded sha256"]);
});

test("a duplicate update cannot hide an edited snapshot from the history check", () => {
  const edited = structuredClone(retired);
  edited.factions[0]!.detachments[0]!.enhancements[0]!.points = 25;
  assert.deepEqual(historyErrors(history, [current, edited, retired]), ["synthetic-1-0 has multiple snapshots"]);
});

test("pricing refuses to choose between two snapshots of the same update", () => {
  assert.deepEqual(pointsAt([current, retired, retired], "synthetic-1-0", unit("cinder-wardens", 5)), {
    ok: false,
    reason: "ambiguous-update",
  });
});

test("a dropped retained snapshot fails the history check", () => {
  assert.deepEqual(historyErrors(history, [current]), ["synthetic-1-0 is listed but its snapshot is missing"]);
});

test("the digest does not depend on key order", () => {
  const reversed = JSON.parse(JSON.stringify(Object.fromEntries(Object.entries(retired).reverse())));
  assert.equal(snapshotDigest(reversed), snapshotDigest(retired));
});

test("comparing two updates lists every changed, missing and new row", () => {
  const report = compareSnapshots(current, retired);
  assert.deepEqual(
    { matched: report.matched, differ: report.differ.map((d) => d.key), missing: report.missing, extra: report.extra.length },
    {
      matched: 4,
      differ: ["enhancement/ashen-choir/lantern-vigil/gilded-censer"],
      missing: ["unit/ashen-choir/cinder-wardens/1-/5", "unit/ashen-choir/cinder-wardens/1-/10"],
      extra: 16,
    },
  );
});

const fork = fromMfmFork([json("mfm-fork/ashen-choir.json") as ForkFaction], {
  id: "synthetic-fork",
  rulesVersion: { edition: "synthetic", update: "Field Tariff 1.1" },
  published: "2026-02-01",
  source: { title: "Synthetic fork", page: "1" },
  basis: "Invented values for tests.",
});
const forkUnits = fork.snapshot.factions[0]!.units;

test("a converted fork faction validates", () => {
  assert.equal(validateSnapshot(fork.snapshot).ok, true);
});

test("fork copy ranges become tiers", () => {
  assert.deepEqual(
    forkUnits[0]!.tiers.map((t) => t.copies),
    [{ from: 1, to: 2 }, { from: 3 }],
  );
});

test("the fork's upgrade mark becomes a flag", () => {
  assert.deepEqual(fork.snapshot.factions[0]!.detachments[0]!.enhancements[1], { id: "cinder-litany-aura", name: "Cinder Litany (Aura)", upgrade: true, points: 10 });
});

test("a fork add-on row becomes wargear", () => {
  assert.deepEqual(forkUnits.find((u) => u.id === "ember-bulwark")!.wargear, [{ item: "Ember Brazier", points: 15 }]);
});

test("a fork row description becomes its composition", () => {
  assert.equal(forkUnits.find((u) => u.id === "pyre-hounds")!.tiers[0]!.costs[1]!.composition, "3 Handlers, 3 Hounds");
});

test("a repeated fork name is told apart by its group", () => {
  assert.ok(forkUnits.some((u) => u.id === "every-model-has-the-choir-keyword.kiln-herald"));
});

test("a repeated fork name with nothing to tell it apart is reported", () => {
  assert.ok(fork.issues.includes(`ashen-choir: a second "Grey Reliquary" has nothing to tell it apart, so it became grey-reliquary-2 in source order`));
});
