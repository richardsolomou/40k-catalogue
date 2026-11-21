# Mission packs

A mission-pack record describes what a player decides and scores in one pack: force dispositions, which primary mission and battlefields a pairing gets, the secondary cards and how they may be played, scoring windows and amounts, caps, and twists. The contract is the JSON Schema in [src/mission-packs/mission-pack.v1.schema.json](../src/mission-packs/mission-pack.v1.schema.json), with types in [pack.ts](../src/mission-packs/pack.ts), reference checks in [validate.ts](../src/mission-packs/validate.ts), and a reference setup and scoring implementation in [play.ts](../src/mission-packs/play.ts), and a comparison against another implementation's behaviour in [compare.ts](../src/mission-packs/compare.ts). This covers [#8](https://github.com/richardsolomou/40k-catalogue/issues/8).

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
| `caps` | `primary` and `secondary` caps `perRound` and `perBattle`, and `fixedSecondaryPerCard`, the most one Fixed card can score. `perRoundExcludesBattleEnd` on a cap counts what is scored at the battle end against `perBattle` only. |
| `dispositions` | Force dispositions players pick. |
| `deployments`, `layouts` | Stable battlefield references. A layout lists the deployments it can be played with. |
| `primaries` | Primary missions. Each `pairing` names a `friendly` and `opposition` disposition and the deployments and layouts the pairing allows. A primary may also name a stable `detachment` ID. Each pairing or detachment maps to at most one primary in a pack. |
| `secondaries` | Secondary cards, the `modes` (`fixed`, `tactical`) they can be played in, their awards, and an optional `whenDrawn` redraw. |
| `twists` | Optional battle-wide changes, flagged `changesPrimary` when they rewrite primary scoring. |

An award is `vp` scored `once` or for `each` occurrence, up to an optional `max`, limited to some `modes`, and in an optional `exclusive` group. Awards on one card add up, except that one claim per exclusive group is allowed at a moment. `criterion` is a short summary in original wording. Apps show it for players to confirm; it is not machine-checkable.

A window is the end of a named `phase`, the end of a `turn` (`own`, `opponent`, `any`), or `battle-end`, optionally limited to `rounds`. `orBattleEnd` on an opponent's-turn window also opens it at the battle end when this player took the last turn, because the opponent's next turn never comes. A battle-end moment with `drawnLastTurn: false`, for a card drawn before that last turn, keeps it closed; without the field it opens. A rule that scores in the command phase but at turn end in the final round is two windows with complementary round ranges.

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

[fixtures/mission-packs/synthetic-pack.json](../fixtures/mission-packs/synthetic-pack.json) is an invented pack. Its names and numbers are made up, and it uses four battle rounds so tests show the count is read rather than assumed. It exercises disposition pairings, a final-round window change, per-each awards with a maximum, round, battle, and fixed-card caps, mode-limited and exclusive awards, the battle-end fallback with and without draw history, redraws, and four unresolved parts. [synthetic-cases.json](../fixtures/mission-packs/synthetic-cases.json) is a matching set of reference cases, including cap cases. [test/mission-packs.test.ts](../test/mission-packs.test.ts) runs both and the reference errors with `pnpm test`.

## Comparing with another implementation

`compare` runs a pack against reference cases: what another implementation decides for setups, the battlefields a table may play, whether an award can be claimed at a moment, award amounts, exclusive groups, caps, and, optionally, whether a claim passes a cap given what is already banked. Cases use the pack's own IDs. A consumer writes them from its own routines and translates its stored IDs first. One reference moment can stand for several of ours, such as a last turn that is also the battle end; the award is open if any of them opens it.

```sh
node src/mission-packs/cli.ts validate <pack.json>
node src/mission-packs/cli.ts compare <pack.json> <cases.json>
```

Both print counts, gap paths, and differences by ID, award, and moment only, never a note or a compared value, so the report on a private pack can be shared. `compare` exits 1 on any difference.

`battlefieldsFor` gives the deployment and layout pairs for two dispositions. Each side has its own primary, so a battlefield must be allowed by both sides' pairings.

`primaryForDetachment` selects a primary by exact detachment ID, for packs such as Combat Patrol whose battlefield is chosen independently.

### Chapter Approved at the inventory baseline

On 21 November 2026 a local adapter read the pinned Chapter Approved 2026–27 pack through Praetorium's own routines at `a9b4a5b` (catalogue pointer `29e26d2…`, Game Datacards `ebcd0cb`, Battlemaster `acabfa4…`). It replaced every string the routines publish with a hash, so no wording was read. It wrote a candidate pack in format 1 and reference cases from `missionsFromDatacards`, `missionCardsFromDatacards`, `tableBattlefields`, `cardsDue`, `cardsDueFromTheirTurn` with the mode filter `scoringDue` applies, and `awardTotal`. The candidate keeps Game Datacards IDs, has no summaries or effects (each is unresolved), and stays outside Git.

The pack has 5 dispositions, 6 deployments, 45 layouts, 25 primaries with 25 pairings and 100 awards, 18 secondaries with 31 awards, and 6 twists. The candidate validates with 140 gaps: 131 award criteria, 6 twist effects, 2 "when drawn" replacements, and 1 window.

| Cases | Checked | Agree |
| --- | --- | --- |
| Setup: primary and deployments per disposition pairing | 25 | 25 |
| Table battlefields per disposition pair | 15 | 15 |
| Award open at a moment, per mode, all rounds, phases, and turns | 9,982 | 9,980 |
| Award amounts, 1 to 10 claims | 290 | 290 |
| Exclusive groups per card | 43 | 43 |
| Primary, secondary, and fixed-card caps | 3 | 3 |

Also agreed: all 45 layouts name one deployment and have geometry, the caps are the same on every primary, and the pack's battle-ready field equals the bonus Praetorium hardcodes.

Both differences are the same primary award (`2a68706e-fa98-4c79-a431-67069fb93f4e`, first objective), whose data scores it at the end of either player's turn in every round. In the final round, Praetorium scores every primary award at the end of the player's own turn, whatever the card's data says. The data agrees for every other award. Format 1 can say either per award. A private variant whose window stops opponent's-turn scoring after round 4 agrees with every case. A pack-wide rule would add nothing that windows can't say, so none was added. Which reading the printed rules mean needs review.

A second local probe asked Praetorium `c742a9e` how it caps scores and settles the battle end, through `scoringCapError` and `scoringDue` on battles at their final turn's end and `cardsDue` for cards drawn before the last turn. It wrote 62 more window cases, 10 of them for the 5 `orBattleEnd` awards, and 156 cap cases. Without `drawnLastTurn`, all 10 `orBattleEnd` cases differ. Without `perRoundExcludesBattleEnd`, 13 battle-end primary claims after a full round are capped, which Praetorium allows. With both:

| Cases, current and retired-edition packs alike | Checked | Agree |
| --- | --- | --- |
| Earlier cases above | 10,358 | 10,356 |
| Window cases for cards drawn before the last turn | 62 | 62 |
| Cap cases, candidate as derived | 156 | 143 |
| Cap cases, private variant with `perRoundExcludesBattleEnd` on the primary cap | 156 | 156 |

The 13 remaining differences are the battle-end primary awards scored after a full round. This repeats Praetorium's behaviour; it does not confirm the printed rules.

Fields that need richer modelling or review:

- **Card modes.** 14 of 18 secondaries have no award limited to one mode, and the source states no card-level mode, so the candidate lets them be played in both. The source's cards have no field with a mode, and only 11 awards are typed (6 Fixed, 5 Tactical). Praetorium filters awards by type, never cards. The real pack's mode restrictions have to be authored.
- **Cumulative awards.** 9 awards (7 primary, 2 secondary) carry the source's `isCumulative`, which neither Praetorium nor format 1 reads. Each is a later award on an objective, after an award without the flag, and none is in an exclusive group. Both implementations add these awards like any others, so the flag changes no score in either. What it means on the printed card needs review.
- **Per-each reading.** Praetorium reads an award as per-each only when its input is a stepper and its wording starts "for each". 2 primary awards have a stepper but not that wording, so they score once. Review against the printed card.
- **Unrecognised timing.** 1 primary award's wording is outside the six phrasings, so Praetorium cannot score it automatically and the candidate leaves its window unresolved.
- **"When drawn" replacements.** 2 secondaries replace rather than redraw. Praetorium offers them as an optional discard and draw, under a table condition the player judges from the card's words. Nothing in scoring reads it. Format 1 has no value for this, and the condition would need an authored summary, so they stay unresolved.
- **Cap behaviour.** Praetorium refuses a score that would pass a cap; `scoreCard` keeps the part that fits and reports `capped`. Both use the same numbers. A consumer that refuses can treat `capped` as a refusal. Praetorium does not count an end-of-battle primary award against the round cap, only the battle cap; secondaries at the battle end still count against both. `perRoundExcludesBattleEnd` on the primary cap reproduces this. Whether the printed pack says so needs review, so it is set only in a private variant of the candidate.
- **Battle-end fallback.** Praetorium opens an opponent's-turn card at the battle end only if it was drawn in the player's last turn. Fixed cards are never drawn during a turn, so they never get this fallback. `drawnLastTurn: false` reproduces this. Whether the printed rule also lets a card drawn earlier score needs review.
- **Exclusive per-each awards.** Praetorium's end-of-battle check allows one claim of an award in an exclusive group; `scoreCard` allows several. None of the pack's awards are both, so no case tests it.

## Remaining gaps

- **No reviewed real pack is published.** The Chapter Approved candidate above is derived from Game Datacards, which has no reuse basis and is not an authoring source ([source inventory](source-inventory.md#game-datacards-mission-packs)). It shows the format can carry the pack's setup and scoring and that this implementation agrees with Praetorium's on those facts. It is not a review against the printed pack: cases and candidate come from the same derived fields.
- **Not modelled:** machine-checkable scoring criteria, mission actions (start, completion, units, limits), mission selections and operation markers, "when drawn" replacements, twist effects, card-level mode restrictions, cumulative awards, and battle sizes.
- **Battle-end fallback** covers opponent's-turn windows only, and its only draw history is whether the card was drawn in the last turn. Windows tied to any other draw or activation time are not modelled.

## Blockers for publishing a real pack

1. The owner's decision from the [source-use table](source-inventory.md#source-use-decision-for-3) on whether structured facts (VP, caps, timing, pairings) and printed names can be published.
2. A contributor authoring the pack from the printed source with page references and original summaries for 131 criteria and 6 twist effects, then reviewing every award's amount, window, mode, and exclusive group, plus the fields listed above.
3. The adapter that writes Praetorium's cases is local and must land in Praetorium before the comparison can run in CI. It must also translate Praetorium's stored IDs to project IDs once records stop carrying Game Datacards IDs.
4. Use a protected production audit to confirm the IDs stored in battles, rosters and sealed events.

## Before Praetorium switches this source

1. Clear the publishing blockers above.
2. Add the ID mapping above and prove it resolves every pack, card, twist, disposition, deployment, and layout ID stored in production battles, rosters, and sealed events, including retired ones.
3. Run `compare` on the reviewed pack against cases from Praetorium's routines, and replay stored battle logs through `scoreCard`. Every difference, including the final-round primary above, should be a recorded correction, not a silent change to an old battle.
4. Keep Game Datacards for whatever the format does not cover, recorded as retained under [#13](https://github.com/richardsolomou/40k-catalogue/issues/13), until those parts have records.
5. Land the [#9](https://github.com/richardsolomou/40k-catalogue/issues/9) geometry keyed by the same deployment and layout IDs before dropping the name-based Battlemaster join.

[p-packs]: https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/src/server/missionPacks.ts
[p-missions]: https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/src/server/datacardMissions.ts
[p-twists]: https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/src/server/missionTwists.ts
[p-selections]: https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/src/server/missionSelections.ts
[p-terrain]: https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/src/server/datacardTerrain.ts
