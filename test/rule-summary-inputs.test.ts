import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { buildCatalogueRelease, type CatalogueRecord } from "../src/catalogue-releases/catalogue.ts";
import { KINDS as PROFILE_KINDS, validateProfiles } from "../src/datasheet-profiles/profiles.ts";
import { validatePack } from "../src/mission-packs/validate.ts";
import { validateSnapshot } from "../src/points/validate.ts";
import { KINDS as DEFINITION_KINDS, validateDefinitions } from "../src/roster-definitions/definitions.ts";
import { buildRelease } from "../src/releases/release.ts";
import { parseSummary, validateSummaries } from "../src/rule-summaries/summaries.ts";
import { commonmark } from "./commonmark.ts";

const data = fileURLToPath(new URL("../data/", import.meta.url));
const json = (path: string): any => JSON.parse(readFileSync(path, "utf8"));
const options = { release: "0.0.0", commit: "0".repeat(40) };
// Inputs build without a previous release, as the first release of a rules version's line does.
const SUMMARY_KINDS = new Set(["ability", "core-rule", "core-ability", "weapon-ability", "faq", "mission-award", "mission-card", "mission-action", "mission-twist"]);
const versions = readdirSync(data).filter((v) => existsSync(join(data, v, "rule-summaries", "identity.json")));

test("every rules version with rule summaries is found", () => {
  assert.ok(versions.includes("mfm-1-6"));
});

for (const version of versions) {
  const summaries = join(data, version, "rule-summaries");
  const mechanics = join(data, version, "mechanics");

  const records = (): CatalogueRecord[] =>
    readdirSync(join(summaries, "records")).flatMap((c) => readdirSync(join(summaries, "records", c)).map((f) => json(join(summaries, "records", c, f))));

  test(`every ${version} rule summary validates against its identity release`, () => {
    const result = validateSummaries(
      json(join(summaries, "identity.json")),
      records().filter((r) => SUMMARY_KINDS.has(r.kind)),
    );
    if (!result.ok) assert.fail(result.errors.slice(0, 20).join("\n"));
  });

  test(`CommonMark reads every ${version} summary as the strict parser does`, () => {
    const differ = records()
      .filter((r) => SUMMARY_KINDS.has(r.kind) && (r.data as { text?: string }).text !== "none")
      .filter((r) => {
        const { summary } = r.data as { summary: string };
        const parsed = parseSummary(summary);
        return !parsed.ok || JSON.stringify(parsed.blocks) !== JSON.stringify(commonmark(summary));
      });
    assert.deepEqual(differ.map((r) => `${r.kind}:${r.id}`), []);
  });

  test(`every ${version} mission pack validates as a mission pack under its record's ID`, () => {
    for (const record of records().filter((r) => r.kind === "mission-pack")) {
      const result = validatePack(record.data);
      if (!result.ok) assert.fail(result.errors.slice(0, 20).join("\n"));
      assert.equal((record.data as { id: string }).id, record.id);
    }
  });

  test(`every ${version} mission pack swaps a drawn card the way its card's facts do`, () => {
    const cards = new Map(records().filter((r) => r.kind === "mission-card").map((r) => [r.id, r.data as any]));
    const differ = records()
      .filter((r) => r.kind === "mission-pack")
      .flatMap((r) => (r.data as any).secondaries)
      .filter((secondary) => secondary.whenDrawn?.action)
      .filter((secondary) => {
        const operations = cards.get(secondary.id)?.facts?.fields?.detail?.operations ?? [];
        const discards = operations.some((operation: { kind: string }) => operation.kind === "discard");
        return (secondary.whenDrawn.action === "discard") !== discards;
      });
    assert.deepEqual(differ.map((secondary) => secondary.id), []);
  });

  test(`every ${version} datasheet profile, roster definition and points snapshot validates`, () => {
    const all = records();
    const identity = json(join(summaries, "identity.json"));
    const profiles = all.filter((r) => (PROFILE_KINDS as string[]).includes(r.kind));
    const definitions = all.filter((r) => (DEFINITION_KINDS as string[]).includes(r.kind));
    const results = [
      ...(profiles.length ? [validateProfiles(identity, profiles)] : []),
      ...(definitions.length ? [validateDefinitions(identity, definitions)] : []),
      ...all.filter((r) => r.kind === "points-snapshot").map((r) => validateSnapshot(r.data)),
    ];
    for (const result of results) if (!result.ok) assert.fail(result.errors.slice(0, 20).join("\n"));
  });

  test(`the ${version} rule summaries build as a catalogue release`, () => {
    const result = buildCatalogueRelease(summaries, options);
    if (!result.ok) assert.fail(result.errors.slice(0, 20).join("\n"));
  });

  if (existsSync(mechanics))
    test(`the ${version} mechanics build as a mechanics release`, () => {
      const result = buildRelease(mechanics, options);
      if (!result.ok) assert.fail(result.errors.slice(0, 20).join("\n"));
    });
}
