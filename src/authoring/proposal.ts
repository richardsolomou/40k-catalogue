import { isDeepStrictEqual } from "node:util";
import { Ajv2020 } from "ajv/dist/2020.js";
import { renderSummary } from "../render.ts";
import type { MechanicRecord } from "../record.ts";
import { validate } from "../validate.ts";
import schema from "./proposal.v1.schema.json" with { type: "json" };

// Mirrors proposal.v1.schema.json.
export type Check = {
  path: string;
  outcome: "confirmed" | "needs-correction" | "corrected" | "unresolved";
  note?: string;
  draft?: unknown;
};
export type Drafting = {
  method: "by-hand" | "model-assisted";
  author: string;
  model?: string;
  modelInputs?: ("contributor-notes" | "structured-fields")[];
};
export type Review = { reviewer: string; date: string; checks: Check[] };
export type Proposal = { proposalVersion: 1; record: unknown; drafting: Drafting; review?: Review };

export type Decision =
  | { outcome: "approved"; record: MechanicRecord; proposal: Proposal }
  | { outcome: "held"; reasons: string[] };

const checkSchema = new Ajv2020({ allErrors: true }).compile<Proposal>(schema);

export function decide(value: unknown): Decision {
  if (!checkSchema(value)) {
    const errors = (checkSchema.errors ?? []).filter((e) => e.keyword !== "if");
    return { outcome: "held", reasons: errors.map((e) => `${e.instancePath || "/"} ${e.message}`) };
  }
  const result = validate(value.record);
  if (!result.ok) return { outcome: "held", reasons: result.errors.map((e) => (e.startsWith("/ ") ? `/record${e.slice(1)}` : `/record${e}`)) };
  if (!value.review) return { outcome: "held", reasons: ["the proposal has not been reviewed"] };

  const { record } = result;
  const gaps = new Set(result.gaps.map((g) => g.path));
  const parts = new Set([...reviewableParts(record), ...gaps]);
  const reasons: string[] = [];
  const reviewed = new Set<string>();

  for (const check of value.review.checks) {
    const { path, outcome } = check;
    if (reviewed.has(path)) reasons.push(`${path} is reviewed more than once`);
    reviewed.add(path);
    if (!parts.has(path)) {
      reasons.push(`${path} is not a reviewable part of the record`);
      continue;
    }
    if (outcome === "needs-correction") reasons.push(`${path} needs correction: ${check.note}`);
    if (outcome === "corrected" && isDeepStrictEqual(at(record, path), check.draft)) {
      reasons.push(`${path} still matches its draft, so the correction has not been applied`);
    }
    if (gaps.has(path) && outcome !== "unresolved") reasons.push(`${path} is a gap in the record, so review it as unresolved`);
    if (!gaps.has(path) && outcome === "unresolved") reasons.push(`${path} is reviewed as unresolved, but the record resolves it`);
  }
  for (const path of parts) if (!reviewed.has(path)) reasons.push(`${path} has not been reviewed`);

  return reasons.length > 0 ? { outcome: "held", reasons } : { outcome: "approved", record, proposal: value };
}

// The files an approved proposal publishes. Built field by field so nothing else in a proposal can reach them.
export function publication(decision: Extract<Decision, { outcome: "approved" }>): Record<string, string> {
  const { record, proposal } = decision;
  const { method, author, model, modelInputs } = proposal.drafting;
  const { reviewer, date, checks } = proposal.review!;
  const review = {
    reviewVersion: 1,
    id: record.id,
    rulesVersion: record.rulesVersion,
    outcome: "approved",
    drafting: { method, author, model, modelInputs },
    reviewer,
    date,
    checks: checks.map(({ path, outcome, note, draft }) => ({ path, outcome, note, draft })),
  };
  return {
    [`${record.id}.json`]: json(record),
    [`${record.id}.summary.txt`]: `${renderSummary(record)}\n`,
    [`${record.id}.review.json`]: json(review),
  };
}

// Every part a reviewer must confirm, correct, or mark unresolved before a record is published.
function reviewableParts(record: MechanicRecord): string[] {
  const optional = (["usage", "duration", "restriction"] as const).filter((key) => record[key] !== undefined);
  const conditions = record.conditions.map((_, i) => `/conditions/${i}`);
  return ["/rulesVersion", "/source", "/trigger", "/target", ...conditions, "/effect", ...optional.map((key) => `/${key}`)];
}

function at(value: unknown, pointer: string): unknown {
  return pointer
    .split("/")
    .slice(1)
    .reduce<unknown>((node, key) => (node as Record<string, unknown> | undefined)?.[key], value);
}

function json(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}
