# Mission packs

A mission-pack record describes what a player decides and scores in one pack: force dispositions, which primary mission and battlefields a pairing gets, the secondary cards and how they may be played, scoring windows and amounts, caps, and twists. The contract is the JSON Schema in [src/mission-packs/mission-pack.v1.schema.json](../src/mission-packs/mission-pack.v1.schema.json), with types in [pack.ts](../src/mission-packs/pack.ts), reference checks in [validate.ts](../src/mission-packs/validate.ts), and a reference setup and scoring implementation in [play.ts](../src/mission-packs/play.ts). This covers [#8](https://github.com/richardsolomou/40k-catalogue/issues/8).

## What Praetorium reads today

Audited at the [inventory baseline](source-inventory.md) `a9b4a5b`, which was Praetorium `main` on 21 November 2026. The pinned Game Datacards pack files are read by [`missionPacks.ts`][p-packs], [`datacardMissions.ts`][p-missions], [`missionTwists.ts`][p-twists], [`missionSelections.ts`][p-selections], and [`datacardTerrain.ts`][p-terrain]. Field names below are the source's; no values are reproduced.

| Area | Source fields read | What Praetorium builds or stores |
| --- | --- | --- |
| Pack | `name` (slugged into the stored `missionPackId`), `isCombatPatrol` (Combat Patrol packs are skipped) | `settings.missionPackId` in each battle's `configure-battle` command |
| Caps | `primaryMissionScoreBattleRoundLimit`, `primaryMissionScoreGameLimit`, the two secondary equivalents, `fixedSecondaryMissionCapLimit` | `Mission.roundCap`, `gameCap`, `secondaryRoundCap`, `secondaryGameCap`, `fixedSecondaryCap` |
| Dispositions | `forceDispositions[].name`, `description` | Slug IDs stored on rosters and sealed-event teams, `/force-dispositions/$id` URLs |
| Matchups | `primaryMissions[].forceDispositions[]`: `friendly`, `opposition`, `recommendedPresets`, then `presets[].deployment` by name | One primary per `pack\|friendly\|opposition` key and its permitted `deploymentIds` |
| Mission cards | `primaryMissions[]` and `secondaryMissions[]`: `id`, `name`, `description`; `objectives[]`: `whenText`, `scorablePeriods`, `id`; `scoring[]`: `victoryPoints`, `victoryPointsCap`, `scoringType`, `inputType`, `isMutuallyExclusive`, `isCumulative`, `scoringCriteria` | `MissionCard` with `awards` (vp, per-each, max, mode, exclusive group, trigger windows), stored as `key` and `cardKey` in battle commands |
| Card behaviour | `actions[]` (`name`, `startsText`, `completesText`, `effectText`, `unitsText`, `useLimitText`, `restrictionText`); the "when drawn" wording, matched by pattern; card IDs pinned to selection kinds by wording digest | `actions`, `whenDrawn` (redraw or replace), `selection` (marker and guard choices) |
| Twists | `missionTwists[]`: `id`, `name`, `lore`, `rules`; whether `rules` mentions the primary mission | `MissionTwist`, stored as `settings.twistId` |
| Deployments | `deployments[]`: `id`, `name` | `Deployment`, stored as `patternId`; zones and objective points come from Battlemaster by name |
| Layouts | `layouts[]`: `id`, `name` (parsed as two matchup names and a variant letter), `deployments` | `TerrainLayout`, stored as `terrainLayoutId` and in sealed-event table battlefields; geometry joined from Battlemaster |

Trigger windows come from matching `whenText` against six known phrasings. Wording outside them gives no window, so the card cannot be scored automatically. Objective marker keys in mission selections come from layout geometry, or from names a player types. Not read at all: `battleSizes`, `battleReadyArmyPointModifier` (Praetorium hardcodes the battle-ready bonus), `compatibleDataVersion`, `updated`, `lore` on cards, and presets beyond their deployment. `isCumulative` is copied onto awards but no scoring code reads it.

## Format version 1

| Field | Meaning |
| --- | --- |
| `formatVersion`, `kind` | `1` and `"mission-pack"`. A breaking change gets a new version and schema file. |
| `id`, `name`, `rulesVersion`, `source` | Project pack ID, display name, the edition and update it was checked against, and a source `title` with a `page` or `url`. |
| `battleRounds`, `battleReady` | Number of battle rounds and the battle-ready bonus. |
| `caps` | `primary` and `secondary` caps `perRound` and `perBattle`, and `fixedSecondaryPerCard`, the most one Fixed card can score. |
| `dispositions` | Force dispositions players pick. |
| `deployments`, `layouts` | Stable battlefield references. A layout lists the deployments it can be played with. |
| `primaries` | Primary missions. Each `pairing` names a `friendly` and `opposition` disposition and the deployments and layouts the pairing allows. A pairing appears once in a pack. |
| `secondaries` | Secondary cards, the `modes` (`fixed`, `tactical`) they can be played in, their awards, and an optional `whenDrawn` redraw. |
| `twists` | Optional battle-wide changes, flagged `changesPrimary` when they rewrite primary scoring. |

An award is `vp` scored `once` or for `each` occurrence, up to an optional `max`, limited to some `modes`, and in an optional `exclusive` group. Awards on one card add up, except that one claim per exclusive group is allowed at a moment. `criterion` is a short summary in our own words. Apps show it for players to confirm; it is not machine-checkable.

A window is the end of a named `phase`, the end of a `turn` (`own`, `opponent`, `any`), or `battle-end`, optionally limited to `rounds`. `orBattleEnd` on an opponent's-turn window also opens it at the battle end when this player took the last turn, because the opponent's next turn never comes. A rule that scores in the command phase but at turn end in the final round is two windows with complementary round ranges.

Any of `battleRounds`, `battleReady`, each cap, an award's `criterion`, each window, `whenDrawn`, and a twist's `effect` can be `{ "unresolved": "<what is missing>" }`. The validator lists each gap by JSON pointer. `scoreCard` refuses claims outside every resolved window and reports an unresolved window or cap as unenforced, rather than assuming a value.

`validatePack` also checks that IDs are unique in each section and that pairings, layouts, and redraws name existing dispositions, deployments, layouts, and cards. It checks that each layout in a pairing permits one of the pairing's deployments, that award modes are modes the card can be played in, and that round ranges fit the battle.

## Joining saved battles and terrain

Records carry project IDs only. Praetorium keeps the mapping from them to the identifiers its stored data holds, as for the [pilot](source-inventory.md#where-mappings-live):

| Stored in Praetorium | Maps to |
| --- | --- |
| `missionPackId` (pack-name slug) | pack `id` |
| `rosters.disposition`, sealed-event team disposition (name slug) | `dispositions[].id` |
| `cardKey`, secondary and primary `key` (Game Datacards card UUIDs) | `primaries[].id`, `secondaries[].id` |
| `twistId` | `twists[].id` |
| `patternId`, `deploymentIds` | `deployments[].id` |
| `terrainLayoutId`, `event_battlefields` | `layouts[].id` |

Layouts and deployments are references, not geometry. Zones, objective markers, and terrain belong to the geometry records in [#9](https://github.com/richardsolomou/40k-catalogue/issues/9), keyed by the same `deployments[].id` and `layouts[].id`, so the objective keys mission selections use come from there too. Old battles keep their stored IDs: the mapping must resolve every ID a saved battle holds, including retired ones.

## Fixtures and checks

[fixtures/mission-packs/synthetic-pack.json](../fixtures/mission-packs/synthetic-pack.json) is an invented pack. Its names and numbers are made up, and it uses four battle rounds so tests show the count is read rather than assumed. It exercises disposition pairings, a final-round window change, per-each awards with a maximum, round, battle, and fixed-card caps, mode-limited and exclusive awards, the battle-end fallback, redraws, and four unresolved parts. [test/mission-packs.test.ts](../test/mission-packs.test.ts) runs it and the reference errors with `pnpm test`.

## Remaining gaps

- **No real pack is represented.** Game Datacards has no reuse basis and is not an authoring source ([source inventory](source-inventory.md#game-datacards-mission-packs)). The publisher's pack can be read by a contributor but not sent to a model, and whether structured facts such as VP and caps can be published is the owner's open decision from the [source-use table](source-inventory.md#source-use-decision-for-3). A contributor needs to author the current pack from the printed source, with page references, once that decision is made.
- **Not modelled:** machine-checkable scoring criteria, mission actions (start, completion, units, limits), mission selections and operation markers, "when drawn" replacements, twist effects, Combat Patrol packs, battle sizes, and the scoring meaning of the source's `isCumulative`.
- **Battle-end fallback** covers opponent's-turn windows only. Windows tied to when a card was drawn or became active need history this format does not carry.

## Before Praetorium switches this source

1. Author the pinned pack from the printed source and review each award's amount, window, mode, and exclusive group against it.
2. Add the ID mapping above and prove it resolves every pack, card, twist, disposition, deployment, and layout ID stored in production battles, rosters, and sealed events, including retired ones.
3. Compare `setupFor` and `scoreCard` with Praetorium's `missionForIn`, `dueNow`, `awardTotal`, and cap handling over its battle tests and a replay of stored battle logs. Every difference should be a recorded correction, not a silent change to an old battle.
4. Keep Game Datacards for whatever the format does not cover, recorded as retained under [#13](https://github.com/richardsolomou/40k-catalogue/issues/13), until those parts have records.
5. Land the [#9](https://github.com/richardsolomou/40k-catalogue/issues/9) geometry keyed by the same deployment and layout IDs before dropping the name-based Battlemaster join.

[p-packs]: https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/src/server/missionPacks.ts
[p-missions]: https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/src/server/datacardMissions.ts
[p-twists]: https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/src/server/missionTwists.ts
[p-selections]: https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/src/server/missionSelections.ts
[p-terrain]: https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/src/server/datacardTerrain.ts
