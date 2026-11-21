import { resolve, type Ref } from "../catalogue-identity/identity.ts";
import { lookupPoints, type Miss } from "../points/lookup.ts";
import type { PointsSnapshot } from "../points/snapshot.ts";
import type { Definition, DefinitionKind, Definitions } from "./definitions.ts";

/** A saved list in catalogue IDs: model counts by model ID, and wargear counts by option ID. */
export type RosterUnit = {
  unit: string;
  models?: Record<string, number>;
  options?: Record<string, Record<string, number>>;
  enhancement?: string;
};
export type Roster = { faction: string; detachment: string; units: RosterUnit[] };

export type ProblemCode =
  | "not-current"
  | "missing-definition"
  | "detachment-faction"
  | "unit-faction"
  | "unit-model"
  | "model-count"
  | "unit-size"
  | "unit-option"
  | "option-choice"
  | "option-count"
  | "option-quantity"
  | "option-uniform"
  | "enhancement-detachment"
  | "enhancement-keywords"
  | "enhancement-repeated"
  | "roster-limit";
/** `unit` is the position in the roster, absent for the roster as a whole. */
export type Problem = { code: ProblemCode; unit?: number; message: string };

/** Every catalogue reference a roster holds, for `checkUpgrade` before reading it under another release. */
export function rosterRefs(roster: Roster): Ref[] {
  return [
    { kind: "faction", id: roster.faction },
    { kind: "detachment", id: roster.detachment },
    ...roster.units.flatMap((u) => [
      { kind: "unit", id: u.unit },
      ...Object.keys(u.models ?? {}).map((id) => ({ kind: "model", id })),
      ...Object.entries(u.options ?? {}).flatMap(([id, counts]) => [{ kind: "roster-option", id }, ...Object.keys(counts).map((w) => ({ kind: "wargear", id: w }))]),
      ...(u.enhancement ? [{ kind: "enhancement", id: u.enhancement }] : []),
    ]),
  ];
}

/** How many wargear selections an option takes in a unit of `total` models, `carriers` of which can take it. */
export function optionBounds(option: Definition<"roster-option">, total: number, carriers: number): { min: number; max: number } {
  const { choose, per } = option.data;
  const blocks = carriers === 0 ? 0 : per === "carrier" ? carriers : per ? Math.floor(total / per.models) : 1;
  return { min: choose.min * blocks, max: choose.max * blocks };
}

/** Every reason the roster is not legal under these definitions, in roster order. */
export function checkRoster(definitions: Definitions, roster: Roster): Problem[] {
  const problems: Problem[] = [];
  const current = (kind: DefinitionKind, id: string, unit?: number) => {
    const found = resolve(definitions.identity, { kind, id });
    if (found.status === "current") {
      if (definitions.get(kind, id)) return true;
      problems.push({ code: "missing-definition", ...(unit === undefined ? {} : { unit }), message: `${kind}:${id} has no definition` });
    } else {
      problems.push({ code: "not-current", ...(unit === undefined ? {} : { unit }), message: `${kind}:${id} is ${found.status}` });
    }
    return false;
  };
  if (current("faction", roster.faction) && current("detachment", roster.detachment)) {
    if (definitions.get("detachment", roster.detachment)?.data.faction !== roster.faction) {
      problems.push({ code: "detachment-faction", message: `detachment:${roster.detachment} is not a ${roster.faction} detachment` });
    }
  }

  const copies = new Map<string, number>();
  const enhancements = new Set<string>();
  roster.units.forEach((picked, i) => {
    const add = (code: ProblemCode, message: string) => problems.push({ code, unit: i, message });
    if (!current("unit", picked.unit, i)) return;
    const unit = definitions.get("unit", picked.unit)!;
    if (unit.data.faction !== roster.faction) add("unit-faction", `${unit.name} is not a ${roster.faction} unit`);
    copies.set(unit.id, (copies.get(unit.id) ?? 0) + 1);
    if (copies.get(unit.id) === (unit.data.perRoster ?? Infinity) + 1) add("roster-limit", `${unit.name} is limited to ${unit.data.perRoster} per roster`);

    const models = definitions.modelsOf(unit.id);
    for (const id of Object.keys(picked.models ?? {})) {
      if (current("model", id, i) && !models.some((m) => m.id === id)) add("unit-model", `model:${id} is not part of ${unit.name}`);
    }
    const counts = new Map(models.map((m) => [m.id, picked.models && Object.hasOwn(picked.models, m.id) ? picked.models[m.id]! : m.data.min]));
    for (const model of models) {
      const count = counts.get(model.id)!;
      if (!Number.isSafeInteger(count) || count < model.data.min || count > model.data.max) {
        add("model-count", `${model.name} needs ${model.data.min}-${model.data.max} models, has ${count}`);
      }
    }
    const total = [...counts.values()].reduce((sum, n) => sum + n, 0);
    if (!unit.data.sizes.includes(total)) add("unit-size", `${unit.name} fields ${unit.data.sizes.join(" or ")} models, has ${total}`);

    const options = definitions.optionsOf(unit.id);
    for (const [id, chosen] of Object.entries(picked.options ?? {})) {
      if (!current("roster-option", id, i)) continue;
      const option = options.find((o) => o.id === id);
      if (!option) {
        add("unit-option", `roster-option:${id} is not offered to ${unit.name}`);
        continue;
      }
      const selections = Object.entries(chosen);
      if (selections.some(([, n]) => !Number.isSafeInteger(n) || n < 0)) add("option-quantity", `${option.name} needs non-negative whole counts`);
      const taken = selections.filter(([, n]) => n > 0);
      for (const [wargear] of taken) {
        if (current("wargear", wargear, i) && !option.data.choices.includes(wargear)) add("option-choice", `${option.name} does not offer wargear:${wargear}`);
      }
      if (option.data.uniform && taken.length > 1) add("option-uniform", `${option.name} takes one choice for the whole unit`);
    }
    for (const option of options) {
      const carriers = option.data.carrier ? (counts.get(option.data.carrier) ?? 0) : total;
      const { min, max } = optionBounds(option, total, carriers);
      const taken = Object.values(picked.options?.[option.id] ?? {}).filter((n) => n > 0).reduce((sum, n) => sum + n, 0);
      if (taken < min || taken > max) add("option-count", `${option.name} takes ${min}-${max}, has ${taken}`);
    }

    if (picked.enhancement && current("enhancement", picked.enhancement, i)) {
      const enhancement = definitions.get("enhancement", picked.enhancement)!;
      if (enhancement.data.detachment !== roster.detachment) add("enhancement-detachment", `${enhancement.name} belongs to another detachment`);
      const { all = [], none = [] } = enhancement.data.keywords ?? {};
      if (unit.data.enhancements === false || !all.every((k) => unit.data.keywords.includes(k)) || none.some((k) => unit.data.keywords.includes(k))) {
        add("enhancement-keywords", `${unit.name} cannot take ${enhancement.name}`);
      }
      if (enhancements.has(enhancement.id) && !enhancement.data.upgrade) add("enhancement-repeated", `${enhancement.name} is already taken`);
      enhancements.add(enhancement.id);
    }
  });
  return problems;
}

/** A unit as a list prints it: its name, model count, and the names of wargear taken beyond the default loadout. */
export type PrintedUnit = { name: string; models: number; wargear?: Record<string, number> };
export type ImportMiss = {
  code: "unknown-unit" | "ambiguous-unit" | "ambiguous-models" | "model-count-mismatch" | "unknown-wargear" | "ambiguous-wargear";
  name: string;
};
export type ImportResult = { ok: true; unit: RosterUnit } | { ok: false; misses: ImportMiss[] };

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * Reads a printed unit into catalogue IDs by exact name, never by similarity. Legality is `checkRoster`'s job,
 * so a count that can be assigned to a variable model is checked there.
 */
export function importUnit(definitions: Definitions, faction: string, printed: PrintedUnit): ImportResult {
  const units = definitions.all("unit").filter((u) => u.data.faction === faction && same(u.name, printed.name));
  if (units.length !== 1) return { ok: false, misses: [{ code: units.length ? "ambiguous-unit" : "unknown-unit", name: printed.name }] };
  const unit = units[0]!;
  const misses: ImportMiss[] = [];

  // Fixed models stay at their count; the one variable model takes the rest.
  const models = definitions.modelsOf(unit.id);
  const variable = models.filter((m) => m.data.min !== m.data.max);
  const fixed = models.filter((m) => m.data.min === m.data.max).reduce((sum, m) => sum + m.data.min, 0);
  if (variable.length > 1) misses.push({ code: "ambiguous-models", name: printed.name });
  if (variable.length === 0 && printed.models !== fixed) misses.push({ code: "model-count-mismatch", name: printed.name });
  const counts = Object.fromEntries(models.map((m) => [m.id, m === variable[0] ? printed.models - fixed : m.data.min]));

  const options = new Map<string, Record<string, number>>();
  const defaults = new Set(models.flatMap((m) => m.data.wargear));
  for (const [name, count] of Object.entries(printed.wargear ?? {})) {
    const offers = definitions.optionsOf(unit.id).flatMap((o) => o.data.choices.filter((id) => same(definitions.get("wargear", id)?.name ?? "", name)).map((id) => ({ o, id })));
    if (offers.length === 1) {
      const [{ o, id }] = offers as [typeof offers[number]];
      options.set(o.id, { ...options.get(o.id), [id]: count });
    }
    else if (offers.length > 1) misses.push({ code: "ambiguous-wargear", name });
    else if (![...defaults].some((id) => same(definitions.get("wargear", id)?.name ?? "", name))) misses.push({ code: "unknown-wargear", name });
  }
  return misses.length > 0
    ? { ok: false, misses }
    : { ok: true, unit: { unit: unit.id, models: counts, ...(options.size ? { options: Object.fromEntries(options) } : {}) } };
}

export type PointsGap = { ref: Ref; models?: number; reason: Miss | "no-definition" };

/**
 * Joins definitions to a points snapshot that uses the same catalogue IDs: every unit size and enhancement must
 * have a price, every detachment its detachment points, and every priced unit a definition.
 */
export function pointsGaps(definitions: Definitions, snapshot: PointsSnapshot): PointsGap[] {
  const gaps: PointsGap[] = [];
  const miss = (ref: Ref, result: ReturnType<typeof lookupPoints>, models?: number) => {
    if (!result.ok) gaps.push({ ref, ...(models === undefined ? {} : { models }), reason: result.reason });
  };
  for (const unit of definitions.all("unit")) {
    for (const models of unit.data.sizes) {
      miss({ kind: "unit", id: unit.id }, lookupPoints(snapshot, { kind: "unit", faction: unit.data.faction, unit: unit.id, models }), models);
    }
  }
  for (const detachment of definitions.all("detachment")) {
    miss({ kind: "detachment", id: detachment.id }, lookupPoints(snapshot, { kind: "detachment", faction: detachment.data.faction, detachment: detachment.id }));
  }
  for (const enhancement of definitions.all("enhancement")) {
    const faction = definitions.get("detachment", enhancement.data.detachment)!.data.faction;
    miss(
      { kind: "enhancement", id: enhancement.id },
      lookupPoints(snapshot, { kind: "enhancement", faction, detachment: enhancement.data.detachment, enhancement: enhancement.id }),
    );
  }
  for (const faction of snapshot.factions) {
    for (const unit of faction.units) if (!definitions.get("unit", unit.id)) gaps.push({ ref: { kind: "unit", id: unit.id }, reason: "no-definition" });
  }
  return gaps;
}
