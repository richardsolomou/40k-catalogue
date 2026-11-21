import { createHash } from "node:crypto";
import { lookupPoints, type PointsLookup, type PointsRef } from "./lookup.ts";
import type { PointsHistory, PointsSnapshot } from "./snapshot.ts";

/** SHA-256 of the snapshot with object keys sorted, so formatting and key order never change it. */
export function snapshotDigest(snapshot: PointsSnapshot): string {
  return createHash("sha256").update(canonical(snapshot)).digest("hex");
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value).toSorted(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

/** Every update the history lists must be present and unchanged; a retained update is never edited or dropped. */
export function historyErrors(history: PointsHistory, snapshots: PointsSnapshot[]): string[] {
  const errors: string[] = [];
  const byId = Map.groupBy(snapshots, (snapshot) => snapshot.id);
  for (const update of history.updates) {
    const matches = byId.get(update.id);
    if (!matches) errors.push(`${update.id} is listed but its snapshot is missing`);
    else if (matches.length > 1) errors.push(`${update.id} has multiple snapshots`);
    else if (snapshotDigest(matches[0]!) !== update.sha256) errors.push(`${update.id} no longer matches its recorded sha256`);
  }
  const listed = new Set(history.updates.map((u) => u.id));
  for (const id of byId.keys()) if (!listed.has(id)) errors.push(`${id} is not listed in the history`);
  return errors;
}

/** Points under the named update only. An unknown update is a miss, never a fall back to current points. */
export function pointsAt(snapshots: PointsSnapshot[], update: string, ref: PointsRef): PointsLookup {
  const matches = snapshots.filter((snapshot) => snapshot.id === update);
  if (matches.length === 0) return { ok: false, reason: "unknown-update" };
  if (matches.length > 1) return { ok: false, reason: "ambiguous-update" };
  return lookupPoints(matches[0]!, ref);
}
