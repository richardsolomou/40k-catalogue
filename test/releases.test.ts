import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { buildRelease, packRelease, sha256, verifyRelease, writeRelease, type ReleaseFiles } from "../src/releases/release.ts";

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
  for (const name of names) cpSync(new URL(`${name}.json`, fixtures), join(dir, `${name}.json`));
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

function editRecord(dir: string, update: (record: Record<string, unknown>) => void) {
  const path = join(dir, "targeted-effect.json");
  const record = JSON.parse(readFileSync(path, "utf8"));
  update(record);
  writeFileSync(path, JSON.stringify(record));
}

test("a release contains JSON files only", () => {
  assert.deepEqual(
    [...build(inputs()).keys()],
    [
      "manifest.json",
      "records/synthetic.grave-tether.json",
      "records/synthetic.hex-lantern.json",
      "records/synthetic.wake-shards.json",
      "schema/mechanic.v1.schema.json",
    ],
  );
});

test("the released record carries its reviewed summary body inline", () => {
  const files = build(inputs());
  const record = JSON.parse(files.get("records/synthetic.hex-lantern.json")!);
  const reviewed = JSON.parse(readFileSync(new URL("targeted-effect.json", fixtures), "utf8"));
  assert.equal(manifest(files).formatVersion, 2);
  assert.equal(typeof record.summary, "string");
  assert.equal(record.summary, reviewed.summary);
  assert.ok(!record.summary.startsWith(record.name));
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
  assert.deepEqual(errors(dir), ["notes.md: not a record file"]);
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
  assert.deepEqual(errors(dir), ["drafts: not a record file"]);
});

test("a symlinked input blocks the release", () => {
  const dir = inputs();
  symlinkSync(join(dir, "targeted-effect.json"), join(dir, "linked.json"));
  assert.deepEqual(errors(dir), ["linked.json: not a record file"]);
});

test("a record without its reviewed summary blocks the release", () => {
  const dir = inputs();
  editRecord(dir, (record) => { delete record.summary; });
  assert.deepEqual(errors(dir), ["targeted-effect.json: /summary is required for a release"]);
});

test("a reviewed summary that differs from the rendered one blocks the release", () => {
  const dir = inputs();
  editRecord(dir, (record) => { record.summary = "Edited by hand."; });
  assert.deepEqual(errors(dir), ["targeted-effect.json: /summary must match the rendered summary"]);
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
  cpSync(join(dir, "targeted-effect.json"), join(dir, "copy.json"));
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

test("a published version 1 archive still verifies", () => {
  const files = build(inputs(["targeted-effect"]));
  const legacy = manifest(files);
  legacy.formatVersion = 1;
  const [entry] = legacy.records;
  const { name, summary, ...mechanic } = JSON.parse(files.get(entry.record.path)!);
  const json = JSON.stringify({ name, ...mechanic });
  const text = `${name}: ${summary}\n`;
  entry.summary = { path: `summaries/${entry.id}.txt`, sha256: sha256(text) };
  entry.record.sha256 = sha256(json);
  files.set(entry.record.path, json);
  files.set(entry.summary.path, text);
  files.set("manifest.json", JSON.stringify(legacy));
  assert.deepEqual(verifyRelease(written(files)), []);
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
  rmSync(join(dir, "records", "synthetic.wake-shards.json"));
  assert.deepEqual(verifyRelease(dir), ["records/synthetic.wake-shards.json: missing"]);
});

test("verification rejects a changed file", () => {
  const dir = written();
  writeFileSync(join(dir, "records", "synthetic.wake-shards.json"), "{}\n");
  assert.deepEqual(verifyRelease(dir), ["records/synthetic.wake-shards.json: checksum mismatch"]);
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
