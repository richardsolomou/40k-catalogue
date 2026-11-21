import { createHash } from "node:crypto";
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { Ajv2020 } from "ajv/dist/2020.js";
import recordSchema from "../../schema/mechanic.v1.schema.json" with { type: "json" };
import legacyManifestSchema from "./manifest.v1.schema.json" with { type: "json" };
import manifestSchema from "./manifest.v2.schema.json" with { type: "json" };
import type { MechanicRecord } from "../record.ts";
import { validate } from "../validate.ts";

type FileRef = { path: string; sha256: string };
type RulesVersion = MechanicRecord["rulesVersion"];
type RecordRef = { id: string; record: FileRef };

export type Manifest = {
  formatVersion: 2;
  release: string;
  commit: string;
  recordSchema: FileRef & { formatVersion: 1 };
  rulesVersions: RulesVersion[];
  records: RecordRef[];
};

type LegacyManifest = Omit<Manifest, "formatVersion" | "records"> & {
  formatVersion: 1;
  records: (RecordRef & { summary: FileRef })[];
};

// Release path to file content, in path order.
export type ReleaseFiles = Map<string, string>;
export type Build = { ok: true; files: ReleaseFiles } | { ok: false; errors: string[] };

const MANIFEST = "manifest.json";
const RECORD_SCHEMA = "schema/mechanic.v1.schema.json";
const INPUT = /^[a-z0-9]+(?:[.-][a-z0-9]+)*\.json$/;

const schemas = new Ajv2020({ allErrors: true });
const checkManifest = schemas.compile<Manifest>(manifestSchema);
const checkLegacyManifest = schemas.compile<LegacyManifest>(legacyManifestSchema);

// Builds from reviewed JSON records. The archive's bytes depend only on the input values and release metadata.
export function buildRelease(dir: string, { release, commit }: { release: string; commit: string }): Build {
  const errors: string[] = [];
  const records = new Map<string, MechanicRecord>();
  let hasRecordFile = false;
  const dirents = readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1));
  for (const entry of dirents) {
    const { name } = entry;
    const isFile = entry.isFile();
    if (isFile && name === "README.md") continue;
    if (!isFile || !INPUT.test(name)) {
      errors.push(`${name}: not a record file`);
      continue;
    }
    hasRecordFile = true;
    let value: unknown;
    try {
      value = JSON.parse(readFileSync(join(dir, name), "utf8"));
    } catch (error) {
      errors.push(`${name}: ${(error as Error).message}`);
      continue;
    }
    const result = validate(value);
    if (!result.ok) {
      errors.push(...result.errors.map((e) => `${name}: ${e}`));
      continue;
    }
    const { record, gaps } = result;
    errors.push(...gaps.map((gap) => `${name}: unresolved at ${gap.path}`));
    if (record.summary === undefined) errors.push(`${name}: /summary is required for a release`);
    if (records.has(record.id)) errors.push(`${name}: duplicate id ${record.id}`);
    records.set(record.id, record);
  }
  if (!hasRecordFile) errors.push(`${dir}: no records`);
  if (errors.length > 0) return { ok: false, errors: errors.sort() };

  const files = new Map<string, string>([[RECORD_SCHEMA, canonicalJson(recordSchema)]]);
  const entries: Manifest["records"] = [];
  const rulesVersions = new Map<string, RulesVersion>();
  for (const id of [...records.keys()].sort()) {
    const record = records.get(id)!;
    const path = `records/${id}.json`;
    const content = canonicalJson(record);
    files.set(path, content);
    entries.push({ id, record: { path, sha256: sha256(content) } });
    const { edition, update } = record.rulesVersion;
    rulesVersions.set(JSON.stringify([edition, update]), { edition, update });
  }
  const manifest: Manifest = {
    formatVersion: 2,
    release,
    commit,
    recordSchema: { formatVersion: 1, path: RECORD_SCHEMA, sha256: sha256(files.get(RECORD_SCHEMA)!) },
    rulesVersions: [...rulesVersions.keys()].sort().map((key) => rulesVersions.get(key)!),
    records: entries,
  };
  if (!checkManifest(manifest)) return { ok: false, errors: manifestErrors(checkManifest) };
  files.set(MANIFEST, canonicalJson(manifest));
  return { ok: true, files: new Map([...files].sort(([a], [b]) => (a < b ? -1 : 1))) };
}

// Fails rather than overwrite, so a published release directory is never changed in place.
export function writeRelease(dir: string, files: ReleaseFiles): void {
  mkdirSync(dir);
  for (const [path, content] of files) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), content);
  }
}

// An uncompressed tar with fixed metadata and a PAX path header when a name exceeds ustar's fields.
export function packRelease(files: ReleaseFiles): Buffer {
  const blocks: Buffer[] = [];
  const append = (name: string, prefix: string, body: Buffer, type = "0") => {
    const header = Buffer.alloc(512);
    header.write(name, 0);
    header.write("0000644\0", 100);
    header.write("0000000\0", 108);
    header.write("0000000\0", 116);
    header.write(`${body.length.toString(8).padStart(11, "0")}\0`, 124);
    header.write("00000000000\0", 136);
    header.write("        ", 148);
    header.write(type, 156);
    header.write("ustar\u000000", 257);
    header.write(prefix, 345);
    const checksum = header.reduce((sum, byte) => sum + byte, 0);
    header.write(`${checksum.toString(8).padStart(6, "0")}\0 `, 148);
    blocks.push(header, body, Buffer.alloc((512 - (body.length % 512)) % 512));
  };
  for (const [path, content] of files) {
    const body = Buffer.from(content, "utf8");
    const split = Buffer.byteLength(path) > 100 ? path.lastIndexOf("/") : -1;
    const name = path.slice(split + 1);
    const prefix = split === -1 ? "" : path.slice(0, split);
    if (Buffer.byteLength(name) <= 100 && Buffer.byteLength(prefix) <= 155) {
      append(name, prefix, body);
      continue;
    }
    const attribute = ` path=${path}\n`;
    const attributeBytes = Buffer.byteLength(attribute);
    let length = attributeBytes + 1;
    while (length !== attributeBytes + String(length).length) length = attributeBytes + String(length).length;
    const fallback = sha256(path);
    append(`pax-${fallback}`, "", Buffer.from(`${length}${attribute}`, "utf8"), "x");
    append(fallback, "", body);
  }
  blocks.push(Buffer.alloc(1024));
  return Buffer.concat(blocks);
}

// Checks that an unpacked release holds exactly the files its manifest lists, each with its checksum.
// It does not re-run the validator or renderer, whose later versions must not invalidate old releases.
export function verifyRelease(dir: string): string[] {
  const errors: string[] = [];
  const present = releaseFiles(dir, errors);
  if (!present.has(MANIFEST)) return [...errors, `${MANIFEST}: missing`];

  let manifest: unknown;
  try {
    manifest = JSON.parse(readFileSync(join(dir, MANIFEST), "utf8"));
  } catch (error) {
    return [...errors, `${MANIFEST}: ${(error as Error).message}`];
  }
  const legacy = typeof manifest === "object" && manifest !== null && "formatVersion" in manifest && manifest.formatVersion === 1;
  const check = legacy ? checkLegacyManifest : checkManifest;
  if (!check(manifest)) return [...errors, ...manifestErrors(check)];

  const listed: FileRef[] = [manifest.recordSchema];
  const records: readonly (RecordRef & { summary?: FileRef })[] = manifest.records;
  records.forEach(({ id, record, summary }, i) => {
    if (record.path !== `records/${id}.json`) errors.push(`/records/${i}/record/path must be records/${id}.json`);
    if (i > 0 && records[i - 1].id >= id) errors.push(`/records/${i} is not in ascending id order`);
    listed.push(record);
    if (summary) {
      if (summary.path !== `summaries/${id}.txt`) errors.push(`/records/${i}/summary/path must be summaries/${id}.txt`);
      listed.push(summary);
    }
  });
  present.delete(MANIFEST);
  checkReleaseFiles(dir, present, listed, errors);
  return errors.sort();
}

export function releaseFiles(dir: string, errors: string[]): Set<string> {
  const present = new Set<string>();
  for (const entry of readdirSync(dir, { withFileTypes: true, recursive: true })) {
    const path = relative(dir, join(entry.parentPath, entry.name)).split("\\").join("/");
    if (entry.isFile()) present.add(path);
    else if (!entry.isDirectory()) errors.push(`${path}: not a regular file`);
  }
  return present;
}

export function checkReleaseFiles(dir: string, present: Set<string>, listed: FileRef[], errors: string[]): void {
  for (const { path, sha256: expected } of listed) {
    if (!present.delete(path)) errors.push(`${path}: missing`);
    else if (sha256(readFileSync(join(dir, path))) !== expected) errors.push(`${path}: checksum mismatch`);
  }
  errors.push(...[...present].map((path) => `${path}: not listed in the manifest`));
}

function manifestErrors(check: typeof checkManifest | typeof checkLegacyManifest): string[] {
  return (check.errors ?? []).map((e) => `${MANIFEST}${e.instancePath || "/"} ${e.message}`);
}

export function sha256(content: string | Buffer): string {
  return createHash("sha256").update(content).digest("hex");
}

// Sorted keys, two-space indent, trailing newline. Array order is meaningful and kept.
export function canonicalJson(value: unknown): string {
  const sort = (v: unknown): unknown =>
    Array.isArray(v)
      ? v.map(sort)
      : v && typeof v === "object"
        ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, sort((v as Record<string, unknown>)[k])]))
        : v;
  return `${JSON.stringify(sort(value), null, 2)}\n`;
}
