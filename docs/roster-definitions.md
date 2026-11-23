# Roster definitions

Roster definitions say how a list is built: which models a unit fields, what wargear it may take, which enhancements a detachment offers and to whom, and how many copies of a unit a roster may hold. They are the `data` of the roster category's records in a [catalogue release](catalogue-releases.md), one record per [identity](catalogue-identity.md) entry. The contract is [src/roster-definitions/definitions.v2.schema.json](../src/roster-definitions/definitions.v2.schema.json) plus the rules below, and `src/roster-definitions/` is a reference implementation of both.

Points are not definitions. Prices stay in [points snapshots](points.md), which join to definitions by the same catalogue IDs.

## Format versions

Every record's `data` carries `"formatVersion": 2`. Records without it are format version 1, described by [definitions.v1.schema.json](../src/roster-definitions/definitions.v1.schema.json), and all the records of one rules version use one version. Version 1 names wargear as lists, so it cannot say that a model carries two of an item or that an option replaces both. Version 2 counts them, and adds conditions, shared roster limits, compositions, substitutes and scaled option groups. `validateDefinitions` reads a version 1 list as a count of one of each item, which is what it meant, so the checker, importer and points joins below treat both versions alike.

## Records

| Kind | `data` | Meaning |
| --- | --- | --- |
| `faction` | optional `unitLimits` | The faction exists in this rules version. Each of `unitLimits` bounds how many units holding all its `keywords` a roster of the faction holds. |
| `battle-size` | `points` | A battle size a roster can be built for, and its points limit. |
| `detachment` | `faction` | The faction the detachment belongs to. |
| `enhancement` | `detachment`, optional `upgrade`, optional `keywords.all` and `keywords.none` | Offered by that detachment to units holding every `all` keyword and no `none` keyword. An `upgrade` may be taken by several units; any other enhancement once per roster. |
| `unit` | `faction`, `keywords`, `sizes`, optional `conditionalKeywords`, `compositions`, `modelGroups`, `optionGroups`, `perRoster`, `limits`, `legends`, `enhancements: false`, `wargear` | `sizes` lists every model count the unit may field. `wargear` counts what the unit carries that none of its models does, such as a support turret, and options without a `carrier` may replace it. `modelGroups` bounds the sum of counts of its named model IDs, and `optionGroups` the selections several of its options take together. `perRoster` caps its copies, and the first of `limits` for the roster's `battleSize` whose condition holds replaces it. A `perRoster` of 0 means no roster may hold the unit, as when it enters play only through another unit's rule. `enhancements: false` bars a unit that the keyword rules would otherwise admit. |
| `model` | `unit`, `min`, `max`, `wargear`, optional `bySize` | A kind of model in the unit, how many of it the unit fields, and how many of each wargear ID each one carries by default, as `{ <wargear ID>: count }`. A `bySize` row gives its bounds at one total squad size. |
| `roster-option` | `unit`, optional `carrier`, `choose`, optional `per`, `bySize`, `uniform`, `substitutes`, `replaces`, `caps`, `requires`, and `choices` | Wargear the unit may take. Each selection takes one of `choices`, which are wargear IDs, instead of the counts of wargear in `replaces`. |
| `wargear` | optional `includes` | A piece of wargear, or a bundle holding the counts of wargear in `includes`, at least two items in all. |

A model that carries two lascannons has `"wargear": { "<lascannon>": 2 }`. An option replacing both has `"replaces": { "<lascannon>": 2 }`, and a choice giving two heavy bolters for them is a bundle with `"includes": { "<heavy bolter>": 2 }`. An option replacing one lascannon at a time takes up to two selections per carrier instead.

An option without `replaces` adds its choice to the carrier's wargear. With a `choose.min` above zero it is a choice every carrier must make, as when a model carries no default weapon in one slot.

An option takes between `choose.min` and `choose.max` selections, scaled by `per`:

| `per` | Bounds |
| --- | --- |
| absent | Once for the unit, or not at all when the unit fields none of its `carrier`. |
| `"carrier"` | Once for each `carrier` model, as when every model may swap a weapon. |
| `{ "models": n }` | Once for every `n` models in the unit, as when one model in five may take a heavy weapon. |

A `uniform` option is all or nothing: the unit takes none of it, or takes its full scaled maximum of one choice, as when every model may swap the same weapon but the squad must match. Its `substitutes` are choices some models may take instead: the selections of its other choices are then either none or one choice taken by every carrier that takes no substitute, so the full scaled maximum counts the substitutes too. A cap usually limits the substitutes.

Each of an option's `caps` limits how many of its `choices` the option takes together, to `max` scaled by the cap's own `per`. A cap of 1 per carrier lets each model take any two of three wargear but never two of the same. A cap without `per` holds for the whole unit, as when only one model in a fixed squad may carry a particular weapon.

A model or option can specify `bySize: [{ size, min, max }]` for sizes with their own bounds. Use the total model count in the unit as `size`. A cap can specify `bySize: [{ size, max }]`. The listed values are absolute for that size. Other sizes use the regular bounds and scaling. An option with no carriers still takes zero selections.

A unit's `modelGroups` entries give `models`, `min`, `max` and optional `bySize`. The bound applies to the sum across its member IDs, for example when multiple equipment configurations fill the same kind of slot. Individual model bounds and the unit's total remain in force.

A unit's `optionGroups` entries give `options` and `max`, and optionally `per`, `carrier` and `bySize`. Each member names an `option` of the unit and, optionally, the `choices` of it that count and a `weight` each of their selections counts for, as when a choice of two shrine tokens uses up two of a limit on tokens. One option may be named by several members with different choices. The group holds at most `max` of those selections, scaled by `per` like a cap, as when two options draw on one slot or offer the same weapon, or one model in three may take either of two weapons. A group scaled `"carrier"` names its `carrier` model, as when swaps on the same models exclude each other. A `bySize` row gives the group's absolute maximum at one size. Only selections the roster lists count, so wargear a unit keeps by default never fills a group, and a group has no minimum.

A unit's `compositions` are the ways it may field its models when model bounds alone would admit more, as when six models are either three and three or six and none. Each composition maps model IDs to `min` and `max`, and a model it omits fields none. The model counts must fit one composition as well as the models' own bounds and the unit's `sizes`.

An option with `requires` is closed until the unit takes one of `requires.choices` from the option `requires.option`, as when a character may take a relic only after swapping its default weapon.

## Conditions

A `when` holds for a roster whose `faction` and `detachment` are the ones it names, and whose units name its `warlord` model as their warlord. Each field it omits holds for any roster. A unit's `conditionalKeywords` entries give `keywords` the unit holds where their `when` holds, as when a unit is BATTLELINE in one detachment, and a row of its `limits` with a `when` applies only where that holds. Conditional keywords count for enhancements and for a faction's `unitLimits`.

A faction's `unitLimits` entries give `keywords` and optional `min` and `max`: a roster of that faction holds between `min` and `max` units with all those keywords. A row of `detachments` names a `detachment` of the faction and its own optional `min` and `max`, which replace the entry's in a roster of that detachment, so a row with neither lifts the limit there.

A model loadout that a source writes as separate model entries, one per weapon, is one `model` with a `roster-option` per carrier whose choices are the loadouts as wargear.

## Validation

`validateDefinitions(identity, records)` checks the identity release, each record's `data` against its kind, and these rules, which the schema cannot express:

- Every record uses the identity release's rules version, its entry is current, and an entry has at most one record.
- Every ID a record's data names has a record of the right kind and appears in the identity entry's `references`, so a release's `dependsOn` and `unresolvedReferences` see every join.
- Every unit has at least one model, and every size lies between its models' summed minimums and maximums at that size.
- Every shared model group includes at least two distinct models that belong to its unit.
- Every option group names only options of its own unit, with only choices those options offer, and no choice of an option twice. A group of format version 1 names at least two options.
- A model's `min` is no more than its `max`, and an option's `choose.min` no more than its `choose.max`.
- An option's carrier belongs to its unit. It replaces no more of an item than one of its carriers carries, or for an option without one, than a model or the unit itself carries, and does not offer what it replaces.
- An option caps only wargear it offers. It requires another option of the same unit and choices that option offers, and has no minimum.
- An option with `substitutes` is `uniform`, offers them, and offers a choice besides them.
- An option group scaled per carrier names a carrier of its unit, and only such a group names one.
- Every composition names only its unit's models, and every unit size fits at least one composition.
- A unit sets at most one limit per battle size and condition, and no limit after one without a condition for the same battle size, which would never apply. Each list of `bySize` bounds has at most one row per size and uses the unit's declared sizes.
- A faction's unit limits name only its own detachments, each once, and no `min` above its `max`.
- A wargear bundle includes at least two items and does not include itself, directly or through another bundle.

## MFM 1.6

The [MFM 1.6 input](../data/mfm-1-6/rule-summaries/README.md) includes the `rosters` category in format version 2, built from the official app's data build: factions, battle sizes, Detachments, and every datasheet outside Combat Patrol as one unit, modelled once rather than once per Space Marine chapter. Every wargear option the app allows is stated exactly. A unit's `aliases` are the BSData entry IDs of the datasheets it stands for (`bsdata.<entry ID with dots>`), so lists saved against BSData IDs resolve. Warhammer Legends datasheets the app does not carry are typed from Games Workshop's Legends PDFs where their text states the loadout exactly; the README lists the rest. Enhancement eligibility is in each Enhancement's [rule facts](rule-facts.md).

## Earlier rules versions

Each earlier 11th-edition input except the Custodes codex one (`data/<version>/rule-summaries/`) includes the same `rosters` category, built from the app build in force at that update's cutoff and the Legends documents dated before it. A unit keeps the ID it has in MFM 1.6, and lists the BSData entry IDs of the datasheets Praetorium compiled for that update among its aliases.

## Saved rosters

A saved roster names a `faction`, a `detachment`, an optional `battleSize`, and its `units`. Each unit gives its `unit` ID, its model counts by model ID, its taken wargear as `{ <option ID>: { <wargear ID>: count } }`, an optional `enhancement`, and, for the warlord's unit, the warlord's model ID as `warlord`. An omitted model count uses its base `min`. The checker then applies the bounds for the sum of those counts. Wargear a unit keeps by default is not listed.

`checkRoster(definitions, roster)` checks the constraints this format supports. It reports problems in roster order, each with a `code`, the unit's position, and a message:

| Code | Problem |
| --- | --- |
| `not-current` | An ID that is aliased, retired or missing in this release. |
| `missing-definition` | A current ID with no definition in the supplied records. |
| `detachment-faction`, `unit-faction` | A detachment or unit from another faction. |
| `unit-model`, `model-count`, `unit-size` | A model, or a warlord, from another unit, a model count outside its bounds, or a total outside `sizes`. |
| `model-group-count`, `unit-composition` | The named models' combined count is outside their shared bounds, or the model counts fit none of the unit's compositions. |
| `unit-option`, `option-choice`, `option-count`, `option-uniform` | An option from another unit, wargear the option does not offer, a selection count outside its scaled bounds, or a `uniform` option split between choices besides its substitutes or short of its maximum. |
| `option-cap`, `option-unavailable` | More of some choices than a cap allows, or an option taken before the choice it `requires`. |
| `option-group-count` | More selections across an option group's members than its `max`. |
| `option-quantity` | A wargear choice with a negative, fractional or invalid count. |
| `enhancement-detachment`, `enhancement-keywords`, `enhancement-repeated` | An enhancement from another detachment, on an ineligible unit, or taken twice when it is not an upgrade. |
| `roster-limit` | More copies of a unit than its limit for the roster's battle size, or `perRoster` when the roster or unit names none. |
| `unit-limit` | More or fewer units with a faction's limited keywords than the roster's faction and detachment allow. |
| `warlord-repeated` | More than one unit names a warlord. |

Before reading a roster under another release, pass `rosterRefs(roster)` to [`checkUpgrade`](catalogue-identity.md#consumer-mappings-and-upgrades). A saved roster keeps its rules version so it can be checked against those definitions.

## Imports

`importUnit(definitions, faction, printed)` reads a list's unit name, model count, and additional wargear into catalogue IDs. Names match exactly, ignoring case and surrounding space. With the optional `modelCounts` breakdown by printed model name, each model must resolve within the unit and the counts must sum to the total. With only a total, fixed models keep their count and a single variable model takes the rest, using the bounds for that unit size. Multiple variable models without a breakdown are ambiguous. The importer reports unknown or ambiguous names and mismatched counts. The caller checks legality with `checkRoster`. [Localisation](localisation.md) handles translated and historical names.

## Points joins

`pointsGaps(definitions, snapshot)` joins definitions to a points snapshot that uses the same catalogue IDs. It reports every unit size, detachment, and enhancement without a price, with the [lookup](points.md#looking-up-a-cost) reason, and every priced unit with no definition. A unit no roster may hold needs no price.

## History

The rules in [When an ID changes](catalogue-identity.md#when-an-id-changes) apply to every kind here. The fixtures exercise the cases a roster meets:

- A renamed unit keeps its ID, so an import must use the name in the list's own rules version.
- A duplicate wargear entry becomes an alias of the one kept.
- An option split in two is retired with `replacedBy` naming both successors.
- Battle sizes, caps, an option group, and a conditional option first appear in the second release, so the first release's roster has no battle size.
- The third release is written in format version 2 and adds counted wargear, conditions, shared roster limits, compositions, a substitute and a unit no roster may hold.

[fixtures/roster-definitions](../fixtures/roster-definitions) holds three catalogue release inputs for an invented faction, points snapshots for the second and third, and a saved roster for each. [test/roster-definitions.test.ts](../test/roster-definitions.test.ts) builds the releases, checks the history, and covers validation, legality, imports, upgrades, and points joins.
