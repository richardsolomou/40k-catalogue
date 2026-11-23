import { Ajv2020 } from "ajv/dist/2020.js";
import { resolve, validateRelease, type Ref, type Release } from "../catalogue-identity/identity.ts";
import type { CatalogueRecord } from "../catalogue-releases/catalogue.ts";
import { validate as validateMechanic } from "../validate.ts";
import factsSchema from "./facts.v1.schema.json" with { type: "json" };
import schema from "./summaries.v1.schema.json" with { type: "json" };

// Mirrors summaries.v1.schema.json, which is the contract consumers rely on.
export type Citation =
  | { type: "app"; title: string; appVersion: string; dataBuild: number; releaseDate: string }
  | { type: "publisher"; title: string; page?: string; url: string };
export type SummarySpan = { start: number; end: number; bold?: true; target?: Ref };
/** Typed facts in a named format; VS Data checks `vs-data-facts` version `1` against its schema and `vs-data-mechanic` version `1` as mechanic fields. */
export type Facts = { format: string; version?: string; fields: Record<string, unknown> };
export type SummaryData = {
  summary: string;
  summarySpans?: SummarySpan[];
  citations: Citation[];
  /** The open questions the summary's reading rests on. */
  interpretation?: { question: string }[];
  facts?: Facts;
};
type Phase = "command" | "movement" | "shooting" | "charge" | "fight";
type Card = "primary" | "secondary";
export type AbilityData = SummaryData & {
  ruleType: "army-rule" | "detachment-rule" | "stratagem" | "core-stratagem" | "enhancement" | "unit-ability" | "core-ability" | "weapon-ability";
  group?: string;
  /** Required for Stratagems and absent otherwise, like `stratagem`. */
  cp?: number;
  stratagem?: { phases: Phase[]; turn: "own" | "opponent" | "any"; type?: "battle-tactic" | "strategic-ploy" | "epic-deed" | "wargear"; oncePerPhase?: true };
};
export type CoreRuleData = SummaryData & { document: string; section?: string; ruleNumber?: string };
export type KeywordData = SummaryData & { parameterized?: true };
/** `amendsUnlisted` names targets the catalogue has no entry for yet, by the kind they will have. */
export type FaqData = SummaryData & { publication: string; amends: Ref[]; amendsUnlisted?: { kind: string; name: string }[] };
export type MissionAwardData = SummaryData & { pack: string; card: Card; vp: number; max?: number };
export type MissionCardData = SummaryData & { pack: string; card: Card };
export type PackRuleData = SummaryData & { pack: string };

type DataOf = {
  ability: AbilityData;
  "core-rule": CoreRuleData;
  "core-ability": KeywordData;
  "weapon-ability": KeywordData;
  faq: FaqData;
  "mission-award": MissionAwardData;
  "mission-card": MissionCardData;
  "mission-action": PackRuleData;
  "mission-twist": PackRuleData;
};
export type SummaryKind = keyof DataOf;
export type Summary<K extends SummaryKind = SummaryKind> = { kind: K; id: string; name: string; data: DataOf[K] };

/** One rules version's rule summaries. */
export type Summaries = {
  get<K extends SummaryKind>(kind: K, id: string): Summary<K> | undefined;
  /** FAQ records that amend `rule`, in ID order. */
  amendedBy(rule: Ref): Summary<"faq">[];
};
export type SummariesValidation = { ok: true; summaries: Summaries } | { ok: false; errors: string[] };

export const KINDS: SummaryKind[] = ["ability", "core-rule", "core-ability", "weapon-ability", "faq", "mission-award", "mission-card", "mission-action", "mission-twist"];

const ajv = new Ajv2020({ allErrors: true }).addSchema(schema).addSchema(factsSchema);
const checkData = new Map(KINDS.map((kind) => [kind, ajv.getSchema(`${schema.$id}#/$defs/${kind}`)!]));
const checkFacts = new Map(["plain", "stratagem", "enhancement-fields", "mission-award"].map((shape) => [shape, ajv.getSchema(`${factsSchema.$id}#/$defs/${shape}`)!]));
// Which `vs-data-facts` shape a record's fields take: its kind's, or for an ability its rule type's.
function factsShape(kind: SummaryKind, data: SummaryData): string {
  if (kind === "mission-award") return "mission-award";
  const ruleType = (data as AbilityData).ruleType;
  if (kind === "ability" && ruleType === "enhancement") return "enhancement-fields";
  if (kind === "ability" && STRATAGEMS.has(ruleType)) return "stratagem";
  return "plain";
}
const key = ({ kind, id }: Ref) => `${kind}:${id}`;
const STRATAGEMS = new Set<AbilityData["ruleType"]>(["stratagem", "core-stratagem"]);

/**
 * Validates rule summary records against the identity release of their rules version. Every rule a
 * summary links to or an FAQ amends must be current and listed in the record's identity references, so a
 * release reports it in `dependsOn` and `unresolvedReferences`.
 */
export function validateSummaries(identityValue: unknown, records: CatalogueRecord[]): SummariesValidation {
  const identityResult = validateRelease(identityValue);
  if (!identityResult.ok) return { ok: false, errors: identityResult.errors.map((e) => `identity ${e}`) };
  const identity: Release = identityResult.release;
  const entries = new Map(identity.entries.map((entry) => [key(entry), entry]));
  const errors: string[] = [];
  const byKey = new Map<string, Summary>();

  for (const record of records) {
    const at = key(record);
    if (record.rulesVersion.edition !== identity.rulesVersion.edition || record.rulesVersion.update !== identity.rulesVersion.update) {
      errors.push(`${at} belongs to a different rules version`);
      continue;
    }
    const check = checkData.get(record.kind as SummaryKind);
    if (!check) {
      errors.push(`${at} is not a rule summary kind`);
      continue;
    }
    if (!check(record.data)) {
      errors.push(...(check.errors ?? []).map((e) => `${at} data${e.instancePath} ${e.message}`));
      continue;
    }
    const entry = entries.get(at);
    if (!entry || entry.retired) {
      errors.push(`${at} is ${resolve(identity, record).status} in the identity release`);
      continue;
    }
    if (byKey.has(at)) errors.push(`${at} has more than one record`);
    const summary = { kind: record.kind as SummaryKind, id: record.id, name: entry.name, data: record.data as SummaryData };
    byKey.set(at, summary as Summary);

    if (summary.kind === "ability") {
      const { ruleType, cp, stratagem } = summary.data as AbilityData;
      if (STRATAGEMS.has(ruleType)) {
        if (cp === undefined) errors.push(`${at} is a Stratagem with no CP cost`);
      } else if (cp !== undefined || stratagem) errors.push(`${at} is not a Stratagem but has a CP cost or Stratagem timing`);
    }
    const { summary: text, summarySpans = [], facts } = summary.data;
    summarySpans.forEach(({ start, end }, i) => {
      if (end <= start || end > text.length) errors.push(`${at} span ${i} does not lie within the summary`);
      else if (i > 0 && start < summarySpans[i - 1].end) errors.push(`${at} span ${i} overlaps or precedes the span before it`);
    });
    // A summary may link its own rule's name, which needs no reference.
    const named = [...summarySpans.flatMap((s) => (s.target ? [s.target] : [])), ...((summary.data as FaqData).amends ?? [])].filter((ref) => key(ref) !== at);
    for (const ref of named) {
      const target = entries.get(key(ref));
      if (!target || target.retired) errors.push(`${at} names ${key(ref)}, which is not current in the identity release`);
      else if (!entry.references?.some((r) => key(r) === key(ref))) errors.push(`${at} names ${key(ref)} but its identity entry does not reference it`);
    }
    if (facts?.format === "vs-data-facts") {
      const check = checkFacts.get(factsShape(summary.kind, summary.data))!;
      if (facts.version !== "1") errors.push(`${at} facts use vs-data-facts version ${facts.version ?? "(none)"}, not 1`);
      else if (!check(facts.fields)) errors.push(...(check.errors ?? []).map((e) => `${at} facts${e.instancePath} ${e.message}`));
      else {
        const rounds = (facts.fields.award as { rounds?: number[] } | undefined)?.rounds ?? [];
        if (rounds.some((r, i) => i > 0 && r <= rounds[i - 1])) errors.push(`${at} facts/award/rounds are not in ascending order`);
      }
    }
    if (facts?.format === "vs-data-mechanic" && facts.version === "1") {
      const mechanic = validateMechanic({ ...facts.fields, formatVersion: 1, id: record.id, name: entry.name, rulesVersion: record.rulesVersion, source: record.source });
      if (!mechanic.ok) errors.push(...mechanic.errors.map((e) => `${at} facts${e}`));
    }
  }

  if (errors.length > 0) return { ok: false, errors };
  const faqs = [...byKey.values()].filter((s): s is Summary<"faq"> => s.kind === "faq").sort((a, b) => (a.id < b.id ? -1 : 1));
  return {
    ok: true,
    summaries: {
      get: <K extends SummaryKind>(kind: K, id: string) => byKey.get(key({ kind, id })) as Summary<K> | undefined,
      amendedBy: (rule) => faqs.filter((faq) => faq.data.amends.some((r) => key(r) === key(rule))),
    },
  };
}
