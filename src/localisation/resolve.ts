import { foldName, normalizeName } from "./normalize.ts";
import type { Kind, LocalisationFile } from "./validate.ts";

export type Via = "name" | "display" | "spelling" | "historical";
export type Hit = { id: string; kind: Kind; language: string; via: Via; folded: boolean };
export type Resolution =
  | { status: "matched"; id: string; kind: Kind; hits: Hit[] }
  | { status: "ambiguous"; hits: Hit[] }
  | { status: "unmatched" }
  | { status: "unknown-language"; language: string };

/** Narrows a lookup to one language, some kinds, or the IDs that make sense where the name was read. */
export type Query = { language?: string; kinds?: readonly Kind[]; ids?: ReadonlySet<string> };

export type NameIndex = { languages: string[]; resolve(name: string, query?: Query): Resolution };

/**
 * Indexes validated files, possibly from several sources and languages. An entity, a kind and ID, must keep the same
 * catalogue name across every file, since entries for one entity in different files describe the same thing.
 */
export function indexNames(files: readonly LocalisationFile[]): NameIndex {
  const exact = new Map<string, Hit[]>();
  const folded = new Map<string, Hit[]>();
  const entities = new Map<string, { kind: Kind; name: string }>();
  const add = (map: Map<string, Hit[]>, key: string, hit: Hit) => map.set(key, [...(map.get(key) ?? []), hit]);

  for (const { language, entries } of files) {
    for (const entry of entries) {
      const known = entities.get(`${entry.kind}:${entry.id}`);
      if (known && (known.kind !== entry.kind || known.name !== entry.name)) {
        throw new Error(`${entry.kind} ${entry.id} is named "${known.name}" in one file and "${entry.name}" in another`);
      }
      entities.set(`${entry.kind}:${entry.id}`, entry);
      const names: [string, Via][] = [
        [entry.name, "name"],
        ...(entry.display ? [[entry.display, "display"] as [string, Via]] : []),
        ...(entry.aliases ?? []).map((alias): [string, Via] => [alias.name, alias.use]),
      ];
      for (const [name, via] of names) {
        add(exact, normalizeName(name), { id: entry.id, kind: entry.kind, language, via, folded: false });
        add(folded, foldName(name), { id: entry.id, kind: entry.kind, language, via, folded: true });
      }
    }
  }

  const languages = [...new Set(files.map((f) => f.language))].sort();
  // "fr-CA" is served by a "fr-CA" file or, failing that, by "fr".
  const serves = (fileLanguage: string, wanted: string) => {
    const [file, want] = [fileLanguage.toLowerCase(), wanted.toLowerCase()];
    return want === file || want.startsWith(`${file}-`);
  };

  return {
    languages,
    resolve(name, query = {}) {
      const { language, kinds, ids } = query;
      if (language && !languages.some((l) => serves(l, language))) return { status: "unknown-language", language };
      const wanted = (hit: Hit) =>
        (!language || serves(hit.language, language)) && (!kinds || kinds.includes(hit.kind)) && (!ids || ids.has(hit.id));

      let hits = (exact.get(normalizeName(name)) ?? []).filter(wanted);
      if (hits.length === 0) hits = (folded.get(foldName(name)) ?? []).filter(wanted);
      // A retired name gives way to an entity that carries it today.
      if (hits.some((hit) => hit.via !== "historical")) hits = hits.filter((hit) => hit.via !== "historical");

      const [first, ...rest] = hits;
      if (!first) return { status: "unmatched" };
      if (rest.some((hit) => hit.id !== first.id || hit.kind !== first.kind)) return { status: "ambiguous", hits };
      return { status: "matched", id: first.id, kind: first.kind, hits };
    },
  };
}
