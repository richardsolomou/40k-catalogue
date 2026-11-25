import { Ajv2020 } from "ajv/dist/2020.js";
import { resolve, validateRelease, type Ref, type Release } from "../catalogue-identity/identity.ts";
import type { CatalogueRecord } from "../catalogue-releases/catalogue.ts";
import v1Schema from "./definitions.v1.schema.json" with { type: "json" };
import v2Schema from "./definitions.v2.schema.json" with { type: "json" };
import { checkRoster } from "./roster.ts";

// Mirrors definitions.v2.schema.json, which is the contract consumers rely on. Version 1 data is read into the same
// shape: its wargear lists become counts of one each, which is what version 1 meant by them.
/** How many of each wargear ID. */
export type Counts = Record<string, number>;
/** Holds when the roster's faction and detachment are the ones named and one of its units has the named warlord model. */
export type When = { faction?: string; detachment?: string; warlord?: string };
type RosterBounds = { min?: number; max?: number };
/** How many units holding every keyword a roster of the faction may hold; a detachment's row replaces the faction's bounds. */
export type UnitLimit = RosterBounds & { keywords: string[]; detachments?: (RosterBounds & { detachment: string })[] };
/** At most `max` of an entry's units holding every keyword; a `free` unit does not count while enough `per` units back it. */
export type AllyLimit = { keywords: string[]; battleSize: string; max: number; free?: { keywords: string[]; per: string[] }[] };
/** Units a roster may hold beyond its own and its parent's, under the entry's conditions. */
export type Ally = {
  units: string[];
  detachments?: string[];
  points?: { battleSize: string; max: number }[];
  limits?: AllyLimit[];
  oneLimit?: true;
  enhancements?: true;
};
export type FactionData = { unitLimits?: UnitLimit[]; parent?: string; excludedUnits?: string[]; allies?: Ally[] };
/** `duplicates` caps copies of a unit that has no `perRoster` or limit of its own. */
export type BattleSizeData = { points: number; detachmentPoints?: number; enhancements?: number; duplicates?: number };
/**
 * `stratagems` and `enhancements` list the rule summary entries (kind `ability`) of every card the version gives the
 * detachment; a card it prints without an entry is named in `stratagemsUnlisted` or `enhancementsUnlisted`.
 */
export type DetachmentData = {
  faction: string;
  stratagems?: string[];
  enhancements?: string[];
  stratagemsUnlisted?: string[];
  enhancementsUnlisted?: string[];
  /** Mission-pack force disposition IDs, outside the roster category. */
  dispositions?: string[];
  excludedUnits?: string[];
  /** Models that may be the Warlord with this detachment though they otherwise could not. */
  warlords?: string[];
  /** The Warlord must be one of these models. */
  requiredWarlords?: string[];
  /** A keyword two of a roster's detachments may not share. */
  group?: string;
};
/** An `upgrade` may be taken by several units; other enhancements once per roster. */
export type EnhancementData = { detachment: string; upgrade?: true; keywords?: { all?: string[]; none?: string[] } };
/** The first of `limits` for the roster's battle size whose `when` holds replaces `perRoster`. */
export type Limit = { battleSize: string; perRoster: number; when?: When };
/** `enhancements: false` bars a unit that the keyword rules would otherwise admit. */
export type UnitData = {
  faction: string;
  keywords: string[];
  conditionalKeywords?: { keywords: string[]; when: When }[];
  sizes: number[];
  /** Model counts must fit one of these, each giving every model's bounds; a model a composition omits fields none. */
  compositions?: Record<string, Bounds>[];
  modelGroups?: (ModelCountBounds & { models: string[] })[];
  /** Bounds the selections its options take together, counting only a member's `choices` where it names them. */
  optionGroups?: OptionGroup[];
  perRoster?: number;
  limits?: Limit[];
  legends?: true;
  enhancements?: false;
  /** Wargear the unit carries that none of its models does. */
  wargear?: Counts;
  /** The selections the unit takes when first fielded, by option ID, where its models of one kind start with different wargear. */
  defaults?: Record<string, Counts>;
  /** Its model counts when first fielded, where they differ from its models' `min`. */
  defaultModels?: Record<string, number>;
};
export type Bounds = { min: number; max: number };
/** Each selection of a member's choices counts `weight` (default 1) towards the group's maximum. */
export type OptionGroup = { options: { option: string; choices?: string[]; weight?: number }[]; max: number; carrier?: string; per?: Per; bySize?: SizeMaximum[] };
type SizeBounds = Bounds & { size: number };
type SizeMaximum = { size: number; max: number };
type ModelCountBounds = Bounds & { bySize?: SizeBounds[] };
export type ModelData = ModelCountBounds & { unit: string; wargear: Counts };
/** Scales a bound by each carrier model, or by every `models` models in the unit; absent means once per unit. */
export type Per = "carrier" | { models: number };
export type OptionData = {
  unit: string;
  carrier?: string;
  choose: Bounds;
  per?: Per;
  bySize?: SizeBounds[];
  uniform?: true;
  /** Choices a `uniform` option allows beside its one uniform choice. */
  substitutes?: string[];
  /** What each selection replaces. */
  replaces?: Counts;
  choices: string[];
  /** Each cap limits how many of its `choices` the option takes together, scaled by its own `per`. */
  caps?: { choices: string[]; max: number; per?: Per; bySize?: SizeMaximum[] }[];
  /** The option is closed unless another option of the unit has taken one of these choices. */
  requires?: { option: string; choices: string[] };
};
export type WargearData = { includes?: Counts };

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
  /** The format version every record was written in. */
  formatVersion: 1 | 2;
  get<K extends DefinitionKind>(kind: K, id: string): Definition<K> | undefined;
  all<K extends DefinitionKind>(kind: K): Definition<K>[];
  /** Model and option records of a unit, in ID order. */
  modelsOf(unit: string): Definition<"model">[];
  optionsOf(unit: string): Definition<"roster-option">[];
};

export type DefinitionsValidation = { ok: true; definitions: Definitions } | { ok: false; errors: string[] };

export const KINDS: DefinitionKind[] = ["faction", "battle-size", "detachment", "enhancement", "unit", "model", "roster-option", "wargear"];

// Limits on what a roster holds as a whole, which a unit's own first fielding cannot be held to.
const ROSTER_WIDE = new Set(["roster-limit", "unit-limit", "unit-excluded", "ally-detachment", "ally-limit"]);

export function modelBounds(model: ModelCountBounds, size: number): Bounds {
  return model.bySize?.find((bounds) => bounds.size === size) ?? model;
}

const ajv = new Ajv2020({ allErrors: true }).addSchema(v1Schema).addSchema(v2Schema);
const checkers = (schema: { $id: string }) => new Map(KINDS.map((kind) => [kind, ajv.getSchema(`${schema.$id}#/$defs/${kind}`)!]));
const checkData = { 1: checkers(v1Schema), 2: checkers(v2Schema) };

const counted = (ids: string[] | undefined) => ids && Object.fromEntries(ids.map((id) => [id, 1]));
/** Reads version 1 data, whose wargear lists name one of each, as version 2 counts. */
function fromV1(kind: DefinitionKind, data: any): any {
  if (kind === "model") return { ...data, wargear: counted(data.wargear) };
  if (kind === "roster-option" && data.replaces) return { ...data, replaces: counted(data.replaces) };
  if (kind === "wargear" && data.includes) return { ...data, includes: counted(data.includes) };
  return data;
}

const whenRefs = (when: When | undefined): Ref[] => [
  ...(when?.faction ? [{ kind: "faction", id: when.faction }] : []),
  ...(when?.detachment ? [{ kind: "detachment", id: when.detachment }] : []),
  ...(when?.warlord ? [{ kind: "model", id: when.warlord }] : []),
];

// Every ID a record's data names, with the kind it must resolve to.
function namedRefs(kind: DefinitionKind, data: any): Ref[] {
  const refs = (k: string, ids: string[] = []) => ids.map((id) => ({ kind: k, id }));
  switch (kind) {
    case "faction": {
      const faction = data as FactionData;
      const allies = faction.allies ?? [];
      return [
        ...refs("detachment", faction.unitLimits?.flatMap((l) => l.detachments?.map((d) => d.detachment) ?? [])),
        ...refs("faction", faction.parent ? [faction.parent] : []),
        ...refs("unit", faction.excludedUnits),
        ...refs("unit", allies.flatMap((a) => a.units)),
        ...refs("detachment", allies.flatMap((a) => a.detachments ?? [])),
        ...refs("battle-size", allies.flatMap((a) => [...(a.points ?? []), ...(a.limits ?? [])].map((row) => row.battleSize))),
      ];
    }
    case "detachment": {
      const detachment = data as DetachmentData;
      return [
        ...refs("faction", [detachment.faction]),
        ...refs("unit", detachment.excludedUnits),
        ...refs("model", [...(detachment.warlords ?? []), ...(detachment.requiredWarlords ?? [])]),
      ];
    }
    case "enhancement":
      return refs("detachment", [data.detachment]);
    case "unit": {
      const unit = data as UnitData;
      return [
        ...refs("faction", [unit.faction]),
        ...refs("wargear", Object.keys(unit.wargear ?? {})),
        ...(unit.conditionalKeywords ?? []).flatMap((c) => whenRefs(c.when)),
        ...refs("battle-size", unit.limits?.map((l) => l.battleSize)),
        ...(unit.limits ?? []).flatMap((l) => whenRefs(l.when)),
        ...refs("model", unit.compositions?.flatMap((c) => Object.keys(c))),
        ...refs("model", unit.modelGroups?.flatMap((group) => group.models)),
        ...refs("model", unit.optionGroups?.flatMap((group) => (group.carrier ? [group.carrier] : []))),
        ...refs("roster-option", unit.optionGroups?.flatMap((group) => group.options.map((member) => member.option))),
        ...refs("wargear", unit.optionGroups?.flatMap((group) => group.options.flatMap((member) => member.choices ?? []))),
        ...refs("roster-option", Object.keys(unit.defaults ?? {})),
        ...refs("wargear", Object.values(unit.defaults ?? {}).flatMap((counts) => Object.keys(counts))),
        ...refs("model", Object.keys(unit.defaultModels ?? {})),
      ];
    }
    case "model":
      return [...refs("unit", [data.unit]), ...refs("wargear", Object.keys(data.wargear))];
    case "roster-option":
      return [
        ...refs("unit", [data.unit]),
        ...refs("model", data.carrier ? [data.carrier] : []),
        ...refs("wargear", [...Object.keys(data.replaces ?? {}), ...data.choices, ...(data.requires?.choices ?? [])]),
        ...refs("roster-option", data.requires ? [data.requires.option] : []),
      ];
    case "wargear":
      return refs("wargear", Object.keys(data.includes ?? {}));
    default:
      return [];
  }
}

/**
 * Validates the records of a rules version against its identity release. A record's data may only name
 * entries its identity entry references, so release coverage and dependency reports see every join.
 * Records carrying `formatVersion: 2` in their data are version 2; all records of one call share a version.
 */
export function validateDefinitions(identityValue: unknown, records: CatalogueRecord[]): DefinitionsValidation {
  const identityResult = validateRelease(identityValue);
  if (!identityResult.ok) return { ok: false, errors: identityResult.errors.map((e) => `identity ${e}`) };
  const identity = identityResult.release;
  const errors: string[] = [];
  const byKey = new Map<string, Definition>();
  const key = (kind: string, id: string) => `${kind}:${id}`;
  const entries = new Map(identity.entries.map((entry) => [key(entry.kind, entry.id), entry]));
  const versionOf = (record: CatalogueRecord) => ((record.data as { formatVersion?: unknown })?.formatVersion === 2 ? 2 : 1);
  const formatVersion = records.length > 0 ? versionOf(records[0]!) : 2;
  if (records.some((record) => versionOf(record) !== formatVersion)) return { ok: false, errors: ["records mix roster definition format versions 1 and 2"] };

  for (const record of records) {
    const at = key(record.kind, record.id);
    if (record.rulesVersion.edition !== identity.rulesVersion.edition || record.rulesVersion.update !== identity.rulesVersion.update) {
      errors.push(`${at} belongs to a different rules version`);
      continue;
    }
    const check = checkData[formatVersion].get(record.kind as DefinitionKind);
    if (!check) {
      errors.push(`${at} is not a roster definition kind`);
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
    const data = formatVersion === 1 ? fromV1(record.kind as DefinitionKind, record.data) : record.data;
    byKey.set(at, { id: record.id, name: entry.name, data });
  }

  const kindOf = (at: string) => at.slice(0, at.indexOf(":")) as DefinitionKind;
  const byKind = Map.groupBy(byKey, ([at]) => kindOf(at));
  for (const definitions of byKind.values()) definitions.sort(([a], [b]) => (a < b ? -1 : 1));
  const all = <K extends DefinitionKind>(kind: K) => (byKind.get(kind) ?? []).map(([, definition]) => definition as Definition<K>);
  const get = <K extends DefinitionKind>(kind: K, id: string) => byKey.get(key(kind, id)) as Definition<K> | undefined;
  const models = all("model");
  const options = all("roster-option");
  const modelsByUnit = Map.groupBy(models, (model) => model.data.unit);
  const optionsByUnit = Map.groupBy(options, (option) => option.data.unit);
  const modelsOf = (unit: string) => modelsByUnit.get(unit)?.slice() ?? [];
  const optionsOf = (unit: string) => optionsByUnit.get(unit)?.slice() ?? [];

  for (const [at, definition] of byKey) {
    const kind = kindOf(at);
    const entry = entries.get(at)!;
    for (const ref of namedRefs(kind, definition.data)) {
      const target = key(ref.kind, ref.id);
      if (!byKey.has(target)) errors.push(`${at} names ${target}, which has no record`);
      else if (!entry.references?.some((r) => r.kind === ref.kind && r.id === ref.id)) errors.push(`${at} names ${target} but its identity entry does not reference it`);
    }
    // A detachment's cards are rule summaries, outside the roster category, so they need a current entry, not a record.
    if (kind === "detachment") {
      const { stratagems = [], enhancements = [] } = definition.data as DetachmentData;
      for (const id of [...stratagems, ...enhancements]) {
        const target = key("ability", id);
        if (!entries.get(target) || entries.get(target)!.retired) errors.push(`${at} names ${target}, which is not a current entry`);
        else if (!entry.references?.some((r) => r.kind === "ability" && r.id === id)) errors.push(`${at} names ${target} but its identity entry does not reference it`);
      }
    }
  }

  const checkSizeBounds = (at: string, bounds: readonly (SizeBounds | SizeMaximum)[], unit: string) => {
    const sizes = get("unit", unit)?.data.sizes;
    const seen = new Set<number>();
    for (const row of bounds) {
      if (sizes && !sizes.includes(row.size)) errors.push(`${at} names unlisted size ${row.size}`);
      if (seen.has(row.size)) errors.push(`${at} repeats size ${row.size}`);
      seen.add(row.size);
      if ("min" in row && row.min > row.max) errors.push(`${at} size ${row.size} min is above max`);
    }
  };
  const checkRosterBounds = (at: string, { min, max }: RosterBounds) => {
    if (min !== undefined && max !== undefined && min > max) errors.push(`${at} min is above max`);
  };
  const ownModel = (at: string, id: string, unit: string) => {
    const model = get("model", id);
    if (model && model.data.unit !== unit) errors.push(`${at} names model:${id}, which belongs to another unit`);
  };

  for (const faction of all("faction")) {
    for (const [i, limit] of (faction.data.unitLimits ?? []).entries()) {
      const path = `faction:${faction.id} unitLimits/${i}`;
      checkRosterBounds(path, limit);
      const seen = new Set<string>();
      for (const row of limit.detachments ?? []) {
        checkRosterBounds(`${path} detachment:${row.detachment}`, row);
        if (seen.has(row.detachment)) errors.push(`${path} names detachment:${row.detachment} more than once`);
        seen.add(row.detachment);
        const detachment = get("detachment", row.detachment);
        if (detachment && detachment.data.faction !== faction.id) errors.push(`${path} names detachment:${row.detachment}, which belongs to another faction`);
      }
    }
  }

  for (const faction of all("faction")) {
    const { parent } = faction.data;
    if (parent === faction.id) errors.push(`faction:${faction.id} names itself as its parent`);
    else if (parent && get("faction", parent)?.data.parent) errors.push(`faction:${faction.id} names faction:${parent}, which has a parent of its own`);
  }

  for (const unit of all("unit")) {
    const at = key("unit", unit.id);
    const models = modelsOf(unit.id);
    if (models.length === 0) errors.push(`${at} has no models`);
    for (const size of unit.data.sizes) {
      const bounds = models.map(({ data }) => modelBounds(data, size));
      const least = bounds.reduce((sum, { min }) => sum + min, 0);
      const most = bounds.reduce((sum, { max }) => sum + max, 0);
      if (models.length > 0 && (size < least || size > most)) errors.push(`${at} size ${size} is outside its models' ${least}-${most}`);
    }
    for (const [i, composition] of (unit.data.compositions ?? []).entries()) {
      const path = `${at} compositions/${i}`;
      for (const [id, bounds] of Object.entries(composition)) {
        ownModel(path, id, unit.id);
        if (bounds.min > bounds.max) errors.push(`${path} model:${id} min is above max`);
      }
    }
    if (unit.data.compositions) {
      const reach = unit.data.compositions.map((c) => Object.values(c).reduce((r, b) => ({ min: r.min + b.min, max: r.max + b.max }), { min: 0, max: 0 }));
      for (const size of unit.data.sizes) if (!reach.some(({ min, max }) => size >= min && size <= max)) errors.push(`${at} size ${size} fits none of its compositions`);
    }
    for (const [i, group] of (unit.data.modelGroups ?? []).entries()) {
      const path = `${at} modelGroups/${i}`;
      if (group.min > group.max) errors.push(`${path} min is above max`);
      if (group.bySize) checkSizeBounds(`${path} bySize`, group.bySize, unit.id);
      for (const id of group.models) ownModel(path, id, unit.id);
    }
    for (const [i, group] of (unit.data.optionGroups ?? []).entries()) {
      const path = `${at} optionGroups/${i}`;
      const seen = new Map<string, string[] | undefined>();
      for (const { option: id, choices } of group.options) {
        const before = seen.get(id);
        if (seen.has(id) && (!before || !choices || choices.some((w) => before.includes(w)))) errors.push(`${path} names roster-option:${id} more than once`);
        seen.set(id, !seen.has(id) ? choices : before && choices ? [...before, ...choices] : undefined);
        const option = get("roster-option", id);
        if (option && option.data.unit !== unit.id) errors.push(`${path} names roster-option:${id}, which belongs to another unit`);
        for (const w of choices ?? []) if (option && !option.data.choices.includes(w)) errors.push(`${path} names wargear:${w}, which roster-option:${id} does not offer`);
      }
      if ((group.per === "carrier") !== (group.carrier !== undefined)) errors.push(`${path} names a carrier exactly when it scales per carrier`);
      if (group.carrier) ownModel(path, group.carrier, unit.id);
      if (group.bySize) checkSizeBounds(`${path} bySize`, group.bySize, unit.id);
    }
    const always = new Set<string>();
    const seenLimits = new Set<string>();
    for (const limit of unit.data.limits ?? []) {
      const rowKey = JSON.stringify([limit.battleSize, limit.when ?? null]);
      if (seenLimits.has(rowKey)) errors.push(`${at} limits battle-size:${limit.battleSize} more than once`);
      else if (always.has(limit.battleSize)) errors.push(`${at} limits battle-size:${limit.battleSize} after a row that always applies`);
      seenLimits.add(rowKey);
      if (!limit.when) always.add(limit.battleSize);
    }
  }
  for (const model of models) {
    if (model.data.min > model.data.max) errors.push(`model:${model.id} min is above max`);
    if (model.data.bySize) checkSizeBounds(`model:${model.id} bySize`, model.data.bySize, model.data.unit);
  }
  for (const option of options) {
    const at = key("roster-option", option.id);
    const { unit, carrier, choose, bySize, replaces = {}, choices, caps = [], requires, uniform, substitutes } = option.data;
    const carrierModel = carrier ? get("model", carrier) : undefined;
    if (choose.min > choose.max) errors.push(`${at} choose min is above max`);
    if (bySize) checkSizeBounds(`${at} bySize`, bySize, unit);
    if (carrierModel && carrierModel.data.unit !== unit) errors.push(`${at} carrier model:${carrier} belongs to another unit`);
    const carriers = carrier ? [carrierModel?.data] : [...modelsOf(unit).map((m) => m.data), get("unit", unit)?.data];
    for (const [id, n] of Object.entries(replaces)) {
      const most = Math.max(0, ...carriers.map((m) => m?.wargear?.[id] ?? 0));
      if (most === 0) errors.push(`${at} replaces wargear:${id}, which its carriers do not carry`);
      else if (most < n) errors.push(`${at} replaces ${n} of wargear:${id}, but its carriers carry ${most}`);
    }
    for (const id of choices) if (Object.hasOwn(replaces, id)) errors.push(`${at} offers wargear:${id}, which it also replaces`);
    for (const [i, cap] of caps.entries()) {
      for (const id of cap.choices) if (!choices.includes(id)) errors.push(`${at} caps wargear:${id}, which it does not offer`);
      if (cap.bySize) checkSizeBounds(`${at} caps[${i}] bySize`, cap.bySize, unit);
    }
    if (substitutes) {
      if (!uniform) errors.push(`${at} has substitutes but is not uniform`);
      for (const id of substitutes) if (!choices.includes(id)) errors.push(`${at} substitutes wargear:${id}, which it does not offer`);
      if (choices.every((id) => substitutes.includes(id))) errors.push(`${at} has no choice besides its substitutes`);
    }
    if (requires) {
      const required = get("roster-option", requires.option);
      if (requires.option === option.id) errors.push(`${at} requires itself`);
      else if (required && required.data.unit !== unit) errors.push(`${at} requires roster-option:${requires.option}, which belongs to another unit`);
      for (const id of requires.choices) if (required && !required.data.choices.includes(id)) errors.push(`${at} requires wargear:${id}, which roster-option:${requires.option} does not offer`);
      if (choose.min > 0 || bySize?.some(({ min }) => min > 0)) errors.push(`${at} requires another option but has a minimum`);
    }
  }
  const includes = (id: string) => Object.keys(get("wargear", id)?.data.includes ?? {});
  for (const wargear of all("wargear")) {
    const held = Object.values(wargear.data.includes ?? { [wargear.id]: 2 }).reduce((sum, n) => sum + n, 0);
    if (held < 2) errors.push(`wargear:${wargear.id} includes fewer than two items`);
    const reached = new Set(includes(wargear.id));
    for (const id of reached) for (const inner of includes(id)) reached.add(inner);
    if (reached.has(wargear.id)) errors.push(`wargear:${wargear.id} includes itself`);
  }

  if (errors.length > 0) return { ok: false, errors };
  const definitions: Definitions = { identity, formatVersion, get, all, modelsOf, optionsOf };
  // A unit's first fielding must be one checkRoster accepts; roster-wide limits are not the unit's to meet.
  for (const unit of all("unit")) {
    const { defaults, defaultModels } = unit.data;
    if (!defaults && !defaultModels) continue;
    const detachment = all("detachment").find((d) => d.data.faction === unit.data.faction)?.id ?? "";
    const roster = { faction: unit.data.faction, detachment, units: [{ unit: unit.id, ...(defaultModels ? { models: defaultModels } : {}), ...(defaults ? { options: defaults } : {}) }] };
    for (const problem of checkRoster(definitions, roster)) {
      if (problem.unit === 0 && !ROSTER_WIDE.has(problem.code)) errors.push(`unit:${unit.id} defaults are not a legal fielding: ${problem.message}`);
    }
  }
  return errors.length > 0 ? { ok: false, errors } : { ok: true, definitions };
}
