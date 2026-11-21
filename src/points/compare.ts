import type { PointsSnapshot } from "./snapshot.ts";

/** One priced fact, keyed by IDs so two snapshots line up: `unit/<faction>/<unit>/<from>-<to>/<models>[/<composition>]` and similar. */
export type Row = { key: string; points: number | null };

export type Comparison = {
  baselineRows: number;
  candidateRows: number;
  matched: number;
  /** Share of baseline rows the candidate prices identically. */
  matchRate: number;
  differ: { key: string; candidate: number | null; baseline: number | null }[];
  missing: string[];
  extra: string[];
};

export function rows(snapshot: PointsSnapshot): Row[] {
  const out: Row[] = [];
  const add = (key: string, points: number | object) => out.push({ key, points: typeof points === "number" ? points : null });
  for (const f of snapshot.factions) {
    for (const d of f.detachments) {
      add(`detachment/${f.id}/${d.id}`, d.dp);
      for (const e of d.enhancements) add(`${e.upgrade ? "upgrade" : "enhancement"}/${f.id}/${d.id}/${e.id}`, e.points);
    }
    for (const u of f.units) {
      for (const t of u.tiers) {
        const copies = `${t.copies.from}-${t.copies.to ?? ""}`;
        for (const c of t.costs) add(`unit/${f.id}/${u.id}/${copies}/${c.models}${c.composition ? `/${c.composition}` : ""}`, c.points);
      }
      for (const w of u.wargear ?? []) add(`wargear/${f.id}/${u.id}/${w.item}`, w.points);
    }
  }
  return out;
}

/** Unresolved values compare as null, so a value that became unresolved counts as a difference. */
export function compareSnapshots(candidate: PointsSnapshot, baseline: PointsSnapshot): Comparison {
  const ours = new Map(rows(candidate).map((r) => [r.key, r.points]));
  const theirs = new Map(rows(baseline).map((r) => [r.key, r.points]));
  const differ: Comparison["differ"] = [];
  const missing: string[] = [];
  let matched = 0;
  for (const [key, points] of theirs) {
    if (!ours.has(key)) missing.push(key);
    else if (ours.get(key) === points) matched++;
    else differ.push({ key, candidate: ours.get(key)!, baseline: points });
  }
  const extra = [...ours.keys()].filter((key) => !theirs.has(key));
  return {
    baselineRows: theirs.size,
    candidateRows: ours.size,
    matched,
    matchRate: theirs.size === 0 ? 1 : matched / theirs.size,
    differ,
    missing,
    extra,
  };
}
