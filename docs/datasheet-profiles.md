# Datasheet profiles

Datasheet profiles record what a unit's datasheet prints in its stat lines and which units it may join. They are the `data` of a profiles category in a [catalogue release](catalogue-releases.md), one record per [identity](catalogue-identity.md) entry, beside the [roster definitions](roster-definitions.md) whose units, models and wargear they name. The contract is [src/datasheet-profiles/profiles.v1.schema.json](../src/datasheet-profiles/profiles.v1.schema.json) plus the rules below, and `src/datasheet-profiles/` is a reference implementation of both.

Nothing here is published profile data yet. The fixtures are profiles for the invented roster definitions, and the [rehearsal](#rehearsal) ran on private records.

## Records

| Kind | `data` | Meaning |
| --- | --- | --- |
| `unit-profile` | `unit`, optional `models`, the unit characteristics, optional `gaps` | One stat line. With neither `models` nor a model gap, it describes every model of the unit. |
| `weapon-profile` | `unit`, `wargear`, the weapon characteristics, optional `keywords` and `gaps` | One stat line of a weapon as this unit's datasheet prints it. A weapon with several modes has one profile per mode, all naming the same `wargear`. |
| `attachment` | `unit`, optional `leads`, `supports` and `gaps` | The units this unit may join as a Leader (`leads`) or as a support attachment (`supports`). |
| `transport-profile` | `unit`, `capacity` or a capacity gap | The transport's alternative loads, passenger allowances, exceptions and equipment-dependent capacities. |

A stat line's ID is scoped by its unit, as in `<unit ID>.<profile>`, because two datasheets can print different stat lines for wargear with the same ID. An attachment or transport profile uses its unit's ID.

## Characteristics

| Field | Value |
| --- | --- |
| `movement` | Inches as an integer, `{ "atLeast": n }` for a move of at least `n` inches, or `null` when the datasheet prints none. |
| `toughness`, `wounds`, `strength` | A positive integer. |
| `save`, `leadership` | A roll: `3` means 3+. |
| `objectiveControl` | A non-negative integer, or `null` when the datasheet prints none. |
| `invulnerableSave` | `{ "roll": n }`, with `against: "ranged"` when it applies only to ranged attacks and `conditional: true` when another rule of the datasheet says when it applies. |
| `baseSize` | `"hull"`, `{ "diameter": mm }`, or `{ "length": mm, "width": mm }` for an oval, each optionally `approximate` or `flying`. |
| `range` | Inches as a positive integer, or `"melee"`. |
| `attacks`, `damage` | A positive integer, or dice written as `D6`, `2D3` or `D6+1`. |
| `skill` | The ballistic or weapon skill as a roll, or `null` when the weapon makes no hit roll. |
| `armourPenetration` | Zero or a negative integer. |
| `keywords` | Weapon keywords as printed, one per item, including any parameter such as `Rapid Fire 1`. |

Unit profiles must state `movement`, `toughness`, `save`, `wounds`, `leadership` and `objectiveControl`, and weapon profiles `wargear`, `range`, `attacks`, `skill`, `strength`, `armourPenetration` and `damage`, unless a gap names the field.

## Transport capacity

Each `loads` entry is one way to load the transport. Each consists of one or more pools, and eligible passengers may occupy those pools at the same time. A pool gives its `limit`, whether it `count`s models or units, its `selectors` and an optional `maxWounds`. A selector is a keyword or a phrase formed by consecutive keywords. A passenger can match any selector in the list.

An `excluded` entry refuses a passenger matching its selectors unless an `except` selector also matches. `space` sets the number of places a matching model takes. Use the first matching entry and one place by default. The optional `moreWoundsThan` threshold is strict. If the transport carries a `whenEquipped` wargear item, that item's pool replaces the first pool of the first load. Multiple active replacements need a ruling before the capacity can be evaluated.

Use a `capacity` gap when the complete transport capacity cannot be represented or an equipment condition cannot be joined. Deployment abilities such as splitting a unit before it embarks need separate mechanics records.

## Gaps

A gap is `{ "field", "reason" }`. `unrepresentable` means the source prints a value this format has no form for, such as an invulnerable save that differs by model, and the field is left out. `no-target` means the source names something no catalogue ID identifies: a weapon whose wargear the unit neither carries nor offers, a unit profile that matches none of the unit's models, or an attachment target with no unit. An attachment keeps the targets that resolve and adds one `no-target` gap for each that does not. A converter records a gap instead of choosing a nearby value or target.

## Local and qualified references

A profile's `unit` bounds what else it may name. Its `models` must belong to that unit, and any weapon profile or equipment condition must refer to wargear the unit carries or offers. Attachment targets are qualified: they may name any current unit in the release, including another faction's. Every reference resolves within the record's own rules version, so a release that holds only some factions cannot name a unit outside them.

## Validation

`validateProfiles(identity, records)` takes the identity release that holds both the profile entries and the roster entries they name. It checks each record's `data` against its kind and these rules, which the schema cannot express:

- Every record uses the identity release's rules version, its entry is current, and an entry has at most one record.
- Every ID a record names is current in the release and appears in its identity entry's `references`, so a release's `dependsOn` lists the roster category.
- The local references above hold, and no unit attaches to itself.
- A required characteristic is either stated or a gap, never both.
- When a unit has several unit profiles, each names its models or has a `models` gap, and no model has two profiles.
- A unit has at most one attachment and one transport record. A transport can state one replacement pool for each wargear ID.

`profiles.of(kind, unit)` lists a unit's records of one kind, and `profiles.attachedBy(unit, role)` lists the units that may lead or support it.

## Versioning

Profiles follow the [identity rules](catalogue-identity.md). A characteristic change keeps the profile's ID. A weapon that splits into modes retires its old profile with the new ones as `replacedBy`, so a saved reference to it resolves to them. A profile ID is never reused for a different stat line.

## Rehearsal

The private stage converted the [definition rehearsal](definition-cutover.md)'s profile and attachment inventory for all nine rules versions at the same snapshot. It resolved datasheets and attachment targets through the stable ID ledger, and every rules version's records pass `validateProfiles`. Counts at `mfm-1-6`:

| Check | Result |
| --- | --- |
| Units with profiles | 5,055 of 6,233. 2,216 from their own faction's datasheet and 2,839 from a shared datasheet whose copies are identical; 1,178 units have no datasheet. |
| Unit profiles | 6,009, of which 5,481 have no gap. Of the 1,575 in units with several profiles, 1,105 name their models by exact name and 470 have a `models` gap, 4 of them because two profiles match the same model. |
| Weapon profiles | 29,957, of which 26,282 have no gap. 26,295 join to wargear the unit carries or offers by exact name; 3,662 have a `wargear` gap. |
| Unrepresentable values | 95 in all nine versions together: base sizes printed without a size (52), skills or leadership printed without `+` (30), invulnerable saves that differ by model or have two values (8), ranges printed as `?` or `N/A` (4), and armour penetration printed as `-` (1). |
| Attachment links | 8,899 statements: 8,566 resolve within the unit's faction, 39 to one unit of another faction, 10 to several units and 284 to none. They form 3,777 Leader and 908 support relations in 1,065 records. |
| Both directions | The source lists a relation on the joining unit, on the unit joined, or both. 3,059 Leader relations appear on both sides, 140 only on the joining unit and 578 only on the unit joined. For support the counts are 861, 28 and 19. The private inventory holds their union for review. It needs a comparison against the actual roster rules before it can decide attachment legality. |

Across the eight retired versions, 33,628 profile IDs are also current and 1,330 belong to units whose current profiles differ because a profile was renamed or removed; that is 90.0% to 99.4% kept per version. Another 12,228 belong to units that have no current datasheet, and 902 to units no longer current.

The private transport stage joined all 270 datasheets with a transport rule across the nine versions to roster IDs. The existing reader can express 266 capacity records, including 79 of 81 current datasheets. The other four records flag a capacity gap. One current rule's equipment condition resolves to the unit's exact wargear ID.

The staged capacities reproduce eligibility and pool occupancy in all 1,168,904 single-passenger cases, covering loads of 1, 5, 10 and 20 models and all equipment variants in the input. These cases use the same rules reader and load checker as the baseline. Source review and a replay of full saved formations remain open.

## Not covered

- Additional transport and other profile lines still need review where the reader exposes no structured capacity. The profile inventory has 536 transport and other lines at `mfm-1-6`, including repeated lines for the same datasheet.
- Abilities and rules text are mechanics, not profiles.
- An attachment target named only by keyword, or a relation that holds only under a condition, has no form and becomes a `no-target` gap.
- Profiles are duplicated for every faction that offers a shared datasheet, as roster definitions are.
