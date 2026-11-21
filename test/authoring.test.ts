import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { decide, publication, type Decision } from "../src/authoring/proposal.ts";
import { buildRelease } from "../src/releases/release.ts";

const fixtures = new URL("../fixtures/authoring/", import.meta.url);
const read = (path: string) => readFileSync(new URL(path, fixtures), "utf8");
const proposal = (name: string) => JSON.parse(read(`cinder-ward.${name}.json`));
const corrected = () => proposal("corrected");

function reasons(value: unknown): string[] {
  const decision = decide(value);
  return decision.outcome === "held" ? decision.reasons : [];
}

function approved(value: unknown): Extract<Decision, { outcome: "approved" }> {
  const decision = decide(value);
  if (decision.outcome === "held") assert.fail(decision.reasons.join("\n"));
  return decision;
}

test("a draft that misreads the timing is held until it is corrected", () => {
  assert.deepEqual(reasons(proposal("wrong-timing")), [
    "/trigger needs correction: the ward is used in the opponent's Shooting phase, not your own",
  ]);
});

test("a draft that misreads the target is held until it is corrected", () => {
  assert.deepEqual(reasons(proposal("wrong-target")), ["/target needs correction: the selected unit is an enemy unit, not a friendly one"]);
});

test("a correction marked but not applied to the record is held", () => {
  const value = corrected();
  value.record.trigger = value.review.checks.find((c: { path: string }) => c.path === "/trigger").draft;
  assert.deepEqual(reasons(value), ["/trigger still matches its draft, so the correction has not been applied"]);
});

test("an unreviewed proposal is held", () => {
  const { review, ...value } = corrected();
  assert.deepEqual(reasons(value), ["the proposal has not been reviewed"]);
});

test("every part of the record must be reviewed", () => {
  const value = corrected();
  value.review.checks = value.review.checks.filter((c: { path: string }) => c.path !== "/duration");
  assert.deepEqual(reasons(value), ["/duration has not been reviewed"]);
});

test("a gap in the record cannot be reviewed as confirmed", () => {
  const value = corrected();
  value.review.checks.find((c: { path: string }) => c.path === "/conditions/0").outcome = "confirmed";
  delete value.review.checks.find((c: { path: string }) => c.path === "/conditions/0").note;
  assert.deepEqual(reasons(value), ["/conditions/0 is a gap in the record, so review it as unresolved"]);
});

test("an invalid record is held with its validation errors", () => {
  const value = corrected();
  value.record.trigger.phase = "deployment";
  assert.ok(reasons(value).some((r) => r.startsWith("/record/trigger")));
});

test("source prose cannot be attached to a proposal", () => {
  assert.deepEqual(reasons({ ...corrected(), sourceText: "pasted rule" }), ["/ must NOT have additional properties"]);
});

test("a model-assisted draft cannot declare source prose as a model input", () => {
  const value = corrected();
  value.drafting.modelInputs = ["source-prose"];
  assert.deepEqual(reasons(value), ["/drafting/modelInputs/0 must be equal to one of the allowed values"]);
});

const attribution = {
  url: "https://example.org/ember-rules/cinder-ward",
  revision: "v2.4.0",
  credit: "Ember Rules contributors",
  licence: "https://creativecommons.org/licenses/by/4.0/",
  changes: "Translated the structured trigger and effect into catalogue fields.",
};

function importedDraft() {
  const value = corrected();
  value.drafting = { method: "structured-import", author: "Fixture translator" };
  return value;
}

test("a structured import needs source attribution", () => {
  assert.deepEqual(reasons(importedDraft()), ["a structured import requires record attribution"]);
});

test("attribution must be reviewed alongside the mechanic", () => {
  const value = importedDraft();
  value.record.attribution = attribution;
  assert.deepEqual(reasons(value), ["/attribution has not been reviewed"]);
});

test("a release preserves the credit for a reviewed adaptation", (t) => {
  const value = importedDraft();
  value.record.attribution = attribution;
  value.record.conditions = [];
  value.review.checks = value.review.checks.filter((check: { path: string }) => check.path !== "/conditions/0");
  value.review.checks.push({ path: "/attribution", outcome: "confirmed" });

  const records = mkdtempSync(join(tmpdir(), "catalogue-attribution-"));
  t.after(() => rmSync(records, { recursive: true, force: true }));
  const files = publication(approved(value));
  writeFileSync(join(records, `${value.record.id}.json`), files[`${value.record.id}.json`]!);
  const release = buildRelease(records, { release: "0.1.0", commit: "a".repeat(40) });
  if (!release.ok) assert.fail(release.errors.join("\n"));
  const entry = release.files.get(`records/${value.record.id}.json`);
  assert.deepEqual(JSON.parse(entry!.toString()).attribution, attribution);
});

test("an approved proposal publishes a JSON record with its summary and a review", () => {
  const published = readdirSync(new URL("published/", fixtures));
  const files = publication(approved(corrected()));
  assert.deepEqual(Object.keys(files).sort(), published.sort());
  for (const name of published) assert.equal(files[name], read(`published/${name}`), name);
});

test("the authoring CLI produces input the release builder can package", (t) => {
  const dir = mkdtempSync(join(tmpdir(), "catalogue-authoring-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const value = corrected();
  value.record.conditions = [];
  value.review.checks = value.review.checks.filter((check: { path: string }) => check.path !== "/conditions/0");
  const proposalPath = join(dir, "proposal.json");
  const records = join(dir, "records");
  const reviews = join(dir, "reviews");
  writeFileSync(proposalPath, JSON.stringify(value));
  const cli = fileURLToPath(new URL("../src/authoring/cli.ts", import.meta.url));
  execFileSync(process.execPath, [cli, "publish", proposalPath, records, reviews]);
  assert.deepEqual(readdirSync(records), [`${value.record.id}.json`]);
  assert.deepEqual(readdirSync(reviews), [`${value.record.id}.review.json`]);
  const result = buildRelease(records, { release: "0.1.0", commit: "a".repeat(40) });
  if (!result.ok) assert.fail(result.errors.join("\n"));
  assert.ok(result.files.has(`records/${value.record.id}.json`));
});

test("fields outside the format never reach published files", () => {
  const value = corrected();
  value.review.checks[0].modelPrompt = "prompt with source prose";
  value.drafting.notes = "author-inputs/cinder-ward.md";
  // The schema rejects these, so call publication directly to prove it copies only known fields.
  const files = publication({ outcome: "approved", record: corrected().record, proposal: value });
  assert.doesNotMatch(Object.values(files).join("\n"), /source prose|author-inputs/);
});

test("the drafting folder for raw inputs is ignored by Git", () => {
  assert.ok(readFileSync(new URL("../.gitignore", import.meta.url), "utf8").split("\n").includes("/author-inputs/"));
});
