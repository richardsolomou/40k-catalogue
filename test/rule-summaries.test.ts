import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import type { Release } from "../src/catalogue-identity/identity.ts";
import { buildCatalogueRelease, type CatalogueRecord, type Manifest } from "../src/catalogue-releases/catalogue.ts";
import type { ReleaseFiles } from "../src/releases/release.ts";
import { validateSummaries } from "../src/rule-summaries/summaries.ts";

const fixtures = fileURLToPath(new URL("../fixtures/rule-summaries/", import.meta.url));
const json = (path: string): any => JSON.parse(readFileSync(join(fixtures, path), "utf8"));
const identity = (): Release => json("identity.json");
const records = (): CatalogueRecord[] => readdirSync(join(fixtures, "records")).flatMap((c) => readdirSync(join(fixtures, "records", c)).map((f) => json(`records/${c}/${f}`)));
const OATH = { kind: "ability", id: "synthetic.ember-host.smouldering-oath" };
const VOLLEY = "synthetic.ember-host.kindled-vow.ember-volley";
const ERRATA = "synthetic-codex.errata.smouldering-oath";

function errors(change: (identity: Release, records: CatalogueRecord[]) => void) {
  const [id, recs] = [identity(), records()];
  change(id, recs);
  const result = validateSummaries(id, recs);
  return result.ok ? [] : result.errors;
}
const data = (recs: CatalogueRecord[], kind: string, id: string): any => recs.find((r) => r.kind === kind && r.id === id)!.data;

function build(change: (dir: string) => void = () => {}, release = "0.1.0", previous?: ReleaseFiles): ReleaseFiles {
  const dir = mkdtempSync(join(tmpdir(), "rule-summaries-"));
  test.after(() => rmSync(dir, { recursive: true, force: true }));
  cpSync(fixtures, dir, { recursive: true });
  change(dir);
  const result = buildCatalogueRelease(dir, { release, commit: "0".repeat(40), previous });
  if (!result.ok) assert.fail(result.errors.join("\n"));
  return result.files;
}
const category = (files: ReleaseFiles, name: string) => (JSON.parse(files.get("manifest.json")!) as Manifest).categories.find((c) => c.name === name)!;

test("the synthetic summaries validate and list the FAQ that amends a rule", () => {
  const result = validateSummaries(identity(), records());
  if (!result.ok) assert.fail(result.errors.join("\n"));
  assert.deepEqual(result.summaries.amendedBy(OATH).map((faq) => faq.id), [ERRATA]);
});

test("rules reference and mission rules build as categories, with undrafted entries unresolved", () => {
  const files = build();
  assert.ok(files.has("schema/rule-summaries/summaries.v1.schema.json"));
  const rules = category(files, "rules-reference");
  const missions = category(files, "mission-rules");
  assert.deepEqual(
    [rules.status, rules.unresolved, missions.status, missions.dependsOn],
    ["partial", [{ kind: "ability", id: "synthetic.ember-host.kindled-vow.cinder-ward" }], "complete", ["rules-reference"]],
  );
});

test("a retired FAQ reports the publications that superseded it", () => {
  const sources = [{ title: "Synthetic Faction Pack: Version 1.2", page: "5" }];
  const files = build(
    (dir) => {
      const path = join(dir, "identity.json");
      const value = JSON.parse(readFileSync(path, "utf8"));
      value.revision = 2;
      value.entries.find((e: { id: string }) => e.id === ERRATA).retired = { replacedBy: [], sources };
      writeFileSync(path, JSON.stringify(value));
      rmSync(join(dir, `records/rules-reference/faq.${ERRATA}.json`));
    },
    "0.2.0",
    build(),
  );
  assert.deepEqual(category(files, "rules-reference").changes.retired, [{ kind: "faq", id: ERRATA, replacedBy: [], sources }]);
});

test("a catalogue record's attribution must be complete", () => {
  const dir = mkdtempSync(join(tmpdir(), "rule-summaries-"));
  test.after(() => rmSync(dir, { recursive: true, force: true }));
  cpSync(fixtures, dir, { recursive: true });
  const path = join(dir, `records/rules-reference/ability.${OATH.id}.json`);
  const value = JSON.parse(readFileSync(path, "utf8"));
  delete value.attribution.licence;
  writeFileSync(path, JSON.stringify(value));
  const result = buildCatalogueRelease(dir, { release: "0.1.0", commit: "0".repeat(40) });
  assert.deepEqual(result.ok ? [] : result.errors, [`records/rules-reference/ability.${OATH.id}.json: /attribution must have required property 'licence'`]);
});

test("a Stratagem needs its CP cost", () => {
  assert.deepEqual(
    errors((_, recs) => delete data(recs, "ability", VOLLEY).cp),
    [`ability:${VOLLEY} is a Stratagem with no CP cost`],
  );
});

test("only a Stratagem has a CP cost", () => {
  assert.deepEqual(
    errors((_, recs) => (data(recs, "ability", OATH.id).cp = 1)),
    [`ability:${OATH.id} is not a Stratagem but has a CP cost or Stratagem timing`],
  );
});

test("a summary span must lie within the summary", () => {
  assert.deepEqual(
    errors((_, recs) => (data(recs, "weapon-ability", "synthetic.searing").summarySpans[0].end = 500)),
    ["weapon-ability:synthetic.searing span 0 does not lie within the summary"],
  );
});

test("summary spans must not overlap", () => {
  assert.deepEqual(
    errors((_, recs) => (data(recs, "ability", OATH.id).summarySpans[1].start = 30)),
    [`ability:${OATH.id} span 1 overlaps or precedes the span before it`],
  );
});

test("a linked rule must be a reference of the record's identity entry", () => {
  assert.deepEqual(
    errors((id) => delete id.entries.find((e) => e.id === OATH.id)!.references),
    [`ability:${OATH.id} names core-ability:synthetic.ashwalk but its identity entry does not reference it`],
  );
});

test("an FAQ must amend at least one catalogued rule", () => {
  assert.deepEqual(
    errors((_, recs) => (data(recs, "faq", ERRATA).amends = [])),
    [`faq:${ERRATA} data/amends must NOT have fewer than 1 items`],
  );
});

test("mechanic facts are checked as mechanic fields", () => {
  assert.deepEqual(
    errors((_, recs) => (data(recs, "ability", VOLLEY).facts.fields.effect.by = 0)),
    [`ability:${VOLLEY} facts/effect/by must NOT be valid`],
  );
});
