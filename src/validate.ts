import { Ajv2020 } from "ajv/dist/2020.js";
import schema from "../schema/mechanic.v1.schema.json" with { type: "json" };
import { isUnresolved, type MechanicRecord, type UnitRef } from "./record.ts";

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
  return errors.length > 0 ? { ok: false, errors } : { ok: true, record: value, gaps: gaps(value) };
}

export function gaps(record: MechanicRecord): Gap[] {
  const parts: [string, object | undefined][] = [
    ["/trigger", record.trigger],
    ["/target", record.target],
    ...record.conditions.map((c, i): [string, object] => [`/conditions/${i}`, c]),
    ["/effect", record.effect],
    ["/duration", record.duration],
  ];
  return parts.flatMap(([path, part]) => (part && isUnresolved(part) ? [{ path, note: part.unresolved }] : []));
}

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
    if (isUnresolved(c)) return;
    refs.push([`/conditions/${i}/unit`, c.unit]);
    if (c.kind !== "within") return;
    refs.push([`/conditions/${i}/of`, c.of]);
    if (c.unit === c.of) errors.push(`/conditions/${i} cannot measure a distance from a unit to itself`);
  });

  const hasTriggeringUnit = !isUnresolved(record.trigger) && record.trigger.kind === "move-end";
  for (const [path, ref] of refs) {
    if (ref === "triggering-unit" && !hasTriggeringUnit) errors.push(`${path} refers to a triggering unit, but the trigger has none`);
    if (ref === "target" && path.startsWith("/target/")) errors.push(`${path} cannot refer to the target it selects`);
  }
  return errors;
}
