# Roster definitions

Roster definitions say how a list is built: which models a unit fields, what wargear it may take, which enhancements a detachment offers and to whom, and how many copies of a unit a roster may hold. They are the `data` of the roster category's records in a [catalogue release](catalogue-releases.md), one record per [identity](catalogue-identity.md) entry. The contract is [src/roster-definitions/definitions.v1.schema.json](../src/roster-definitions/definitions.v1.schema.json) plus the rules below, and `src/roster-definitions/` is a reference implementation of both.

Points are not definitions. Prices stay in [points snapshots](points.md), which join to definitions by the same catalogue IDs.

## Records

| Kind | `data` | Meaning |
| --- | --- | --- |
| `faction` | `{}` | The faction exists in this rules version. |
| `battle-size` | `points` | A battle size a roster can be built for, and its points limit. |
| `detachment` | `faction` | The faction the detachment belongs to. |
| `enhancement` | `detachment`, optional `upgrade`, optional `keywords.all` and `keywords.none` | Offered by that detachment to units holding every `all` keyword and no `none` keyword. An `upgrade` may be taken by several units; any other enhancement once per roster. |
| `unit` | `faction`, `keywords`, `sizes`, optional `modelGroups`, `optionGroups`, `perRoster`, `limits`, `legends`, `enhancements: false` | `sizes` lists every model count the unit may field. `modelGroups` bounds the sum of counts of its named model IDs, and `optionGroups` the selections several of its options take together. `perRoster` caps its copies, and each of `limits` replaces it in a roster of its `battleSize`. `enhancements: false` bars a unit that the keyword rules would otherwise admit. |
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

A unit's `modelGroups` entries give `models`, `min`, `max` and optional `bySize`. The bound applies to the sum across its member IDs, for example when multiple equipment configurations fill the same kind of slot. Individual model bounds and the unit's total remain in force.

A unit's `optionGroups` entries give `options` and `max`. Each member names an `option` of the unit and, optionally, the `choices` of it that count. The group holds at most `max` of those selections for the whole unit at every size, as when two options draw on one slot or offer the same weapon. Only selections the roster lists count, so wargear a unit keeps by default never fills a group, and a group has no minimum.

An option with `requires` is closed until the unit takes one of `requires.choices` from the option `requires.option`, as when a character may take a relic only after swapping its default weapon.

A model loadout that a source writes as separate model entries, one per weapon, is one `model` with a `roster-option` per carrier whose choices are the loadouts as wargear.

## Validation

`validateDefinitions(identity, records)` checks the identity release, each record's `data` against its kind, and these rules, which the schema cannot express:

- Every record uses the identity release's rules version, its entry is current, and an entry has at most one record.
- Every ID a record's data names has a record of the right kind and appears in the identity entry's `references`, so a release's `dependsOn` and `unresolvedReferences` see every join.
- Every unit has at least one model, and every size lies between its models' summed minimums and maximums at that size.
- Every shared model group includes at least two distinct models that belong to its unit.
- Every option group names at least two options of its own unit, each once, and only choices those options offer.
- A model's `min` is no more than its `max`, and an option's `choose.min` no more than its `choose.max`.
- An option's carrier belongs to its unit, it replaces only wargear its carriers carry, and it does not offer what it replaces.
- An option caps only wargear it offers. It requires another option of the same unit and choices that option offers, and has no minimum.
- A unit sets at most one limit per battle size. Each list of `bySize` bounds has at most one row per size and uses the unit's declared sizes.
- A wargear bundle does not include itself, directly or through another bundle.

## Saved rosters

A saved roster names a `faction`, a `detachment`, an optional `battleSize`, and its `units`. Each unit gives its `unit` ID, its model counts by model ID, its taken wargear as `{ <option ID>: { <wargear ID>: count } }`, and an optional `enhancement`. An omitted model count uses its base `min`. The checker then applies the bounds for the sum of those counts. Wargear a unit keeps by default is not listed.

`checkRoster(definitions, roster)` checks the constraints this format supports. It reports problems in roster order, each with a `code`, the unit's position, and a message:

| Code | Problem |
| --- | --- |
| `not-current` | An ID that is aliased, retired or missing in this release. |
| `missing-definition` | A current ID with no definition in the supplied records. |
| `detachment-faction`, `unit-faction` | A detachment or unit from another faction. |
| `unit-model`, `model-count`, `unit-size` | A model from another unit, a model count outside its bounds, or a total outside `sizes`. |
| `model-group-count` | The named models' combined count is outside their shared bounds. |
| `unit-option`, `option-choice`, `option-count`, `option-uniform` | An option from another unit, wargear the option does not offer, a selection count outside its scaled bounds, or a `uniform` option split between choices or short of its maximum. |
| `option-cap`, `option-unavailable` | More of some choices than a cap allows, or an option taken before the choice it `requires`. |
| `option-group-count` | More selections across an option group's members than its `max`. |
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
- Battle sizes, caps, an option group, and a conditional option first appear in the second release, so the first release's roster has no battle size.

[fixtures/roster-definitions](../fixtures/roster-definitions) holds two catalogue release inputs for an invented faction, a points snapshot for the second, and a saved roster for each. [test/roster-definitions.test.ts](../test/roster-definitions.test.ts) builds both releases, checks the history, and covers validation, legality, imports, upgrades, and points joins.
