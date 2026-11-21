import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { checkUpgrade, historyErrors, lookup, resolve, validateRelease, type Release } from "../src/catalogue-identity/identity.ts";

const fixtures = new URL("../fixtures/catalogue-identity/", import.meta.url);
const read = (path: string): unknown => JSON.parse(readFileSync(new URL(path, fixtures), "utf8"));
const clone = <T>(value: T): T => structuredClone(value);

function release(name: string): Release {
  const result = validateRelease(read(`${name}.json`));
  if (!result.ok) assert.fail(result.errors.join("\n"));
  return result.release;
}

const v10 = release("synthetic-1.0");
const v11 = release("synthetic-1.1");
const history = [v10, v11];
const squad = { kind: "unit", id: "synthetic.iron-choir.warden-squad" };
const crossfire = { kind: "mission-layout", id: "synthetic.layout.crossfire" };
const lanceUpgrade = { kind: "roster-option", id: "synthetic.warden-squad.lance-upgrade" };
const chainglaive = { kind: "wargear", id: "synthetic.chainglaive" };

const expectedErrors: Record<string, string> = {
  "alias-reuses-id": "/entries/0 alias wargear:synthetic.chainglaive is already in use",
  "duplicate-id": "/entries/1 duplicates unit:synthetic.warden-squad",
  "invalid-id": `/entries/0/id must match pattern "^[a-z0-9]+(?:[.-][a-z0-9]+)*$"`,
  "missing-reference": "/entries/0 refers to missing mission-layout:synthetic.layout.crossfire",
  "reference-to-alias": "/entries/1 refers to alias wargear:synthetic.chainglaive instead of wargear:synthetic.chain-glaive",
  "reference-to-retired": "/entries/1 refers to retired mission-layout:synthetic.layout.crossfire",
  "reference-to-wrong-kind": "/entries/1 refers to missing wargear:synthetic.pulse-lance",
  "replaced-by-missing": "/entries/0 is replaced by missing roster-option:synthetic.one-lance",
  "replaced-by-retired": "/entries/0 is replaced by retired roster-option:synthetic.one-lance",
};

test("every invalid identity fixture has an expected error", () => {
  const names = readdirSync(new URL("invalid/", fixtures)).map((f) => f.slice(0, -".json".length));
  assert.deepEqual(names.sort(), Object.keys(expectedErrors).sort());
});

for (const [name, error] of Object.entries(expectedErrors)) {
  test(`${name} fails validation with: ${error}`, () => {
    const result = validateRelease(read(`invalid/${name}.json`));
    assert.ok(!result.ok && result.errors.includes(error), JSON.stringify(result));
  });
}

test("the synthetic history keeps every published ID", () => {
  assert.deepEqual(historyErrors(history), []);
});

test("a historical lookup reads the record as it was in that rules version", () => {
  const found = lookup(history, squad, { edition: "synthetic", update: "1.0" });
  assert.equal(found.status === "current" && found.entry.name, "Warden Squad");
});

test("a current lookup reads the updated record", () => {
  const found = lookup(history, squad, { edition: "synthetic", update: "1.1" });
  assert.equal(found.status === "current" && found.entry.name, "Warden Cohort");
});

test("a historical mission keeps its original layout reference", () => {
  const found = lookup(history, { kind: "mission", id: "synthetic.mission.hold-the-line" }, { edition: "synthetic", update: "1.0" });
  assert.deepEqual(found.status === "current" && found.entry.references, [crossfire]);
});

test("a lookup in an unpublished rules version does not fall back to another", () => {
  assert.deepEqual(lookup(history, squad, { edition: "synthetic", update: "1.2" }), { status: "unknown-version" });
});

test("an explicit replacement resolves to its successors", () => {
  const found = resolve(v11, lanceUpgrade);
  assert.deepEqual(found.status === "retired" && found.replacedBy.map((e) => e.id), [
    "synthetic.warden-squad.one-lance",
    "synthetic.warden-squad.two-lances",
  ]);
});

test("a retirement without a successor resolves to no replacement", () => {
  const found = resolve(v11, crossfire);
  assert.deepEqual(found.status === "retired" && found.replacedBy, []);
});

test("an alias resolves to its canonical entry", () => {
  const found = resolve(v11, chainglaive);
  assert.equal(found.status === "aliased" && found.entry.id, "synthetic.chain-glaive");
});

test("a reference resolves only within its kind", () => {
  assert.deepEqual(resolve(v11, { kind: "wargear", id: squad.id }), { status: "missing" });
});

test("an upgrade check lists every reference the consumer must remap", () => {
  const refs = [squad, crossfire, lanceUpgrade, chainglaive, { kind: "unit", id: "synthetic.unknown" }];
  assert.deepEqual(
    checkUpgrade(v11, refs).map((f) => [f.ref.id, f.resolution.status]),
    [
      [crossfire.id, "retired"],
      [lanceUpgrade.id, "retired"],
      [chainglaive.id, "aliased"],
      ["synthetic.unknown", "missing"],
    ],
  );
});

test("a history may not drop a published ID", () => {
  const next = clone(v11);
  next.entries = next.entries.filter((e) => e.id !== squad.id);
  assert.ok(historyErrors([v10, next]).includes("synthetic 1.1 drops unit:synthetic.iron-choir.warden-squad"));
});

test("a history may not drop a published alias", () => {
  const later = clone(v11);
  later.rulesVersion = { edition: "synthetic", update: "1.2" };
  later.entries.find((e) => e.id === "synthetic.chain-glaive")!.aliases = undefined;
  assert.ok(historyErrors([v10, v11, later]).includes("synthetic 1.2 drops wargear:synthetic.chainglaive"));
});

test("a history may not reuse a retired ID for an active entry", () => {
  const later = clone(v11);
  later.rulesVersion = { edition: "synthetic", update: "1.2" };
  later.entries.find((e) => e.id === crossfire.id)!.retired = undefined;
  assert.ok(historyErrors([v10, v11, later]).includes("synthetic 1.2 reuses retired mission-layout:synthetic.layout.crossfire"));
});

test("a history may not turn an alias into its own entry", () => {
  const later = clone(v11);
  later.rulesVersion = { edition: "synthetic", update: "1.2" };
  later.entries.find((e) => e.id === "synthetic.chain-glaive")!.aliases = undefined;
  later.entries.push({ kind: "wargear", id: "synthetic.chainglaive", name: "Chain Glaive" });
  assert.ok(historyErrors([v10, v11, later]).includes("synthetic 1.2 turns alias wargear:synthetic.chainglaive into its own entry"));
});

test("a catalogue revision is immutable even when another revision uses the same rules version", () => {
  assert.ok(historyErrors([v10, clone(v10)]).includes("synthetic 1.0 revision 1 is published more than once"));
  const correction = { ...clone(v10), revision: 2 };
  correction.entries.find((e) => e.id === squad.id)!.name = "Wardens";
  const releases = [v10, correction];
  assert.deepEqual(historyErrors(releases), []);
  assert.deepEqual(lookup(releases, squad, v10.rulesVersion), { status: "ambiguous-version" });
  const old = lookup(releases, squad, v10.rulesVersion, 1);
  const corrected = lookup(releases, squad, v10.rulesVersion, 2);
  assert.equal(old.status === "current" && old.entry.name, "Warden Squad");
  assert.equal(corrected.status === "current" && corrected.entry.name, "Wardens");
  assert.deepEqual(lookup(releases, squad, v10.rulesVersion, 3), { status: "unknown-version" });
});
