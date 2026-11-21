import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { buildRelease, packRelease, verifyRelease, writeRelease, type ReleaseFiles } from "../src/releases/release.ts";

const fixtures = new URL("../fixtures/valid/", import.meta.url);
const NAMES = ["targeted-effect", "end-of-move-trigger", "mixed-unit-conditions"];
const OPTIONS = { release: "0.1.0", commit: "0123456789abcdef0123456789abcdef01234567" };

function scratch(): string {
  const dir = mkdtempSync(join(tmpdir(), "releases-test-"));
  test.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

function inputs(names = NAMES): string {
  const dir = join(scratch(), "records");
  mkdirSync(dir);
  for (const name of names) {
    for (const file of [`${name}.json`, `${name}.summary.txt`]) cpSync(new URL(file, fixtures), join(dir, file));
  }
  return dir;
}

function build(dir: string, options = OPTIONS): ReleaseFiles {
  const result = buildRelease(dir, options);
  if (!result.ok) assert.fail(result.errors.join("\n"));
  return result.files;
}

function errors(dir: string, options = OPTIONS): string[] {
  const result = buildRelease(dir, options);
  return result.ok ? [] : result.errors;
}

function written(files = build(inputs())): string {
  const dir = join(scratch(), "release");
  writeRelease(dir, files);
  return dir;
}

const manifest = (files: ReleaseFiles) => JSON.parse(files.get("manifest.json")!);

test("a release holds only the manifest, the record schema, and each record with its summary", () => {
  assert.deepEqual(
    [...build(inputs()).keys()],
    [
      "manifest.json",
      "records/synthetic.grave-tether.json",
      "records/synthetic.hex-lantern.json",
      "records/synthetic.wake-shards.json",
      "schema/mechanic.v1.schema.json",
      "summaries/synthetic.grave-tether.txt",
      "summaries/synthetic.hex-lantern.txt",
      "summaries/synthetic.wake-shards.txt",
    ],
  );
});

test("rebuilding the same inputs gives identical files", () => {
  const dir = inputs();
  assert.deepEqual(build(dir), build(dir));
});

test("record key order and formatting do not change the release", () => {
  const dir = inputs();
  const before = build(dir);
  const path = join(dir, "targeted-effect.json");
  const record = JSON.parse(readFileSync(path, "utf8"));
  writeFileSync(path, JSON.stringify(Object.fromEntries(Object.entries(record).reverse())));
  assert.deepEqual(build(dir), before);
});

test("the archive is the same bytes for the same files", () => {
  const dir = inputs();
  assert.equal(Buffer.compare(packRelease(build(dir)), packRelease(build(dir))), 0);
});

test("standard tar unpacks the archive to a release that verifies", () => {
  const dir = join(scratch(), "unpacked");
  mkdirSync(dir);
  const archive = join(dir, "..", "release.tar");
  writeFileSync(archive, packRelease(build(inputs())));
  execFileSync("tar", ["-xf", archive, "-C", dir]);
  assert.deepEqual(verifyRelease(dir), []);
});

test("the manifest lists records in id order", () => {
  assert.deepEqual(
    manifest(build(inputs())).records.map((r: { id: string }) => r.id),
    ["synthetic.grave-tether", "synthetic.hex-lantern", "synthetic.wake-shards"],
  );
});

test("the manifest lists each distinct rules version once", () => {
  assert.deepEqual(manifest(build(inputs())).rulesVersions, [{ edition: "synthetic", update: "1.0" }]);
});

test("the manifest names the commit it was built from", () => {
  assert.equal(manifest(build(inputs())).commit, OPTIONS.commit);
});

test("an unexpected input file blocks the release", () => {
  const dir = inputs();
  writeFileSync(join(dir, "notes.md"), "draft");
  assert.deepEqual(errors(dir), ["notes.md: not a record or summary file"]);
});

test("a review README beside the records is excluded from the release", () => {
  const dir = inputs();
  const expected = build(dir);
  writeFileSync(join(dir, "README.md"), "Review notes.");
  assert.deepEqual(build(dir), expected);
});

test("a subdirectory in the input blocks the release", () => {
  const dir = inputs();
  mkdirSync(join(dir, "drafts"));
  assert.deepEqual(errors(dir), ["drafts: not a record or summary file"]);
});

test("a symlinked input blocks the release", () => {
  const dir = inputs();
  symlinkSync(join(dir, "targeted-effect.json"), join(dir, "linked.json"));
  assert.deepEqual(errors(dir), ["linked.json: not a record or summary file"]);
});

test("a record without its reviewed summary blocks the release", () => {
  const dir = inputs();
  rmSync(join(dir, "targeted-effect.summary.txt"));
  assert.deepEqual(errors(dir), ["targeted-effect: needs both targeted-effect.json and targeted-effect.summary.txt"]);
});

test("a reviewed summary that differs from the rendered one blocks the release", () => {
  const dir = inputs();
  writeFileSync(join(dir, "targeted-effect.summary.txt"), "Edited by hand.\n");
  assert.deepEqual(errors(dir), ["targeted-effect.summary.txt: does not match the rendered summary"]);
});

test("an unexpected record field blocks the release", () => {
  const dir = inputs();
  const path = join(dir, "targeted-effect.json");
  writeFileSync(path, JSON.stringify({ ...JSON.parse(readFileSync(path, "utf8")), notes: "draft" }));
  assert.deepEqual(errors(dir), ["targeted-effect.json: / must NOT have additional properties"]);
});

test("an unexpected nested record field blocks the release", () => {
  const dir = inputs();
  const path = join(dir, "targeted-effect.json");
  const record = JSON.parse(readFileSync(path, "utf8"));
  writeFileSync(path, JSON.stringify({ ...record, source: { ...record.source, scan: "page.png" } }));
  assert.deepEqual(errors(dir), ["targeted-effect.json: /source must NOT have additional properties"]);
});

test("an unresolved record blocks the release", () => {
  assert.deepEqual(errors(inputs([...NAMES, "unresolved-gaps"])), [
    "unresolved-gaps.json: unresolved at /conditions/0",
    "unresolved-gaps.json: unresolved at /duration",
  ]);
});

test("two records with one id block the release", () => {
  const dir = inputs();
  for (const ext of ["json", "summary.txt"]) cpSync(join(dir, `targeted-effect.${ext}`), join(dir, `copy.${ext}`));
  assert.deepEqual(errors(dir), ["targeted-effect.json: duplicate id synthetic.hex-lantern"]);
});

test("an empty input blocks the release", () => {
  const dir = join(scratch(), "empty");
  mkdirSync(dir);
  assert.deepEqual(errors(dir), [`${dir}: no records`]);
});

test("a release version that is not MAJOR.MINOR.PATCH blocks the release", () => {
  assert.deepEqual(errors(inputs(), { ...OPTIONS, release: "pilot" }), [
    `manifest.json/release must match pattern "^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)$"`,
  ]);
});

test("a written release verifies", () => {
  assert.deepEqual(verifyRelease(written()), []);
});

test("writing never replaces an existing release", () => {
  const dir = written();
  assert.throws(() => writeRelease(dir, build(inputs())), { code: "EEXIST" });
});

test("verification rejects a file the manifest does not list", () => {
  const dir = written();
  writeFileSync(join(dir, "records", "extra.json"), "{}\n");
  assert.deepEqual(verifyRelease(dir), ["records/extra.json: not listed in the manifest"]);
});

test("verification rejects a missing file", () => {
  const dir = written();
  rmSync(join(dir, "summaries", "synthetic.wake-shards.txt"));
  assert.deepEqual(verifyRelease(dir), ["summaries/synthetic.wake-shards.txt: missing"]);
});

test("verification rejects a changed file", () => {
  const dir = written();
  writeFileSync(join(dir, "summaries", "synthetic.wake-shards.txt"), "Changed.\n");
  assert.deepEqual(verifyRelease(dir), ["summaries/synthetic.wake-shards.txt: checksum mismatch"]);
});

test("verification rejects an unexpected manifest field", () => {
  const dir = written();
  const path = join(dir, "manifest.json");
  writeFileSync(path, JSON.stringify({ ...JSON.parse(readFileSync(path, "utf8")), builtAt: "2026-11-21" }));
  assert.deepEqual(verifyRelease(dir), ["manifest.json/ must NOT have additional properties"]);
});

test("verification rejects a record path outside its id", () => {
  const dir = written();
  const path = join(dir, "manifest.json");
  const value = JSON.parse(readFileSync(path, "utf8"));
  value.records[0].record.path = "../outside.json";
  writeFileSync(path, JSON.stringify(value));
  assert.ok(verifyRelease(dir).includes("/records/0/record/path must be records/synthetic.grave-tether.json"));
});
