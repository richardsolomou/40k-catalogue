import { Ajv2020 } from "ajv/dist/2020.js";
import { isDeepStrictEqual } from "node:util";
import schema from "../schema/mechanic.v1.schema.json" with { type: "json" };
import { isUnresolved, type MechanicRecord, type Trigger, type UnitRef } from "./record.ts";
import { renderSummaryData } from "./render.ts";

export type Gap = { path: string; note: string };
export type Validation = { ok: true; record: MechanicRecord; gaps: Gap[] } | { ok: false; errors: string[] };

const checkSchema = new Ajv2020({ allErrors: true }).compile<MechanicRecord>(schema);

export function validate(value: unknown): Validation {
  if (!checkSchema(value)) {
    // "if" errors only repeat the failure already reported inside the matching branch.
    const errors = (checkSchema.errors ?? []).filter((e) => e.keyword !== "if");
    return { ok: false, errors: errors.map((e) => `${e.instancePath || "/"} ${e.message}`) };
  }
  const errors = referenceErrors(value);
  if (errors.length === 0 && (value.summary !== undefined || value.summarySpans !== undefined || value.summaryTerms?.length)) {
    const expected = renderSummaryData(value);
    if (value.summary !== undefined && value.summary !== expected.summary) errors.push("/summary must match the rendered summary");
    if (value.summarySpans !== undefined && !isDeepStrictEqual(value.summarySpans, expected.summarySpans ?? [])) {
      errors.push("/summarySpans must match the rendered summary spans");
    }
    const labels = value.summaryTerms?.map(({ label }) => label.trim().toLowerCase()) ?? [];
    if (new Set(labels).size !== labels.length) errors.push("/summaryTerms repeats a label");
    const renderedLabels = new Set(expected.summarySpans?.map(({ start, end }) => expected.summary.slice(start, end).toLowerCase()));
    for (const [index, label] of labels.entries()) {
      if (!renderedLabels.has(label)) errors.push(`/summaryTerms/${index}/label is absent from the rendered summary`);
    }
  }
  return errors.length > 0 ? { ok: false, errors } : { ok: true, record: value, gaps: gaps(value) };
}

export function gaps(record: MechanicRecord): Gap[] {
  const parts: [string, object | undefined][] = [
    ["/trigger", record.trigger],
    ["/target", record.target],
    ...record.conditions.map((c, i): [string, object] => [`/conditions/${i}`, c]),
    ["/effect", record.effect],
    ["/effect/ifBattleShocked", effectPenalty(record.effect)],
    ["/duration", record.duration],
    ["/restriction", record.restriction],
  ];
  return parts.flatMap(([path, part]) => (part && isUnresolved(part) ? [{ path, note: part.unresolved }] : []));
}

function effectPenalty(effect: MechanicRecord["effect"]): object | undefined {
  return !isUnresolved(effect) && effect.kind === "desperate-escape-tests" ? effect.ifBattleShocked : undefined;
}

// Each unit reference other than this-unit and target is introduced by one kind of trigger.
const INTRODUCED_BY: Partial<Record<UnitRef, { kinds: Trigger["kind"][]; name: string }>> = {
  "triggering-unit": { kinds: ["move-end", "move-selected", "unit-destroyed"], name: "a triggering unit" },
  "triggering-model": { kinds: ["model-destroyed"], name: "a triggering model" },
  "destroying-unit": { kinds: ["unit-destroyed"], name: "a destroying unit" },
};

// Unit references must name a unit the record actually introduces, which the schema cannot express.
function referenceErrors(record: MechanicRecord): string[] {
  const errors: string[] = [];
  const refs: [string, UnitRef][] = [];
  const { target } = record;
  if (!isUnresolved(target)) {
    if ("unit" in target) refs.push(["/target/unit", target.unit]);
    else if (target.select.within) refs.push(["/target/select/within/of", target.select.within.of]);
  }
  record.conditions.forEach((c, i) => {
    if (isUnresolved(c) || !("unit" in c)) return;
    refs.push([`/conditions/${i}/unit`, c.unit]);
    if (c.kind !== "within") return;
    refs.push([`/conditions/${i}/of`, c.of]);
    if (c.unit === c.of) errors.push(`/conditions/${i} cannot measure a distance from a unit to itself`);
  });
  const { effect, restriction } = record;
  if (!isUnresolved(effect) && effect.kind === "desperate-escape-tests") refs.push(["/effect/unit", effect.unit]);
  if (restriction && !isUnresolved(restriction)) refs.push(["/restriction/unit", restriction.unit]);

  const triggerKind = isUnresolved(record.trigger) ? undefined : record.trigger.kind;
  for (const [path, ref] of refs) {
    const introduced = INTRODUCED_BY[ref];
    if (introduced && !(triggerKind && introduced.kinds.includes(triggerKind))) {
      errors.push(`${path} refers to ${introduced.name}, but the trigger has none`);
    }
    if (ref === "target" && path.startsWith("/target/")) errors.push(`${path} cannot refer to the target it selects`);
  }
  return errors;
}
