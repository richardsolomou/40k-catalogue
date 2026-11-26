import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { validateRelease } from "../src/catalogue-identity/identity.ts";
import { foldName, normalizeName } from "../src/localisation/normalize.ts";
import { idsWithin, releaseErrors } from "../src/localisation/release.ts";
import { indexNames, type Query, type Resolution } from "../src/localisation/resolve.ts";
import { validateLocalisation, type LocalisationFile } from "../src/localisation/validate.ts";

const fixtures = new URL("../fixtures/localisation/", import.meta.url);
const data = new URL("../fixtures/localisation/candidates/", import.meta.url);
const json = (dir: URL, name: string): unknown => JSON.parse(readFileSync(new URL(name, dir), "utf8"));
const names = (dir: URL) => readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5));

function valid(dir: URL, name: string) {
  const result = validateLocalisation(json(dir, `${name}.json`));
  if (!result.ok) assert.fail(result.errors.join("\n"));
  return result;
}

const fr = valid(new URL("valid/", fixtures), "ashen-wardens.fr").file;
const es = valid(new URL("valid/", fixtures), "ashen-wardens.es").file;
const index = indexNames([fr, es]);
const ids = (resolution: Resolution) => ("hits" in resolution ? [...new Set(resolution.hits.map((h) => h.id))].sort() : []);
const matched = (name: string, query?: Query) => {
  const resolution = index.resolve(name, query);
  return resolution.status === "matched" ? resolution.id : resolution.status;
};

for (const name of names(new URL("valid/", fixtures))) {
  test(`fixture ${name} validates`, () => {
    assert.equal(validateLocalisation(json(new URL("valid/", fixtures), `${name}.json`)).ok, true);
  });
}

for (const name of names(data)) {
  test(`sample ${name} validates`, () => {
    assert.equal(validateLocalisation(json(data, `${name}.json`)).ok, true);
  });
}

const expectedErrors: Record<string, string> = {
  "duplicate-id": "/entries/1/id repeats the id of /entries/0",
  "entry-without-names": "/entries/0 must match a schema in anyOf",
  "historical-without-until": "/entries/0/aliases/0 must have required property 'until'",
  "language-name-not-tag": `/language must match pattern "^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$"`,
  "missing-reuse-terms": "/source must have required property 'reuse'",
  "redundant-alias": "/entries/0/aliases/0 repeats a name the entry already answers to",
  "spelling-with-until": "/entries/0/aliases/0/until boolean schema is false",
  "unknown-kind": "/entries/0/kind must be equal to one of the allowed values",
};

test("every invalid localisation fixture has an expected error", () => {
  assert.deepEqual(names(new URL("invalid/", fixtures)), Object.keys(expectedErrors).sort());
});

for (const [name, error] of Object.entries(expectedErrors)) {
  test(`${name} fails validation with: ${error}`, () => {
    const result = validateLocalisation(json(new URL("invalid/", fixtures), `${name}.json`));
    assert.ok(!result.ok && result.errors.includes(error), JSON.stringify(result));
  });
}

test("normalization folds case, spacing, typographic quotes and French colon spacing", () => {
  assert.equal(normalizeName("  Faction :  Gardiens de l’Âtre "), "faction: gardiens de l'âtre");
});

test("normalization folds full-width letters", () => {
  assert.equal(normalizeName("ＡＢＣ"), "abc");
});

test("folding removes Latin accents", () => {
  assert.equal(foldName("Lame de Tempête"), "lame de tempete");
});

test("folding keeps Japanese voicing marks", () => {
  assert.notEqual(foldName("ガ"), foldName("カ"));
});

test("validation reports names that two entities of one kind share", () => {
  assert.deepEqual(valid(new URL("valid/", fixtures), "ashen-wardens.fr").ambiguities, [
    { kind: "wargear", name: "Lame de Tempête", ids: ["ashen-wardens.storm-blade", "ashen-wardens.tempest-blade"] },
  ]);
});

test("a display name resolves to its entity's ID", () => {
  assert.equal(matched("Ost des Braises"), "ashen-wardens.ember-host");
});

test("an alternative spelling resolves to the same ID as the display name", () => {
  assert.equal(matched("Ost de Braise"), "ashen-wardens.ember-host");
});

test("the catalogue's own name resolves to the same ID", () => {
  assert.equal(matched("Ember Host"), "ashen-wardens.ember-host");
});

test("display names in two languages resolve to one ID", () => {
  assert.deepEqual([matched("Gardiens Cendrés"), matched("Guardianes Cenicientos")], ["ashen-wardens", "ashen-wardens"]);
});

test("a name typed without accents or with a plain apostrophe still resolves", () => {
  assert.equal(matched("gardiens de l'atre"), "ashen-wardens.hearth-keepers");
});

test("a historical name still resolves and says it is historical", () => {
  const resolution = index.resolve("Ost Ardent");
  assert.ok(resolution.status === "matched" && resolution.hits[0]?.via === "historical", JSON.stringify(resolution));
});

test("a current name wins over the same spelling retired from another entity", () => {
  assert.equal(matched("Ost des Cendres"), "ashen-wardens.cinder-host");
});

test("a name two entities share is reported with every candidate", () => {
  assert.deepEqual(ids(index.resolve("Lame de Tempête")), ["ashen-wardens.storm-blade", "ashen-wardens.tempest-blade"]);
});

test("the IDs valid where a name was read settle an ambiguity", () => {
  assert.equal(matched("Lame de Tempête", { ids: new Set(["ashen-wardens.tempest-blade"]) }), "ashen-wardens.tempest-blade");
});

test("a spelling two languages give different entities is ambiguous without a language", () => {
  assert.deepEqual(ids(index.resolve("Brasero")), ["ashen-wardens.brazier", "ashen-wardens.ember-brazier"]);
});

test("naming the language settles a cross-language ambiguity", () => {
  assert.equal(matched("Brasero", { language: "es" }), "ashen-wardens.ember-brazier");
});

test("a regional language falls back to its base language", () => {
  assert.equal(matched("Ost des Braises", { language: "fr-CA" }), "ashen-wardens.ember-host");
});

test("a language with no file is reported as unknown rather than unmatched", () => {
  assert.deepEqual(index.resolve("Aschewächter", { language: "de" }), { status: "unknown-language", language: "de" });
});

test("a kind filter excludes entities of other kinds", () => {
  assert.equal(matched("Ost des Braises", { kinds: ["unit"] }), "unmatched");
});

test("an entity cannot change catalogue name between files", () => {
  const renamed: LocalisationFile = { ...es, entries: [{ id: "ashen-wardens", kind: "faction", name: "Ash Wardens", display: "Guardianes" }] };
  assert.throws(() => indexNames([fr, renamed]), /faction ashen-wardens is named "Ashen Wardens"/);
});

test("entities of two kinds can share an ID", () => {
  const shared: LocalisationFile = {
    ...es,
    entries: [
      { id: "ashen-wardens.icon", kind: "wargear", name: "Icon", display: "Icono" },
      { id: "ashen-wardens.icon", kind: "ability", name: "Icon", display: "Estandarte" },
    ],
  };
  const result = validateLocalisation(shared);
  assert.ok(result.ok);
  assert.equal(indexNames([shared]).resolve("Estandarte").status, "matched");
});

const checkedRelease = validateRelease(json(new URL("release/", fixtures), "synthetic-update-3.json"));
if (!checkedRelease.ok) assert.fail(checkedRelease.errors.join("\n"));
const release = checkedRelease.release;
const emberCourt = valid(new URL("valid/", fixtures), "ember-court.fr").file;
const books = indexNames([fr, es, emberCourt]);
const ashenWardens = idsWithin(release, { kind: "faction", id: "ashen-wardens" });
const withFirstEntry = (entry: Partial<LocalisationFile["entries"][number]>): LocalisationFile => ({ ...fr, entries: [{ ...fr.entries[0]!, ...entry }] });

for (const name of names(new URL("valid/", fixtures))) {
  test(`fixture ${name} matches the release it names`, () => {
    assert.deepEqual(releaseErrors(valid(new URL("valid/", fixtures), name).file, release), []);
  });
}

test("a file checked against another rules version is rejected", () => {
  assert.deepEqual(releaseErrors({ ...fr, rulesVersion: { edition: "Synthetic", update: "Update 2" } }, release), [
    "/rulesVersion is Synthetic Update 2 but the release is Synthetic Update 3",
  ]);
});

test("an ID the release does not publish is reported", () => {
  assert.deepEqual(releaseErrors(withFirstEntry({ id: "ashen-wardens.ash-host", kind: "detachment" }), release), [
    "/entries/0 names detachment ashen-wardens.ash-host, which the release does not publish",
  ]);
});

test("an ID of another kind is reported as unpublished", () => {
  assert.deepEqual(releaseErrors(withFirstEntry({ kind: "unit" }), release), ["/entries/0 names unit ashen-wardens, which the release does not publish"]);
});

const holdTheLine = { id: "synthetic-pack.hold-the-line", name: "Hold the Line" };
const disposition = (name: string): LocalisationFile => withFirstEntry({ id: holdTheLine.id, kind: "disposition", name, display: "Tenir la Ligne" });

test("a force disposition a mission pack of the release defines is checked against the pack", () => {
  assert.deepEqual(
    [releaseErrors(disposition("Hold the Line"), release, [holdTheLine]), releaseErrors(disposition("Hold the Lines"), release, [holdTheLine])],
    [[], ['/entries/0/name is "Hold the Lines" but the release names disposition synthetic-pack.hold-the-line "Hold the Line"']],
  );
});

test("a force disposition no mission pack defines is reported", () => {
  assert.deepEqual(releaseErrors(disposition("Hold the Line"), release), [
    "/entries/0 names disposition synthetic-pack.hold-the-line, which no mission pack of the release defines",
  ]);
});

test("an alias ID is reported with its canonical ID", () => {
  assert.deepEqual(releaseErrors(withFirstEntry({ id: "ashen-wardens.cinder-guards", kind: "unit", name: "Cinder Guard" }), release), [
    "/entries/0/id is an alias of unit ashen-wardens.cinder-guard",
  ]);
});

test("a retired entry's alias still requires its canonical ID", () => {
  const retired = structuredClone(release);
  const unit = retired.entries.find((entry) => entry.id === "ashen-wardens.cinder-guard")!;
  unit.retired = { replacedBy: [] };
  assert.deepEqual(releaseErrors(withFirstEntry({ id: unit.aliases![0], kind: "unit", name: unit.name }), retired), [
    "/entries/0/id is an alias of unit ashen-wardens.cinder-guard",
  ]);
});

test("a catalogue name the release does not give that ID is reported", () => {
  assert.deepEqual(releaseErrors(withFirstEntry({ name: "Ashen Warden" }), release), [
    `/entries/0/name is "Ashen Warden" but the release names faction ashen-wardens "Ashen Wardens"`,
  ]);
});

test("a printed name two books share is ambiguous without a book", () => {
  assert.deepEqual(ids(books.resolve("Garde de Cendre")), ["ashen-wardens.cinder-guard", "ember-court.cinder-guard"]);
});

test("a book's IDs settle a printed name two books share", () => {
  const resolution = books.resolve("Garde de Cendre", { ids: ashenWardens });
  assert.ok(resolution.status === "matched" && resolution.id === "ashen-wardens.cinder-guard", JSON.stringify(resolution));
});

test("a book's IDs include the wargear its models use", () => {
  assert.ok(ashenWardens.has("ashen-wardens.ember-brazier"));
});

test("a book's IDs leave out another book's entries", () => {
  assert.equal(books.resolve("Pique de Cendre", { ids: ashenWardens }).status, "unmatched");
});

test("a cross-faction attachment does not bring another book's unit into scope", () => {
  const attached = structuredClone(release);
  attached.entries.push({
    kind: "attachment",
    id: "ashen-wardens.cinder-guard",
    name: "Cross-faction attachment",
    references: [{ kind: "unit", id: "ashen-wardens.cinder-guard" }, { kind: "unit", id: "ember-court.cinder-guard" }],
  });
  const ids = idsWithin(attached, { kind: "faction", id: "ashen-wardens" });
  assert.equal(ids.has("ember-court.cinder-guard"), false);
});

test("a unit's IDs settle wargear its book names twice", () => {
  const keepers = idsWithin(release, { kind: "unit", id: "ashen-wardens.hearth-keepers" });
  const resolution = books.resolve("Lame de Tempête", { ids: keepers });
  assert.ok(resolution.status === "matched" && resolution.id === "ashen-wardens.tempest-blade", JSON.stringify(resolution));
});
