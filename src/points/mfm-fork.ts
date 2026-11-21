import type { Cost, Detachment, Faction, PointsSnapshot, Tier, Unit, Wargear } from "./snapshot.ts";

// The per-faction shape of the community Munitorum Field Manual dataset, after `yq -o=json`. Fields this
// format does not carry (leader and support lists, objectives, unique tags, labels) are ignored.
export type ForkCost = { models: number; points: number; desc?: string; addon?: boolean };
export type ForkUnit = {
  name: string;
  groupTitle?: string;
  legends?: boolean;
  pricing: { range: string; costs: ForkCost[] }[];
  wargear?: { item: string; points: number }[];
};
export type ForkFaction = {
  name: string;
  slug: string;
  version: string;
  detachments?: { name: string; dp: number; enhancements?: { name: string; points: number }[] }[];
  units: ForkUnit[];
};

export type SnapshotMeta = Omit<PointsSnapshot, "formatVersion" | "kind" | "factions">;
export type Conversion = { snapshot: PointsSnapshot; issues: string[] };

const UPGRADE = /\s*\(upgrade\)/i;

export function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Converts the dataset to a snapshot, listing every place where the conversion had to choose. */
export function fromMfmFork(factions: ForkFaction[], meta: SnapshotMeta): Conversion {
  const issues: string[] = [];
  const out = factions.toSorted((a, b) => (a.slug < b.slug ? -1 : 1)).map((f) => faction(f, issues));
  return { snapshot: { formatVersion: 1, kind: "points-snapshot", ...meta, factions: out }, issues };
}

function faction(f: ForkFaction, issues: string[]): Faction {
  const detachments: Detachment[] = (f.detachments ?? []).map((d) => ({
    id: slug(d.name),
    name: d.name,
    dp: d.dp,
    enhancements: (d.enhancements ?? []).map((e) => {
      const name = e.name.replace(UPGRADE, "");
      return { id: slug(name), name, ...(UPGRADE.test(e.name) ? { upgrade: true as const } : {}), points: e.points };
    }),
  }));

  const taken = new Set<string>();
  const shared = new Set(f.units.map((u) => u.name).filter((name, i, all) => all.indexOf(name) !== i));
  const units = f.units.map((u): Unit => {
    let id = shared.has(u.name) && u.groupTitle ? `${slug(u.groupTitle)}.${slug(u.name)}` : slug(u.name);
    if (taken.has(id)) {
      let n = 2;
      while (taken.has(`${id}-${n}`)) n++;
      issues.push(`${f.slug}: a second "${u.name}" has nothing to tell it apart, so it became ${id}-${n} in source order`);
      id = `${id}-${n}`;
    }
    taken.add(id);
    return unit(f.slug, id, u, issues);
  });
  return { id: f.slug, name: f.name, detachments, units };
}

function unit(factionSlug: string, id: string, u: ForkUnit, issues: string[]): Unit {
  const wargear: Wargear[] = (u.wargear ?? []).map((w) => ({ item: w.item, points: w.points }));
  const tiers = u.pricing.map((p): Tier => {
    const costs: Cost[] = [];
    for (const c of p.costs) {
      if (c.addon) {
        // An add-on is an optional extra bought with the unit, which is how wargear prices already work.
        const item = c.desc ?? "add-on";
        if (!wargear.some((w) => w.item === item)) wargear.push({ item, points: c.points });
        continue;
      }
      costs.push({ models: c.models, ...(c.desc ? { composition: c.desc } : {}), points: c.points });
    }
    return { copies: copies(p.range), costs };
  });
  if (tiers.some((t) => t.costs.some((c, i) => t.costs.findIndex((o) => o.models === c.models) !== i))) {
    issues.push(`${factionSlug}/${id}: rows share a model count and are told apart by composition only`);
  }
  return { id, name: u.name, ...(u.groupTitle ? { group: u.groupTitle } : {}), ...(u.legends ? { legends: true as const } : {}), tiers, ...(wargear.length ? { wargear } : {}) };
}

// Ranges are written "[1,2]" (first to second copy) or "[3,)" (third copy onwards).
function copies(range: string): Tier["copies"] {
  const match = /^\[(\d+),(\d*)[\])]$/.exec(range);
  if (!match) throw new Error(`unreadable copy range ${range}`);
  return match[2] ? { from: Number(match[1]), to: Number(match[2]) } : { from: Number(match[1]) };
}
