import { Ajv2020 } from "ajv/dist/2020.js";
import schema from "./release.v1.schema.json" with { type: "json" };

// Mirrors release.v1.schema.json, which is the contract consumers rely on.
export type RulesVersion = { edition: string; update: string };
export type Ref = { kind: string; id: string };
export type Source = { title: string; page?: string; url?: string };
export type Entry = {
  kind: string;
  id: string;
  name: string;
  aliases?: string[];
  /** `sources` names the publications that retired the entry, such as the document superseding an FAQ. */
  retired?: { replacedBy: string[]; sources?: Source[] };
  references?: Ref[];
};
export type Release = { formatVersion: 1; rulesVersion: RulesVersion; revision: number; entries: Entry[] };

export type Resolution =
  | { status: "current"; entry: Entry }
  | { status: "aliased"; entry: Entry }
  | { status: "retired"; entry: Entry; replacedBy: Entry[] }
  | { status: "missing" };

export type ReleaseValidation = { ok: true; release: Release } | { ok: false; errors: string[] };

const checkSchema = new Ajv2020({ allErrors: true }).compile<Release>(schema);

const key = (kind: string, id: string) => `${kind}:${id}`;
const versionName = ({ edition, update }: RulesVersion) => `${edition} ${update}`;
const sameVersion = (a: RulesVersion, b: RulesVersion) => a.edition === b.edition && a.update === b.update;

export function validateRelease(value: unknown): ReleaseValidation {
  if (!checkSchema(value)) {
    return { ok: false, errors: (checkSchema.errors ?? []).map((e) => `${e.instancePath || "/"} ${e.message}`) };
  }
  const errors = releaseErrors(value);
  return errors.length > 0 ? { ok: false, errors } : { ok: true, release: value };
}

function releaseErrors(release: Release): string[] {
  const errors: string[] = [];
  const byId = new Map<string, Entry>();
  const aliasOf = new Map<string, Entry>();

  release.entries.forEach((entry, i) => {
    const k = key(entry.kind, entry.id);
    if (byId.has(k)) errors.push(`/entries/${i} duplicates ${k}`);
    else byId.set(k, entry);
  });
  release.entries.forEach((entry, i) => {
    for (const alias of entry.aliases ?? []) {
      const k = key(entry.kind, alias);
      if (byId.has(k) || aliasOf.has(k)) errors.push(`/entries/${i} alias ${k} is already in use`);
      else aliasOf.set(k, entry);
    }
  });

  release.entries.forEach((entry, i) => {
    for (const id of entry.retired?.replacedBy ?? []) {
      const target = byId.get(key(entry.kind, id));
      if (!target) errors.push(`/entries/${i} is replaced by missing ${key(entry.kind, id)}`);
      else if (target.retired) errors.push(`/entries/${i} is replaced by retired ${key(entry.kind, id)}`);
    }
    for (const ref of entry.references ?? []) {
      const k = key(ref.kind, ref.id);
      const target = byId.get(k);
      if (target && target.retired && !entry.retired) errors.push(`/entries/${i} refers to retired ${k}`);
      else if (!target && aliasOf.has(k)) errors.push(`/entries/${i} refers to alias ${k} instead of ${key(ref.kind, aliasOf.get(k)!.id)}`);
      else if (!target) errors.push(`/entries/${i} refers to missing ${k}`);
    }
  });
  return errors;
}

// Releases are oldest first; each must keep every ID and alias its predecessors published.
export function historyErrors(releases: Release[]): string[] {
  const errors: string[] = [];
  releases.forEach((release, i) => {
    const later = releases.slice(i + 1);
    if (later.some((r) => sameVersion(r.rulesVersion, release.rulesVersion) && r.revision === release.revision)) {
      errors.push(`${versionName(release.rulesVersion)} revision ${release.revision} is published more than once`);
    }
    const next = releases[i + 1];
    if (!next) return;
    for (const entry of release.entries) {
      for (const id of [entry.id, ...(entry.aliases ?? [])]) {
        const k = key(entry.kind, id);
        const found = resolve(next, { kind: entry.kind, id });
        const where = versionName(next.rulesVersion);
        if (found.status === "missing") errors.push(`${where} drops ${k}`);
        else if (entry.retired && found.status !== "retired") errors.push(`${where} reuses retired ${k}`);
        else if (id !== entry.id && found.status === "current") errors.push(`${where} turns alias ${k} into its own entry`);
      }
    }
  });
  return errors;
}

export function resolve(release: Release, ref: Ref): Resolution {
  const ofKind = release.entries.filter((e) => e.kind === ref.kind);
  const entry = ofKind.find((e) => e.id === ref.id) ?? ofKind.find((e) => e.aliases?.includes(ref.id));
  if (!entry) return { status: "missing" };
  if (entry.retired) {
    const replacedBy = entry.retired.replacedBy.map((id) => ofKind.find((e) => e.id === id)!);
    return { status: "retired", entry, replacedBy };
  }
  return { status: entry.id === ref.id ? "current" : "aliased", entry };
}

// A saved record can select the exact revision that was available when it was created.
export function lookup(
  releases: Release[],
  ref: Ref,
  rulesVersion: RulesVersion,
  revision?: number,
): Resolution | { status: "unknown-version" | "ambiguous-version" } {
  const matches = releases.filter((r) => sameVersion(r.rulesVersion, rulesVersion) && (revision === undefined || r.revision === revision));
  if (matches.length > 1) return { status: "ambiguous-version" };
  const [release] = matches;
  return release ? resolve(release, ref) : { status: "unknown-version" };
}

export type UpgradeFinding = { ref: Ref; resolution: Exclude<Resolution, { status: "current" }> };

// Lists the references a consumer must act on before moving its mappings to `to`.
export function checkUpgrade(to: Release, refs: Ref[]): UpgradeFinding[] {
  return refs.flatMap((ref) => {
    const resolution = resolve(to, ref);
    return resolution.status === "current" ? [] : [{ ref, resolution }];
  });
}
