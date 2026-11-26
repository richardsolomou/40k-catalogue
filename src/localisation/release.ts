import { resolve, type Ref, type Release } from "../catalogue-identity/identity.ts";
import type { LocalisationFile } from "./validate.ts";

const key = ({ kind, id }: Ref) => `${kind}:${id}`;

/** A force disposition a mission pack of the release defines, as the pack names it. */
export type Disposition = { id: string; name: string };

/**
 * What stops a file being read against one identity release: a different rules version, or an entry whose kind and ID
 * the release does not publish, publishes only as an alias, or publishes under another catalogue name. A `disposition`
 * entry names a force disposition one of the release's mission packs defines, given as `dispositions`.
 */
export function releaseErrors(file: LocalisationFile, release: Release, dispositions: readonly Disposition[] = []): string[] {
  const want = file.rulesVersion;
  const have = release.rulesVersion;
  if (want.edition !== have.edition || want.update !== have.update) {
    return [`/rulesVersion is ${want.edition} ${want.update} but the release is ${have.edition} ${have.update}`];
  }
  const entries = new Map(release.entries.map((entry) => [key(entry), entry]));
  const packed = new Map(dispositions.map((disposition) => [disposition.id, disposition]));
  return file.entries.flatMap((entry, i) => {
    if (entry.kind === "disposition") {
      const defined = packed.get(entry.id);
      if (!defined) return [`/entries/${i} names disposition ${entry.id}, which no mission pack of the release defines`];
      return defined.name === entry.name ? [] : [`/entries/${i}/name is "${entry.name}" but the release names disposition ${entry.id} "${defined.name}"`];
    }
    const current = entries.get(key(entry));
    if (!current) {
      const found = resolve(release, entry);
      return found.status === "missing"
        ? [`/entries/${i} names ${entry.kind} ${entry.id}, which the release does not publish`]
        : [`/entries/${i}/id is an alias of ${entry.kind} ${found.entry.id}`];
    }
    if (current.name !== entry.name) return [`/entries/${i}/name is "${entry.name}" but the release names ${entry.kind} ${entry.id} "${current.name}"`];
    return [];
  });
}

/**
 * The IDs a name can mean in the given faction, detachment or unit, including weapons offered by its models and
 * options. Only ownership references determine the scope. Pass the result as a query's `ids`.
 */
export function idsWithin(release: Release, ref: Ref): Set<string> {
  const owners = new Map([["unit", "faction"], ["detachment", "faction"], ["enhancement", "detachment"], ["ability", "detachment"], ["model", "unit"], ["roster-option", "unit"]]);
  const owned = new Map<string, Release["entries"]>();
  for (const entry of release.entries) {
    const ownerKind = owners.get(entry.kind);
    for (const owner of entry.references ?? []) {
      if (owner.kind !== ownerKind) continue;
      const group = owned.get(key(owner)) ?? [];
      group.push(entry);
      owned.set(key(owner), group);
    }
  }
  if (!release.entries.some((entry) => entry.kind === ref.kind && entry.id === ref.id)) return new Set();
  const ids = new Set<string>();
  const visit = (target: Ref) => {
    ids.add(target.id);
    for (const child of owned.get(key(target)) ?? []) {
      visit(child);
      if (child.kind === "model" || child.kind === "roster-option") {
        for (const { kind, id } of child.references ?? []) if (kind === "wargear") ids.add(id);
      }
    }
  };
  visit(ref);
  return ids;
}
