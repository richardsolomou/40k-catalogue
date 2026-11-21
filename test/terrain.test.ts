import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { placeLayout } from "../src/terrain/place.ts";
import type { TerrainLayout, TerrainRecord } from "../src/terrain/record.ts";
import { droppedIds, joinBattlefields, verify, verifyDataset } from "../src/terrain/verify.ts";

const fixtures = new URL("../fixtures/terrain/", import.meta.url);
const read = (path: string) => JSON.parse(readFileSync(new URL(path, fixtures), "utf8"));
const names = (dir: string) =>
  readdirSync(new URL(dir, fixtures))
    .filter((f) => f.endsWith(".json") && !f.endsWith(".placed.json"))
    .map((f) => f.slice(0, -5));

function record(name: string): TerrainRecord {
  const result = verify(read(`valid/${name}.json`));
  if (!result.ok) assert.fail(result.errors.join("\n"));
  return result.record;
}

const layout = (name: string) => record(name) as TerrainLayout;
const area = (name: string, id: string) => placeLayout(layout(name)).areas.find((a) => a.id === id)!;
const dataset = () => names("valid").map(record);

for (const name of names("valid")) {
  test(`${name} verifies`, () => {
    assert.equal(verify(read(`valid/${name}.json`)).ok, true);
  });
}

for (const name of names("valid").filter((n) => read(`valid/${n}.json`).kind === "terrain-layout")) {
  test(`${name} places to its expected board geometry`, () => {
    assert.deepEqual(placeLayout(layout(name)), read(`valid/${name}.placed.json`));
  });
}

test("a quarter turn points the footprint's width down the board", () => {
  assert.deepEqual(area("orientation", "turn-90").corners[1], { x: 20, y: 10 });
});

test("three quarter turns point the footprint's width up the board", () => {
  assert.deepEqual(area("orientation", "turn-270").corners[1], { x: 4, y: 20 });
});

test("a mirrored part reflects across its own origin before it is placed", () => {
  assert.deepEqual(area("orientation", "mirrored").parts[0]!.walls[0]!.points, [
    { x: 36, y: 26 },
    { x: 36, y: 22 },
    { x: 30, y: 22 },
  ]);
});

test("footprints sharing an objective ID place it at one point", () => {
  const placed = placeLayout(layout("standard")).areas.filter((a) => a.objective?.id === "centre");
  assert.deepEqual(new Set(placed.map((a) => JSON.stringify(a.objective!.at))), new Set([JSON.stringify({ x: 30, y: 22 })]));
});

const expectedErrors: Record<string, string> = {
  "duplicate-id": "/areas id turn-0 is used more than once in the layout",
  "flat-outline": "/areas/0/outline encloses no area",
  "lone-group": "/areas group pair has one footprint; a footprint that is a terrain area on its own has no group",
  "measured-without-reuse": "/provenance must have required property 'reuse'",
  "objective-outside-outline": "/areas/0/objective is outside the area's outline",
  "off-board": "/areas/0/outline is off the board",
  "portrait-board": "/board must be landscape: width is the long edge",
  "rotation-out-of-range": "/areas/0/footprint/rotation must be < 360",
  "unknown-kind": "/kind must be equal to one of the allowed values",
};

test("every invalid terrain fixture has an expected error", () => {
  assert.deepEqual(names("invalid"), Object.keys(expectedErrors).sort());
});

for (const [name, error] of Object.entries(expectedErrors)) {
  test(`${name} fails verification with: ${error}`, () => {
    const result = verify(read(`invalid/${name}.json`));
    assert.ok(!result.ok && result.errors.includes(error), JSON.stringify(result));
  });
}

const references = {
  layouts: [
    { id: "synthetic.layout.standard", deployments: ["synthetic.deployment.standard"] },
    { id: "synthetic.layout.orientation", deployments: [] },
  ],
  deployments: [{ id: "synthetic.deployment.standard" }],
};

test("the valid fixtures join to every layout and deployment a pack names", () => {
  assert.deepEqual(joinBattlefields(references, dataset()), { gaps: [], errors: [] });
});

test("a pack layout with no geometry record is reported as a gap", () => {
  const records = dataset().filter((r) => r.id !== "synthetic.layout.standard");
  assert.deepEqual(joinBattlefields(references, records).gaps, ["layout synthetic.layout.standard has no terrain layout"]);
});

test("a layout permitting a deployment drawn on another board fails the join", () => {
  const mismatched = { ...references, layouts: [{ id: "synthetic.layout.orientation", deployments: ["synthetic.deployment.standard"] }] };
  assert.deepEqual(joinBattlefields(mismatched, dataset()).errors, [
    "layout synthetic.layout.orientation is not on the same board as deployment synthetic.deployment.standard",
  ]);
});

test("two records with one ID fail the dataset check", () => {
  const records = dataset();
  assert.deepEqual(verifyDataset([...records, records[0]!]), [`${records[0]!.id} is used by more than one record`]);
});

test("reordering footprints drops no ID a saved battle could hold", () => {
  const before = layout("standard");
  assert.deepEqual(droppedIds([before], [{ ...before, areas: before.areas.toReversed() }]), []);
});

test("renaming a footprint reports its old ID as dropped", () => {
  const before = layout("standard");
  const after = { ...before, areas: before.areas.map((a) => (a.id === "long-1" ? { ...a, id: "long-west" } : a)) };
  assert.deepEqual(droppedIds([before], [after]), ["synthetic.layout.standard#long-1"]);
});
