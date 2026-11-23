import { Ajv2020 } from "ajv/dist/2020.js";
import { resolve, validateRelease, type Entry, type Ref, type Release } from "../catalogue-identity/identity.ts";
import type { CatalogueRecord } from "../catalogue-releases/catalogue.ts";
import schema from "./profiles.v1.schema.json" with { type: "json" };

// Mirrors profiles.v1.schema.json, which is the contract consumers rely on.
/** A field the source states but the record cannot: its target has no ID, or its value has no form here. */
export type Gap = { field: string; reason: "no-target" | "unrepresentable" };
/** A roll of this value or more, so `3` means 3+. */
export type Roll = number;
/** A fixed amount, or dice such as `D6`, `2D3` or `D6+1`. */
export type Amount = number | string;
export type BaseSize = "hull" | { diameter: number; approximate?: true; flying?: true } | { length: number; width: number; approximate?: true; flying?: true };
/** A profile with neither `models` nor a model gap applies to the whole unit. `null` means the datasheet gives no value. */
export type UnitProfileData = {
  unit: string;
  models?: string[];
  movement?: number | null | { atLeast: number };
  toughness?: number;
  save?: Roll;
  wounds?: number;
  leadership?: Roll;
  objectiveControl?: number | null;
  /** `against: "ranged"` limits the save to ranged attacks; `conditional` means another rule of the datasheet sets when it applies. */
  invulnerableSave?: { roll: Roll; against?: "ranged"; conditional?: true };
  baseSize?: BaseSize;
  gaps?: Gap[];
};
/** `skill` is the ballistic or weapon skill; `null` means the weapon makes no hit roll. */
export type WeaponProfileData = {
  unit: string;
  wargear?: string;
  range?: number | "melee";
  attacks?: Amount;
  skill?: Roll | null;
  strength?: number;
  armourPenetration?: number;
  damage?: Amount;
  keywords?: string[];
  gaps?: Gap[];
};
/** The units this unit may join as a Leader or as a support attachment. */
export type AttachmentData = { unit: string; leads?: string[]; supports?: string[]; gaps?: Gap[] };

type TransportPool = { limit: number; count: "models" | "units"; selectors: string[]; maxWounds?: number };
export type TransportProfileData = {
  unit: string;
  capacity?: {
    loads: TransportPool[][];
    whenEquipped?: { wargear: string; pool: TransportPool }[];
    excluded?: { selectors: string[]; except?: string[] }[];
    space?: { selectors?: string[]; moreWoundsThan?: number; size: number }[];
  };
  /** How many embarked models can shoot as if on the battlefield. */
  firingDeck?: number;
  gaps?: Gap[];
};

type DataOf = { "unit-profile": UnitProfileData; "weapon-profile": WeaponProfileData; attachment: AttachmentData; "transport-profile": TransportProfileData };
export type ProfileKind = keyof DataOf;
export type Profile<K extends ProfileKind = ProfileKind> = { id: string; name: string; data: DataOf[K] };

/** One rules version's datasheet profiles, indexed by the unit they describe. */
export type Profiles = {
  get<K extends ProfileKind>(kind: K, id: string): Profile<K> | undefined;
  all<K extends ProfileKind>(kind: K): Profile<K>[];
  /** Records of a kind that describe a unit, in ID order. */
  of<K extends ProfileKind>(kind: K, unit: string): Profile<K>[];
  /** Units whose attachment records name `unit` as one they lead or support, in ID order. */
  attachedBy(unit: string, role: "leads" | "supports"): string[];
};

export type ProfilesValidation = { ok: true; profiles: Profiles } | { ok: false; errors: string[] };

export const KINDS: ProfileKind[] = ["unit-profile", "weapon-profile", "attachment", "transport-profile"];
const REQUIRED: Record<ProfileKind, string[]> = {
  "unit-profile": ["movement", "toughness", "save", "wounds", "leadership", "objectiveControl"],
  "weapon-profile": ["wargear", "range", "attacks", "skill", "strength", "armourPenetration", "damage"],
  attachment: [],
  "transport-profile": ["capacity"],
};

const ajv = new Ajv2020({ allErrors: true }).addSchema(schema);
const checkData = new Map(KINDS.map((kind) => [kind, ajv.getSchema(`${schema.$id}#/$defs/${kind}`)!]));
const key = (kind: string, id: string) => `${kind}:${id}`;

function namedRefs(kind: ProfileKind, data: any): Ref[] {
  const refs = (k: string, ids: string[] = []) => ids.map((id) => ({ kind: k, id }));
  const unit = refs("unit", [data.unit]);
  if (kind === "unit-profile") return [...unit, ...refs("model", data.models)];
  if (kind === "weapon-profile") return [...unit, ...refs("wargear", data.wargear ? [data.wargear] : [])];
  if (kind === "transport-profile") return [...unit, ...refs("wargear", (data as TransportProfileData).capacity?.whenEquipped?.map(({ wargear }) => wargear))];
  return [...unit, ...refs("unit", [...(data.leads ?? []), ...(data.supports ?? [])])];
}

/**
 * Validates profile records against the identity release of their rules version, which also holds the
 * roster entries they name. A record's own unit bounds what else it may name: its models must belong to
 * that unit and its wargear must be carried or offered there, or included by a bundle that is, while
 * attachment targets may be any unit.
 */
export function validateProfiles(identityValue: unknown, records: CatalogueRecord[]): ProfilesValidation {
  const identityResult = validateRelease(identityValue);
  if (!identityResult.ok) return { ok: false, errors: identityResult.errors.map((e) => `identity ${e}`) };
  const identity: Release = identityResult.release;
  const entries = new Map(identity.entries.map((entry) => [key(entry.kind, entry.id), entry]));
  const errors: string[] = [];
  const byKey = new Map<string, Profile>();

  for (const record of records) {
    const at = key(record.kind, record.id);
    if (record.rulesVersion.edition !== identity.rulesVersion.edition || record.rulesVersion.update !== identity.rulesVersion.update) {
      errors.push(`${at} belongs to a different rules version`);
      continue;
    }
    const check = checkData.get(record.kind as ProfileKind);
    if (!check) {
      errors.push(`${at} is not a profile kind`);
      continue;
    }
    if (!check(record.data)) {
      errors.push(...(check.errors ?? []).map((e) => `${at} data${e.instancePath} ${e.message}`));
      continue;
    }
    const entry = entries.get(at);
    if (!entry || entry.retired) {
      errors.push(`${at} is ${resolve(identity, record).status} in the identity release`);
      continue;
    }
    if (byKey.has(at)) errors.push(`${at} has more than one record`);
    byKey.set(at, { id: record.id, name: entry.name, data: record.data as any });
  }

  const refsOf = (entry: Entry | undefined, kind: string) => entry?.references?.filter((r) => r.kind === kind).map((r) => r.id) ?? [];
  const unitWargear = new Map<string, Set<string>>();
  for (const entry of identity.entries) {
    if (entry.retired || (entry.kind !== "model" && entry.kind !== "roster-option" && entry.kind !== "unit")) continue;
    for (const unit of entry.kind === "unit" ? [entry.id] : refsOf(entry, "unit")) {
      const carried = unitWargear.get(unit) ?? unitWargear.set(unit, new Set()).get(unit)!;
      for (const id of refsOf(entry, "wargear")) carried.add(id);
    }
  }
  // A Set visits members added while iterating it, so this adds what carried bundles include at any depth, each once.
  for (const carried of unitWargear.values()) for (const id of carried) for (const included of refsOf(entries.get(key("wargear", id)), "wargear")) carried.add(included);

  for (const [at, profile] of byKey) {
    const kind = at.slice(0, at.indexOf(":")) as ProfileKind;
    const entry = entries.get(at)!;
    const data = profile.data as any;
    for (const ref of namedRefs(kind, data)) {
      const target = entries.get(key(ref.kind, ref.id));
      if (!target || target.retired) errors.push(`${at} names ${key(ref.kind, ref.id)}, which is not current in the identity release`);
      else if (!entry.references?.some((r) => r.kind === ref.kind && r.id === ref.id)) errors.push(`${at} names ${key(ref.kind, ref.id)} but its identity entry does not reference it`);
      if (ref.kind === "wargear" && !unitWargear.get(data.unit)?.has(ref.id)) errors.push(`${at} names wargear:${ref.id}, which unit:${data.unit} neither carries nor offers`);
    }
    const gapped = new Set((profile.data.gaps ?? []).map((gap) => gap.field));
    for (const field of gapped) {
      if (field === "unit" || field === "gaps" || !Object.hasOwn(schema.$defs[kind].properties, field)) {
        errors.push(`${at} has a gap for unknown field ${field}`);
      } else if (kind !== "attachment" && data[field] !== undefined) {
        errors.push(`${at} states ${field} and also a gap for it`);
      }
    }
    for (const field of REQUIRED[kind]) {
      if (data[field] === undefined && !gapped.has(field)) errors.push(`${at} has no ${field} and no gap for it`);
    }
    for (const model of data.models ?? []) {
      if (!refsOf(entries.get(key("model", model)), "unit").includes(data.unit)) errors.push(`${at} names model:${model}, which belongs to another unit`);
    }
    if (kind === "transport-profile") {
      const gear = (data as TransportProfileData).capacity?.whenEquipped?.map(({ wargear }) => wargear) ?? [];
      if (new Set(gear).size !== gear.length) errors.push(`${at} has multiple capacities for the same wargear`);
    }
    for (const target of [...(data.leads ?? []), ...(data.supports ?? [])]) if (target === data.unit) errors.push(`${at} attaches unit:${target} to itself`);
  }

  const byKind = Map.groupBy([...byKey].sort(([a], [b]) => (a < b ? -1 : 1)), ([at]) => at.slice(0, at.indexOf(":")) as ProfileKind);
  const all = <K extends ProfileKind>(kind: K) => (byKind.get(kind) ?? []).map(([, p]) => p as Profile<K>);
  const byUnit = new Map(KINDS.map((kind) => [kind, Map.groupBy(all(kind), (p) => p.data.unit)]));

  for (const [unit, profiles] of byUnit.get("unit-profile")!) {
    const unscoped = profiles.filter((p) => !(p.data as UnitProfileData).models && !p.data.gaps?.some((g) => g.field === "models"));
    if (profiles.length > 1 && unscoped.length > 0) errors.push(`unit:${unit} has ${profiles.length} unit profiles, so each needs models or a gap for them`);
    const models = profiles.flatMap((p) => (p.data as UnitProfileData).models ?? []);
    for (const model of new Set(models)) if (models.indexOf(model) !== models.lastIndexOf(model)) errors.push(`unit:${unit} gives model:${model} more than one profile`);
  }
  for (const kind of ["attachment", "transport-profile"] as const) {
    for (const [unit, records] of byUnit.get(kind)!) {
      if (records.length > 1) errors.push(`unit:${unit} has more than one ${kind} record`);
    }
  }

  const links = all("attachment").flatMap(({ data }) => (["leads", "supports"] as const).flatMap((role) => (data[role] ?? []).map((target) => ({ at: `${role}:${target}`, unit: data.unit }))));
  const attached = Map.groupBy(links, (link) => link.at);

  if (errors.length > 0) return { ok: false, errors };
  return {
    ok: true,
    profiles: {
      get: <K extends ProfileKind>(kind: K, id: string) => byKey.get(key(kind, id)) as Profile<K> | undefined,
      all,
      of: <K extends ProfileKind>(kind: K, unit: string) => (byUnit.get(kind)!.get(unit)?.slice() ?? []) as Profile<K>[],
      attachedBy: (unit, role) => (attached.get(`${role}:${unit}`) ?? []).map((link) => link.unit).toSorted(),
    },
  };
}
