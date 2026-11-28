import { Ajv2020 } from "ajv/dist/2020.js";
import { isUnresolved } from "../record.ts";
import type { Gap } from "../validate.ts";
import historySchema from "./history.v1.schema.json" with { type: "json" };
import schema from "./points.v1.schema.json" with { type: "json" };
import { sameMix } from "./lookup.ts";
import type { PointsHistory, PointsSnapshot, Tier } from "./snapshot.ts";

export type SnapshotValidation = { ok: true; snapshot: PointsSnapshot; gaps: Gap[] } | { ok: false; errors: string[] };
export type HistoryValidation = { ok: true; history: PointsHistory } | { ok: false; errors: string[] };

const ajv = new Ajv2020({ allErrors: true });
const checkSnapshot = ajv.compile<PointsSnapshot>(schema);
const checkHistory = ajv.compile<PointsHistory>(historySchema);

const schemaErrors = (errors: typeof checkSnapshot.errors) => (errors ?? []).map((e) => `${e.instancePath || "/"} ${e.message}`);

export function validateSnapshot(value: unknown): SnapshotValidation {
  if (!checkSnapshot(value)) return { ok: false, errors: schemaErrors(checkSnapshot.errors) };
  const errors = structureErrors(value);
  return errors.length > 0 ? { ok: false, errors } : { ok: true, snapshot: value, gaps: snapshotGaps(value) };
}

export function validateHistory(value: unknown): HistoryValidation {
  if (!checkHistory(value)) return { ok: false, errors: schemaErrors(checkHistory.errors) };
  const errors: string[] = [];
  repeats(errors, "/updates", value.updates);
  const current = value.updates.filter((u) => u.status === "current").length;
  if (current !== 1) errors.push(`/updates must have exactly one current update, found ${current}`);
  return errors.length > 0 ? { ok: false, errors } : { ok: true, history: value };
}

/** Every unresolved value, by JSON pointer. */
export function snapshotGaps(value: unknown, path = ""): Gap[] {
  if (Array.isArray(value)) return value.flatMap((item, i) => snapshotGaps(item, `${path}/${i}`));
  if (!value || typeof value !== "object") return [];
  if (isUnresolved(value)) return [{ path, note: value.unresolved }];
  return Object.entries(value).flatMap(([key, item]) => snapshotGaps(item, `${path}/${key}`));
}

// Uniqueness and tier coverage, which the schema cannot express.
function structureErrors(snapshot: PointsSnapshot): string[] {
  const errors: string[] = [];
  repeats(errors, "/factions", snapshot.factions);
  snapshot.factions.forEach((faction, f) => {
    const at = `/factions/${f}`;
    repeats(errors, `${at}/detachments`, faction.detachments);
    faction.detachments.forEach((d, i) => repeats(errors, `${at}/detachments/${i}/enhancements`, d.enhancements));
    repeats(errors, `${at}/units`, faction.units);
    faction.units.forEach((unit, u) => {
      const path = `${at}/units/${u}`;
      tierErrors(errors, `${path}/tiers`, unit.tiers);
      const items = new Set<string>();
      unit.wargear?.forEach((w, i) => {
        if (items.has(w.item)) errors.push(`${path}/wargear/${i}/item repeats "${w.item}"`);
        items.add(w.item);
      });
    });
  });
  return errors;
}

// Copy ranges are contiguous from the first copy through the last priced copy.
function tierErrors(errors: string[], path: string, tiers: Tier[]) {
  let next = 1;
  tiers.forEach(({ copies, costs }, i) => {
    if (copies.from !== next) errors.push(`${path}/${i}/copies/from must be ${next}`);
    if (copies.to !== undefined && copies.to < copies.from) errors.push(`${path}/${i}/copies/to is before from`);
    if (copies.to === undefined && i < tiers.length - 1) errors.push(`${path}/${i}/copies must have "to" unless it is the last tier`);
    next = (copies.to ?? copies.from) + 1;

    const rows = new Set<string>();
    costs.forEach((cost, j) => {
      const key = `${cost.models}|${cost.composition ?? ""}`;
      if (rows.has(key)) errors.push(`${path}/${i}/costs/${j} repeats ${cost.models} models${cost.composition ? ` as "${cost.composition}"` : ""}`);
      rows.add(key);
      const mixed = cost.mix ? Object.values(cost.mix).reduce((sum, n) => sum + n, 0) : cost.models;
      if (mixed !== cost.models) errors.push(`${path}/${i}/costs/${j}/mix counts ${mixed} models, not ${cost.models}`);
      if (cost.mix && costs.some((other, k) => k < j && other.models === cost.models && other.mix && sameMix(other.mix, cost.mix!))) errors.push(`${path}/${i}/costs/${j}/mix repeats another row's mix`);
      if (!cost.composition && costs.some((other, k) => k !== j && other.models === cost.models)) {
        errors.push(`${path}/${i}/costs/${j} shares its model count with another row, so it needs a composition`);
      }
    });
  });
}

function repeats(errors: string[], path: string, items: { id: string }[]) {
  const seen = new Set<string>();
  items.forEach((item, i) => {
    if (seen.has(item.id)) errors.push(`${path}/${i}/id repeats "${item.id}"`);
    seen.add(item.id);
  });
}
