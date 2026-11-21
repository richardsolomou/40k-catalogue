import type { Entry, Inventory } from "./coverage.ts";

// The Game Datacards faction and core file layout, reduced to the fields that name an entry. Text fields are never read.
type Name = string | { en?: string };
type Named = { name?: Name };
export type DatacardsStratagem = {
  id: string;
  name: Name;
  detachment_id?: string;
  cost?: unknown;
  phase?: unknown;
  turn?: unknown;
};
type Profile = { keywords?: string[] };
type Datasheet = {
  id: string;
  name: Name;
  abilities?: {
    core?: Named[];
    other?: Named[];
    special?: Named[];
    wargear?: Named[];
    primarch?: { abilities?: Named[] }[];
    damaged?: object | null;
  };
  rangedWeapons?: { profiles?: Profile[] }[];
  meleeWeapons?: { profiles?: Profile[] }[];
};
export type DatacardsFaction = {
  id?: string;
  detachments?: { id: string; name: Name }[];
  stratagems?: DatacardsStratagem[];
  enhancements?: { id: string; name: Name; detachment_id?: string }[];
  rules?: { army?: Named[]; detachment?: { detachment_id: string; rules?: Named[] }[] };
  datasheets?: Datasheet[];
};
export type DatacardsCore = { stratagems?: DatacardsStratagem[] };

const nameOf = (name: Name | undefined) => (typeof name === "string" ? name : (name?.en ?? "")).trim();
const slug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
// "Deadly Demise D6+2", "Feel No Pain 5+", "Scouts 8\"" and "Sustained Hits 1" all name one mechanic with an amount.
const baseName = (name: string) => name.replace(/\s+D?\d+(?:\+\d*)?"?$/i, "").replace(/^anti-.*$/i, "Anti");

/** Every gameplay reference entry a Game Datacards faction file names, by kind, with the core stratagems when given. */
export function inventoryFromDatacards(
  faction: DatacardsFaction,
  core: DatacardsCore | undefined,
  meta: Pick<Inventory, "rulesVersion" | "source">,
): Inventory {
  const detachments = new Map((faction.detachments ?? []).map((d) => [d.id, nameOf(d.name)]));
  const entries = new Map<string, Entry>();
  const add = (entry: Entry) => {
    if (entry.name && !entries.has(entry.id)) entries.set(entry.id, entry);
  };
  const shared = (kind: "core-ability" | "weapon-ability", name: string) => {
    const base = baseName(name.trim());
    add({ kind, id: `${kind}:${slug(base)}`, name: base, group: "Core" });
  };

  for (const rule of faction.rules?.army ?? []) add({ kind: "army-rule", id: `army:${slug(nameOf(rule.name))}`, name: nameOf(rule.name) });
  for (const set of faction.rules?.detachment ?? [])
    for (const rule of set.rules ?? [])
      add({ kind: "detachment-rule", id: `${set.detachment_id}:${slug(nameOf(rule.name))}`, name: nameOf(rule.name), group: detachments.get(set.detachment_id) });
  for (const card of faction.stratagems ?? [])
    add({ kind: "stratagem", id: card.id, name: nameOf(card.name), group: detachments.get(card.detachment_id ?? "") });
  for (const card of faction.enhancements ?? [])
    add({ kind: "enhancement", id: card.id, name: nameOf(card.name), group: detachments.get(card.detachment_id ?? "") });
  for (const sheet of faction.datasheets ?? []) {
    const group = nameOf(sheet.name);
    const abilities = sheet.abilities ?? {};
    const own = [...(abilities.other ?? []), ...(abilities.special ?? []), ...(abilities.wargear ?? []), ...(abilities.primarch ?? []).flatMap((p) => p.abilities ?? [])];
    for (const ability of own) add({ kind: "unit-ability", id: `${sheet.id}:${slug(nameOf(ability.name))}`, name: nameOf(ability.name), group });
    if (abilities.damaged) add({ kind: "unit-ability", id: `${sheet.id}:damaged`, name: "Damaged", group });
    for (const ability of abilities.core ?? []) shared("core-ability", nameOf(ability.name));
    for (const weapon of [...(sheet.rangedWeapons ?? []), ...(sheet.meleeWeapons ?? [])])
      for (const profile of weapon.profiles ?? []) for (const keyword of profile.keywords ?? []) shared("weapon-ability", keyword);
  }
  for (const card of core?.stratagems ?? []) add({ kind: "core-stratagem", id: card.id, name: nameOf(card.name), group: "Core" });

  const clean = [...entries.values()].map(({ group, ...entry }) => (group ? { ...entry, group } : entry));
  return { formatVersion: 1, ...meta, entries: clean };
}
