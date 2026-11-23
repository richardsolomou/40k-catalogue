import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { buildCatalogueRelease, type CatalogueRecord } from "../src/catalogue-releases/catalogue.ts";
import { buildRelease } from "../src/releases/release.ts";
import { validateSummaries } from "../src/rule-summaries/summaries.ts";

const data = fileURLToPath(new URL("../data/", import.meta.url));
const json = (path: string): any => JSON.parse(readFileSync(path, "utf8"));
const options = { release: "0.0.0", commit: "0".repeat(40) };
// Inputs build without a previous release, as the first release of a rules version's line does.
const versions = readdirSync(data).filter((v) => existsSync(join(data, v, "rule-summaries", "identity.json")));

test("every rules version with rule summaries is found", () => {
  assert.ok(versions.includes("mfm-1-6"));
});

for (const version of versions) {
  const summaries = join(data, version, "rule-summaries");
  const mechanics = join(data, version, "mechanics");

  test(`every ${version} rule summary validates against its identity release`, () => {
    const records: CatalogueRecord[] = readdirSync(join(summaries, "records")).flatMap((c) =>
      readdirSync(join(summaries, "records", c)).map((f) => json(join(summaries, "records", c, f))),
    );
    const result = validateSummaries(json(join(summaries, "identity.json")), records);
    if (!result.ok) assert.fail(result.errors.slice(0, 20).join("\n"));
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
