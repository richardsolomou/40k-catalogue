import { Ajv2020 } from "ajv/dist/2020.js";
import schema from "./terrain.v1.schema.json" with { type: "json" };
import { containsPoint, placeLayout, signedArea } from "./place.ts";
import type { DeploymentMap, Point, TerrainLayout, TerrainRecord } from "./record.ts";

export type Verification = { ok: true; record: TerrainRecord } | { ok: false; errors: string[] };

const checkSchema = new Ajv2020({ allErrors: true }).compile<TerrainRecord>(schema);

/** Checks one record against the schema, then the geometry and identity rules the schema cannot express. */
export function verify(value: unknown): Verification {
  if (!checkSchema(value)) {
    // "if" errors only repeat the failure already reported inside the matching branch.
    const errors = (checkSchema.errors ?? []).filter((e) => e.keyword !== "if");
    return { ok: false, errors: errors.map((e) => `${e.instancePath || "/"} ${e.message}`) };
  }
  const errors = value.kind === "terrain-layout" ? layoutErrors(value) : deploymentErrors(value);
  return errors.length > 0 ? { ok: false, errors } : { ok: true, record: value };
}

/**
 * Checks that records verified one by one have distinct IDs, and that each deployment a layout names is a deployment
 * map among them on the same board.
 */
export function verifyDataset(records: TerrainRecord[]): string[] {
  const errors = duplicates(records.map((r) => r.id)).map((id) => `${id} is used by more than one record`);
  const byId = new Map(records.map((r) => [r.id, r]));
  for (const layout of records)
    for (const id of (layout.kind === "terrain-layout" && layout.deployments) || []) {
      const deployment = byId.get(id);
      if (deployment?.kind !== "deployment-map") errors.push(`layout ${layout.id} names deployment ${id}, which has no deployment map`);
      else if (!sameBoard(deployment, layout)) errors.push(`layout ${layout.id} is not on the same board as deployment ${id}`);
    }
  return errors;
}

/** The layouts and deployments a mission pack names, and which deployments each layout permits; any pack format fits. */
export type BattlefieldReferences = { layouts: { id: string; deployments: string[] }[]; deployments: { id: string }[] };

/**
 * Joins referenced layouts and deployments to geometry records with the same ID. Missing geometry is reported as a
 * gap, not an error, because a pack can be published before its terrain; a layout drawn on a different board from a
 * deployment it permits is an error, and so is a listed layout naming deployments of its own, which the pack owns.
 */
export function joinBattlefields(references: BattlefieldReferences, records: TerrainRecord[]): { gaps: string[]; errors: string[] } {
  const byId = new Map(records.map((r) => [r.id, r]));
  const gaps: string[] = [];
  const errors: string[] = [];
  for (const { id } of references.deployments)
    if (byId.get(id)?.kind !== "deployment-map") gaps.push(`deployment ${id} has no deployment map`);
  for (const { id, deployments } of references.layouts) {
    const layout = byId.get(id);
    if (layout?.kind !== "terrain-layout") {
      gaps.push(`layout ${id} has no terrain layout`);
      continue;
    }
    if (layout.deployments) errors.push(`layout ${id} names its own deployments, though a mission pack lists it`);
    for (const deploymentId of deployments) {
      const deployment = byId.get(deploymentId);
      if (deployment?.kind === "deployment-map" && !sameBoard(deployment, layout)) errors.push(`layout ${id} is not on the same board as deployment ${deploymentId}`);
    }
  }
  return { gaps, errors };
}

/**
 * IDs a saved battle could hold that `previous` resolves and `next` does not: records, a layout's footprints, and
 * objectives. Each is reported as `<record id>` or `<record id>#<id>`.
 */
export function droppedIds(previous: TerrainRecord[], next: TerrainRecord[]): string[] {
  const keys = (records: TerrainRecord[]) =>
    records.flatMap((r) => [
      r.id,
      ...(r.kind === "terrain-layout"
        ? r.areas.flatMap((a) => [a.id, ...(a.objective ? [a.objective.id] : [])])
        : r.objectives.map((o) => o.id)
      ).map((id) => `${r.id}#${id}`),
    ]);
  const kept = new Set(keys(next));
  return [...new Set(keys(previous))].filter((key) => !kept.has(key));
}

function layoutErrors(layout: TerrainLayout): string[] {
  const errors = boardErrors(layout.board);
  const ids = layout.areas.flatMap((a) => [a.id, ...a.parts.flatMap((p) => [p.id, ...p.walls.map((w) => w.id)])]);
  for (const id of duplicates(ids)) errors.push(`/areas id ${id} is used more than once in the layout`);
  for (const [group, count] of counts(layout.areas.flatMap((a) => (a.group ? [a.group] : []))))
    if (count < 2) errors.push(`/areas group ${group} has one footprint; a footprint that is a terrain area on its own has no group`);

  const placed = placeLayout(layout).areas;
  layout.areas.forEach((area, i) => {
    const at = `/areas/${i}`;
    const { outline, objective, parts } = placed[i]!;
    errors.push(...shapeErrors(`${at}/outline`, outline, layout.board));
    if (objective && !containsPoint(outline, objective.at)) errors.push(`${at}/objective is outside the area's outline`);
    if (objective) errors.push(...pointErrors(`${at}/objective`, [objective.at], layout.board));
    parts.forEach((part, j) => {
      if (part.roof) errors.push(...shapeErrors(`${at}/parts/${j}/roof`, part.roof, layout.board));
      part.walls.forEach((wall, k) => errors.push(...pointErrors(`${at}/parts/${j}/walls/${k}`, wall.points, layout.board)));
    });
    (area.measurements ?? []).forEach((m, j) => errors.push(...pointErrors(`${at}/measurements/${j}`, [m.from, m.to], layout.board)));
  });
  return errors;
}

function deploymentErrors(deployment: DeploymentMap): string[] {
  const errors = boardErrors(deployment.board);
  for (const [name, regions] of [["zones", deployment.zones], ["territories", deployment.territories]] as const) {
    for (const role of duplicates(regions.map((r) => r.role))) errors.push(`/${name} has more than one ${role} region`);
    regions.forEach((region, i) => errors.push(...shapeErrors(`/${name}/${i}`, region.points, deployment.board)));
  }
  for (const id of duplicates(deployment.objectives.map((o) => o.id))) errors.push(`/objectives id ${id} is used more than once`);
  deployment.objectives.forEach((o, i) => errors.push(...pointErrors(`/objectives/${i}`, [o.at], deployment.board)));
  return errors;
}

function sameBoard(a: TerrainRecord, b: TerrainRecord): boolean {
  return a.board.width === b.board.width && a.board.height === b.board.height;
}

function boardErrors(board: { width: number; height: number }): string[] {
  return board.width >= board.height ? [] : ["/board must be landscape: width is the long edge"];
}

function shapeErrors(path: string, points: Point[], board: { width: number; height: number }): string[] {
  const errors = pointErrors(path, points, board);
  if (Math.abs(signedArea(points)) < 0.001) errors.push(`${path} encloses no area`);
  return errors;
}

function pointErrors(path: string, points: Point[], board: { width: number; height: number }): string[] {
  const off = points.some((p) => p.x < -0.001 || p.y < -0.001 || p.x > board.width + 0.001 || p.y > board.height + 0.001);
  return off ? [`${path} is off the board`] : [];
}

function counts(values: string[]): Map<string, number> {
  const tally = new Map<string, number>();
  for (const value of values) tally.set(value, (tally.get(value) ?? 0) + 1);
  return tally;
}

function duplicates(values: string[]): string[] {
  return [...counts(values)].flatMap(([value, count]) => (count > 1 ? [value] : []));
}
