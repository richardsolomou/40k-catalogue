import { createHash } from "node:crypto";
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { Ajv2020 } from "ajv/dist/2020.js";
import recordSchema from "../../schema/mechanic.v1.schema.json" with { type: "json" };
import manifestSchema from "./manifest.v1.schema.json" with { type: "json" };
import type { MechanicRecord } from "../record.ts";
import { renderSummary } from "../render.ts";
import { validate } from "../validate.ts";

type FileRef = { path: string; sha256: string };
type RulesVersion = MechanicRecord["rulesVersion"];

export type Manifest = {
  formatVersion: 1;
  release: string;
  commit: string;
  recordSchema: FileRef & { formatVersion: 1 };
  rulesVersions: RulesVersion[];
  records: { id: string; record: FileRef; summary: FileRef }[];
};

// Release path to file content, in path order.
export type ReleaseFiles = Map<string, string>;
export type Build = { ok: true; files: ReleaseFiles } | { ok: false; errors: string[] };

const MANIFEST = "manifest.json";
const RECORD_SCHEMA = "schema/mechanic.v1.schema.json";
const INPUT = /^([a-z0-9]+(?:-[a-z0-9]+)*)\.(json|summary\.txt)$/;

const checkManifest = new Ajv2020({ allErrors: true }).compile<Manifest>(manifestSchema);

// Builds a release from one directory that holds only `<name>.json` records, each beside the reviewed
// `<name>.summary.txt` it must render. The output depends only on file contents, never on file order,
// key order, formatting, timestamps, or the machine.
export function buildRelease(dir: string, { release, commit }: { release: string; commit: string }): Build {
  const errors: string[] = [];
  const inputs = new Map<string, Map<string, string>>();
  const dirents = readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1));
  for (const entry of dirents) {
    if (entry.isFile() && entry.name === "README.md") continue;
    const match = entry.isFile() ? INPUT.exec(entry.name) : null;
    if (!match) {
      errors.push(`${entry.name}: not a record or summary file`);
      continue;
    }
    const [, name, ext] = match;
    if (!inputs.has(name)) inputs.set(name, new Map());
    inputs.get(name)!.set(ext, readFileSync(join(dir, entry.name), "utf8"));
  }
  if (inputs.size === 0) errors.push(`${dir}: no records`);

  const records = new Map<string, { record: MechanicRecord; summary: string }>();
  for (const [name, parts] of inputs) {
    const text = parts.get("json");
    const reviewed = parts.get("summary.txt");
    if (text === undefined || reviewed === undefined) {
      errors.push(`${name}: needs both ${name}.json and ${name}.summary.txt`);
      continue;
    }
    let value: unknown;
    try {
      value = JSON.parse(text);
    } catch (error) {
      errors.push(`${name}.json: ${(error as Error).message}`);
      continue;
    }
    const result = validate(value);
    if (!result.ok) {
      errors.push(...result.errors.map((e) => `${name}.json: ${e}`));
      continue;
    }
    // A release carries only fully reviewed records, so any gap blocks it.
    errors.push(...result.gaps.map((gap) => `${name}.json: unresolved at ${gap.path}`));
    const summary = renderSummary(result.record);
    if (summary !== reviewed.trimEnd()) errors.push(`${name}.summary.txt: does not match the rendered summary`);
    if (records.has(result.record.id)) errors.push(`${name}.json: duplicate id ${result.record.id}`);
    records.set(result.record.id, { record: result.record, summary });
  }
  if (errors.length > 0) return { ok: false, errors: errors.sort() };

  const files = new Map<string, string>([[RECORD_SCHEMA, canonicalJson(recordSchema)]]);
  const entries: Manifest["records"] = [];
  const rulesVersions = new Map<string, RulesVersion>();
  for (const id of [...records.keys()].sort()) {
    const { record, summary } = records.get(id)!;
    const recordFile = { path: `records/${id}.json`, content: canonicalJson(record) };
    const summaryFile = { path: `summaries/${id}.txt`, content: `${summary}\n` };
    for (const { path, content } of [recordFile, summaryFile]) files.set(path, content);
    entries.push({
      id,
      record: { path: recordFile.path, sha256: sha256(recordFile.content) },
      summary: { path: summaryFile.path, sha256: sha256(summaryFile.content) },
    });
    const { edition, update } = record.rulesVersion;
    rulesVersions.set(JSON.stringify([edition, update]), { edition, update });
  }
  const manifest: Manifest = {
    formatVersion: 1,
    release,
    commit,
    recordSchema: { formatVersion: 1, path: RECORD_SCHEMA, sha256: sha256(files.get(RECORD_SCHEMA)!) },
    rulesVersions: [...rulesVersions.keys()].sort().map((key) => rulesVersions.get(key)!),
    records: entries,
  };
  if (!checkManifest(manifest)) return { ok: false, errors: manifestErrors() };
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

// An uncompressed ustar archive with fixed metadata, so equal files always give equal bytes on any
// platform and Node version, which compressed output does not guarantee.
export function packRelease(files: ReleaseFiles): Buffer {
  const blocks: Buffer[] = [];
  for (const [path, content] of files) {
    const body = Buffer.from(content, "utf8");
    if (Buffer.byteLength(path) > 100) throw new Error(`${path}: path longer than 100 bytes`);
    const header = Buffer.alloc(512);
    header.write(path, 0);
    header.write("0000644\0", 100);
    header.write("0000000\0", 108);
    header.write("0000000\0", 116);
    header.write(`${body.length.toString(8).padStart(11, "0")}\0`, 124);
    header.write("00000000000\0", 136);
    header.write("        ", 148);
    header.write("0", 156);
    header.write("ustar\u000000", 257);
    const checksum = header.reduce((sum, byte) => sum + byte, 0);
    header.write(`${checksum.toString(8).padStart(6, "0")}\0 `, 148);
    blocks.push(header, body, Buffer.alloc((512 - (body.length % 512)) % 512));
  }
  blocks.push(Buffer.alloc(1024));
  return Buffer.concat(blocks);
}

// Checks that an unpacked release holds exactly the files its manifest lists, each with its checksum.
// It does not re-run the validator or renderer, whose later versions must not invalidate old releases.
export function verifyRelease(dir: string): string[] {
  const present = new Set<string>();
  const errors: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true, recursive: true })) {
    const path = relative(dir, join(entry.parentPath, entry.name)).split("\\").join("/");
    if (entry.isFile()) present.add(path);
    else if (!entry.isDirectory()) errors.push(`${path}: not a regular file`);
  }
  if (!present.has(MANIFEST)) return [...errors, `${MANIFEST}: missing`];

  let manifest: unknown;
  try {
    manifest = JSON.parse(readFileSync(join(dir, MANIFEST), "utf8"));
  } catch (error) {
    return [...errors, `${MANIFEST}: ${(error as Error).message}`];
  }
  if (!checkManifest(manifest)) return [...errors, ...manifestErrors()];

  const listed: FileRef[] = [manifest.recordSchema];
  manifest.records.forEach(({ id, record, summary }, i) => {
    if (record.path !== `records/${id}.json`) errors.push(`/records/${i}/record/path must be records/${id}.json`);
    if (summary.path !== `summaries/${id}.txt`) errors.push(`/records/${i}/summary/path must be summaries/${id}.txt`);
    if (i > 0 && manifest.records[i - 1].id >= id) errors.push(`/records/${i} is not in ascending id order`);
    listed.push(record, summary);
  });
  for (const { path, sha256: expected } of listed) {
    if (!present.delete(path)) errors.push(`${path}: missing`);
    else if (sha256(readFileSync(join(dir, path))) !== expected) errors.push(`${path}: checksum mismatch`);
  }
  present.delete(MANIFEST);
  errors.push(...[...present].map((path) => `${path}: not listed in the manifest`));
  return errors.sort();
}

function manifestErrors(): string[] {
  return (checkManifest.errors ?? []).map((e) => `${MANIFEST}${e.instancePath || "/"} ${e.message}`);
}

function sha256(content: string | Buffer): string {
  return createHash("sha256").update(content).digest("hex");
}

// Sorted keys, two-space indent, trailing newline. Array order is meaningful and kept.
function canonicalJson(value: unknown): string {
  const sort = (v: unknown): unknown =>
    Array.isArray(v)
      ? v.map(sort)
      : v && typeof v === "object"
        ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, sort((v as Record<string, unknown>)[k])]))
        : v;
  return `${JSON.stringify(sort(value), null, 2)}\n`;
}
