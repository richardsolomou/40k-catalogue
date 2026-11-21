import {
  isUnresolved,
  type Condition,
  type Duration,
  type Effect,
  type MechanicRecord,
  type OrUnresolved,
  type Target,
  type Trigger,
  type UnitFilter,
  type UnitRef,
} from "./record.ts";

const PHASES = { command: "Command", movement: "Movement", shooting: "Shooting", charge: "Charge", fight: "Fight" };
const TURNS = { own: "your", opponent: "your opponent's", any: "each" };
const MOVES = { normal: "Normal", advance: "Advance", "fall-back": "Fall Back", charge: "Charge" };
const STATUSES = { "battle-shocked": "Battle-shocked", "below-half-strength": "Below Half-strength" };
const MOMENTS = { "phase-start": "at the start of the phase", "turn-start": "at the start of the turn" };
const ROLLS = {
  hit: "Hit rolls",
  wound: "Wound rolls",
  save: "saving throws",
  advance: "Advance rolls",
  charge: "Charge rolls",
  "battle-shock": "Battle-shock tests",
};
const CHARACTERISTICS = {
  move: "Move",
  toughness: "Toughness",
  save: "Save",
  leadership: "Leadership",
  "objective-control": "Objective Control",
  attacks: "Attacks",
};
const DURATIONS = { "end-of-phase": "the end of the phase", "end-of-turn": "the end of the turn", "end-of-battle-round": "the end of the battle round" };

// One sentence per record: "<name>: <trigger>, [if <conditions>, ][select <unit>, then ]<effect>[ <duration>]."
// Conditions on a selected target restrict which unit can be selected, so they render inside the selection.
export function renderSummary(record: MechanicRecord): string {
  const unit = (ref: UnitRef): string => {
    if (ref === "this-unit") return "this unit";
    if (ref === "triggering-unit") return "that unit";
    return or(record.target, (t) => ("unit" in t ? unit(t.unit) : "the selected unit"));
  };

  const { target } = record;
  const selection = !isUnresolved(target) && "select" in target ? target : undefined;
  const eligibility: Condition[] = [];
  const checks: OrUnresolved<Condition>[] = [];
  for (const c of record.conditions) {
    if (selection && !isUnresolved(c) && mentionsTarget(c)) eligibility.push(c);
    else checks.push(c);
  }

  const clauses = [capitalise(or(record.trigger, trigger))];
  if (checks.length > 0) clauses.push(`if ${list(checks.map((c) => or(c, (c) => `${unit(c.unit)} ${predicate(c, c.unit, unit)}`)), "and")}`);

  let action = or(record.effect, (e) => effect(e, unit("target")));
  if (selection) action = `${select(selection, eligibility, unit)}, then ${action}`;
  if (record.duration) action += ` ${or(record.duration, duration)}`;
  clauses.push(action);

  return `${record.name}: ${clauses.join(", ")}.`;
}

function or<T extends object>(part: OrUnresolved<T>, render: (part: T) => string): string {
  return isUnresolved(part) ? `[unresolved: ${part.unresolved}]` : render(part);
}

function trigger(t: Trigger): string {
  if (t.kind === "move-end") return `when ${filter(t.unit)} ends ${article(list(t.moves.map((m) => MOVES[m]), "or"))} move`;
  return `at the ${t.kind === "phase-start" ? "start" : "end"} of ${TURNS[t.turn]} ${PHASES[t.phase]} phase`;
}

function mentionsTarget(c: Condition): boolean {
  return c.unit === "target" || (c.kind === "within" && c.of === "target");
}

// Describes the condition with `subject` as its grammatical subject; distance is symmetric, so either end can be the subject.
function predicate(c: Condition, subject: UnitRef, unit: (ref: UnitRef) => string): string {
  if (c.kind === "within") return `is within ${c.inches}" of ${unit(subject === c.unit ? c.of : c.unit)}`;
  if (c.at === "now") return `is ${STATUSES[c.status]}`;
  return `was ${STATUSES[c.status]} ${MOMENTS[c.at]}`;
}

function select(t: Extract<Target, { select: unknown }>, eligibility: Condition[], unit: (ref: UnitRef) => string): string {
  const { within } = t.select;
  const chosen = `select one ${filterWords(t.select)} unit`;
  if (eligibility.length === 0) return within ? `${chosen} within ${within.inches}" of ${unit(within.of)}` : chosen;
  const rules = eligibility.map((c) => predicate(c, "target", unit));
  if (within) rules.push(`is within ${within.inches}" of ${unit(within.of)}`);
  return `${chosen} that ${list(rules, "and")}`;
}

function effect(e: Effect, target: string): string {
  if (e.kind === "mortal-wounds") return `inflict ${e.amount} mortal wound${e.amount === "1" ? "" : "s"} on ${target}`;
  const change = e.by > 0 ? `add ${e.by} to` : `subtract ${-e.by} from`;
  if (e.kind === "modify-roll") return `${change} ${ROLLS[e.roll]} for ${target}`;
  return `${change} the ${CHARACTERISTICS[e.characteristic]} characteristic of ${target}`;
}

function duration(d: Duration): string {
  return `until ${DURATIONS[d.until]}`;
}

function filter(f: UnitFilter): string {
  return article(`${filterWords(f)} unit`);
}

function filterWords(f: UnitFilter): string {
  return [f.side, ...(f.keywords ?? [])].join(" ");
}

function article(phrase: string): string {
  return `${/^[aeiou]/i.test(phrase) ? "an" : "a"} ${phrase}`;
}

function list(items: string[], conjunction: "and" | "or"): string {
  return items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} ${conjunction} ${items.at(-1)}`;
}

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
