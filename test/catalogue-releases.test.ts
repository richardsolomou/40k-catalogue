import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { buildCatalogueRelease, readCatalogueRelease, verifyCatalogueRelease, type Manifest } from "../src/catalogue-releases/catalogue.ts";
import { packRelease, writeRelease, type ReleaseFiles } from "../src/releases/release.ts";

const fixtures = fileURLToPath(new URL("../fixtures/catalogue-releases/", import.meta.url));
const COMMIT = "0123456789abcdef0123456789abcdef01234567";

function scratch(): string {
  const dir = mkdtempSync(join(tmpdir(), "catalogue-releases-test-"));
  test.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

function input(name: string): string {
  const dir = join(scratch(), name);
  cpSync(join(fixtures, name), dir, { recursive: true });
  return dir;
}

function edit(path: string, change: (value: any) => void): void {
  const value = JSON.parse(readFileSync(path, "utf8"));
  change(value);
  writeFileSync(path, JSON.stringify(value));
}

function build(dir: string, release = "0.2.0", previous?: ReleaseFiles): ReleaseFiles {
  const result = buildCatalogueRelease(dir, { release, commit: COMMIT, previous });
  if (!result.ok) assert.fail(result.errors.join("\n"));
  return result.files;
}

function errors(dir: string, release = "0.2.0", previous?: ReleaseFiles): string[] {
  const result = buildCatalogueRelease(dir, { release, commit: COMMIT, previous });
  return result.ok ? [] : result.errors;
}

function written(files: ReleaseFiles): string {
  const dir = join(scratch(), "release");
  writeRelease(dir, files);
  return dir;
}

// The first release as a consumer reads it back: written, verified, and loaded from disk.
function first(): ReleaseFiles {
  const result = readCatalogueRelease(written(build(input("1.0"))));
  if (!result.ok) assert.fail(result.errors.join("\n"));
  return result.files;
}

const manifest = (files: ReleaseFiles): Manifest => JSON.parse(files.get("manifest.json")!);
const category = (files: ReleaseFiles, name: string) => manifest(files).categories.find((c) => c.name === name)!;
const second = () => build(input("1.1"), "0.3.0", first());
const statuses = (files: ReleaseFiles) => Object.fromEntries(manifest(files).categories.map((c) => [c.name, c.status]));

test("a release with every owned entry recorded reports those categories complete and the rest retained", () => {
  assert.deepEqual(statuses(build(input("1.0"))), {
    mechanics: "retained",
    missions: "complete",
    points: "retained",
    rosters: "complete",
    terrain: "complete",
  });
});

test("retained categories add no files to the release", () => {
  const categories = [...build(input("1.0")).keys()].filter((p) => p.startsWith("records/")).map((p) => p.split("/")[1]);
  assert.deepEqual([...new Set(categories)], ["missions", "rosters", "terrain"]);
});

test("a category names the categories its entries refer to, including retained ones", () => {
  assert.deepEqual(category(build(input("1.0")), "rosters").dependsOn, ["mechanics"]);
});

test("input file names, key order, and formatting do not change the archive", () => {
  const expected = packRelease(build(input("1.0")));
  const dir = input("1.0");
  renameSync(join(dir, "records/rosters/warden-squad.json"), join(dir, "records/rosters/a.json"));
  edit(join(dir, "identity.json"), (value) => value.entries.reverse());
  edit(join(dir, "categories.json"), (value) => value.categories.reverse());
  const path = join(dir, "records/missions/crossfire.json");
  writeFileSync(path, JSON.stringify(Object.fromEntries(Object.entries(JSON.parse(readFileSync(path, "utf8"))).reverse())));
  assert.equal(Buffer.compare(packRelease(build(dir)), expected), 0);
});

test("standard tar unpacks the archive to a release that verifies", () => {
  const dir = join(scratch(), "unpacked");
  mkdirSync(dir);
  const archive = join(dir, "..", "release.tar");
  writeFileSync(archive, packRelease(second()));
  execFileSync("tar", ["-xf", archive, "-C", dir]);
  assert.deepEqual(verifyCatalogueRelease(dir), []);
});

test("standard tar preserves a catalogue record ID longer than the ustar file name field", () => {
  const dir = mkdtempSync(join(tmpdir(), "long-catalogue-archive-"));
  const path = `records/profiles/weapon-profile/${"synthetic-long-profile-".repeat(6)}named.json`;
  const archive = join(dir, "release.tar");
  writeFileSync(archive, packRelease(new Map([[path, "{}\n"]])));
  execFileSync("tar", ["-xf", archive, "-C", dir]);
  assert.equal(readFileSync(join(dir, path), "utf8"), "{}\n");
});

test("nested catalogue paths longer than the tar name field round-trip", () => {
  const dir = input("1.0");
  const id = "synthetic.terrain." + "long-layout-".repeat(4) + "east";
  const original = "synthetic.terrain.ruins-a";
  edit(join(dir, "identity.json"), (value) => {
    for (const entry of value.entries) {
      if (entry.id === original) entry.id = id;
      for (const ref of entry.references ?? []) if (ref.id === original) ref.id = id;
    }
  });
  edit(join(dir, "records/terrain/ruins-a.json"), (value) => (value.id = id));
  const path = `records/terrain/terrain-layout/${id}.json`;
  assert.ok(Buffer.byteLength(path) > 100);
  const out = scratch();
  const archive = join(out, "release.tar");
  writeFileSync(archive, packRelease(build(dir)));
  const listed = execFileSync("tar", ["-tf", archive], { encoding: "utf8" });
  assert.ok(listed.split("\n").includes(path));
});

test("verification rejects a changed record", () => {
  const dir = written(build(input("1.0")));
  writeFileSync(join(dir, "records/terrain/terrain-layout/synthetic.terrain.ruins-a.json"), "{}\n");
  assert.deepEqual(verifyCatalogueRelease(dir), ["records/terrain/terrain-layout/synthetic.terrain.ruins-a.json: checksum mismatch"]);
});

test("verification rejects records listed under a retained category", () => {
  const dir = written(build(input("1.0")));
  edit(join(dir, "manifest.json"), (value) => {
    const points = value.categories.find((c: { name: string }) => c.name === "points");
    points.records.push(value.categories.find((c: { name: string }) => c.name === "terrain").records[0]);
  });
  assert.ok(verifyCatalogueRelease(dir).includes("/categories/2 is retained but lists records"));
});

// The first input with French names for its faction, unit and one piece of wargear.
function localised(change: (file: any) => void = () => {}): string {
  const dir = input("1.0");
  const file = {
    formatVersion: 1,
    language: "fr",
    rulesVersion: { edition: "synthetic", update: "1.0" },
    source: { title: "Synthetic names", reuse: "Invented for this project's tests." },
    entries: [
      { kind: "faction", id: "synthetic.iron-choir", name: "Iron Choir", display: "Chœur de Fer" },
      { kind: "unit", id: "synthetic.iron-choir.warden-squad", name: "Warden Squad", display: "Escouade de Gardiens" },
      { kind: "wargear", id: "synthetic.pulse-lance", name: "Pulse Lance", display: "Lance à impulsion", aliases: [{ name: "Lance pulsée", use: "spelling" }] },
    ],
  };
  change(file);
  mkdirSync(join(dir, "localisation"));
  writeFileSync(join(dir, "localisation", "fr.json"), JSON.stringify(file));
  return dir;
}

test("the manifest lists each language's names with their checksum", () => {
  const files = build(localised());
  assert.deepEqual(manifest(files).localisation, [
    { language: "fr", path: "localisation/fr.json", sha256: createHash("sha256").update(files.get("localisation/fr.json")!).digest("hex"), entries: 3 },
  ]);
});

test("a release without localised names lists none", () => {
  assert.equal(manifest(build(input("1.0"))).localisation, undefined);
});

test("a localised entry the identity names differently blocks the release", () => {
  const dir = localised((file) => (file.entries[1].name = "Warden Squads"));
  assert.deepEqual(errors(dir), ['localisation/fr.json: /entries/1/name is "Warden Squads" but the release names unit synthetic.iron-choir.warden-squad "Warden Squad"']);
});

test("a localisation file must be named for its language", () => {
  assert.deepEqual(errors(localised((file) => (file.language = "es"))), ["localisation/fr.json: names language es"]);
});

test("a regional language is listed after its base language and the release verifies", () => {
  const dir = localised();
  const regional = JSON.parse(readFileSync(join(dir, "localisation", "fr.json"), "utf8"));
  writeFileSync(join(dir, "localisation", "fr-CA.json"), JSON.stringify({ ...regional, language: "fr-CA" }));
  const files = build(dir);
  assert.deepEqual([manifest(files).localisation!.map((file) => file.language), verifyCatalogueRelease(written(files))], [["fr", "fr-CA"], []]);
});

test("the order of localised entries does not change the archive", () => {
  const reversed = localised((file) => file.entries.reverse());
  assert.equal(build(reversed).get("localisation/fr.json"), build(localised()).get("localisation/fr.json"));
});

test("verification rejects changed localised names", () => {
  const dir = written(build(localised()));
  writeFileSync(join(dir, "localisation/fr.json"), "{}\n");
  assert.deepEqual(verifyCatalogueRelease(dir), ["localisation/fr.json: checksum mismatch"]);
});

test("the manifest pins the release it follows", () => {
  const before = first();
  assert.deepEqual(manifest(build(input("1.1"), "0.3.0", before)).previous, {
    release: "0.2.0",
    rulesVersion: { edition: "synthetic", update: "1.0" },
    revision: 1,
    manifest: createHash("sha256").update(before.get("manifest.json")!).digest("hex"),
  });
});

test("entries removed from play are reported with their replacements", () => {
  const files = second();
  assert.deepEqual(
    [...category(files, "rosters").changes.retired, ...category(files, "missions").changes.retired],
    [
      { kind: "roster-option", id: "synthetic.warden-squad.lance-upgrade", replacedBy: ["synthetic.warden-squad.one-lance", "synthetic.warden-squad.two-lances"] },
      { kind: "mission-layout", id: "synthetic.layout.hammer", replacedBy: [] },
    ],
  );
});

test("records that leave the release are reported", () => {
  const files = second();
  assert.deepEqual(
    [...category(files, "rosters").changes.recordsRemoved, ...category(files, "missions").changes.recordsRemoved],
    [
      { kind: "roster-option", id: "synthetic.warden-squad.lance-upgrade" },
      { kind: "wargear", id: "synthetic.chainglaive" },
      { kind: "mission-layout", id: "synthetic.layout.hammer" },
    ],
  );
});

test("an ID merged into another entry is reported as an alias", () => {
  assert.deepEqual(category(second(), "rosters").changes.aliased, [
    { kind: "wargear", id: "synthetic.chainglaive", canonical: "synthetic.chain-glaive" },
  ]);
});

test("active entries without a record are reported as unresolved", () => {
  const files = second();
  assert.deepEqual(
    [...category(files, "rosters").unresolved, ...category(files, "terrain").unresolved],
    [
      { kind: "roster-option", id: "synthetic.warden-squad.two-lances" },
      { kind: "terrain-layout", id: "synthetic.terrain.ruins-b" },
    ],
  );
});

test("a record that refers to an unresolved entry in another category is reported", () => {
  assert.deepEqual(category(second(), "missions").unresolvedReferences, [
    { from: { kind: "mission-layout", id: "synthetic.layout.crossfire" }, to: { kind: "terrain-layout", id: "synthetic.terrain.ruins-b" } },
  ]);
});

test("unresolved entries or references make a category partial", () => {
  assert.deepEqual(statuses(second()), {
    mechanics: "retained",
    missions: "partial",
    points: "retained",
    rosters: "partial",
    terrain: "partial",
  });
});

test("an ID dropped since the previous release blocks the release", () => {
  const dir = input("1.1");
  edit(join(dir, "identity.json"), (value) => {
    value.entries = value.entries.filter((e: { id: string }) => e.id !== "synthetic.layout.hammer");
  });
  assert.deepEqual(errors(dir, "0.3.0", first()), ["identity.json: synthetic 1.1 drops mission-layout:synthetic.layout.hammer"]);
});

test("a release no newer than the previous one is blocked", () => {
  assert.deepEqual(errors(input("1.1"), "0.2.0", first()), ["previous: release 0.2.0 must be newer than 0.2.0"]);
});

test("a category dropped since the previous release blocks the release", () => {
  const dir = input("1.1");
  edit(join(dir, "categories.json"), (value) => {
    value.categories = value.categories.filter((c: { name: string }) => c.name !== "points");
    value.categories.find((c: { name: string }) => c.name === "rosters").kinds.push("points");
  });
  assert.deepEqual(errors(dir, "0.3.0", first()), ["categories.json: drops points"]);
});

test("a record without an identity entry blocks the release", () => {
  const dir = input("1.0");
  edit(join(dir, "records/rosters/pulse-lance.json"), (value) => (value.id = "synthetic.plasma-lance"));
  assert.deepEqual(errors(dir), ["records/rosters/pulse-lance.json: wargear:synthetic.plasma-lance is missing in identity.json"]);
});

test("a record for a retired entry blocks the release", () => {
  const dir = input("1.1");
  cpSync(join(fixtures, "1.0/records/missions/hammer.json"), join(dir, "records/missions/hammer.json"));
  edit(join(dir, "records/missions/hammer.json"), (value) => (value.rulesVersion.update = "1.1"));
  assert.deepEqual(errors(dir), ["records/missions/hammer.json: mission-layout:synthetic.layout.hammer is retired in identity.json"]);
});

test("an absent entry is neither counted nor unresolved", () => {
  const dir = input("1.1");
  edit(join(dir, "identity.json"), (value) => value.entries.push({ kind: "wargear", id: "synthetic.void-blade", name: "Void Blade", absent: true }));
  const rosters = category(build(dir, "0.3.0", first()), "rosters");
  assert.deepEqual([rosters.entries, rosters.unresolved], [category(second(), "rosters").entries, category(second(), "rosters").unresolved]);
});

test("a record for an absent entry blocks the release", () => {
  const dir = input("1.0");
  edit(join(dir, "identity.json"), (value) => (value.entries.find((e: { id: string }) => e.id === "synthetic.chain-glaive").absent = true));
  assert.deepEqual(errors(dir), ["records/rosters/chain-glaive.json: wargear:synthetic.chain-glaive is absent in identity.json"]);
});

test("a record in the wrong category blocks the release", () => {
  const dir = input("1.0");
  renameSync(join(dir, "records/terrain/ruins-a.json"), join(dir, "records/missions/ruins-a.json"));
  rmSync(join(dir, "records/terrain"), { recursive: true });
  assert.deepEqual(errors(dir), [
    "records/missions/ruins-a.json: terrain-layout does not belong to missions",
    "records/terrain: an included category needs records",
  ]);
});

test("records for a retained category block the release", () => {
  const dir = input("1.0");
  mkdirSync(join(dir, "records/points"));
  assert.deepEqual(errors(dir), ["records/points: not an included category"]);
});

test("a retained source must name the revision consumers should keep using", () => {
  const dir = input("1.0");
  edit(join(dir, "categories.json"), (value) => {
    delete value.categories.find((c: { name: string }) => c.name === "points").sources[0].revision;
  });
  assert.ok(errors(dir).includes("categories.json: /categories/4/sources/0 must have required property 'revision'"));
});

test("an identity kind without a category blocks the release", () => {
  const dir = input("1.0");
  edit(join(dir, "categories.json"), (value) => {
    value.categories = value.categories.filter((c: { name: string }) => c.name !== "points");
  });
  assert.deepEqual(errors(dir), ["identity.json: points belongs to no category"]);
});

test("a record from another rules version blocks the release", () => {
  const dir = input("1.1");
  cpSync(join(fixtures, "1.0/records/terrain/ruins-a.json"), join(dir, "records/terrain/ruins-a.json"));
  assert.deepEqual(errors(dir), ["records/terrain/ruins-a.json: rules version differs from identity.json"]);
});
