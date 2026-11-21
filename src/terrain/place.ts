import type { Area, Part, Point, TerrainLayout } from "./record.ts";

export type PlacedPart = {
  id: string;
  name: string;
  density: Part["density"];
  roof: Point[] | null;
  walls: { id: string; points: Point[]; thickness: number }[];
};

export type PlacedArea = {
  id: string;
  group: string | null;
  /** The footprint rectangle's corners, starting at its origin and going round its width first. */
  corners: Point[];
  outline: Point[];
  objective: { id: string; at: Point } | null;
  parts: PlacedPart[];
};

/** A layout with every point in the board frame, rounded to a thousandth of an inch. */
export type PlacedLayout = { id: string; board: TerrainLayout["board"]; areas: PlacedArea[] };

export function placeLayout(layout: TerrainLayout): PlacedLayout {
  return {
    id: layout.id,
    board: layout.board,
    areas: layout.areas.map(placeArea),
  };
}

function placeArea(area: Area): PlacedArea {
  const { at, width, height, rotation } = area.footprint;
  const board = (p: Point) => round(translate(at, rotate(p, rotation)));
  return {
    id: area.id,
    group: area.group,
    corners: [{ x: 0, y: 0 }, { x: width, y: 0 }, { x: width, y: height }, { x: 0, y: height }].map(board),
    outline: area.outline.map(board),
    objective: area.objective && { id: area.objective.id, at: board(area.objective.at) },
    parts: area.parts.map((part) => {
      const local = (p: Point) => board(translate(part.at, rotate(part.mirror ? { x: -p.x, y: p.y } : p, part.rotation)));
      return {
        id: part.id,
        name: part.name,
        density: part.density,
        roof: part.roof && part.roof.map(local),
        walls: part.walls.map((wall) => ({ id: wall.id, points: wall.points.map(local), thickness: wall.thickness })),
      };
    }),
  };
}

/** Turns `p` about the origin; with y pointing down, a positive angle turns +x towards +y, clockwise as drawn. */
export function rotate(p: Point, degrees: number): Point {
  const radians = (degrees * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return { x: p.x * cos - p.y * sin, y: p.x * sin + p.y * cos };
}

function translate(by: Point, p: Point): Point {
  return { x: by.x + p.x, y: by.y + p.y };
}

// Adding 0 turns -0 into 0 so placed output compares and serialises the same way.
function round(p: Point): Point {
  return { x: Math.round(p.x * 1000) / 1000 + 0, y: Math.round(p.y * 1000) / 1000 + 0 };
}

/** Twice the signed area: positive when the points run clockwise as drawn in the board frame. */
export function signedArea(points: Point[]): number {
  return points.reduce((total, p, i) => {
    const next = points[(i + 1) % points.length]!;
    return total + p.x * next.y - next.x * p.y;
  }, 0);
}

/** Inside or on the boundary of `polygon`, within `tolerance` inches. */
export function containsPoint(polygon: Point[], p: Point, tolerance = 0.001): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i]!;
    const b = polygon[j]!;
    if (segmentDistance(p, a, b) <= tolerance) return true;
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

function segmentDistance(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = dx * dx + dy * dy;
  const t = length ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / length)) : 0;
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}
