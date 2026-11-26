import { plain } from "./markdown.ts";
import type { AbilityData, StratagemParts } from "./summaries.ts";

/** The house style (docs/summary-style.md) covers these kinds of rule summary. */
const KINDS = new Set(["ability", "weapon-ability"]);
const STRATAGEMS = new Set(["stratagem", "core-stratagem"]);

// Phrasings the phrasebook replaces, checked outside names.
const REPLACED: [string, RegExp][] = [
  ["each-time", /\b(?:each|every) time\b/i],
  ["just-after", /\b(?:just|right|immediately) after\b/i],
  ["as-long-as", /\bas long as\b/i],
  ["may", /\bmay\b/i],
  ["allowed-to", /\bis allowed to\b/i],
  ["choose", /\b(?:choose|chooses|choosing|chose|chosen|nominates?|nominated)\b/i],
  // Being selected to shoot or fight and selecting targets are core terms.
  ["select", /\bselect(?:s|ed|ing)?\b(?! (?:to (?:shoot|fight)|(?:its |their )?targets?)\b)/i],
  ["friendly", /\bfriendly\b/i],
  ["suffers", /\bsuffer(?:s|ed|ing)?\b/i],
  ["gains", /\bgains?\b(?!\s+(?:\d|D\d|CP\b|VP\b))|\bis granted\b/i],
  ["has-the-ability", /\bha(?:s|ve) the\s+(?:\S+\s+){0,4}abilit(?:y|ies)\b/i],
  ["no-more-than", /\bno (?:more|farther|further) than \d+["″]|\d+["″] or closer\b|\bup to \d+["″] away\b/i],
  ["engaged-with", /\bengaged with\b|\bin combat with\b/i],
  ["leader-opening", /\bwhen this model leads\b|\bwhile leading a unit\b/i],
  ["while-down-to", /\bwhile down to\b/i],
  ["roll-modifier", /\broll modifier\b/i],
  ["is-the-target", /\bwhen (?:this|that|the) unit is the target\b/i],
  ["until-phase-end", /\buntil (?:the )?phase end\b/i],
  ["until-the-end-of", /\buntil the end of the (?:phase|turn|battle)\b/i],
  ["limit-in-brackets", /\(once per (?:battle|turn|phase|battle round)\b/i],
  ["inches-word", /\d+ inch(?:es)?\b/i],
  ["is-dealt", /\bis dealt\b/i],
  ["is-added-to", /\bis added to\b/i],
  ["falls-by", /\bfalls by\b/i],
  // A multiple of a value; "twice" as a count of times something happens stays.
  ["multiple-word", /\b(?:double|triple|quadruple|thrice)\b|\btwice (?:the|its|their|that|as)\b/i],
  ["next-command-phase-starts", /\buntil your (?:opponent's )?next Command phase (?:starts|begins)\b/i],
  ["phase-opens", /\bphase opens\b|\bphase is over\b|\bturn finishes\b/i],
  ["inch-sign", /″/],
  ["dash-range", /\d–\d/],
];
// A duration opening a sentence, list item, named part or Stratagem part, or straight after its usage limit, where it
// belongs after the effect.
const DURATION_FIRST =
  /(?:^|[.!?:]\s+|\n(?:- |\d+\. )?)(?:Once per (?:battle|turn|phase), )?(?:For the rest of the (?:phase|turn|battle)|Until (?:your|the end of|the start of))\b/i;
const WHEN = /^(?:(?:Your|Opponent's|Either player's) (?:(?:Command|Movement|Shooting|Charge|Fight) phase|turn)|Any phase)\b/;
// A count word opening a Target part repeats the official text's own opening; "A" and digits do not.
const TARGET_COUNT = /^(?:Up to )?(?:one|two|three|four|five|six|seven|eight|nine|ten)\b/i;
const DAMAGED = /^With \d+-\d+ wounds left, /;
const DAMAGED_ID = /^damaged\b/;

// A summary's text without its names: bold spans and link text are game terms or names.
const unnamed = (summary: string) => summary.replace(/\[[^\]]*\]\([^)]*\)/g, " ").replace(/\*\*[^*]*\*\*/g, " ");

export type StyleRecord = { kind: string; id: string; data: unknown };

/** The house-style rules a summary breaks, by name; none where it is in style or the style does not cover it. */
export function styleIssues(record: StyleRecord): string[] {
  if (!KINDS.has(record.kind)) return [];
  const data = record.data as AbilityData & { parts?: StratagemParts };
  if (typeof data.summary !== "string") return [];
  const issues: string[] = [];
  const apostrophes = (s: string) => s.replace(/’/g, "'");
  let text: string, when: string | undefined, target: string | undefined;
  try {
    text = apostrophes(plain(data.summary));
    when = data.parts && apostrophes(plain(data.parts.when));
    target = data.parts && plain(data.parts.target) && unnamed(data.parts.target).trim();
  } catch {
    return ["invalid-summary"];
  }
  if (STRATAGEMS.has(data.ruleType)) {
    if (when === undefined) issues.push("stratagem-parts");
    else if (!WHEN.test(when)) issues.push("stratagem-when");
    if (target !== undefined && TARGET_COUNT.test(target)) issues.push("stratagem-target");
  }
  if (data.ruleType === "enhancement" && !text.startsWith("Bearer: ")) issues.push("enhancement-bearer");
  if (data.ruleType === "unit-ability" && DAMAGED_ID.test(record.id.split(".").at(-1)!) && !DAMAGED.test(text)) issues.push("damaged-opening");
  if (DURATION_FIRST.test(text)) issues.push("duration-first");
  const prose = unnamed(apostrophes(data.summary));
  for (const [name, pattern] of REPLACED) if (pattern.test(prose)) issues.push(`phrasing/${name}`);
  return issues;
}

export type StyleReport = { checked: number; issues: Record<string, string[]> };

/** The records the style covers, and for each rule the `kind:id` of every record that breaks it. */
export function styleReport(records: StyleRecord[]): StyleReport {
  const report: StyleReport = { checked: 0, issues: {} };
  for (const record of records) {
    if (!KINDS.has(record.kind)) continue;
    report.checked++;
    for (const issue of styleIssues(record)) (report.issues[issue] ??= []).push(`${record.kind}:${record.id}`);
  }
  return report;
}
