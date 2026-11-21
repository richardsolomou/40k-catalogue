# Roster definitions

Roster definitions say how a list is built: which models a unit fields, what wargear it may take, which enhancements a detachment offers and to whom, and how many copies of a unit a roster may hold. They are the `data` of the roster category's records in a [catalogue release](catalogue-releases.md), one record per [identity](catalogue-identity.md) entry. The contract is [src/roster-definitions/definitions.v1.schema.json](../src/roster-definitions/definitions.v1.schema.json) plus the rules below, and `src/roster-definitions/` is a reference implementation of both.

Points are not definitions. Prices stay in [points snapshots](points.md), which join to definitions by the same catalogue IDs.

Nothing here is published definition data yet. The fixtures are an invented faction, because no source of real definitions has a reuse basis (see [Where each field can come from](#where-each-field-can-come-from)).

## Records

| Kind | `data` | Meaning |
| --- | --- | --- |
| `faction` | `{}` | The faction exists in this rules version. |
| `battle-size` | `points` | A battle size a roster can be built for, and its points limit. |
| `detachment` | `faction` | The faction the detachment belongs to. |
| `enhancement` | `detachment`, optional `upgrade`, optional `keywords.all` and `keywords.none` | Offered by that detachment to units holding every `all` keyword and no `none` keyword. An `upgrade` may be taken by several units; any other enhancement once per roster. |
| `unit` | `faction`, `keywords`, `sizes`, optional `perRoster`, `limits`, `legends`, `enhancements: false` | `sizes` lists every model count the unit may field. `perRoster` caps its copies, and each of `limits` replaces it in a roster of its `battleSize`. `enhancements: false` bars a unit that the keyword rules would otherwise admit. |
| `model` | `unit`, `min`, `max`, `wargear`, optional `bySize` | A kind of model in the unit, how many of it the unit fields, and the wargear each one carries by default. A `bySize` row gives its bounds at one total squad size. |
| `roster-option` | `unit`, optional `carrier`, `choose`, optional `per`, `bySize`, `uniform`, `replaces`, `caps`, `requires`, and `choices` | Wargear the unit may take instead of `replaces`. `choices` are wargear IDs. |
| `wargear` | optional `includes` | A piece of wargear, or a bundle of the wargear it `includes`. |

An option takes between `choose.min` and `choose.max` selections, scaled by `per`:

| `per` | Bounds |
| --- | --- |
| absent | Once for the unit, or not at all when the unit fields none of its `carrier`. |
| `"carrier"` | Once for each `carrier` model, as when every model may swap a weapon. |
| `{ "models": n }` | Once for every `n` models in the unit, as when one model in five may take a heavy weapon. |

A `uniform` option is all or nothing: the unit takes none of it, or takes its full scaled maximum of one choice, as when every model may swap the same weapon but the squad must match.

Each of an option's `caps` limits how many of its `choices` the option takes together, to `max` scaled by the cap's own `per`. A cap of 1 per carrier lets each model take any two of three wargear but never two of the same. A cap without `per` holds for the whole unit, as when only one model in a fixed squad may carry a particular weapon.

A model or option can specify `bySize: [{ size, min, max }]` for sizes with their own bounds. Use the total model count in the unit as `size`. A cap can specify `bySize: [{ size, max }]`. The listed values are absolute for that size. Other sizes use the regular bounds and scaling. An option with no carriers still takes zero selections.

An option with `requires` is closed until the unit takes one of `requires.choices` from the option `requires.option`, as when a character may take a relic only after swapping its default weapon.

A model loadout that a source writes as separate model entries, one per weapon, is one `model` with a `roster-option` per carrier whose choices are the loadouts as wargear.

## Validation

`validateDefinitions(identity, records)` checks the identity release, each record's `data` against its kind, and these rules, which the schema cannot express:

- Every record uses the identity release's rules version, its entry is current, and an entry has at most one record.
- Every ID a record's data names has a record of the right kind and appears in the identity entry's `references`, so a release's `dependsOn` and `unresolvedReferences` see every join.
- Every unit has at least one model, and every size lies between its models' summed minimums and maximums at that size.
- A model's `min` is no more than its `max`, and an option's `choose.min` no more than its `choose.max`.
- An option's carrier belongs to its unit, it replaces only wargear its carriers carry, and it does not offer what it replaces.
- An option caps only wargear it offers. It requires another option of the same unit and choices that option offers, and has no minimum.
- A unit sets at most one limit per battle size. Each list of `bySize` bounds has at most one row per size and uses the unit's declared sizes.
- A wargear bundle does not include itself.

## Saved rosters

A saved roster names a `faction`, a `detachment`, an optional `battleSize`, and its `units`. Each unit gives its `unit` ID, its model counts by model ID, its taken wargear as `{ <option ID>: { <wargear ID>: count } }`, and an optional `enhancement`. An omitted model count uses its base `min`. The checker then applies the bounds for the sum of those counts. Wargear a unit keeps by default is not listed.

`checkRoster(definitions, roster)` checks the constraints this format supports. It reports problems in roster order, each with a `code`, the unit's position, and a message:

| Code | Problem |
| --- | --- |
| `not-current` | An ID that is aliased, retired or missing in this release. |
| `missing-definition` | A current ID with no definition in the supplied records. |
| `detachment-faction`, `unit-faction` | A detachment or unit from another faction. |
| `unit-model`, `model-count`, `unit-size` | A model from another unit, a model count outside its bounds, or a total outside `sizes`. |
| `unit-option`, `option-choice`, `option-count`, `option-uniform` | An option from another unit, wargear the option does not offer, a selection count outside its scaled bounds, or a `uniform` option split between choices or short of its maximum. |
| `option-cap`, `option-unavailable` | More of some choices than a cap allows, or an option taken before the choice it `requires`. |
| `option-quantity` | A wargear choice with a negative, fractional or invalid count. |
| `enhancement-detachment`, `enhancement-keywords`, `enhancement-repeated` | An enhancement from another detachment, on an ineligible unit, or taken twice when it is not an upgrade. |
| `roster-limit` | More copies of a unit than its limit for the roster's battle size, or `perRoster` when the roster or unit names none. |

Before reading a roster under another release, pass `rosterRefs(roster)` to [`checkUpgrade`](catalogue-identity.md#consumer-mappings-and-upgrades). A saved roster keeps its rules version so it can be checked against those definitions.

## Imports

`importUnit(definitions, faction, printed)` reads a list's unit name, model count, and additional wargear into catalogue IDs. Names match exactly, ignoring case and surrounding space. With the optional `modelCounts` breakdown by printed model name, each model must resolve within the unit and the counts must sum to the total. With only a total, fixed models keep their count and a single variable model takes the rest, using the bounds for that unit size. Multiple variable models without a breakdown are ambiguous. The importer reports unknown or ambiguous names and mismatched counts. The caller checks legality with `checkRoster`. [Localisation](localisation.md) handles translated and historical names.

## Points joins

`pointsGaps(definitions, snapshot)` joins definitions to a points snapshot that uses the same catalogue IDs. It reports every unit size, detachment, and enhancement without a price, with the [lookup](points.md#looking-up-a-cost) reason, and every priced unit with no definition.

## History

The rules in [When an ID changes](catalogue-identity.md#when-an-id-changes) apply to every kind here. The fixtures exercise the cases a roster meets:

- A renamed unit keeps its ID, so an import must use the name in the list's own rules version.
- A duplicate wargear entry becomes an alias of the one kept.
- An option split in two is retired with `replacedBy` naming both successors.
- Battle sizes, caps, and a conditional option first appear in the second release, so the first release's roster has no battle size.

[fixtures/roster-definitions](../fixtures/roster-definitions) holds two catalogue release inputs for an invented faction, a points snapshot for the second, and a saved roster for each. [test/roster-definitions.test.ts](../test/roster-definitions.test.ts) builds both releases, checks the history, and covers validation, legality, imports, upgrades, and points joins.

## Where each field can come from

The [source inventory](source-inventory.md) records provenance and terms. No candidate source is cleared for publishing definition data.

| Field | Candidate sources | Open question |
| --- | --- | --- |
| Unit, model and wargear names, keywords, model counts, default wargear, wargear options | The publisher's datasheets and faction packs, authored as structured facts with page references | Whether publishing structured facts and names from the publisher's material is acceptable ([source-use decision](source-inventory.md#source-use-decision-for-3), unresolved before [#4](https://github.com/richardsolomou/40k-catalogue/issues/4)) |
| The same fields, as data | The `wh40k-11e` definitions, Game Datacards | No licence for the definitions; no reuse basis for Game Datacards. Usable for comparison only |
| Detachments, enhancements, upgrade marks, Legends status, priced unit sizes | The Munitorum Field Manual dataset ([points](points.md)) | Whether its MIT grant covers the scraped values |
| Roster limits, battle-size limits | The publisher's core rules and datasheets | As for datasheets |
| Translated and historical names | [Localisation](localisation.md) | As recorded there |

## Necrons comparison at the baseline

Checked on 21 November 2026. The Necrons definitions were converted into this shape in a scratch directory through Praetorium's own construction code, so the comparison measures what the shape can express and how this reference implementation judges it, not the accuracy of a new source. Converted data and roster samples stayed out of the repository and every result below is an aggregate.

**Baseline.** Praetorium [`a9b4a5b`](https://github.com/richardsolomou/praetorium.gg/tree/a9b4a5b3d37484f696b275d0b0e10b89ca07c325), whose lock pins definitions revision `5dd8d752…` and points revision `6a63139e…` (the MFM 1.6 fork at `6eed7b1` with corrections), rules version `mfm-1-6`, Necrons catalogue `b654-a18a-ea1-3bf2`. The local snapshot's `revision.json` matches the lock exactly. Praetorium's [pilot integration](https://github.com/richardsolomou/praetorium.gg/pull/1975) shows catalogue summaries only on detachment pages and the offline download, matched by ID and rules version, so its game calculations still read these definitions.

The comparison was rerun after adding battle sizes, caps, `requires`, and all-or-nothing `uniform`, against the same pinned revisions. Every check the additions do not touch reproduced its earlier result exactly.

| Check | Result |
| --- | --- |
| Conversion | 90 datasheets, 12 detachments and 38 enhancements became 471 records (1 faction, 3 battle sizes, 12 detachments, 38 enhancements, 90 units, 92 models, 57 options, 178 wargear), which pass `validateDefinitions`. 74 units carry battle-size `limits`, seven options carry `caps`, and one carries `requires`. |
| Unit composition | Every size Praetorium builds for every datasheet, and one past each end, gets the same verdict from `checkRoster`: 260 of 260. |
| Wargear | 801 single-option probes, each taking 1 to one more than the room of one option at every size. 797 agree (99.5%, from 659 of 799 before the additions). In all 4 that differ, the candidate accepts what Praetorium rejects (see [Remaining gaps](#remaining-gaps)). |
| Conditional options | The one option Praetorium closes until another selection opens it, probed alone and with each choice of the unit's other options: 3 of 3 agree. |
| Battle-size limits | Each datasheet fielded at its limit and one past it at Incursion, Strike Force and Onslaught: 765 of 771 agree. All 6 that differ are one Epic Hero whose limit Praetorium enforces outside the roster limit the conversion reads, so the candidate gives it none. |
| Roster legality | 279 Necrons tournament lists from the local import corpus, 277 of which Praetorium reads as Necrons and 256 imports cleanly. All 3,840 units map to candidate IDs, and each is judged on the candidate's unit-level codes. 3,789 unit verdicts agree (98.7%). Praetorium rejects 51 more units and the candidate none more. Only one of the 30 lists Praetorium rejects comes from an export of current data. Their errors are about Leader attachments (41 messages), the Warlord (4), and army-wide count limits (3). Every list is a Strike Force list. |
| Lists | 248 of 277 verdicts agree. 246 are legal in both and 2 illegal in both. Praetorium alone rejects 28, all for the rules above. The candidate alone rejects one list that names no detachment, a gap in the scratch translation rather than in the definitions. |
| Imports | `importUnit`, given each translated unit's name, model count and taken wargear names, reproduces all 3,840 units with no misses. |
| Points joins | Against the converted MFM file, all 12 detachments and 38 enhancements are priced. 63 of 90 units join by name. The 27 that do not are Legends fortifications, Legends units, three campaign variants, and three units with no price in Praetorium either. Praetorium prices 22 of them from another input and 2 at zero. One priced unit's name differs only in number from its definition. One unit has two sizes without a row. |
| Enhancement eligibility | Keyword rules inferred from the units Praetorium offers each enhancement to, plus `enhancements: false` for characters it never offers one to, give the same answer for 3,417 of 3,420 enhancement and unit pairs. |

The 78 disagreements first put down to room that is not a multiple of unit size came from the scratch conversion, which did not read room equal to the unit's size as once per model. Read that way, the remaining differences in those options were squads splitting a weapon swap that the datasheet makes all or nothing, which `uniform` now checks. Caps account for the other 58, including the 4 in a Legends fortification that were not attributed before.

### Remaining gaps

These block replacing definitions for Necrons. Each is a shape, source, or consumer change, not a data fix:

1. **Room shared between options.** A campaign character's two ability groups share one slot, and a Legends fortification caps a weapon across two of its options. The format bounds each option separately. These shared limits account for four differences.
2. **Limits outside the roster limit.** One Epic Hero's single copy comes from a rule the conversion does not read as a roster limit. The shape can hold it as `perRoster: 1`, once the source says so.
3. **Rules outside the shape.** Leader attachments, the Warlord (25 datasheets carry it as a toggle), army-wide enhancement and count limits, and detachment-specific restrictions are roster rules that the app checks separately. Praetorium reads attachment eligibility from datasheet text facts, so it depends on the gameplay reference ([#7](https://github.com/richardsolomou/40k-catalogue/issues/7)).
4. **Narrow eligibility.** Three enhancement and unit pairs need a rule narrower than shared keywords.
5. **Points coverage.** 27 units, mostly Legends, have no price in the Necrons points file, and one name needs an explicit mapping.
6. **Source.** No source of definition data has a reuse basis (see above).

## Older versions and ID mappings

At the baseline Praetorium composes nine rules versions: `mfm-1-6`, the released default, and eight retired versions, three of them backed by private snapshots instead of source pins. Saved rosters keep their rules version, so a replacement has to resolve each one or leave it on its existing input. Moving the retired versions buys nothing, so they keep their current inputs and only new rules versions move. A version that does move needs its own identity release and records, published as an immutable catalogue revision.

Saved rosters hold definition IDs, so Praetorium needs a mapping from its IDs to catalogue references (see [Consumer mappings](catalogue-identity.md#consumer-mappings-and-upgrades)). For Necrons at `mfm-1-6` that mapping is:

| Praetorium | Catalogue | Count |
| --- | --- | --- |
| Faction catalogue ID | `faction` | 1 |
| Battle size entry ID | `battle-size` | 3 |
| Detachment entry ID | `detachment` | 12 |
| Detachment and enhancement option ID | `enhancement` | 38 |
| Datasheet entry ID | `unit` | 90 |
| Model entry ID, including one entry per loadout | `model`, plus the loadout's option and wargear | 102 onto 92 |
| Choice path within a datasheet | `roster-option` | 57 |
| Wargear and loadout entry ID | `wargear` | 275 onto 178 |
| Spread counts | Wargear counts in the roster | |
| Warlord toggle | None; a roster-level rule | 25 |

The mapping is many-to-one where the definitions repeat the same wargear for each unit, and keyed by datasheet where choices are paths. Two model entries in one unit share a name and needed distinct IDs. Every mapped catalogue ID then follows the identity history: a later release can alias or retire it, and `checkUpgrade` lists what the mapping must move. Praetorium's `checkIdDrops` stays in place, because the mapping must never drop an ID a saved roster can hold.

## Cutover sequence

Run per faction, after the gaps above are closed or the faction's units do not meet them:

1. **Publish.** Release a catalogue revision whose roster category is `complete` for the faction, with its points category joined by the same IDs and `pointsGaps` empty.
2. **Map.** Add Praetorium's ID mapping as a reviewed file in its `catalogue/` directory. Check that it covers every ID `just rosters-audit` finds in production rosters and that `checkUpgrade` returns nothing.
3. **Shadow.** Keep definitions authoritative and run the candidate beside them: the probes above, the roster audit against its baseline, the 95% import bar, `just points`, the client-text integration test, and the offline construction bundle. Every disagreement is explained or fixed in the catalogue.
4. **Switch.** Read construction for the faction from the release in a new rules version, leaving retired versions on their inputs. Repeat the shadow checks against the deployed revision.
5. **Roll back.** Pin the roster category back to the definitions source in composition. Saved rosters keep their stored IDs and the mapping stays in place, so rollback needs no data migration and the release stays published for history.

## Decision

Retained. The `wh40k-11e` definitions remain Praetorium's construction source. The shape now reproduces Necrons unit sizes, imports, and wargear and battle-size limits apart from gaps 1 and 2 above, but the roster rules in gap 3 are outside it and no source has a reuse basis. The same scratch probe can run against other factions to measure how often room is shared between options before the shape takes that on. It is not ready for a cutover.
