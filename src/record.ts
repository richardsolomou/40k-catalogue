// Mirrors schema/mechanic.v1.schema.json, which is the contract consumers rely on.

export type Unresolved = { unresolved: string };
export type OrUnresolved<T> = T | Unresolved;

export type Phase = "command" | "movement" | "shooting" | "charge" | "fight";
export type UnitRef = "this-unit" | "triggering-unit" | "target";
export type UnitFilter = { side: "friendly" | "enemy"; keywords?: string[] };
export type Range = { inches: number; of: UnitRef };

export type Trigger =
  | { kind: "phase-start" | "phase-end"; phase: Phase; turn: "own" | "opponent" | "any" }
  | { kind: "move-end"; moves: ("normal" | "advance" | "fall-back" | "charge")[]; unit: UnitFilter };

export type Target = { unit: "this-unit" | "triggering-unit" } | { select: UnitFilter & { within?: Range } };

export type Condition =
  | { kind: "status"; unit: UnitRef; status: "battle-shocked" | "below-half-strength"; at: "now" | "phase-start" | "turn-start" }
  | { kind: "within"; unit: UnitRef; inches: number; of: UnitRef };

export type Effect =
  | { kind: "modify-roll"; roll: "hit" | "wound" | "save" | "advance" | "charge" | "battle-shock"; by: number }
  | {
      kind: "modify-characteristic";
      characteristic: "move" | "toughness" | "save" | "leadership" | "objective-control" | "attacks";
      by: number;
    }
  | { kind: "mortal-wounds"; amount: string };

export type Duration = { until: "end-of-phase" | "end-of-turn" | "end-of-battle-round" };

export type MechanicRecord = {
  formatVersion: 1;
  id: string;
  name: string;
  rulesVersion: { edition: string; update: string };
  source: { title: string; page?: string; url?: string };
  trigger: OrUnresolved<Trigger>;
  target: OrUnresolved<Target>;
  conditions: OrUnresolved<Condition>[];
  effect: OrUnresolved<Effect>;
  duration?: OrUnresolved<Duration>;
};

export function isUnresolved(part: object): part is Unresolved {
  return "unresolved" in part;
}
