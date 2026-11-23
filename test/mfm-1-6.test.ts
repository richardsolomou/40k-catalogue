import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { buildCatalogueRelease, type CatalogueRecord } from "../src/catalogue-releases/catalogue.ts";
import { buildRelease } from "../src/releases/release.ts";
import { validateSummaries } from "../src/rule-summaries/summaries.ts";

const summaries = fileURLToPath(new URL("../data/mfm-1-6/rule-summaries/", import.meta.url));
const mechanics = fileURLToPath(new URL("../data/mfm-1-6/mechanics/", import.meta.url));
const json = (path: string): any => JSON.parse(readFileSync(path, "utf8"));
const options = { release: "0.0.0", commit: "0".repeat(40) };

test("every MFM 1.6 rule summary validates against its identity release", () => {
  const records: CatalogueRecord[] = readdirSync(join(summaries, "records")).flatMap((c) =>
    readdirSync(join(summaries, "records", c)).map((f) => json(join(summaries, "records", c, f))),
  );
  const result = validateSummaries(json(join(summaries, "identity.json")), records);
  if (!result.ok) assert.fail(result.errors.slice(0, 20).join("\n"));
});

test("the MFM 1.6 rule summaries build as a catalogue release", () => {
  const result = buildCatalogueRelease(summaries, options);
  if (!result.ok) assert.fail(result.errors.slice(0, 20).join("\n"));
});

test("the MFM 1.6 mechanics build as a mechanics release", () => {
  const result = buildRelease(mechanics, options);
  if (!result.ok) assert.fail(result.errors.slice(0, 20).join("\n"));
});
