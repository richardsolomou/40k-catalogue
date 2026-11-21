import type { PlacedLayout } from "./place.ts";
import type { DeploymentMap, Point } from "./record.ts";

const SCALE = 10;

/**
 * A plan of the board for visual checks, drawn in the board frame so the SVG's own axes match it: zones and
 * territories, footprints dashed, outlines by density, roofs, walls, objectives, and each footprint's origin corner.
 */
export function renderSvg(layout: PlacedLayout, deployment?: DeploymentMap): string {
  const { width, height } = layout.board;
  const shapes: string[] = [`<rect width="${width}" height="${height}" fill="#f4f1ea"/>`];
  for (const t of deployment?.territories ?? []) shapes.push(polygon(t.points, t.role === "attacker" ? "#f6d5d5" : "#d5e0f6", "none"));
  for (const z of deployment?.zones ?? []) shapes.push(polygon(z.points, z.role === "attacker" ? "#e8a0a0" : "#a0b8e8", "none"));
  for (const area of layout.areas) {
    shapes.push(polygon(area.corners, "none", "#888", 'stroke-dasharray="0.4 0.3"'));
    const density = area.parts.some((p) => p.density === "dense") ? "#7a6a55" : "#b9ad98";
    shapes.push(polygon(area.outline, density, "#333", 'fill-opacity="0.45"'));
    for (const part of area.parts) {
      if (part.roof) shapes.push(polygon(part.roof, "#5b4b3a", "none", 'fill-opacity="0.35"'));
      for (const wall of part.walls)
        shapes.push(`<polyline points="${coords(wall.points)}" fill="none" stroke="#222" stroke-width="${wall.thickness}" stroke-linecap="square"/>`);
    }
    const [origin] = area.corners;
    shapes.push(`<circle cx="${origin!.x}" cy="${origin!.y}" r="0.35" fill="#c0392b"/>`);
  }
  const objectives = [...(deployment?.objectives.map((o) => o.at) ?? []), ...layout.areas.flatMap((a) => (a.objective ? [a.objective.at] : []))];
  for (const o of objectives) shapes.push(`<circle cx="${o.x}" cy="${o.y}" r="0.8" fill="#f1c40f" stroke="#222" stroke-width="0.1"/>`);
  shapes.push(`<rect width="${width}" height="${height}" fill="none" stroke="#333" stroke-width="0.2"/>`);
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width * SCALE}" height="${height * SCALE}" viewBox="0 0 ${width} ${height}">`,
    `<title>${escape(layout.id)}</title>`,
    ...shapes,
    "</svg>",
    "",
  ].join("\n");
}

function polygon(points: Point[], fill: string, stroke: string, extra = ""): string {
  return `<polygon points="${coords(points)}" fill="${fill}" stroke="${stroke}" stroke-width="0.1" ${extra}/>`;
}

function coords(points: Point[]): string {
  return points.map((p) => `${p.x},${p.y}`).join(" ");
}

function escape(text: string): string {
  return text.replace(/[<>&"]/g, (c) => `&#${c.charCodeAt(0)};`);
}
