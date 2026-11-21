import {
  isUnresolved,
  type Condition,
  type CoreAbility,
  type Duration,
  type Effect,
  type MechanicRecord,
  type Move,
  type OrUnresolved,
  type Restriction,
  type Target,
  type Trigger,
  type UnitFilter,
  type UnitRef,
  type WeaponAbility,
} from "./record.ts";

const PHASES = { command: "Command", movement: "Movement", shooting: "Shooting", charge: "Charge", fight: "Fight" };
const TURNS = { own: "your", opponent: "your opponent's", any: "each" };
const MOVES = { normal: "Normal", advance: "Advance", "fall-back": "Fall Back", charge: "Charge", ingress: "Ingress" };
const STATUSES = { "battle-shocked": "Battle-shocked", "below-half-strength": "Below Half-strength", unravelling: "Unravelling" };
const MOMENTS = { "phase-start": "at the start of the phase", "turn-start": "at the start of the turn" };
const ROLLS = {
  hit: "Hit rolls",
  wound: "Wound rolls",
  save: "saving throws",
  advance: "Advance rolls",
  charge: "Charge rolls",
  "battle-shock": "Battle-shock tests",
};
// Bracketed as printed on a datasheet; anti adds its keyword and threshold.
const WEAPON_ABILITIES = {
  assault: "ASSAULT",
  blast: "BLAST",
  "devastating-wounds": "DEVASTATING WOUNDS",
  hazardous: "HAZARDOUS",
  heavy: "HEAVY",
  "ignores-cover": "IGNORES COVER",
  "indirect-fire": "INDIRECT FIRE",
  lance: "LANCE",
  "lethal-hits": "LETHAL HITS",
  pistol: "PISTOL",
  precision: "PRECISION",
  psychic: "PSYCHIC",
  torrent: "TORRENT",
  "twin-linked": "TWIN-LINKED",
  melta: "MELTA",
  "rapid-fire": "RAPID FIRE",
  "sustained-hits": "SUSTAINED HITS",
};
const CORE_ABILITIES = {
  "deep-strike": "Deep Strike",
  "fights-first": "Fights First",
  infiltrators: "Infiltrators",
  "lone-operative": "Lone Operative",
  stealth: "Stealth",
};
const AGAINST = { "psychic-attacks": "Psychic Attacks", "mortal-wounds": "mortal wounds" };
const THRESHOLD_ROLLS = { "deadly-demise": "Deadly Demise roll" };
const CHARACTERISTICS = {
  move: "Move",
  toughness: "Toughness",
  save: "Save",
  leadership: "Leadership",
  "objective-control": "Objective Control",
  attacks: "Attacks",
};
const DURATIONS = { "end-of-phase": "the end of the phase", "end-of-turn": "the end of the turn", "end-of-battle-round": "the end of the battle round" };

type Names = (ref: UnitRef) => string;
type UnitCondition = Extract<Condition, { unit: UnitRef }>;

// Conditions on a selected target restrict which unit can be selected, so they render inside the selection.
export function renderSummary(record: MechanicRecord): string {
  const unit: Names = (ref) => {
    if (ref === "this-unit") return "this unit";
    if (ref === "triggering-model") return "that model";
    if (ref === "destroying-unit") return "the unit that destroyed it";
    if (ref === "triggering-unit") return or(record.trigger, triggeringUnit);
    return or(record.target, (t) => ("unit" in t ? unit(t.unit) : "the selected unit"));
  };

  const { target } = record;
  const selection = !isUnresolved(target) && "select" in target ? target : undefined;
  const destroyedTarget = !isUnresolved(target) && "unit" in target && target.unit === "triggering-model" && target.allowDestroyed;
  const eligibility: UnitCondition[] = [];
  const checks: OrUnresolved<Condition>[] = [];
  for (const c of record.conditions) {
    if (selection && !isUnresolved(c) && mentionsTarget(c)) eligibility.push(c);
    else checks.push(c);
  }

  const kind = isUnresolved(record.trigger) ? undefined : record.trigger.kind;
  const lead = [
    record.usage?.bearerModel && `for ${article(`${record.usage.bearerModel} model`)}`,
    record.usage?.windows && `during ${list(record.usage.windows.map(({ phase, turn }) => {
      const time = phase ? `${PHASES[phase]} phase` : "turn";
      return turn === "any" ? `either player's ${time}` : `${TURNS[turn]} ${time}`;
    }), "or")}`,
    or(record.trigger, trigger),
  ].filter(Boolean);
  const clauses = lead.length > 0 ? [lead.join(", ")] : [];
  const gate = kind === "always" ? "while" : "if";
  if (checks.length > 0) {
    const predicates = checks.map((c) => or(c, (c) => c.kind === "source-model-leading"
      ? "this model is leading a unit"
      : `${unit(c.unit)} ${predicate(c, c.unit, unit)}`));
    clauses.push(`${gate} ${list(predicates, "and")}`);
  }

  let action = or(record.effect, (e) => effect(e, unit("target"), unit));
  if (selection) action = `${select(selection, eligibility, unit)}, then ${action}`;
  if (destroyedTarget) action = `you may target the destroyed model. ${capitalise(action)}`;
  if (record.duration) action += ` ${or(record.duration, duration)}`;
  if (kind === "use") action = `you can use this to ${action}`;
  clauses.push(action);
  if (record.restriction) clauses.push(`and ${or(record.restriction, (r) => restriction(r, unit))}`);

  const cost = record.usage?.cp === undefined ? "" : ` (${record.usage.cp} CP)`;
  const limit = record.usage?.oncePerTurn ? " Use once per turn." : record.usage?.oncePerPhase ? " Use once per phase." : "";
  return `${record.name}${cost}: ${capitalise(clauses.join(", "))}.${limit}`;
}

function or<T extends object>(part: OrUnresolved<T>, render: (part: T) => string): string {
  return isUnresolved(part) ? `[unresolved: ${part.unresolved}]` : render(part);
}

function trigger(t: Trigger): string {
  switch (t.kind) {
    case "move-end":
      return `when ${filter(t.unit)} ends ${article(moves(t.moves))} move`;
    case "move-selected":
      return `when ${filter(t.unit)} is selected to make ${article(moves(t.moves))} move`;
    case "ability-move":
      return `when this unit makes ${article(moves(t.moves))} move using ${t.ability}`;
    case "model-destroyed":
      return `when ${article(`${filterWords(t.unit)} model`)} is destroyed${t.beforeRoll ? `, before its ${THRESHOLD_ROLLS[t.beforeRoll]}` : ""}`;
    case "unit-destroyed":
      return `when ${filter(t.unit)} is destroyed by ${filter(t.by)}`;
    // Neither has a moment of its own: an always-on effect has no lead, and a use is timed by its usage windows.
    case "always":
    case "use":
      return "";
    default:
      return `at the ${t.kind === "phase-start" ? "start" : "end"} of ${TURNS[t.turn]} ${PHASES[t.phase]} phase`;
  }
}

function triggeringUnit(t: Trigger): string {
  if (t.kind === "unit-destroyed") return "the destroyed unit";
  if (t.kind === "move-selected") return `that ${t.unit.side} unit`;
  return "that unit";
}

function moves(kinds: Move[]): string {
  return list(kinds.map((m) => MOVES[m]), "or");
}

function mentionsTarget(c: Condition): c is UnitCondition {
  return "unit" in c && (c.unit === "target" || (c.kind === "within" && c.of === "target"));
}

// Describes the condition with `subject` as its grammatical subject; distance is symmetric, so either end can be the subject.
function predicate(c: UnitCondition, subject: UnitRef, unit: Names): string {
  if (c.kind === "within") return `is within ${c.inches}" of ${unit(subject === c.unit ? c.of : c.unit)}`;
  if (c.kind === "not-selected") return `has not been selected to ${list(c.to, "or")} this phase`;
  if (c.at === "now") return `is ${STATUSES[c.status]}`;
  return `was ${STATUSES[c.status]} ${MOMENTS[c.at]}`;
}

function select(t: Extract<Target, { select: unknown }>, eligibility: UnitCondition[], unit: Names): string {
  const { within } = t.select;
  const chosen = `select one ${filterWords(t.select)} unit`;
  const range = within && `within ${within.inches === "engagement-range" ? "Engagement Range" : `${within.inches}"`} of ${unit(within.of)}`;
  if (eligibility.length === 0) return range ? `${chosen} ${range}` : chosen;
  const rules = eligibility.map((c) => predicate(c, "target", unit));
  if (range) rules.push(`is ${range}`);
  return `${chosen} that ${list(rules, "and")}`;
}

function effect(e: Effect, target: string, unit: Names): string {
  switch (e.kind) {
    case "mortal-wounds":
      return `inflict ${e.amount} mortal wound${e.amount === "1" ? "" : "s"} on ${target}`;
    case "roll-threshold":
      return `${target}'s ${THRESHOLD_ROLLS[e.roll]} succeeds on a ${e.succeedsOn}+`;
    case "activate-ability":
      return `activate the ${e.ability} of ${target}`;
    case "desperate-escape-tests": {
      const tested = unit(e.unit);
      const penalty = or(e.ifBattleShocked, (p) => `${change(p.by)} each test`);
      return `when ${tested} makes its Fall Back move, take one Desperate Escape test for each model in it, and if it is Battle-shocked, ${penalty}`;
    }
    case "enemy-distance":
      return `${target} can end that move more than ${e.inches}" from every enemy unit${e.horizontal ? ", measured horizontally" : ""}`;
    case "modify-roll":
      return `${change(e.by)} ${ROLLS[e.roll]} for ${target}`;
    case "modify-characteristic":
      return `${change(e.by)} the ${CHARACTERISTICS[e.characteristic]} characteristic of ${target}`;
    case "re-roll": {
      const rolls = `${ROLLS[e.roll]}${e.results === "ones" ? " of 1" : ""}`;
      return `re-roll ${rolls} for ${e.weapons ? `${e.weapons} attacks made by ${target}` : target}`;
    }
    case "grant-weapon-abilities":
      return `grant ${list(e.abilities.map(weaponAbility), "and")} to ${e.weapons ? `${e.weapons} weapons` : "weapons"} equipped by models in ${target}`;
    case "grant-abilities":
      return `grant ${list(e.abilities.map(coreAbility), "and")} to ${target}`;
  }
}

function coreAbility(a: CoreAbility): string {
  if (a.ability === "scouts") return `Scouts ${a.inches}"`;
  if (a.ability === "feel-no-pain") return `Feel No Pain ${a.threshold}+${a.against ? ` against ${list(a.against.map((k) => AGAINST[k]), "and")}` : ""}`;
  return CORE_ABILITIES[a.ability];
}

function weaponAbility(a: WeaponAbility): string {
  if (a.ability === "anti") return `[ANTI-${a.keyword.toUpperCase()} ${a.threshold}+]`;
  return `[${WEAPON_ABILITIES[a.ability]}${"value" in a ? ` ${a.value}` : ""}]`;
}

function restriction(r: Restriction, unit: Names): string {
  return `if ${unit(r.unit)} is within ${r.ifWithinEnemy}" of an enemy unit at the end of that move, it cannot declare a charge ${duration({ until: r.until })}`;
}

function change(by: number): string {
  return by > 0 ? `add ${by} to` : `subtract ${-by} from`;
}

function duration(d: Duration): string {
  return `until ${DURATIONS[d.until]}`;
}

function filter(f: UnitFilter): string {
  return article(`${filterWords(f)} unit`);
}

function filterWords(f: UnitFilter): string {
  return [f.side, ...(f.keywords ?? []), ...(f.excludedKeywords ?? []).map((k) => `non-${k}`)].join(" ");
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
