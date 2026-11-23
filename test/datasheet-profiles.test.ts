import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { checkUpgrade, historyErrors, type Release } from "../src/catalogue-identity/identity.ts";
import { buildCatalogueRelease, type CatalogueRecord, type Manifest } from "../src/catalogue-releases/catalogue.ts";
import { validateProfiles } from "../src/datasheet-profiles/profiles.ts";

const fixtures = new URL("../fixtures/", import.meta.url);
const json = (path: string): any => JSON.parse(readFileSync(new URL(path, fixtures), "utf8"));
const records = (dir: string) => readdirSync(new URL(dir, fixtures)).map((f) => json(`${dir}${f}`) as CatalogueRecord);
const identity = (version: string): Release => {
  const rosters = json(`roster-definitions/${version}/identity.json`);
  return { ...rosters, entries: [...rosters.entries, ...json(`datasheet-profiles/${version}/identity.json`).entries] };
};
const profileRecords = (version: string) => records(`datasheet-profiles/${version}/records/profiles/`);
const UNIT = "synthetic.ember-host";
const WARDENS = `${UNIT}.flame-wardens`;

function errors(change: (identity: Release, records: CatalogueRecord[]) => void) {
  const id = identity("1.1");
  const recs = profileRecords("1.1");
  change(id, recs);
  const result = validateProfiles(id, recs);
  return result.ok ? [] : result.errors;
}
const record = (recs: CatalogueRecord[], kind: string, id: string): any => recs.find((r) => r.kind === kind && r.id === id)!;
const entry = (id: Release, kind: string, entryId: string) => id.entries.find((e) => e.kind === kind && e.id === entryId)!;

function profiles(version: string) {
  const result = validateProfiles(identity(version), profileRecords(version));
  if (!result.ok) assert.fail(result.errors.join("\n"));
  return result.profiles;
}

test("both rules versions validate", () => {
  assert.deepEqual([profiles("1.0").all("weapon-profile").length, profiles("1.1").all("weapon-profile").length], [2, 6]);
});

test("profile IDs form a valid identity history beside the roster IDs", () => {
  assert.deepEqual(historyErrors([identity("1.0"), identity("1.1")]), []);
});

test("a saved weapon profile that split into firing modes resolves to its replacements", () => {
  const [finding] = checkUpgrade(identity("1.1"), [{ kind: "weapon-profile", id: `${WARDENS}.cinder-cannon` }]);
  assert.deepEqual(finding.resolution.status === "retired" && finding.resolution.replacedBy.map((e) => e.id), [`${WARDENS}.cinder-cannon-focused`, `${WARDENS}.cinder-cannon-dispersed`]);
});

test("profiles build as a category that depends on rosters and reports the retired profile", () => {
  const build = (version: string, release: string, previous?: Parameters<typeof buildCatalogueRelease>[1]["previous"]) => {
    const dir = mkdtempSync(join(tmpdir(), "profiles-"));
    cpSync(fileURLToPath(new URL(`roster-definitions/${version}/records`, fixtures)), join(dir, "records"), { recursive: true });
    cpSync(fileURLToPath(new URL(`datasheet-profiles/${version}/records`, fixtures)), join(dir, "records"), { recursive: true });
    writeFileSync(join(dir, "identity.json"), JSON.stringify(identity(version)));
    const categories = json(`roster-definitions/${version}/categories.json`);
    categories.categories.push({ name: "profiles", status: "included", kinds: ["unit-profile", "weapon-profile", "attachment"], sources: [{ title: "Synthetic datasheet profiles", page: "1" }] });
    writeFileSync(join(dir, "categories.json"), JSON.stringify(categories));
    const result = buildCatalogueRelease(dir, { release, commit: "0".repeat(40), previous });
    assert.ok(result.ok, JSON.stringify(result));
    return result.files;
  };
  const files = build("1.1", "0.2.0", build("1.0", "0.1.0"));
  assert.ok(files.has("schema/datasheet-profiles/profiles.v1.schema.json"));
  const category = (JSON.parse(files.get("manifest.json")!.toString()) as Manifest).categories.find((c) => c.name === "profiles")!;
  assert.deepEqual([category.status, category.dependsOn, category.changes.retired.map((r) => r.id)], ["complete", ["rosters"], [`${WARDENS}.cinder-cannon`]]);
});

test("a unit's profiles are listed by kind and model", () => {
  const models = profiles("1.1").of("unit-profile", WARDENS).map((p) => p.data.models);
  assert.deepEqual(models, [[`${WARDENS}.warden`], [`${WARDENS}.leader`]]);
});

test("a bodyguard lists every unit that may lead it", () => {
  assert.deepEqual(profiles("1.1").attachedBy(WARDENS, "leads"), [`${UNIT}.pyre-lord`, `${UNIT}.the-kindler`]);
});

test("a profile cannot name a model of another unit", () => {
  const found = errors((id, recs) => {
    const other = `${UNIT}.pyre-lord.lord`;
    record(recs, "unit-profile", `${WARDENS}.warden`).data.models = [other];
    entry(id, "unit-profile", `${WARDENS}.warden`).references!.push({ kind: "model", id: other });
  });
  assert.deepEqual(found, [`unit-profile:${WARDENS}.warden names model:${UNIT}.pyre-lord.lord, which belongs to another unit`]);
});

test("a weapon profile cannot name wargear its unit neither carries nor offers", () => {
  const found = errors((id, recs) => {
    record(recs, "weapon-profile", `${WARDENS}.ember-rifle`).data.wargear = "synthetic.ember-staff";
    entry(id, "weapon-profile", `${WARDENS}.ember-rifle`).references!.push({ kind: "wargear", id: "synthetic.ember-staff" });
  });
  assert.deepEqual(found, [`weapon-profile:${WARDENS}.ember-rifle names wargear:synthetic.ember-staff, which unit:${WARDENS} neither carries nor offers`]);
});

const LORD_STAFF = `${UNIT}.pyre-lord.ember-staff`;
const nameWargear = (id: Release, recs: CatalogueRecord[], profile: string, wargear: string) => {
  record(recs, "weapon-profile", profile).data.wargear = wargear;
  entry(id, "weapon-profile", profile).references!.push({ kind: "wargear", id: wargear });
};

test("a weapon profile may name wargear included by a bundle its unit offers", () => {
  assert.deepEqual(errors((id, recs) => nameWargear(id, recs, LORD_STAFF, "synthetic.ember-maul")), []);
});

test("a weapon profile may name wargear its unit carries itself rather than any model", () => {
  const found = errors((id, recs) => {
    nameWargear(id, recs, `${WARDENS}.ember-rifle`, "synthetic.ember-staff");
    entry(id, "unit", WARDENS).references!.push({ kind: "wargear", id: "synthetic.ember-staff" });
  });
  assert.deepEqual(found, []);
});

test("a weapon profile cannot name wargear only another unit's bundle includes", () => {
  const found = errors((id, recs) => nameWargear(id, recs, `${WARDENS}.ember-rifle`, "synthetic.ward-shield"));
  assert.deepEqual(found, [`weapon-profile:${WARDENS}.ember-rifle names wargear:synthetic.ward-shield, which unit:${WARDENS} neither carries nor offers`]);
});

test("bundles that include each other still bound a weapon profile's wargear", () => {
  const found = errors((id, recs) => {
    entry(id, "wargear", "synthetic.ember-maul").references = [{ kind: "wargear", id: "synthetic.maul-and-shield" }];
    nameWargear(id, recs, LORD_STAFF, "synthetic.ember-maul");
  });
  assert.deepEqual(found, []);
});

const transportLoad = { limit: 4, count: "models", selectors: ["Scouts", "Guard Infantry"] };

function transport(id: Release, records: CatalogueRecord[], capacity: object) {
  const unit = WARDENS;
  id.entries.push({ kind: "transport-profile", id: unit, name: "Transport", references: [{ kind: "unit", id: unit }] });
  records.push({
    formatVersion: 1, kind: "transport-profile", id: unit, rulesVersion: id.rulesVersion,
    source: { title: "Synthetic datasheet", page: "1" }, data: { unit, capacity },
  });
}

test("transport capacity distinguishes extra pools from alternative loads", () => {
  const capacity = {
    loads: [[transportLoad, { limit: 1, count: "models", selectors: ["Hero"] }], [{ limit: 1, count: "units", selectors: ["Monsters"], maxWounds: 3 }]],
    excluded: [{ selectors: ["Flying"], except: ["Friendly Scout"] }],
    space: [{ selectors: ["Heavy"], size: 2 }],
  };
  const id = identity("1.1");
  const recs = profileRecords("1.1");
  transport(id, recs, capacity);
  const result = validateProfiles(id, recs);
  if (!result.ok) assert.fail(result.errors.join("\n"));
  assert.deepEqual(result.profiles.of("transport-profile", WARDENS)[0]?.data.capacity, capacity);
});

test("conditional capacity can only name gear the transport carries or offers", () => {
  const found = errors((id, recs) => {
    const wargear = "synthetic.ember-staff";
    transport(id, recs, { loads: [[transportLoad]], whenEquipped: [{ wargear, pool: transportLoad }] });
    entry(id, "transport-profile", WARDENS).references!.push({ kind: "wargear", id: wargear });
  });
  assert.deepEqual(found, [`transport-profile:${WARDENS} names wargear:synthetic.ember-staff, which unit:${WARDENS} neither carries nor offers`]);
});

test("an attachment cannot name a unit its identity entry does not reference", () => {
  const found = errors((_, recs) => record(recs, "attachment", `${UNIT}.pyre-lord`).data.leads.push(`${UNIT}.ash-drones`));
  assert.deepEqual(found, [`attachment:${UNIT}.pyre-lord names unit:${UNIT}.ash-drones but its identity entry does not reference it`]);
});

test("a missing characteristic needs a gap", () => {
  const found = errors((_, recs) => delete record(recs, "weapon-profile", `${WARDENS}.ember-rifle`).data.strength);
  assert.deepEqual(found, [`weapon-profile:${WARDENS}.ember-rifle has no strength and no gap for it`]);
});

test("a stated characteristic cannot also be a gap", () => {
  const found = errors((_, recs) => record(recs, "unit-profile", `${UNIT}.ash-drones.ash-drone`).data.leadership = 7);
  assert.deepEqual(found, [`unit-profile:${UNIT}.ash-drones.ash-drone states leadership and also a gap for it`]);
});

test("an unknown gap field cannot stand in for a profile field", () => {
  const found = errors((_, recs) => (record(recs, "unit-profile", `${WARDENS}.warden`).data.gaps = [{ field: "move", reason: "unrepresentable" }]));
  assert.deepEqual(found, [`unit-profile:${WARDENS}.warden has a gap for unknown field move`]);
});

test("several unit profiles each need models or a gap for them", () => {
  const found = errors((id, recs) => {
    delete record(recs, "unit-profile", `${WARDENS}.warden`).data.models;
    entry(id, "unit-profile", `${WARDENS}.warden`).references = [{ kind: "unit", id: WARDENS }];
  });
  assert.deepEqual(found, [`unit:${WARDENS} has 2 unit profiles, so each needs models or a gap for them`]);
});

test("dice amounts must name a die", () => {
  const found = errors((_, recs) => (record(recs, "weapon-profile", `${UNIT}.pyre-lord.ember-staff`).data.damage = "D+3"));
  assert.ok(found.some((e) => e.startsWith(`weapon-profile:${UNIT}.pyre-lord.ember-staff data/damage`)), found.join("\n"));
});

test("a transport's Firing Deck is a positive number of models", () => {
  const id = identity("1.1");
  const recs = profileRecords("1.1");
  transport(id, recs, { loads: [[transportLoad]] });
  (recs.at(-1)!.data as { firingDeck?: number }).firingDeck = 0;
  const result = validateProfiles(id, recs);
  assert.deepEqual(result.ok ? [] : result.errors, [`transport-profile:${WARDENS} data/firingDeck must be >= 1`]);
});
