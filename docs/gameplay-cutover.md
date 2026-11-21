# Gameplay data cutover

The comparison uses the nine rules versions in the Praetorium snapshot pinned by [PR #1975](https://github.com/richardsolomou/praetorium.gg/pull/1975), with snapshot ID `9d1bbd972c311e52f7e6d2e912e08513ca55f865100957f3481110da31072466`. The released rules version is `mfm-1-6`. The other eight are retained versions.

## Staged fields and coverage

The private rehearsal preserves faction file membership, source identities, names, and the CP, phase and turn fields of stratagems. It counts rule documents, keyword entries and FAQ entries separately. The staging output contains no rules prose. It serves as a source inventory and comparison input.

| Data in `mfm-1-6` | Count |
| --- | ---: |
| Faction files | 29 |
| Faction and core inventory entries, including shared entries in multiple files | 5,553 |
| Distinct inventory IDs within each kind | 4,765 |
| Stratagem rows with CP, phase and turn present | 1,213 of 1,214 |
| Core rule document files | 6 |
| Keyword entries | 57 |
| FAQ entries | 675 |
| Matches to published pilot records | 4 |

The eight historical sources each contain 29 faction files and between 5,526 and 5,560 inventory entries. Staging all nine versions produced 49,999 inventory rows and 10,954 stratagem usage rows. These counts include entries that recur in several versions. A faction record in a historical source file can be outside the roster scope of that rules version.

The four matches use the IDs and version binding in the [Necrons audit](necrons-coverage.md). The rest still need reviewed mechanic records. Cost and timing metadata helps preserve stratagem identity and usage. Each effect still needs a verified record before this data can replace a game-rule implementation.

## Effect candidates from the existing app

A separate local run read the structured facts Praetorium already uses for combat. The current rules version used the full canonical catalogue, and the eight retired versions used their version-specific canonical catalogues. Of 33,455 rule occurrences across those catalogues, 6,324 had at least one numeric or enumerated combat effect available for review. The current version accounted for 2,055 of those candidates across 13,135 occurrences.

These are occurrences on cards, units and detachments. The count includes repeated abilities and differs from the distinct ID count above. The export kept the available effects and flagged omitted fields. Rule conditions and effect choices still need review before this data can drive gameplay.

## 40kdc-data coverage check

Version 1.5.1 contains structured effects and describes their rendered text as community-authored. The data licence permits reuse and adaptations with credit for the rights the project grants. Keep the pinned source, attribution and changes with any imported record. [Package release](https://github.com/wn-mitch/40kdc-data/releases/tag/npm-v1.5.1) · [Data licence at the release](https://github.com/wn-mitch/40kdc-data/blob/0be661cbdc1de16ad4137b9e000265b2d6c6c7ad/LICENSE-DATA)

The local comparison used explicit source ID links where available. Other matches needed the same kind and normalized name in the relevant faction, unit or detachment. A candidate in the last column has one match at the `2026-10-14` dataslate tag with a structured effect.

| Inventory kind | Distinct IDs | Unique matches | Candidates at the selected tag |
| --- | ---: | ---: | ---: |
| Army rules | 43 | 24 | 17 |
| Detachment rules | 272 | 245 | 183 |
| Stratagems | 1,203 | 1,121 | 910 |
| Enhancements | 817 | 762 | 649 |
| Unit abilities | 2,365 | 1,316 | 1,150 |
| Core and weapon abilities | 54 | 42 | 0 |
| Core stratagems | 11 | 10 | 0 |
| Total | 4,765 | 3,520 | 2,909 (61.0%) |

The other 1,856 IDs include 605 unique matches at another version, 6 without a structured effect at the selected tag, 37 ambiguous matches and 1,208 unmatched IDs. The selected tag is a version filter. Check the matched rule against the relevant source update and review its conditions and effects before using it. The audit is coverage evidence for #7 and #13.

All 2,909 selected ability records pass the pinned upstream schema. The local review file keeps the trigger, scope, effect and usage fields with their attribution and review status.

An exact clause translation found no complete match in the pilot format. Adding explicit [always-on and phase-window timing](records.md#timing) gives 1,427 of 2,909 candidates exact timing from their structured source. This includes 915 passive rules, 254 uses in a phase window and 258 event-triggered rules. The other 1,482 need more timing or usage fields.

The extended format represents 69 full candidates: 31 enhancements, 20 Stratagems and 18 unit abilities. Fifty of them rely on [re-rolls or granted weapon abilities](records.md#weapons). The 20 Stratagems also need target eligibility for a unit not yet chosen to shoot or fight in this phase. The 2,840 others are held. Whether this model is leading a unit is the only hold on 34 more. Other common gaps are conditions, ordered sequences and other target eligibility, such as whether the target disembarked earlier in the turn. The [structured import workflow](authoring.md#draft-a-proposal) preserves source revision, attribution and changes in a released record. The 69 candidates still need the applicable rules update, printed source and mechanic review before publication under [#7](https://github.com/richardsolomou/40k-catalogue/issues/7).

The same package has all 25 current Chapter Approved primary card names and 18 secondary card names, with the same number of award rows on each. It has no matches for the 26 current Combat Patrol primary cards. Its terrain data credits Battlemaster for 45 layouts and King of the Colosseum for one. These are separate checks from gameplay coverage. Mission conditions, scoring, source rights and geometry still need their own comparisons.

## Reproduce the staging output

Run the [gameplay coverage CLI](../src/gameplay-coverage/cli.ts) on each source revision. For the default version, use the snapshot's root `datacards/11th/gdc` directory. For a retained version, use the directory under `editions/<rules-version>` and the revision in that version's `revision.json`.

```sh
node src/gameplay-coverage/cli.ts stage <datacards-directory> --edition 11th \
  --update <rules-version> --title "Game Datacards" --revision <revision>
```

Keep the output outside Git. Match the report to verified records by rules version and source ID, using the consuming app's mapping. Preserve older source pins for any historical version that still needs those records. Track release readiness in [issue #13](https://github.com/richardsolomou/40k-catalogue/issues/13).
