// Mirrors src/points/points.v1.schema.json, which is the contract consumers rely on.

import type { OrUnresolved } from "../record.ts";

export type Source = { title: string; url?: string; page?: string; revision?: string };

/**
 * One row of a cost table. `composition` tells apart rows with the same model count; `mix`, where the row is priced by
 * the models it holds, gives the count of each model by model ID.
 */
export type Cost = { models: number; composition?: string; mix?: Record<string, number>; points: OrUnresolved<number> };

/** The price of the `from`th to `to`th copy of a unit in one army; no `to` means every later copy. */
export type Tier = { copies: { from: number; to?: number }; costs: Cost[] };

/** A wargear price is per item taken, on top of the unit's cost. */
export type Wargear = { item: string; points: OrUnresolved<number> };

export type Unit = { id: string; name: string; group?: string; legends?: true; tiers: Tier[]; wargear?: Wargear[] };
export type Enhancement = { id: string; name: string; upgrade?: true; points: OrUnresolved<number> };
export type Detachment = { id: string; name: string; dp: OrUnresolved<number>; enhancements: Enhancement[] };
export type Faction = { id: string; name: string; detachments: Detachment[]; units: Unit[] };

export type PointsSnapshot = {
  formatVersion: 1;
  kind: "points-snapshot";
  id: string;
  rulesVersion: { edition: string; update: string };
  published: string;
  source: Source;
  basis: string;
  factions: Faction[];
};

export type PointsHistory = {
  formatVersion: 1;
  kind: "points-history";
  updates: { id: string; status: "current" | "retired"; sha256: string }[];
};
