import { Ajv2020 } from "ajv/dist/2020.js";
import type { MechanicRecord } from "../record.ts";
import { gaps } from "../validate.ts";
import schema from "./inventory.v1.schema.json" with { type: "json" };

export const KINDS = [
  "army-rule",
  "detachment-rule",
  "stratagem",
  "enhancement",
  "unit-ability",
  "core-stratagem",
  "core-ability",
  "weapon-ability",
] as const;
export type Kind = (typeof KINDS)[number];
export type Entry = { kind: Kind; id: string; name: string; group?: string };
export type RulesVersion = { edition: string; update: string };
export type Inventory = {
  formatVersion: 1;
  rulesVersion: RulesVersion;
  source: { title: string; revision?: string; url?: string };
  entries: Entry[];
};
/** Record ID to inventory entry ID. The consumer holds this, because entry IDs are its source's IDs. */
export type Mapping = Record<string, string>;

export const STATUSES = ["covered", "gaps", "ambiguous", "missing"] as const;
export type Status = (typeof STATUSES)[number];
export type Counts = { entries: number } & Record<Status, number>;
export type EntryCoverage = Entry & { status: Status; records: string[]; reason?: string };
export type Coverage = {
  rulesVersion: RulesVersion;
  totals: Counts;
  byKind: Partial<Record<Kind, Counts>>;
  byGroup: Record<string, Counts>;
  entries: EntryCoverage[];
  problems: string[];
};

export type InventoryValidation = { ok: true; inventory: Inventory } | { ok: false; errors: string[] };

const checkInventory = new Ajv2020({ allErrors: true }).compile<Inventory>(schema);

export function validateInventory(value: unknown): InventoryValidation {
  if (!checkInventory(value)) return { ok: false, errors: (checkInventory.errors ?? []).map((e) => `${e.instancePath || "/"} ${e.message}`) };
  const seen = new Set<string>();
  const errors = value.entries.flatMap((entry, i) => {
    const repeat = seen.has(entry.id);
    seen.add(entry.id);
    return repeat ? [`/entries/${i}/id repeats "${entry.id}"`] : [];
  });
  return errors.length > 0 ? { ok: false, errors } : { ok: true, inventory: value };
}

const sameVersion = (a: RulesVersion, b: RulesVersion) => a.edition === b.edition && a.update === b.update;

function judge(mapped: MechanicRecord[], version: RulesVersion): Pick<EntryCoverage, "status" | "reason"> {
  if (mapped.length === 0) return { status: "missing" };
  if (mapped.length > 1) return { status: "ambiguous", reason: `${mapped.length} records map to this entry` };
  const [record] = mapped as [MechanicRecord];
  if (!sameVersion(record.rulesVersion, version))
    return { status: "ambiguous", reason: `record is checked against ${record.rulesVersion.edition} ${record.rulesVersion.update}` };
  const open = gaps(record);
  return open.length > 0 ? { status: "gaps", reason: `unresolved at ${open.map((g) => g.path).join(", ")}` } : { status: "covered" };
}

const empty = (): Counts => ({ entries: 0, covered: 0, gaps: 0, ambiguous: 0, missing: 0 });
const tally = (counts: Counts, status: Status) => {
  counts.entries += 1;
  counts[status] += 1;
};

/** How much of an inventory the given validated records cover, by entry, kind, and group. */
export function coverage(inventory: Inventory, records: MechanicRecord[], mapping: Mapping): Coverage {
  const ids = new Set(inventory.entries.map((e) => e.id));
  const loaded = new Set(records.map((r) => r.id));
  const problems = [
    ...Object.entries(mapping).flatMap(([record, entry]) => [
      ...(loaded.has(record) ? [] : [`mapping names record "${record}", which was not loaded`]),
      ...(ids.has(entry) ? [] : [`record "${record}" maps to "${entry}", which the inventory lacks`]),
    ]),
    ...records.filter((r) => !Object.hasOwn(mapping, r.id)).map((r) => `record "${r.id}" has no mapping`),
  ];
  const totals = empty();
  const byKind: Coverage["byKind"] = {};
  const groups = new Map<string, Counts>();
  const entries = inventory.entries.map((entry): EntryCoverage => {
    const mapped = records.filter((r) => mapping[r.id] === entry.id);
    const result = { ...entry, ...judge(mapped, inventory.rulesVersion), records: mapped.map((r) => r.id) };
    tally(totals, result.status);
    tally((byKind[entry.kind] ??= empty()), result.status);
    if (entry.group) {
      const counts = groups.get(entry.group) ?? empty();
      tally(counts, result.status);
      groups.set(entry.group, counts);
    }
    return result;
  });
  return { rulesVersion: inventory.rulesVersion, totals, byKind, byGroup: Object.fromEntries(groups), entries, problems };
}
