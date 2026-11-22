# Mission packs

A mission-pack record describes what a player decides and scores in one pack: force dispositions, which primary mission and battlefields a pairing gets, the secondary cards and how they may be played, scoring windows and amounts, caps, and twists. The contract is the JSON Schema in [src/mission-packs/mission-pack.v1.schema.json](../src/mission-packs/mission-pack.v1.schema.json), with types in [pack.ts](../src/mission-packs/pack.ts), reference checks in [validate.ts](../src/mission-packs/validate.ts), and a reference setup and scoring implementation in [play.ts](../src/mission-packs/play.ts), and a comparison against another implementation's behaviour in [compare.ts](../src/mission-packs/compare.ts).

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

## Joining terrain and saved battles

A mission pack lists which layouts and deployments can be used. Load the [terrain records](terrain.md#joining-mission-packs) with the same layout and deployment IDs for zones, objective positions and terrain shapes.

Store the rules version with the pack, card, twist, layout and deployment IDs. When importing saved battles from another source, map their IDs to catalogue IDs in the consumer. Keep references to retired versions resolvable.

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

## Chapter Approved at the inventory baseline

[Tracking issue](https://github.com/richardsolomou/vs-data/issues/8) · [Archived evidence](https://github.com/richardsolomou/vs-data/blob/80733c1fb93dd338b3078408c7f46c30c4ec422d/docs/mission-packs.md#chapter-approved-at-the-inventory-baseline)
