// Mirrors src/terrain/terrain.v1.schema.json, which is the contract consumers rely on. Frames are defined in docs/terrain.md.

export type Point = { x: number; y: number };

export type Provenance =
  | { basis: "synthetic" | "original"; note: string }
  | { basis: "measured"; note: string; source: { title: string; page?: string; url?: string }; reuse: string };

export type Wall = { id: string; points: Point[]; thickness: number };

export type Part = {
  id: string;
  name: string;
  density: "dense" | "light";
  at: Point;
  rotation: number;
  mirror: boolean;
  roof: Point[] | null;
  walls: Wall[];
};

export type Area = {
  id: string;
  footprint: { at: Point; width: number; height: number; rotation: number };
  outline: Point[];
  group: string | null;
  objective: { id: string; at: Point } | null;
  parts: Part[];
};

export type TerrainLayout = {
  formatVersion: 1;
  kind: "terrain-layout";
  id: string;
  name: string;
  provenance: Provenance;
  board: { width: number; height: number };
  areas: Area[];
};

export type DeploymentMap = {
  formatVersion: 1;
  kind: "deployment-map";
  id: string;
  name: string;
  provenance: Provenance;
  board: { width: number; height: number };
  zones: { role: "attacker" | "defender"; points: Point[] }[];
  territories: { role: "attacker" | "defender"; points: Point[] }[];
  objectives: { id: string; at: Point }[];
};

export type TerrainRecord = TerrainLayout | DeploymentMap;
