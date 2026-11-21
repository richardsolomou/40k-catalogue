// Mirrors schema/mechanic.v1.schema.json, which is the contract consumers rely on.

export type Unresolved = { unresolved: string };
export type OrUnresolved<T> = T | Unresolved;

export type Phase = "command" | "movement" | "shooting" | "charge" | "fight";
export type Turn = "own" | "opponent" | "any";
export type Move = "normal" | "advance" | "fall-back" | "charge" | "ingress";
export type UnitRef = "this-unit" | "triggering-unit" | "triggering-model" | "destroying-unit" | "target";
export type UnitFilter = { side: "friendly" | "enemy"; keywords?: string[]; excludedKeywords?: string[] };
export type Range = { inches: number | "engagement-range"; of: UnitRef };

export type Trigger =
  | { kind: "phase-start" | "phase-end"; phase: Phase; turn: Turn }
  | { kind: "move-end" | "move-selected"; moves: Move[]; unit: UnitFilter }
  | { kind: "ability-move"; ability: string; moves: Move[] }
  | { kind: "model-destroyed"; unit: UnitFilter; beforeRoll?: "deadly-demise" }
  | { kind: "unit-destroyed"; unit: UnitFilter; by: UnitFilter }
  // Applies for as long as its conditions hold, with no duration, cost, window or limit.
  | { kind: "always" }
  // The player chooses to use it during one of the record's usage windows.
  | { kind: "use" };

export type Target =
  | { unit: "this-unit" | "triggering-unit" }
  | { unit: "triggering-model"; allowDestroyed?: true }
  | { select: UnitFilter & { within?: Range } };

export type Usage = {
  cp?: number;
  windows?: { phase?: Phase; turn: Turn }[];
  oncePerTurn?: true;
  oncePerPhase?: true;
  bearerModel?: string;
};

export type Condition =
  | {
      kind: "status";
      unit: UnitRef;
      status: "battle-shocked" | "below-half-strength" | "unravelling";
      at: "now" | "phase-start" | "turn-start";
    }
  | { kind: "within"; unit: UnitRef; inches: number; of: UnitRef }
  // Passes while the unit has been selected for none of these activities this phase.
  | { kind: "not-selected"; unit: UnitRef; to: ("shoot" | "fight")[] }
  | { kind: "source-model-leading" };

export type Roll = "hit" | "wound" | "save" | "advance" | "charge" | "battle-shock";
// Absent means every weapon the target's models are equipped with.
export type WeaponType = "ranged" | "melee";
export type WeaponAbility =
  | {
      ability:
        | "assault"
        | "blast"
        | "devastating-wounds"
        | "hazardous"
        | "heavy"
        | "ignores-cover"
        | "indirect-fire"
        | "lance"
        | "lethal-hits"
        | "pistol"
        | "precision"
        | "psychic"
        | "torrent"
        | "twin-linked";
    }
  | { ability: "melta" | "rapid-fire" | "sustained-hits"; value: number }
  | { ability: "anti"; keyword: string; threshold: number };
export type CoreAbility =
  | { ability: "deep-strike" | "fights-first" | "infiltrators" | "lone-operative" | "stealth" }
  | { ability: "scouts"; inches: number }
  // Without `against`, Feel No Pain applies to every wound the model would lose.
  | { ability: "feel-no-pain"; threshold: number; against?: ("psychic-attacks" | "mortal-wounds")[] };

export type Effect =
  | { kind: "modify-roll"; roll: Roll; by: number }
  // `ones` re-rolls only results of 1. `weapons` limits a Hit or Wound roll to attacks made with that type of weapon.
  | { kind: "re-roll"; roll: Roll; results: "all" | "ones"; weapons?: WeaponType }
  | { kind: "grant-weapon-abilities"; abilities: WeaponAbility[]; weapons?: WeaponType }
  | { kind: "grant-abilities"; abilities: CoreAbility[] }
  | {
      kind: "modify-characteristic";
      characteristic: "move" | "toughness" | "save" | "leadership" | "objective-control" | "attacks";
      by: number;
    }
  | { kind: "mortal-wounds"; amount: string }
  | { kind: "roll-threshold"; roll: "deadly-demise"; succeedsOn: number }
  | { kind: "activate-ability"; ability: string }
  | { kind: "desperate-escape-tests"; unit: UnitRef; ifBattleShocked: OrUnresolved<{ by: number }> }
  | { kind: "enemy-distance"; inches: number; horizontal: boolean };

export type Duration = { until: "end-of-phase" | "end-of-turn" | "end-of-battle-round" };

// A second consequence checked once the triggering move ends, independently of the effect.
export type Restriction = { kind: "cannot-charge"; unit: UnitRef; ifWithinEnemy: number; until: Duration["until"] };

export type MechanicRecord = {
  formatVersion: 1;
  id: string;
  name: string;
  summary?: string;
  rulesVersion: { edition: string; update: string };
  source: { title: string; page?: string; url?: string };
  attribution?: { url: string; revision: string; credit: string; licence: string; changes: string };
  usage?: Usage;
  trigger: OrUnresolved<Trigger>;
  target: OrUnresolved<Target>;
  conditions: OrUnresolved<Condition>[];
  effect: OrUnresolved<Effect>;
  duration?: OrUnresolved<Duration>;
  restriction?: OrUnresolved<Restriction>;
};

export function isUnresolved(part: object): part is Unresolved {
  return "unresolved" in part;
}
