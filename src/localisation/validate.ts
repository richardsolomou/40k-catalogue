// Mirrors localisation.v1.schema.json, which is the contract consumers rely on.
import { Ajv2020 } from "ajv/dist/2020.js";
import schema from "./localisation.v1.schema.json" with { type: "json" };
import { normalizeName } from "./normalize.ts";

export type Kind = "faction" | "detachment" | "enhancement" | "unit" | "wargear" | "disposition";
export type Alias = { name: string; use: "spelling" } | { name: string; use: "historical"; until: string };
export type Entry = { id: string; kind: Kind; name: string; display?: string; aliases?: Alias[] };

export type LocalisationFile = {
  formatVersion: 1;
  language: string;
  rulesVersion: { edition: string; update: string };
  source: { title: string; url?: string; reuse: string };
  entries: Entry[];
};

/** A spelling that more than one entity of the same kind uses, which a resolver can only answer with every candidate. */
export type Ambiguity = { kind: Kind; name: string; ids: string[] };
export type Validation = { ok: true; file: LocalisationFile; ambiguities: Ambiguity[] } | { ok: false; errors: string[] };

const checkSchema = new Ajv2020({ allErrors: true }).compile<LocalisationFile>(schema);

export function validateLocalisation(value: unknown): Validation {
  if (!checkSchema(value)) {
    // "if" errors only repeat the failure already reported inside the matching branch.
    const errors = (checkSchema.errors ?? []).filter((e) => e.keyword !== "if");
    return { ok: false, errors: errors.map((e) => `${e.instancePath || "/"} ${e.message}`) };
  }
  const errors = entryErrors(value);
  return errors.length > 0 ? { ok: false, errors } : { ok: true, file: value, ambiguities: ambiguities(value) };
}

// Uniqueness and redundancy span entries, which the schema cannot express.
function entryErrors(file: LocalisationFile): string[] {
  const errors: string[] = [];
  const firstIndex = new Map<string, number>();
  file.entries.forEach((entry, i) => {
    const earlier = firstIndex.get(entry.id);
    if (earlier !== undefined) errors.push(`/entries/${i}/id repeats the id of /entries/${earlier}`);
    else firstIndex.set(entry.id, i);

    const seen = new Set([normalizeName(entry.name), ...(entry.display ? [normalizeName(entry.display)] : [])]);
    entry.aliases?.forEach((alias, j) => {
      const key = normalizeName(alias.name);
      if (seen.has(key)) errors.push(`/entries/${i}/aliases/${j} repeats a name the entry already answers to`);
      seen.add(key);
    });
  });
  return errors;
}

// A retired name gives way to an entity that carries it today, so only a clash among current names, or among retired
// names no entity carries today, leaves a reader with more than one candidate.
function ambiguities(file: LocalisationFile): Ambiguity[] {
  const owners = new Map<string, { kind: Kind; name: string; current: Set<string>; retired: Set<string> }>();
  for (const entry of file.entries) {
    const named: [string, boolean][] = [
      [entry.name, false],
      ...(entry.display ? [[entry.display, false] as [string, boolean]] : []),
      ...(entry.aliases ?? []).map((a): [string, boolean] => [a.name, a.use === "historical"]),
    ];
    for (const [name, retired] of named) {
      const key = `${entry.kind}\u0000${normalizeName(name)}`;
      const found = owners.get(key) ?? { kind: entry.kind, name, current: new Set<string>(), retired: new Set<string>() };
      (retired ? found.retired : found.current).add(entry.id);
      owners.set(key, found);
    }
  }
  return [...owners.values()].flatMap(({ kind, name, current, retired }) => {
    const candidates = current.size > 0 ? current : retired;
    return candidates.size > 1 ? [{ kind, name, ids: [...candidates].sort() }] : [];
  });
}
