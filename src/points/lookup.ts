import type { OrUnresolved } from "../record.ts";
import type { Cost, PointsSnapshot, Unit } from "./snapshot.ts";

/** `copy` is which copy of the unit this is in the army, counting from 1. */
export type PointsRef =
  | { kind: "unit"; faction: string; unit: string; models: number; copy?: number; composition?: string; mix?: Record<string, number> }
  | { kind: "wargear"; faction: string; unit: string; item: string }
  | { kind: "detachment"; faction: string; detachment: string }
  | { kind: "enhancement"; faction: string; detachment: string; enhancement: string };

export type Miss =
  | "unknown-update"
  | "ambiguous-update"
  | "unknown-faction"
  | "unknown-unit"
  | "unknown-wargear"
  | "unknown-detachment"
  | "unknown-enhancement"
  | "no-tier"
  | "no-size"
  | "ambiguous-size"
  | "unresolved";

export type PointsLookup = { ok: true; points: number } | { ok: false; reason: Miss; note?: string };

const miss = (reason: Miss, note?: string): PointsLookup => ({ ok: false, reason, ...(note ? { note } : {}) });
const value = (points: OrUnresolved<number>): PointsLookup =>
  typeof points === "number" ? { ok: true, points } : miss("unresolved", points.unresolved);

export function lookupPoints(snapshot: PointsSnapshot, ref: PointsRef): PointsLookup {
  const faction = snapshot.factions.find((f) => f.id === ref.faction);
  if (!faction) return miss("unknown-faction");
  if (ref.kind === "detachment" || ref.kind === "enhancement") {
    const detachment = faction.detachments.find((d) => d.id === ref.detachment);
    if (!detachment) return miss("unknown-detachment");
    if (ref.kind === "detachment") return value(detachment.dp);
    const enhancement = detachment.enhancements.find((e) => e.id === ref.enhancement);
    return enhancement ? value(enhancement.points) : miss("unknown-enhancement");
  }
  const unit = faction.units.find((u) => u.id === ref.unit);
  if (!unit) return miss("unknown-unit");
  if (ref.kind === "wargear") {
    const item = unit.wargear?.find((w) => w.item === ref.item);
    return item ? value(item.points) : miss("unknown-wargear");
  }
  return unitCost(unit, ref.models, ref.copy ?? 1, ref.composition, ref.mix);
}

// Two mixes give each model the same count; a model missing from either counts as zero.
const sameMix = (a: Record<string, number>, b: Record<string, number>) =>
  [...new Set([...Object.keys(a), ...Object.keys(b)])].every((model) => (a[model] ?? 0) === (b[model] ?? 0));

function unitCost(unit: Unit, models: number, copy: number, composition?: string, mix?: Record<string, number>): PointsLookup {
  const tier = unit.tiers.find(({ copies }) => copy >= copies.from && copy <= (copies.to ?? Infinity));
  if (!tier) return miss("no-tier");
  const sized = tier.costs.filter((c) => c.models === models && (composition === undefined || c.composition === composition));
  // A mix that no row's mix gives prices none, never the row of a circumstance beside them.
  if (mix !== undefined && sized.some((c) => c.mix) && !sized.some((c) => c.mix && sameMix(c.mix, mix))) return miss("no-size");
  const rows = sized.filter((c) => mix === undefined || c.mix === undefined || sameMix(c.mix, mix));
  if (rows.length === 1) return value(rows[0]!.points);
  if (rows.length > 1) return miss("ambiguous-size");
  if (composition !== undefined) return miss("no-size");
  const between = betweenRows(tier.costs, models);
  return between ? value(between.points) : miss("no-size");
}

// MFM Starting Strength guidance (https://mfm.warhammer-community.com/en): a table with a lower and an upper
// starting strength charges any count between them at the upper row. Longer tables price only the counts they print.
function betweenRows(costs: Cost[], models: number): Cost | undefined {
  if (costs.length !== 2) return undefined;
  const [lower, upper] = costs.toSorted((a, b) => a.models - b.models);
  return models > lower!.models && models < upper!.models ? upper : undefined;
}
