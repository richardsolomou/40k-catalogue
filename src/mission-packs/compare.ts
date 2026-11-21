import type { MissionPack, Mode, Primary, Secondary } from "./pack.ts";
import { awardVp, battlefieldsFor, type Moment, scoreCard, setupFor } from "./play.ts";

/**
 * What another implementation does with one pack, as cases this format can be run against. Every ID is the pack's own;
 * a consumer that stores other IDs translates them before writing the cases.
 */
export type ReferenceCases = {
  pack: string;
  setups: { friendly: string; opposition: string; primary: string | null; deployments: string[] }[];
  /** The deployment and layout pairs a table may play for two dispositions, whichever side holds which. */
  battlefields: { sides: [string, string]; options: { deployment: string; layout: string }[] }[];
  /** Whether an award can be claimed at a point in the battle the reference sees as one moment, which may be several of ours. */
  windows: { card: string; award: string; mode?: Mode; moments: Moment[]; due: boolean }[];
  amounts: { card: string; award: string; times: number; vp: number }[];
  /** Awards the reference lets a player claim only one of at a time, per card. */
  exclusive: { card: string; groups: string[][] }[];
  caps: { primary: CapCase; secondary: CapCase; fixedSecondaryPerCard: CapCase };
};
type CapCase = { perRound: number | null; perBattle: number | null };

export type Section = { checked: number; agreed: number; differences: string[] };
export type Comparison = Record<"setups" | "battlefields" | "windows" | "amounts" | "exclusive" | "caps", Section>;

function same(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  const expected = [...b].sort();
  return [...a].sort().every((value, i) => value === expected[i]);
}

function section<T>(cases: T[], differs: (c: T) => string | null): Section {
  const differences = cases.flatMap((c) => differs(c) ?? []);
  return { checked: cases.length, agreed: cases.length - differences.length, differences };
}

const describe = (m: Moment) =>
  m.at === "battle-end" ? `battle-end r${m.round} last ${m.lastTurn}` : `${m.at}${m.at === "phase-end" ? ` ${m.phase}` : ""} r${m.round} ${m.turn}`;

/** Runs the cases against the pack. Differences name IDs and moments only, so a report never repeats a value it compared. */
export function compare(pack: MissionPack, cases: ReferenceCases): Comparison {
  if (cases.pack !== pack.id) throw new Error(`Reference cases name pack ${cases.pack}, expected ${pack.id}`);
  const cards = new Map<string, Primary | Secondary>([...pack.primaries, ...pack.secondaries].map((c) => [c.id, c]));
  const award = (card: string, id: string) => cards.get(card)?.awards.find((a) => a.id === id);

  return {
    setups: section(cases.setups, (c) => {
      const setup = setupFor(pack, c.friendly, c.opposition);
      const where = `${c.friendly} against ${c.opposition}`;
      if ((setup?.primary.id ?? null) !== c.primary) return `${where}: primary`;
      if (setup && !same(setup.deployments, c.deployments)) return `${where}: deployments`;
      return null;
    }),
    battlefields: section(cases.battlefields, (c) => {
      const key = (o: { deployment: string; layout: string }) => `${o.deployment}/${o.layout}`;
      const ours = battlefieldsFor(pack, ...c.sides).map(key);
      return same(ours, c.options.map(key)) ? null : `${c.sides.join(" and ")}: ${ours.length} options against ${c.options.length}`;
    }),
    windows: section(cases.windows, (c) => {
      const card = cards.get(c.card);
      if (!card || !award(c.card, c.award)) return `${c.card}/${c.award}: missing`;
      const due = c.moments.some((m) => scoreCard(pack, card, [{ award: c.award, times: 1 }], m, { round: 0, battle: 0, card: 0 }, c.mode).errors.length === 0);
      return due === c.due ? null : `${c.card}/${c.award}${c.mode ? ` ${c.mode}` : ""} at ${c.moments.map(describe).join(" + ")}: ${due ? "open" : "closed"}, expected ${c.due ? "open" : "closed"}`;
    }),
    amounts: section(cases.amounts, (c) => {
      const a = award(c.card, c.award);
      if (!a) return `${c.card}/${c.award}: missing`;
      return awardVp(a, c.times) === c.vp ? null : `${c.card}/${c.award} x${c.times}`;
    }),
    exclusive: section(cases.exclusive, (c) => {
      const card = cards.get(c.card);
      if (!card) return `${c.card}: missing`;
      const groups = new Map<string, string[]>();
      for (const a of card.awards) if (a.exclusive) groups.set(a.exclusive, [...(groups.get(a.exclusive) ?? []), a.id]);
      const key = (gs: string[][]) => gs.map((g) => [...g].sort().join("+")).sort();
      return same(key([...groups.values()]), key(c.groups)) ? null : `${c.card}: exclusive groups`;
    }),
    caps: section(Object.entries(cases.caps) as [keyof MissionPack["caps"], CapCase][], ([name, expected]) => {
      const cap = pack.caps[name];
      const ours = "unresolved" in cap ? { perRound: null, perBattle: null } : { perRound: cap.perRound ?? null, perBattle: cap.perBattle ?? null };
      return ours.perRound === expected.perRound && ours.perBattle === expected.perBattle ? null : `${name}`;
    }),
  };
}
