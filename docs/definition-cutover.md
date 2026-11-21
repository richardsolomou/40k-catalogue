# Definition cutover: every faction and rules version

The [Necrons comparison](roster-definitions.md#necrons-comparison-at-the-baseline) now covers every faction and rules version in the [cutover tracker](cutover-tracker.md). The conversion uses Praetorium's pinned definitions and construction code to measure what the [roster format](roster-definitions.md) can hold and how its reference implementation judges real lists. The records, ID maps, source code for the conversion, and list samples are private.

## Baseline

| Input | Pin |
| --- | --- |
| Praetorium code | [`4e4f122`](https://github.com/richardsolomou/praetorium.gg/tree/4e4f122609849de97947527396e407abc8681976), `origin/main` on 21 November 2026 |
| Praetorium snapshot | `9d1bbd97…`, matching that commit's lock: definitions `ec399499…`, points `6a63139e…`, datacards `73b266d8…` |
| Format and reference implementation | 40K Catalogue `eb0d8cc` (`origin/main`, after #32 and #34). Its 311 tests pass |
| Lists | Praetorium's local import corpus, 4,842 lists that import as one of the 36 current factions, 2,318 of them exported from current data |

The Necrons conversion reproduces the published comparison exactly on this snapshot (260 of 260 size probes, 797 of 801 option probes, 765 of 771 battle-size probes), so the figures below come from the same method.

## What converted

All nine rules versions converted: `mfm-1-6`, the released default, and the eight retired versions. Each faction's records pass `validateDefinitions`, and so does each rules version's merged release.

| Rules version | Factions | Datasheets | Units | Records | Unit sizes | Wargear | Battle-size limits | Conditional options | Enhancement eligibility | IDs reused from current | IDs not current there |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `mfm-1-6` | 36 | 6,266 | 6,233 | 42,643 | 17,725/17,871 | 113,824/129,002 | 52,077/52,851 | 103/103 | 224,506/227,315 | | |
| `legacy-marine-old` | 1 | 278 | 277 | 1,901 | 811/814 | 5,780/6,365 | 2,382/2,382 | 5/5 | 13,699/13,850 | 1,182/1,182 | 162 |
| `legacy-rosters` | 3 | 825 | 822 | 5,722 | 2,411/2,420 | 17,128/18,976 | 7,074/7,074 | 15/15 | 63,861/64,150 | 3,248/3,594 | 510 |
| `legacy-profiles` | 3 | 423 | 418 | 2,679 | 1,324/1,327 | 6,267/6,873 | 3,237/3,237 | 5/5 | 17,669/17,820 | 1,074/1,694 | 910 |
| `current-rosters` | 4 | 1,088 | 1,084 | 7,334 | 3,177/3,194 | 21,317/23,652 | 9,366/9,366 | 20/20 | 37,313/38,632 | 4,501/4,514 | 114 |
| `custodes-11e` | 1 | 125 | 124 | 1,000 | 336/339 | 2,223/2,522 | 924/924 | 5/5 | 8,749/8,804 | 561/567 | 19 |
| `marine-main` | 4 | 1,088 | 1,084 | 7,356 | 3,181/3,198 | 21,549/23,884 | 9,366/9,366 | 20/20 | 39,212/40,244 | 4,532/4,532 | 111 |
| `marine-2026-10-13` | 4 | 1,088 | 1,084 | 7,360 | 3,181/3,198 | 21,553/23,904 | 9,366/9,366 | 20/20 | 39,391/40,244 | 4,536/4,536 | 103 |
| `marine-points-1013` | 5 | 1,220 | 1,215 | 8,349 | 3,552/3,572 | 24,023/26,675 | 10,431/10,431 | 25/25 | 43,318/44,174 | 4,977/5,079 | 265 |

The probe columns give agreeing verdicts over probes, as defined in the Necrons comparison. Enhancement eligibility counts enhancement and unit pairs. "IDs reused" counts identity entries whose Praetorium key already had a catalogue ID in an earlier conversion, over every entry with a ledger key; wargear IDs come from names and are not in the ledger. "Not current there" is what `checkUpgrade` against the current release reports for the retired version's IDs, all of them missing rather than aliased or retired, since no history links the versions.

At `mfm-1-6` the release holds 36 factions, 3 battle sizes, 445 detachments, 1,250 enhancements, 6,233 units, 8,619 models, 8,886 options and 17,171 wargear. Thirty-three datasheets are left out because their sizes fall outside their models' summed bounds (see [Shape gaps](#shape-gaps)).

## Real lists at the current rules version

| Check | Result |
| --- | --- |
| Units | 71,029 units in 4,842 lists, 3,865 of which import cleanly. 70,789 map to a candidate unit; the other 240 belong to left-out datasheets. |
| Unit verdicts | 69,188 of 70,789 agree (97.7%). The candidate alone rejects 1,043, on model counts (968), unit size (393) and option counts (188). Praetorium alone rejects 558. |
| List verdicts | 3,619 of 4,842 agree (74.7%): 3,365 legal in both and 254 illegal in both. Praetorium alone rejects 240 and the candidate alone 983. Across the 494 lists Praetorium rejects, its messages concern Leader attachments (340), army-wide count limits (162), the Warlord (129), detachment rules (58) and other roster rules (131). Across the candidate's rejections, besides the unit-level problems above, `checkRoster` reports repeated enhancements (385) and roster limits (242). |
| Imports | `importUnit`, given each translated unit's name, model count and taken wargear names, reproduces 52,372 of 70,789 units (74.0%). It misses on several variable models (8,165), wargear two options offer (6,108), and a printed name two units share (1,038). Another 5,781 import with a different split. |
| Loadouts outside model choices | 1,316 models in 637 list units are loadout entries no model choice offers. They count toward the model they equip, so their loadout limit goes unchecked. |

## Points joins at the current rules version

Each faction's records were joined to its own Munitorum Field Manual file at the same rules version, and Astartes chapters without their own file to the Space Marines file.

| Kind | Records | Without a price | Why |
| --- | ---: | ---: | --- |
| Units | 6,233 | 3,902 | 1,956 Legends; 1,539 priced only in another faction's file, because each faction holds its own copy of a shared datasheet; 407 with no row in any file |
| Unit sizes | 10,184 | 5,641 | The unpriced units' sizes (5,582), plus 58 sizes without a row and 1 ambiguous size |
| Detachments | 445 | 17 | No row |
| Enhancements | 1,250 | 242 | 185 with no row, 57 in an unpriced detachment |

271 priced rows match no definition. A rules version's points stay in [points snapshots](points.md), so these joins depend on the same catalogue IDs reaching both categories.

## Shape gaps

These are the differences the format or the reference implementation cannot close by data alone, with their denominators at `mfm-1-6`. Retired versions show the same kinds in proportion.

1. **Mixed composition.** 512 unit records have several model kinds whose counts vary, as in kill teams and squads that pick any mix. The format bounds each model separately, so the rest admit or refuse mixes the source does not, and 32 of the 33 left-out units are such mixes that cannot hold their smallest size at all. These units account for 7,560 of the 15,178 option disagreements.
2. **Caps the format cannot scale.** 698 option choices limit one option in a way no `per` form reproduces across sizes, for 4,582 disagreements. Another 1,366 disagreements are in units where several options disagree together, consistent with room shared between options, and 219 in options whose room does not scale linearly with unit size.
3. **Model bounds that scale with size.** 71 loadout choices take models only beyond the default build, at a room that grows with unit size. The format's model `min` and `max` are fixed, so the bound sits on the option instead.
4. **Sizes the source builder does not enumerate.** Some units take a second leader at their larger size, and lists field sizes Praetorium accepts but its size range does not list. These are among the 393 candidate-only unit-size rejections, which the probe does not separate from mixed composition. Sizes need to come from the source, not from the builder.
5. **Limits outside the roster limit.** 774 battle-size probes differ, all where Praetorium enforces a limit the conversion does not read as one: allied daemon units in three Chaos factions (768 probes, 288 of them on Epic Heroes), and one Necrons Epic Hero (6).
6. **Roster rules outside the shape.** Leader attachments, the Warlord (1,034 datasheets carry it as a toggle), army-wide count and enhancement limits, and detachment restrictions remain consumer rules.
7. **Narrow enhancement eligibility.** 2,809 of 227,315 enhancement and unit pairs need a rule narrower than shared keywords. In every one the keyword rule admits a unit Praetorium does not offer.
8. **Shared datasheets.** 396 datasheets are offered by two or more factions and become 4,879 of the 6,233 unit records, one per faction. The format has no shared unit or offered-to relation, which is also why 1,539 units miss a price.
9. **Ambiguous names.** Within a faction, 1,038 list units carry a name two units share, and 36,018 Praetorium wargear entries collapse onto 17,171 wargear names. Imports by name need the ambiguity resolved by ID or by [localisation](localisation.md) aliases.

## Profiles and attachments at the baseline

The current version's canonical catalogue has 2,230 datasheets. The initial roster definition format left these structures out. The separate [profile rehearsal](datasheet-profiles.md#rehearsal) validates records and identifies the remaining gaps.

| Structure | Count | Join to candidate IDs |
| --- | ---: | --- |
| Unit stat profiles | 2,470 | Not attempted |
| Weapon profiles | 11,302 | 9,952 (88.1%) match a wargear name the same candidate unit carries or offers |
| Other profiles | 536 | Not attempted |
| Leader links | 1,587 | 1,424 (89.7%) have both ends mapped to candidate units |
| Attachment links | 1,536 | Not attempted |
| Supporter links | 374 | Not attempted |

Keywords come from Praetorium's definitions. They differ from the canonical datasheet for 1,777 units, and 1,178 units have no canonical datasheet to compare, 817 of them Legends.

## Version-aware structure the format does not represent

- **Partial rules versions.** Each retired version covers between one and five factions and takes the rest from other inputs. An identity release describes one whole rules version, so each retired version here is a partial release with no way to say where its other factions come from.
- **Continuity between rules versions.** `historyErrors` and aliases work within one rules version's revisions. Nothing ties an ID in one rules version to its counterpart in another. The private conversion keeps IDs stable by keying them on Praetorium's IDs: the retired versions reuse between 63% and 100% of their keyed IDs, and a renamed entry keeps its ID (up to 89 renamed entries per version, mostly wargear and enhancements). Even so, every retired version has IDs the current release lacks, from 19 to 910, mostly wargear, options and enhancements that changed or were removed. Two catalogues exist only in `legacy-profiles`.
- **Version-scoped faction IDs.** Praetorium names a retired version's factions as `<version>~<catalogue>`, so the ID mapping is keyed by rules version, 61 faction and version pairs in all.
- **Name-derived wargear IDs.** Wargear IDs come from names, so a renamed weapon becomes a new ID. A keyed source would need its own wargear IDs.

## Mapping

At `mfm-1-6` the private ID map takes Praetorium's 36 catalogue IDs, 445 detachments, 1,250 detachment and enhancement pairs, 6,233 datasheets, 8,813 model entries, 9,143 choice paths and 36,018 wargear entries onto catalogue IDs. The 9,143 choice paths include those of the 33 left-out units, and the Warlord toggles map to nothing. The map is many-to-one for model entries, choice paths and wargear, as in the Necrons pilot.

## Size-specific bounds rerun

The roster format now supports absolute model counts, option bounds and individual choice caps at a declared unit size. The private converter added size-specific option bounds only when the reference builder exposed the same option at every size, the built composition had the requested size, and the bound applied to the whole unit. Choice caps also required the same choice to be visible at each size. Taking a missing choice as an observed zero caused 31 fewer whole-list matches in an earlier run.

With the qualified conversion, 114,042 of 129,002 wargear probes match, up from 113,824. All 36 faction record sets and the merged 42,643-record release validate. Whole-list agreement stays at 3,619 of 4,842, and unit verdicts agree in 69,188 of 70,789 cases. The new per-model bounds and import behavior are verified with synthetic cases. A source conversion still needs to supply the bounds for mixed-model compositions.

A separate extraction applied each source group's count bounds to a single model record. Wargear probes rose to 114,357 matches and whole-list agreement fell to 3,379. The candidate retains the earlier bounds. Valid lists can split that group over several model records when equipment differs. The importer must identify those variants together before enforcing the group's total.

The source group was traced for two Leagues of Votann units. Both groups include the regular model and a separate equipment variant. Applying their bounds to both IDs together retained the previous agreement of 137 of 147 lists. The single-model extraction agreed on 11 of those lists. The other groups still need their full membership mapped.

## Importing named model counts

The private import replay supplied the named model breakdown already present in the translated roster to the optional `modelCounts` input. It compares counts by model ID, ignoring field order and explicit zeros. With only a total, the importer reproduced 58,077 of 70,789 unit compositions and wargear selections. With the named breakdown it reproduced 60,523. The rehearsal measures the import contract using known counts from translated lists. Extraction of the model names from original list text remains a consumer check. [Import contract](roster-definitions.md#imports)

## Decision

Retain the current definitions. Whole-list verdicts agree in 74.7% of cases. Mixed composition and option caps account for most option differences, shared datasheets are duplicated per faction, and there is no recorded reuse basis for the source. The format needs to cover gaps 1 to 4 and 8, plus profiles and attachments. Gaps 5 to 7 need a comparison against the consumer's roster rules. [Roster compatibility issue](https://github.com/richardsolomou/40k-catalogue/issues/39)
