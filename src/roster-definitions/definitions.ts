import { Ajv2020 } from "ajv/dist/2020.js";
import { resolve, validateRelease, type Ref, type Release } from "../catalogue-identity/identity.ts";
import type { CatalogueRecord } from "../catalogue-releases/catalogue.ts";
import schema from "./definitions.v1.schema.json" with { type: "json" };

// Mirrors definitions.v1.schema.json, which is the contract consumers rely on.
export type FactionData = Record<string, never>;
export type BattleSizeData = { points: number };
export type DetachmentData = { faction: string };
/** An `upgrade` may be taken by several units; other enhancements once per roster. */
export type EnhancementData = { detachment: string; upgrade?: true; keywords?: { all?: string[]; none?: string[] } };
/** `limits` replace `perRoster` in a roster of that battle size. `enhancements: false` bars a unit that the keyword rules would otherwise admit. */
export type UnitData = {
  faction: string;
  keywords: string[];
  sizes: number[];
  perRoster?: number;
  limits?: { battleSize: string; perRoster: number }[];
  legends?: true;
  enhancements?: false;
};
export type ModelData = { unit: string; min: number; max: number; wargear: string[] };
/** Scales a bound by each carrier model, or by every `models` models in the unit; absent means once per unit. */
export type Per = "carrier" | { models: number };
export type OptionData = {
  unit: string;
  carrier?: string;
  choose: { min: number; max: number };
  per?: Per;
  uniform?: true;
  replaces?: string[];
  choices: string[];
  /** Each cap limits how many of its `choices` the option takes together, scaled by its own `per`. */
  caps?: { choices: string[]; max: number; per?: Per }[];
  /** The option is closed unless another option of the unit has taken one of these choices. */
  requires?: { option: string; choices: string[] };
};
export type WargearData = { includes?: string[] };

type DataOf = {
  faction: FactionData;
  "battle-size": BattleSizeData;
  detachment: DetachmentData;
  enhancement: EnhancementData;
  unit: UnitData;
  model: ModelData;
  "roster-option": OptionData;
  wargear: WargearData;
};
export type DefinitionKind = keyof DataOf;
export type Definition<K extends DefinitionKind = DefinitionKind> = { id: string; name: string; data: DataOf[K] };

/** One rules version's roster definitions, indexed by kind and ID. */
export type Definitions = {
  identity: Release;
  get<K extends DefinitionKind>(kind: K, id: string): Definition<K> | undefined;
  all<K extends DefinitionKind>(kind: K): Definition<K>[];
  /** Model and option records of a unit, in ID order. */
  modelsOf(unit: string): Definition<"model">[];
  optionsOf(unit: string): Definition<"roster-option">[];
};

export type DefinitionsValidation = { ok: true; definitions: Definitions } | { ok: false; errors: string[] };

export const KINDS: DefinitionKind[] = ["faction", "battle-size", "detachment", "enhancement", "unit", "model", "roster-option", "wargear"];

const ajv = new Ajv2020({ allErrors: true }).addSchema(schema);
const checkData = new Map(KINDS.map((kind) => [kind, ajv.getSchema(`${schema.$id}#/$defs/${kind}`)!]));

// Every ID a record's data names, with the kind it must resolve to.
function namedRefs(kind: DefinitionKind, data: any): Ref[] {
  const refs = (k: string, ids: string[] = []) => ids.map((id) => ({ kind: k, id }));
  switch (kind) {
    case "detachment":
      return refs("faction", [data.faction]);
    case "enhancement":
      return refs("detachment", [data.detachment]);
    case "unit":
      return [...refs("faction", [data.faction]), ...refs("battle-size", data.limits?.map((l: { battleSize: string }) => l.battleSize))];
    case "model":
      return [...refs("unit", [data.unit]), ...refs("wargear", data.wargear)];
    case "roster-option":
      return [
        ...refs("unit", [data.unit]),
        ...refs("model", data.carrier ? [data.carrier] : []),
        ...refs("wargear", [...(data.replaces ?? []), ...data.choices, ...(data.requires?.choices ?? [])]),
        ...refs("roster-option", data.requires ? [data.requires.option] : []),
      ];
    case "wargear":
      return refs("wargear", data.includes);
    default:
      return [];
  }
}

/**
 * Validates the records of a rules version against its identity release. A record's data may only name
 * entries its identity entry references, so release coverage and dependency reports see every join.
 */
export function validateDefinitions(identityValue: unknown, records: CatalogueRecord[]): DefinitionsValidation {
  const identityResult = validateRelease(identityValue);
  if (!identityResult.ok) return { ok: false, errors: identityResult.errors.map((e) => `identity ${e}`) };
  const identity = identityResult.release;
  const errors: string[] = [];
  const byKey = new Map<string, Definition>();
  const key = (kind: string, id: string) => `${kind}:${id}`;

  for (const record of records) {
    const at = key(record.kind, record.id);
    if (record.rulesVersion.edition !== identity.rulesVersion.edition || record.rulesVersion.update !== identity.rulesVersion.update) {
      errors.push(`${at} belongs to a different rules version`);
      continue;
    }
    const check = checkData.get(record.kind as DefinitionKind);
    if (!check) {
      errors.push(`${at} is not a roster definition kind`);
      continue;
    }
    if (!check(record.data)) {
      errors.push(...(check.errors ?? []).map((e) => `${at} data${e.instancePath} ${e.message}`));
      continue;
    }
    const found = resolve(identity, record);
    if (found.status !== "current") {
      errors.push(`${at} is ${found.status} in the identity release`);
      continue;
    }
    if (byKey.has(at)) errors.push(`${at} has more than one record`);
    byKey.set(at, { id: record.id, name: found.entry.name, data: record.data as any });
  }

  const all = <K extends DefinitionKind>(kind: K) =>
    [...byKey.entries()].filter(([k]) => k.startsWith(`${kind}:`)).map(([, d]) => d as Definition<K>).sort((a, b) => (a.id < b.id ? -1 : 1));
  const get = <K extends DefinitionKind>(kind: K, id: string) => byKey.get(key(kind, id)) as Definition<K> | undefined;
  const modelsOf = (unit: string) => all("model").filter((m) => m.data.unit === unit);
  const optionsOf = (unit: string) => all("roster-option").filter((o) => o.data.unit === unit);
  const modelUnit = new Map(all("model").map((m) => [m.id, m.data.unit]));

  for (const [at, definition] of byKey) {
    const kind = at.slice(0, at.indexOf(":")) as DefinitionKind;
    const entry = identity.entries.find((e) => e.kind === kind && e.id === definition.id)!;
    for (const ref of namedRefs(kind, definition.data)) {
      const target = key(ref.kind, ref.id);
      if (!byKey.has(target)) errors.push(`${at} names ${target}, which has no record`);
      else if (!entry.references?.some((r) => r.kind === ref.kind && r.id === ref.id)) errors.push(`${at} names ${target} but its identity entry does not reference it`);
    }
  }

  for (const unit of all("unit")) {
    const at = key("unit", unit.id);
    const models = modelsOf(unit.id);
    if (models.length === 0) errors.push(`${at} has no models`);
    const least = models.reduce((sum, m) => sum + m.data.min, 0);
    const most = models.reduce((sum, m) => sum + m.data.max, 0);
    for (const size of unit.data.sizes) {
      if (models.length > 0 && (size < least || size > most)) errors.push(`${at} size ${size} is outside its models' ${least}-${most}`);
    }
    const battleSizes = unit.data.limits?.map((l) => l.battleSize) ?? [];
    for (const id of new Set(battleSizes)) if (battleSizes.indexOf(id) !== battleSizes.lastIndexOf(id)) errors.push(`${at} limits battle-size:${id} more than once`);
  }
  for (const model of all("model")) {
    if (model.data.min > model.data.max) errors.push(`model:${model.id} min is above max`);
  }
  for (const option of all("roster-option")) {
    const at = key("roster-option", option.id);
    const { unit, carrier, choose, replaces = [], choices, caps = [], requires } = option.data;
    if (choose.min > choose.max) errors.push(`${at} choose min is above max`);
    if (carrier && modelUnit.get(carrier) !== undefined && modelUnit.get(carrier) !== unit) errors.push(`${at} carrier model:${carrier} belongs to another unit`);
    const carried = new Set((carrier ? [get("model", carrier)] : modelsOf(unit)).flatMap((m) => m?.data.wargear ?? []));
    for (const id of replaces) if (!carried.has(id)) errors.push(`${at} replaces wargear:${id}, which its carriers do not carry`);
    for (const id of choices) if (replaces.includes(id)) errors.push(`${at} offers wargear:${id}, which it also replaces`);
    for (const id of caps.flatMap((c) => c.choices)) if (!choices.includes(id)) errors.push(`${at} caps wargear:${id}, which it does not offer`);
    if (requires) {
      const required = get("roster-option", requires.option);
      if (requires.option === option.id) errors.push(`${at} requires itself`);
      else if (required && required.data.unit !== unit) errors.push(`${at} requires roster-option:${requires.option}, which belongs to another unit`);
      for (const id of requires.choices) if (required && !required.data.choices.includes(id)) errors.push(`${at} requires wargear:${id}, which roster-option:${requires.option} does not offer`);
      if (choose.min > 0) errors.push(`${at} requires another option but has a minimum`);
    }
  }
  for (const wargear of all("wargear")) {
    if (wargear.data.includes?.includes(wargear.id)) errors.push(`wargear:${wargear.id} includes itself`);
  }

  return errors.length > 0 ? { ok: false, errors } : { ok: true, definitions: { identity, get, all, modelsOf, optionsOf } };
}
