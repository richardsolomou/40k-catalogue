import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { renderSummary } from "../src/render.ts";
import { validate } from "../src/validate.ts";

const fixtures = new URL("../fixtures/", import.meta.url);
const read = (path: string) => readFileSync(new URL(path, fixtures), "utf8");
const names = (dir: string) => readdirSync(new URL(dir, fixtures)).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5));

function valid(name: string) {
  const result = validate(JSON.parse(read(`valid/${name}.json`)));
  if (!result.ok) assert.fail(result.errors.join("\n"));
  return result;
}

for (const name of names("valid")) {
  test(`${name} validates`, () => {
    assert.equal(validate(JSON.parse(read(`valid/${name}.json`))).ok, true);
  });

  test(`${name} renders its expected summary`, () => {
    assert.equal(renderSummary(valid(name).record), read(`valid/${name}.summary.txt`).trimEnd());
  });
}

const expectedErrors: Record<string, string> = {
  "always-with-cost": "/usage property name must be valid",
  "always-with-duration": "/duration boolean schema is false",
  "always-with-immediate-effect": "/trigger must NOT be valid",
  "always-with-selection": "/target must NOT be valid",
  "distance-to-itself": "/conditions/0 cannot measure a distance from a unit to itself",
  "empty-gap-note": `/conditions/0/unresolved must match pattern "\\S"`,
  "immediate-effect-with-duration": "/duration boolean schema is false",
  "lasting-effect-without-duration": "/ must have required property 'duration'",
  "missing-rules-version": "/ must have required property 'rulesVersion'",
  "missing-source-reference": "/source must match a schema in anyOf",
  "target-within-itself": "/target/select/within/of cannot refer to the target it selects",
  "triggering-unit-without-trigger-unit": "/target/unit refers to a triggering unit, but the trigger has none",
  "two-usage-limits": "/usage must NOT be valid",
  "unknown-trigger-kind": "/trigger/kind must be equal to one of the allowed values",
  "unsupported-format-version": "/formatVersion must be equal to constant",
  "use-without-windows": "/usage must have required property 'windows'",
  "zero-modifier": "/effect/by must NOT be valid",
};

test("every invalid fixture has an expected error", () => {
  assert.deepEqual(names("invalid"), Object.keys(expectedErrors).sort());
});

for (const [name, error] of Object.entries(expectedErrors)) {
  test(`${name} fails validation with: ${error}`, () => {
    const result = validate(JSON.parse(read(`invalid/${name}.json`)));
    assert.ok(!result.ok && result.errors.includes(error), JSON.stringify(result));
  });
}

test("unresolved parts are reported as gaps", () => {
  assert.deepEqual(valid("unresolved-gaps").gaps, [
    { path: "/conditions/0", note: "whether the unit must have fought earlier in the battle round" },
    { path: "/duration", note: "lasts until the unit is next selected to fight, which no duration value covers" },
  ]);
});

test("a fully resolved record has no gaps", () => {
  assert.deepEqual(valid("targeted-effect").gaps, []);
});

test("the summary does not depend on key order", () => {
  const record = JSON.parse(read("valid/end-of-move-trigger.json"));
  const reversed = JSON.parse(JSON.stringify(Object.fromEntries(Object.entries(record).reverse())));
  assert.equal(renderSummary(reversed), renderSummary(record));
});
