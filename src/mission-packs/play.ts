import { isUnresolved } from "../record.ts";
import type { Award, Cap, MissionPack, Mode, Phase, Primary, Secondary, ScoringWindow } from "./pack.ts";

/** A scoring moment seen from one player: `turn` is whose turn it is, `lastTurn` whose turn ended the battle. */
export type Moment =
  | { at: "phase-end"; round: number; phase: Phase; turn: "own" | "opponent" }
  | { at: "turn-end"; round: number; turn: "own" | "opponent" }
  | { at: "battle-end"; round: number; lastTurn: "own" | "opponent" };

/** The primary mission and battlefields a pack offers for two force dispositions, or null if it pairs them with none. */
export function setupFor(pack: MissionPack, friendly: string, opposition: string) {
  for (const primary of pack.primaries) {
    const pairing = primary.pairings.find((p) => p.friendly === friendly && p.opposition === opposition);
    if (pairing) return { primary, deployments: pairing.deployments, layouts: pairing.layouts };
  }
  return null;
}

export function windowOpen(window: ScoringWindow, moment: Moment): boolean {
  if (window.at === "battle-end") return moment.at === "battle-end";
  const { from = 1, to = Infinity } = window.rounds ?? {};
  if (moment.round < from || moment.round > to) return false;
  // The opponent's turn that would close the window never comes when this player's turn ended the battle.
  if (moment.at === "battle-end") return window.orBattleEnd === true && window.turn === "opponent" && moment.lastTurn === "own";
  if (window.at !== moment.at || (window.turn !== "any" && window.turn !== moment.turn)) return false;
  return window.at !== "phase-end" || (moment.at === "phase-end" && window.phase === moment.phase);
}

export function awardVp(award: Award, times: number): number {
  const raw = award.count === "each" ? award.vp * times : times > 0 ? award.vp : 0;
  return award.max === undefined ? raw : Math.min(raw, award.max);
}

export type Banked = { round: number; battle: number; card: number };
export type Claim = { award: string; times: number };
export type Score = { vp: number; capped: boolean; errors: string[]; unenforced: string[] };

/**
 * What one card scores for a set of claims at one moment, after the pack's caps on what the player has already banked
 * this round, this battle, and on this card. A cap the pack leaves unresolved is listed as unenforced, never assumed.
 */
export function scoreCard(
  pack: MissionPack,
  card: Primary | Secondary,
  claims: Claim[],
  moment: Moment,
  banked: Banked,
  mode?: Mode,
): Score {
  const errors: string[] = [];
  const unenforced: string[] = [];
  const groups = new Set<string>();
  let vp = 0;
  for (const claim of claims) {
    const award = card.awards.find((a) => a.id === claim.award);
    if (!award) {
      errors.push(`${card.id} has no award "${claim.award}"`);
      continue;
    }
    if (!Number.isInteger(claim.times) || claim.times < 0 || (award.count === "once" && claim.times > 1)) {
      errors.push(`${award.id} cannot be claimed ${claim.times} times`);
      continue;
    }
    if (claim.times === 0) continue;
    if (award.modes && (!mode || !award.modes.includes(mode))) {
      errors.push(`${award.id} does not apply when the card is played as ${mode ?? "no mode"}`);
      continue;
    }
    const windows = award.windows.filter((w): w is ScoringWindow => !isUnresolved(w));
    if (windows.length < award.windows.length) unenforced.push(`${award.id} has an unresolved scoring window`);
    if (!windows.some((w) => windowOpen(w, moment))) {
      errors.push(`${award.id} cannot be scored at this moment`);
      continue;
    }
    if (award.exclusive) {
      if (groups.has(award.exclusive)) {
        errors.push(`${award.id} shares exclusive group "${award.exclusive}" with another claim`);
        continue;
      }
      groups.add(award.exclusive);
    }
    vp += awardVp(award, claim.times);
  }

  const category = pack.primaries.includes(card as Primary) ? "primary" : "secondary";
  const limits: [string, Cap, "perRound" | "perBattle", number][] = [
    [category, pack.caps[category], "perRound", banked.round],
    [category, pack.caps[category], "perBattle", banked.battle],
  ];
  if (mode === "fixed") limits.push(["fixedSecondaryPerCard", pack.caps.fixedSecondaryPerCard, "perBattle", banked.card]);
  let allowed = vp;
  for (const [name, cap, span, already] of limits) {
    if (isUnresolved(cap)) {
      if (!unenforced.includes(`${name} cap`)) unenforced.push(`${name} cap`);
      continue;
    }
    const limit = cap[span];
    if (limit !== undefined) allowed = Math.min(allowed, Math.max(0, limit - already));
  }
  return { vp: allowed, capped: allowed < vp, errors, unenforced };
}
