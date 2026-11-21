import { Ajv2020 } from "ajv/dist/2020.js";
import { isUnresolved } from "../record.ts";
import type { Gap } from "../validate.ts";
import schema from "./mission-pack.v1.schema.json" with { type: "json" };
import type { Award, MissionPack } from "./pack.ts";

export type PackValidation = { ok: true; pack: MissionPack; gaps: Gap[] } | { ok: false; errors: string[] };

const checkSchema = new Ajv2020({ allErrors: true }).compile<MissionPack>(schema);

export function validatePack(value: unknown): PackValidation {
  if (!checkSchema(value)) {
    const errors = (checkSchema.errors ?? []).filter((e) => e.keyword !== "if");
    return { ok: false, errors: errors.map((e) => `${e.instancePath || "/"} ${e.message}`) };
  }
  const errors = referenceErrors(value);
  return errors.length > 0 ? { ok: false, errors } : { ok: true, pack: value, gaps: packGaps(value) };
}

/** Every unresolved part, by JSON pointer. */
export function packGaps(value: unknown, path = ""): Gap[] {
  if (Array.isArray(value)) return value.flatMap((item, i) => packGaps(item, `${path}/${i}`));
  if (!value || typeof value !== "object") return [];
  if (isUnresolved(value)) return [{ path, note: value.unresolved }];
  return Object.entries(value).flatMap(([key, item]) => packGaps(item, `${path}/${key}`));
}

// Joins between sections, which the schema cannot express.
function referenceErrors(pack: MissionPack): string[] {
  const errors: string[] = [];
  const ids = (path: string, items: { id: string }[]) => {
    const seen = new Set<string>();
    items.forEach((item, i) => {
      if (seen.has(item.id)) errors.push(`${path}/${i}/id repeats "${item.id}"`);
      seen.add(item.id);
    });
    return seen;
  };
  const dispositions = ids("/dispositions", pack.dispositions);
  const deployments = ids("/deployments", pack.deployments);
  const layouts = new Map(pack.layouts.map((layout) => [layout.id, layout]));
  ids("/layouts", pack.layouts);
  ids("/primaries", pack.primaries);
  const secondaries = ids("/secondaries", pack.secondaries);
  ids("/twists", pack.twists);
  const rounds = isUnresolved(pack.battleRounds) ? null : pack.battleRounds.count;

  const known = (path: string, set: { has(id: string): boolean }, id: string, what: string) => {
    if (!set.has(id)) errors.push(`${path} names unknown ${what} "${id}"`);
  };
  pack.layouts.forEach((layout, i) => layout.deployments.forEach((d, j) => known(`/layouts/${i}/deployments/${j}`, deployments, d, "deployment")));

  const pairings = new Set<string>();
  pack.primaries.forEach((primary, i) => {
    const path = `/primaries/${i}`;
    awardErrors(errors, `${path}/awards`, primary.awards, [], rounds);
    primary.pairings.forEach((pairing, j) => {
      const at = `${path}/pairings/${j}`;
      known(`${at}/friendly`, dispositions, pairing.friendly, "disposition");
      known(`${at}/opposition`, dispositions, pairing.opposition, "disposition");
      const key = `${pairing.friendly}|${pairing.opposition}`;
      if (pairings.has(key)) errors.push(`${at} repeats the ${pairing.friendly} against ${pairing.opposition} pairing`);
      pairings.add(key);
      pairing.deployments.forEach((d, k) => known(`${at}/deployments/${k}`, deployments, d, "deployment"));
      pairing.layouts.forEach((id, k) => {
        const layout = layouts.get(id);
        if (!layout) return known(`${at}/layouts/${k}`, layouts, id, "layout");
        if (!layout.deployments.some((d) => pairing.deployments.includes(d)))
          errors.push(`${at}/layouts/${k} "${id}" permits none of the pairing's deployments`);
      });
    });
  });

  pack.secondaries.forEach((secondary, i) => {
    const path = `/secondaries/${i}`;
    awardErrors(errors, `${path}/awards`, secondary.awards, secondary.modes, rounds);
    const drawn = secondary.whenDrawn;
    if (!drawn || isUnresolved(drawn)) return;
    if (drawn.ifActive !== undefined) {
      known(`${path}/whenDrawn/ifActive`, secondaries, drawn.ifActive, "secondary");
      if (drawn.ifActive === secondary.id) errors.push(`${path}/whenDrawn/ifActive cannot name the card itself`);
    }
    if (rounds !== null && drawn.untilRound !== undefined && drawn.untilRound > rounds)
      errors.push(`${path}/whenDrawn/untilRound is after the last battle round`);
  });
  return errors;
}

function awardErrors(errors: string[], path: string, awards: Award[], modes: string[], rounds: number | null) {
  const seen = new Set<string>();
  awards.forEach((award, i) => {
    const at = `${path}/${i}`;
    if (seen.has(award.id)) errors.push(`${at}/id repeats "${award.id}"`);
    seen.add(award.id);
    if (award.max !== undefined && award.max < award.vp) errors.push(`${at}/max is below one award of ${award.vp}`);
    for (const mode of award.modes ?? [])
      if (!modes.includes(mode)) errors.push(`${at}/modes names "${mode}", which the card cannot be played as`);
    award.windows.forEach((window, j) => {
      if (isUnresolved(window) || window.at === "battle-end" || !window.rounds) return;
      const { from = 1, to } = window.rounds;
      if (to !== undefined && from > to) errors.push(`${at}/windows/${j}/rounds ends before it starts`);
      if (rounds !== null && Math.max(from, to ?? from) > rounds) errors.push(`${at}/windows/${j}/rounds is after the last battle round`);
    });
  });
}
