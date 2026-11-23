// Mirrors src/mission-packs/mission-pack.v1.schema.json, which is the contract consumers rely on.

import type { OrUnresolved } from "../record.ts";

export type Phase = "command" | "movement" | "shooting" | "charge" | "fight";
export type Turn = "own" | "opponent" | "any";
export type Mode = "fixed" | "tactical";
export type Source = { title: string; page?: string; url?: string };

/** One moment an award can be claimed. `orBattleEnd` also allows it at the end of the battle when no such moment is left. */
export type ScoringWindow =
  | { at: "phase-end"; phase: Phase; turn: Turn; rounds?: RoundRange; orBattleEnd?: true }
  | { at: "turn-end"; turn: Turn; rounds?: RoundRange; orBattleEnd?: true }
  | { at: "battle-end" };
export type RoundRange = { from?: number; to?: number };

/** Awards on one card add up, except that only one award in an `exclusive` group can be claimed at a moment. */
export type Award = {
  id: string;
  vp: number;
  count: "once" | "each";
  max?: number;
  modes?: Mode[];
  exclusive?: string;
  criterion: OrUnresolved<{ summary: string }>;
  windows: OrUnresolved<ScoringWindow>[];
};

export type Pairing = { friendly: string; opposition: string; deployments: string[]; layouts: string[] };
/** `aliases` are other IDs of the same member, such as the IDs another data source uses for it. */
type Aliased = { aliases?: string[] };
export type Primary = Aliased & { id: string; name: string; source: Source; pairings: Pairing[]; detachment?: string; awards: Award[] };
export type WhenDrawn = { action: "redraw"; required: boolean; untilRound?: number; ifActive?: string };
export type Secondary = Aliased & { id: string; name: string; source: Source; modes: Mode[]; awards: Award[]; whenDrawn?: OrUnresolved<WhenDrawn> };
export type Twist = Aliased & { id: string; name: string; source: Source; changesPrimary: boolean; effect: OrUnresolved<{ summary: string }> };
/** `perRoundExcludesBattleEnd`: what is scored at the battle end counts against `perBattle` but not `perRound`. */
export type Cap = OrUnresolved<{ perRound?: number; perBattle?: number; perRoundExcludesBattleEnd?: true }>;

export type MissionPack = {
  formatVersion: 1;
  kind: "mission-pack";
  id: string;
  name: string;
  rulesVersion: { edition: string; update: string };
  source: Source;
  battleRounds: OrUnresolved<{ count: number }>;
  battleReady: OrUnresolved<{ vp: number }>;
  caps: { primary: Cap; secondary: Cap; fixedSecondaryPerCard: Cap };
  dispositions: (Aliased & { id: string; name: string })[];
  /** Stable references only; zones, objective markers, and terrain geometry are published separately under the same IDs. */
  deployments: (Aliased & { id: string; name: string })[];
  layouts: (Aliased & { id: string; name: string; deployments: string[] })[];
  primaries: Primary[];
  secondaries: Secondary[];
  twists: Twist[];
};
