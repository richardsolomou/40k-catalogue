# Missions and terrain cutover audit

This records how far the [mission pack](mission-packs.md) and [terrain](terrain.md) formats can replace every Praetorium mission, layout, and deployment input, for [#8](https://github.com/richardsolomou/40k-catalogue/issues/8) and [#9](https://github.com/richardsolomou/40k-catalogue/issues/9) under [#13](https://github.com/richardsolomou/40k-catalogue/issues/13). It reports counts and IDs only. The candidates, converted geometry, saved-ID maps, scripts, and releases stayed in a private local cache, outside Git.

## Inputs

Audited on 21 November 2026 with 40K Catalogue `eb0d8cc`, Praetorium reference routines at `c742a9e`, and the pinned catalogue snapshot `9d1bbd9…`.

| Input | Variants found | Read at runtime by |
| --- | --- | --- |
| Chapter Approved 2026–27 pack | Game Datacards `ebcd0cb` (base) and `9c0762c` (identical across the 7 retired-edition inputs examined for this pin) | Battles use the base pack. Roster contexts in a retired edition use that edition's copy. |
| Combat Patrol pack | `ebcd0cb` and `9c0762c` | Terrain and deployments only. Praetorium does not score Combat Patrol missions. |
| King of the Colosseum | 2 traced layouts with their deployments | Battles |
| Battlemaster geometry | `acabfa4…`: 45 Chapter Approved and 3 Combat Patrol layouts | Every edition, through the base directory |
| Legacy Battlemaster pin | `4ac2124…`: 45 layouts in 3 retired editions | Nothing. Editions read the base directory. |

## Mission packs

A local adapter extended the [baseline adapter](mission-packs.md#chapter-approved-at-the-inventory-baseline) to every pack variant and to Combat Patrol. As before, every string was hashed before reading, so no wording was read.

| Candidate | Validates | Gaps | Cases agreed |
| --- | --- | --- | --- |
| Chapter Approved, current | Yes | 140 | 10,356 of 10,358 |
| Chapter Approved, retired editions | Yes | 140 | 10,356 of 10,358 |
| Combat Patrol, current | Yes | 140: 70 criteria, 70 windows | No reference: the app does not score these missions |
| Combat Patrol, retired editions | Yes | 132: 66 criteria, 66 windows | No reference |

Praetorium `c742a9e` writes the same cases, byte for byte, as the baseline `a9b4a5b`. The two differences are the final-round primary award already recorded in [mission packs](mission-packs.md#chapter-approved-at-the-inventory-baseline).

The retired-edition Chapter Approved pack has the same IDs as the current pack and the same facts in every section. Its raw file differs in 3 leaves: two metadata fields and one translated string. The current Combat Patrol pack adds 2 primaries and removes none. Its other raw differences are translations.

Combat Patrol selects a primary using a stable `detachment` reference. The lookup reproduced all 26 assignments in the current pack and all 24 in each of the eight retired versions. The source uses a separate detachment namespace for Combat Patrol. Its IDs do not match any faction-file detachment ID, so a consumer needs to preserve the Combat Patrol IDs.

## Terrain

A second adapter converted every layout and deployment Praetorium serves into terrain format 1. It took ID, group, and objective assignments from Praetorium's own geometry. It placed each record with `placeLayout` and compared the result with Praetorium's output point by point.

| Set | Records | Verify | Points compared | Largest difference |
| --- | --- | --- | --- | --- |
| Chapter Approved layouts | 45 | All pass | 154,890 | 0.001″ (rounding) |
| Combat Patrol layouts, with Praetorium's position corrections | 3 | All pass | 5,364 | 0.001″ |
| King of the Colosseum layouts | 2 | All pass | 948 | 0 |
| Deployment maps (6 Chapter Approved, 3 Combat Patrol, 2 King of the Colosseum) | 11 | All pass | 276 | 0 |

Footprint, part, and wall IDs, terrain-area groups, densities, wall thicknesses, and objective hosts showed no differences. For each of the 48 pack layouts, Praetorium's Battlemaster join was recomputed and matched what it serves.

The legacy Battlemaster pin joins the same 45 Battlemaster IDs and places identically. `droppedIds` reports nothing in either direction. Its files carry no objective hosts, so only footprint IDs could be compared.

The King of the Colosseum layouts are stored as already-placed geometry. Their conversion uses one unrotated footprint per area.

## Joins and saved IDs

`joinBattlefields` reports no gaps or errors for all 4 pack candidates. Every one of the 48 pack layouts permits the deployment that Praetorium joins it to. The 2 King of the Colosseum layouts and their deployments belong to no pack, so no mission record can name them yet.

The saved-ID map covers 414 identifiers Praetorium can store. Each family maps to the record that holds it:

| Family | IDs |
| --- | --- |
| Pack, disposition, primary, secondary, twist | 2, 5, 51, 18, 6 |
| Deployment (`patternId`), layout (`terrainLayoutId`) | 11, 50 |
| Objective keys | 271: 240 `area-N`, 21 `group-center`, 5 `deployment-N`, 5 named King of the Colosseum markers |

Every objective key in this map resolves to a footprint, shared objective, or deployment objective in the converted records. It preserves the source IDs for the comparison. The publishable records need project IDs under the [identity contract](catalogue-identity.md), with the consumer mapping preserved for cutover.

### Production sample

The 58 public battles on production (read-only through Praetorium's public battle listing) give:

- 21 battles with no pack. Their primaries resolve through Praetorium's unscoped disposition keys, which no pack-scoped record targets.
- 37 battles with the Chapter Approved pack.
  - 29 hold deployment IDs the map resolves: 25 Game Datacards IDs (6 distinct) and 4 King of the Colosseum IDs.
  - 8 hold one of 3 older slug deployment IDs. The [legacy deployment rehearsal](#legacy-deployment-rehearsal) identifies their original records.

The listing does not expose layout IDs, card keys, twist IDs, or objective keys. Battle logs were not available, so no stored log was replayed through `scoreCard`.

### Legacy deployment rehearsal

The three stored slugs match their original deployment records. The app before its migration to Game Datacards used the source's string ID and applied each zone's offset to its polygon. Five retained snapshots contain the same deployment file at the two 40kdc source revisions. All three maps passed the terrain validator after applying the historical reader's coordinate transform. [Historical reader](https://github.com/richardsolomou/praetorium.gg/blob/4e024359a68bc1fc574a5980a2479472c64ac2ee/src/server/rulesTerrain.ts) · [Pinned deployment source](https://github.com/wn-mitch/40kdc-data/blob/6a2aa2d284cd677bb963a9e3d228d9964212991e/data/core/deployment-patterns.json)

The same-name newer deployments have different objective positions in all three cases. Two also have different zone vertices. The legacy slugs resolve to their own private records. Preserve those historical assignments in the consumer's mapping so a saved battle keeps the map it used.

## Identity across rules versions

Two private catalogue releases were built with this repository's builder from the candidates. The builder ran without the clean-checkout gate and with a placeholder commit:

| Release | Rules version | Missions | Terrain |
| --- | --- | --- | --- |
| 0.1.0 | Retired editions, Game Datacards `9c0762c` | 137 entries, complete | 362 entries, complete |
| 0.2.0, previous 0.1.0 | Current snapshot, Game Datacards `ebcd0cb` | 139 entries, complete | 362 entries, complete |

Both identities validate, both releases verify, and the history check reports no errors. No ID is retired or dropped. The 2 added entries are the new Combat Patrol primaries. Every record shows as changed because each record repeats its rules version.

`checkUpgrade` from all 0.1.0 entries and all 414 saved IDs to 0.2.0 reports no findings. 412 of the saved IDs resolve in 0.1.0; the other 2 are the new primaries. `complete` here measures coverage of the release's own identity, not reviewed content: the gaps above remain.

## Blockers

1. The source-use decision ([#3](source-inventory.md#source-use-decision-for-3)) and a reuse basis for any geometry. Every converted record is `measured`, and its `reuse` is explicitly unresolved.
2. Authored content: criteria for 131 Chapter Approved and 70 Combat Patrol awards, 70 Combat Patrol windows, 6 twist effects, 2 "when drawn" replacements, card-level modes, cumulative awards, and a ruling on the final-round primary timing.
3. The King of the Colosseum battlefields are standalone geometry. A lookup must keep them available independently of the mission packs.
4. Assign stable IDs under the [identity contract](catalogue-identity.md) and apply the historical deployment mapping in the consumer. Verify it against stored battle data.
5. A protected production audit of battle logs, rosters, and sealed events for layout IDs, card keys, twist IDs, and objective keys, plus a `scoreCard` replay of stored logs.
6. A real release built from tracked inputs, with an archive checksum, before Praetorium switches any pin.
