import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Ajv2020 } from "ajv/dist/2020.js";
import identitySchema from "../catalogue-identity/release.v1.schema.json" with { type: "json" };
import { historyErrors, resolve, validateRelease, type Ref, type Release, type RulesVersion } from "../catalogue-identity/identity.ts";
import profilesSchema from "../datasheet-profiles/profiles.v1.schema.json" with { type: "json" };
import localisationSchema from "../localisation/localisation.v1.schema.json" with { type: "json" };
import { releaseErrors, type Disposition } from "../localisation/release.ts";
import { validateLocalisation, type LocalisationFile } from "../localisation/validate.ts";
import missionPackSchema from "../mission-packs/mission-pack.v1.schema.json" with { type: "json" };
import pointsHistorySchema from "../points/history.v1.schema.json" with { type: "json" };
import pointsSchema from "../points/points.v1.schema.json" with { type: "json" };
import factsSchema from "../rule-summaries/facts.v1.schema.json" with { type: "json" };
import summariesSchema from "../rule-summaries/summaries.v2.schema.json" with { type: "json" };
import { canonicalJson, checkReleaseFiles, releaseFiles, sha256, type ReleaseFiles } from "../releases/release.ts";
import rosterSchema from "../roster-definitions/definitions.v1.schema.json" with { type: "json" };
import terrainSchema from "../terrain/terrain.v1.schema.json" with { type: "json" };
import categoriesSchema from "./categories.v1.schema.json" with { type: "json" };
import definitionsSchema from "./definitions.v1.schema.json" with { type: "json" };
import manifestSchema from "./manifest.v1.schema.json" with { type: "json" };
import recordSchema from "./record.v1.schema.json" with { type: "json" };

// Mirrors the schemas in this directory, which are the contract consumers rely on.
export type Source = { title: string; page?: string; url?: string; pageUrl?: string; revision?: string };
export type Attribution = { url: string; revision: string; credit: string; licence: string; changes: string };
export type CatalogueRecord = { formatVersion: 1; kind: string; id: string; rulesVersion: RulesVersion; source: Source; attribution?: Attribution; data: object };
type Categories = { formatVersion: 1; categories: { name: string; status: "included" | "retained"; kinds: string[]; sources: Source[] }[] };
type Status = "complete" | "partial" | "retained";
type FileRef = { path: string; sha256: string };
export type Category = {
  name: string;
  status: Status;
  statusBefore: Status | null;
  kinds: string[];
  sources: Source[];
  entries: number;
  records: (Ref & FileRef)[];
  unresolved: Ref[];
  unresolvedReferences: { from: Ref; to: Ref }[];
  dependsOn: string[];
  changes: {
    added: Ref[];
    renamed: (Ref & { from: string; to: string })[];
    aliased: (Ref & { canonical: string })[];
    retired: (Ref & { replacedBy: string[]; sources?: Source[] })[];
    recordsAdded: Ref[];
    recordsChanged: Ref[];
    recordsRemoved: Ref[];
  };
};
export type Manifest = {
  formatVersion: 1;
  release: string;
  commit: string;
  rulesVersion: RulesVersion;
  revision: number;
  previous: { release: string; rulesVersion: RulesVersion; revision: number; manifest: string } | null;
  schemas: FileRef[];
  identity: FileRef;
  localisation?: (FileRef & { language: string; entries: number })[];
  categories: Category[];
};
export type Build = { ok: true; files: ReleaseFiles } | { ok: false; errors: string[] };

const MANIFEST = "manifest.json";
const IDENTITY = "identity.json";
const SCHEMAS = new Map<string, object>([
  ["schema/catalogue-identity/release.v1.schema.json", identitySchema],
  ["schema/catalogue-releases/definitions.v1.schema.json", definitionsSchema],
  ["schema/catalogue-releases/manifest.v1.schema.json", manifestSchema],
  ["schema/catalogue-releases/record.v1.schema.json", recordSchema],
  ["schema/datasheet-profiles/profiles.v1.schema.json", profilesSchema],
  ["schema/localisation/localisation.v1.schema.json", localisationSchema],
  ["schema/mission-packs/mission-pack.v1.schema.json", missionPackSchema],
  ["schema/points/history.v1.schema.json", pointsHistorySchema],
  ["schema/points/points.v1.schema.json", pointsSchema],
  ["schema/roster-definitions/definitions.v1.schema.json", rosterSchema],
  ["schema/rule-summaries/facts.v1.schema.json", factsSchema],
  ["schema/rule-summaries/summaries.v2.schema.json", summariesSchema],
  ["schema/terrain/terrain.v1.schema.json", terrainSchema],
]);

const ajv = new Ajv2020({ allErrors: true }).addSchema(definitionsSchema);
const checkCategories = ajv.compile<Categories>(categoriesSchema);
const checkRecord = ajv.compile<CatalogueRecord>(recordSchema);
const checkManifest = ajv.compile<Manifest>(manifestSchema);

const key = ({ kind, id }: Ref) => `${kind}:${id}`;
const byKey = (a: Ref, b: Ref) => (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0);
const byPath = ([a]: [string, string], [b]: [string, string]) => (a < b ? -1 : 1);
const recordPath = (category: string, { kind, id }: Ref) => `records/${category}/${kind}/${id}.json`;
const localisationPath = (language: string) => `localisation/${language}.json`;

// Builds a catalogue release from a directory holding `identity.json`, `categories.json`, an optional
// `README.md`, `records/<category>/<name>.json` for each included category, and optional
// `localisation/<language>.json` files checked against the identity. `previous` is the
// verified file set of the release this one follows; its changes are reported in the manifest. The
// output depends only on those contents, never on file order, key order, formatting, or the machine.
export function buildCatalogueRelease(
  dir: string,
  { release, commit, previous }: { release: string; commit: string; previous?: ReleaseFiles },
): Build {
  const errors: string[] = [];
  const top = sortedDir(dir);
  for (const entry of top) {
    const allowed = entry.isFile() ? ["README.md", IDENTITY, "categories.json"] : entry.isDirectory() ? ["records", "localisation"] : [];
    if (!allowed.includes(entry.name)) errors.push(`${entry.name}: not a catalogue input`);
  }

  const identityResult = validateRelease(readJson(join(dir, IDENTITY), IDENTITY, errors));
  if (!identityResult.ok) errors.push(...identityResult.errors.map((e) => `${IDENTITY}: ${e}`));
  const categoriesValue = readJson(join(dir, "categories.json"), "categories.json", errors);
  const categoriesOk = checkCategories(categoriesValue);
  if (!categoriesOk) errors.push(...schemaErrors("categories.json", checkCategories.errors));
  if (errors.length > 0 || !identityResult.ok || !categoriesOk) return { ok: false, errors: errors.sort() };
  const identity = identityResult.release;
  const entryByKey = new Map(identity.entries.map((entry) => [key(entry), entry]));
  const declared = [...(categoriesValue as Categories).categories].sort((a, b) => (a.name < b.name ? -1 : 1));

  const categoryOf = new Map<string, string>();
  declared.forEach(({ name, kinds }, i) => {
    if (declared[i - 1]?.name === name) errors.push(`categories.json: ${name} is declared more than once`);
    for (const kind of kinds) {
      if (categoryOf.has(kind)) errors.push(`categories.json: ${kind} belongs to both ${categoryOf.get(kind)} and ${name}`);
      else categoryOf.set(kind, name);
    }
  });
  for (const kind of new Set(identity.entries.map((e) => e.kind))) {
    if (!categoryOf.has(kind)) errors.push(`${IDENTITY}: ${kind} belongs to no category`);
  }

  const included = new Set(declared.filter((c) => c.status === "included").map((c) => c.name));
  const records = new Map<string, { category: string; record: CatalogueRecord }>();
  const recordDirs = top.some((e) => e.name === "records" && e.isDirectory()) ? sortedDir(join(dir, "records")) : [];
  for (const entry of recordDirs) {
    if (!entry.isDirectory() || !included.has(entry.name)) {
      errors.push(`records/${entry.name}: not an included category`);
      continue;
    }
    for (const file of sortedDir(join(dir, "records", entry.name))) {
      const where = `records/${entry.name}/${file.name}`;
      if (!file.isFile() || !/^[a-z0-9]+(?:[.-][a-z0-9]+)*\.json$/.test(file.name)) {
        errors.push(`${where}: not a record file`);
        continue;
      }
      const value = readJson(join(dir, where), where, errors);
      if (value === undefined) continue;
      if (!checkRecord(value)) {
        errors.push(...schemaErrors(where, checkRecord.errors));
        continue;
      }
      const k = key(value);
      if (categoryOf.get(value.kind) !== entry.name) errors.push(`${where}: ${value.kind} does not belong to ${entry.name}`);
      const identityEntry = entryByKey.get(k);
      const status = identityEntry ? (identityEntry.retired ? "retired" : identityEntry.absent ? "absent" : "current") : resolve(identity, value).status;
      if (status !== "current") errors.push(`${where}: ${k} is ${status} in ${IDENTITY}`);
      if (!sameVersion(value.rulesVersion, identity.rulesVersion)) errors.push(`${where}: rules version differs from ${IDENTITY}`);
      if (records.has(k)) errors.push(`${where}: duplicates ${k}`);
      records.set(k, { category: entry.name, record: value });
    }
  }
  for (const name of included) {
    if (![...records.values()].some((r) => r.category === name)) errors.push(`records/${name}: an included category needs records`);
  }

  const dispositions = [...records.values()].flatMap(({ record }) =>
    record.kind === "mission-pack" ? ((record.data as { dispositions?: Disposition[] }).dispositions ?? []).map(({ id, name }) => ({ id, name })) : [],
  );
  // A localised name joins a disposition by its ID alone, so no two packs may define one.
  for (const [i, { id }] of dispositions.entries()) {
    if (dispositions.findIndex((other) => other.id === id) < i) errors.push(`records/mission-packs: disposition ${id} is defined by more than one mission pack`);
  }
  const localisation = new Map<string, { language: string; value: LocalisationFile; entries: number }>();
  const localisationDir = top.some((e) => e.name === "localisation" && e.isDirectory()) ? sortedDir(join(dir, "localisation")) : [];
  for (const file of localisationDir) {
    const where = `localisation/${file.name}`;
    const language = file.name.replace(/\.json$/, "");
    if (!file.isFile() || where !== localisationPath(language)) {
      errors.push(`${where}: not a localisation file`);
      continue;
    }
    const result = validateLocalisation(readJson(join(dir, where), where, errors));
    if (!result.ok) {
      errors.push(...result.errors.map((e) => `${where}: ${e}`));
      continue;
    }
    if (result.file.language !== language) errors.push(`${where}: names language ${result.file.language}`);
    errors.push(...releaseErrors(result.file, identity, dispositions).map((e) => `${where}: ${e}`));
    localisation.set(where, { language, value: result.file, entries: result.file.entries.length });
  }

  const before = previous && previousRelease(previous, identity, release, declared, errors);
  if (errors.length > 0) return { ok: false, errors: errors.sort() };

  const files = new Map<string, string>([...SCHEMAS].map(([path, schema]) => [path, canonicalJson(schema)]));
  // Entry order carries no meaning in the identity contract, so it must not change the bytes.
  files.set(IDENTITY, canonicalJson({ ...identity, entries: [...identity.entries].sort(byKey) }));
  for (const [, { category, record }] of records) files.set(recordPath(category, record), canonicalJson(record));
  for (const [path, { value }] of localisation) {
    // Entry order carries no meaning in the localisation contract either.
    const { entries } = value as LocalisationFile;
    files.set(path, canonicalJson({ ...value, entries: [...entries].sort(byKey) }));
  }

  const active = identity.entries.filter((e) => !e.retired && !e.absent);
  const categories = declared.map(({ name, status, kinds, sources }): Category => {
    const owned = active.filter((e) => kinds.includes(e.kind)).map(({ kind, id }) => ({ kind, id })).sort(byKey);
    const own = status === "included" ? owned.filter((ref) => records.has(key(ref))) : [];
    const unresolved = status === "included" ? owned.filter((ref) => !records.has(key(ref))) : [];
    const unresolvedReferences: Category["unresolvedReferences"] = [];
    const dependsOn = new Set<string>();
    for (const from of own) {
      for (const to of entryByKey.get(key(from))!.references ?? []) {
        const target = categoryOf.get(to.kind)!;
        if (target !== name) dependsOn.add(target);
        if (included.has(target) && !records.has(key(to))) unresolvedReferences.push({ from, to: { kind: to.kind, id: to.id } });
      }
    }
    const derived: Status = status === "retained" ? "retained" : unresolved.length + unresolvedReferences.length > 0 ? "partial" : "complete";
    const listed = own.map((ref) => {
      const path = recordPath(name, ref);
      return { ...ref, path, sha256: sha256(files.get(path)!) };
    });
    return {
      name,
      status: derived,
      statusBefore: before?.manifest.categories.find((c) => c.name === name)?.status ?? null,
      kinds: [...kinds].sort(),
      sources,
      entries: owned.length,
      records: listed,
      unresolved,
      unresolvedReferences: unresolvedReferences.sort((a, b) => byKey(a.from, b.from) || byKey(a.to, b.to)),
      dependsOn: [...dependsOn].sort(),
      changes: changes(kinds, identity, listed, before),
    };
  });

  const manifest: Manifest = {
    formatVersion: 1,
    release,
    commit,
    rulesVersion: identity.rulesVersion,
    revision: identity.revision,
    previous: before
      ? {
          release: before.manifest.release,
          rulesVersion: before.manifest.rulesVersion,
          revision: before.manifest.revision,
          manifest: sha256(before.files.get(MANIFEST)!),
        }
      : null,
    schemas: [...SCHEMAS.keys()].map((path) => ({ path, sha256: sha256(files.get(path)!) })),
    identity: { path: IDENTITY, sha256: sha256(files.get(IDENTITY)!) },
    ...(localisation.size > 0
      ? {
          localisation: [...localisation.values()]
            .sort((a, b) => (a.language < b.language ? -1 : 1))
            .map(({ language, entries }) => {
              const path = localisationPath(language);
              return { language, path, sha256: sha256(files.get(path)!), entries };
            }),
        }
      : {}),
    categories,
  };
  if (!checkManifest(manifest)) return { ok: false, errors: schemaErrors(MANIFEST, checkManifest.errors) };
  files.set(MANIFEST, canonicalJson(manifest));
  return { ok: true, files: new Map([...files].sort(byPath)) };
}

type Previous = { files: ReleaseFiles; manifest: Manifest; identity: Release; records: Map<string, Ref & FileRef> };

function previousRelease(
  files: ReleaseFiles,
  identity: Release,
  release: string,
  declared: Categories["categories"],
  errors: string[],
): Previous | undefined {
  const manifest = JSON.parse(files.get(MANIFEST) ?? "null") as Manifest;
  const result = validateRelease(JSON.parse(files.get(IDENTITY) ?? "null"));
  if (!checkManifest(manifest) || !result.ok) {
    errors.push("previous: not a verified catalogue release");
    return undefined;
  }
  const [a, b] = [manifest.release, release].map((v) => v.split(".").map(Number));
  const newer = b.findIndex((n, i) => n !== a[i]);
  if (newer === -1 || b[newer] < a[newer]) errors.push(`previous: release ${release} must be newer than ${manifest.release}`);
  if (sameVersion(manifest.rulesVersion, identity.rulesVersion) && identity.revision < manifest.revision) {
    errors.push(`previous: revision ${identity.revision} must not be older than ${manifest.revision}`);
  }
  errors.push(...historyErrors([result.release, identity]).map((e) => `${IDENTITY}: ${e}`));
  for (const { name } of manifest.categories) {
    if (!declared.some((c) => c.name === name)) errors.push(`categories.json: drops ${name}`);
  }
  const listed = manifest.categories.flatMap((c) => c.records);
  return {
    files,
    manifest,
    identity: result.release,
    records: new Map(listed.map((r) => [key(r), r])),
  };
}

function changes(kinds: string[], identity: Release, records: (Ref & FileRef)[], before: Previous | undefined): Category["changes"] {
  const ref = ({ kind, id }: Ref) => ({ kind, id });
  const was = new Map((before?.identity.entries ?? []).filter((e) => kinds.includes(e.kind)).map((e) => [key(e), e]));
  const result: Category["changes"] = {
    added: [],
    renamed: [],
    aliased: [],
    retired: [],
    recordsAdded: [],
    recordsChanged: [],
    recordsRemoved: [],
  };
  for (const entry of identity.entries.filter((e) => kinds.includes(e.kind))) {
    const prior = was.get(key(entry));
    if (!prior) result.added.push(ref(entry));
    else if (prior.name !== entry.name) result.renamed.push({ ...ref(entry), from: prior.name, to: entry.name });
    if (prior && !prior.retired && entry.retired) result.retired.push({ ...ref(entry), ...entry.retired });
  }
  for (const prior of was.values()) {
    const found = resolve(identity, prior);
    if (found.status === "aliased") result.aliased.push({ ...ref(prior), canonical: found.entry.id });
  }
  for (const record of records) {
    const sum = before?.records.get(key(record))?.sha256;
    if (sum === undefined) result.recordsAdded.push(ref(record));
    else if (sum !== record.sha256) result.recordsChanged.push(ref(record));
  }
  const current = new Set(records.map(key));
  for (const [k, prior] of before?.records ?? []) {
    if (kinds.includes(prior.kind) && !current.has(k)) result.recordsRemoved.push(ref(prior));
  }
  for (const list of Object.values(result)) list.sort(byKey);
  return result;
}

// Checks that an unpacked release holds exactly the files its manifest lists, each with its checksum.
// Like the pilot's check, it does not re-run validation, so later code never invalidates a release.
export function verifyCatalogueRelease(dir: string): string[] {
  const errors: string[] = [];
  const present = releaseFiles(dir, errors);
  if (!present.has(MANIFEST)) return [...errors, `${MANIFEST}: missing`];
  const manifest = readJson(join(dir, MANIFEST), MANIFEST, errors);
  if (manifest === undefined) return errors;
  if (!checkManifest(manifest)) return [...errors, ...schemaErrors(MANIFEST, checkManifest.errors)];

  const listed: FileRef[] = [...manifest.schemas, manifest.identity];
  if (manifest.identity.path !== IDENTITY) errors.push(`/identity/path must be ${IDENTITY}`);
  manifest.localisation?.forEach((file, i) => {
    if (file.path !== localisationPath(file.language)) errors.push(`/localisation/${i}/path must be ${localisationPath(file.language)}`);
    if (i > 0 && manifest.localisation![i - 1].language >= file.language) errors.push(`/localisation/${i} is not in ascending language order`);
    listed.push(file);
  });
  manifest.categories.forEach((category, i) => {
    if (i > 0 && manifest.categories[i - 1].name >= category.name) errors.push(`/categories/${i} is not in ascending name order`);
    if (category.status === "retained") {
      if (category.records.length > 0) errors.push(`/categories/${i} is retained but lists records`);
      category.sources.forEach((source, j) => {
        if (!source.revision) errors.push(`/categories/${i}/sources/${j} is missing the retained revision`);
      });
    }
    category.records.forEach((record, j) => {
      const expected = recordPath(category.name, record);
      if (record.path !== expected) errors.push(`/categories/${i}/records/${j}/path must be ${expected}`);
      if (j > 0 && byKey(category.records[j - 1], record) >= 0) errors.push(`/categories/${i}/records/${j} is not in ascending order`);
      listed.push(record);
    });
  });
  present.delete(MANIFEST);
  checkReleaseFiles(dir, present, listed, errors);
  return errors.sort();
}

// Reads a verified release as the `previous` input of the next build.
export function readCatalogueRelease(dir: string): Build {
  const errors = verifyCatalogueRelease(dir);
  if (errors.length > 0) return { ok: false, errors };
  const files: ReleaseFiles = new Map();
  for (const path of releaseFiles(dir, errors)) {
    files.set(path, readFileSync(join(dir, path), "utf8"));
  }
  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, files: new Map([...files].sort(byPath)) };
}

function sortedDir(dir: string) {
  return readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1));
}

function readJson(path: string, where: string, errors: string[]): unknown {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    errors.push(`${where}: ${(error as Error).message}`);
    return undefined;
  }
}

function schemaErrors(where: string, errors: { instancePath: string; message?: string }[] | null | undefined): string[] {
  return (errors ?? []).map((e) => `${where}: ${e.instancePath || "/"} ${e.message}`);
}

function sameVersion(a: RulesVersion, b: RulesVersion): boolean {
  return a.edition === b.edition && a.update === b.update;
}
