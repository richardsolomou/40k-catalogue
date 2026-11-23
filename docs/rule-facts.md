# Rule facts

Typed facts let an app read what a rule does without parsing its wording. They are the optional `facts` of a [rule summary](rule-summaries.md), in the `vs-data-facts` format:

```json
{ "format": "vs-data-facts", "version": "1", "fields": { … } }
```

The contract is [src/rule-summaries/facts.v1.schema.json](../src/rule-summaries/facts.v1.schema.json), which every catalogue release archive includes, and `validateSummaries` in [src/rule-summaries/summaries.ts](../src/rule-summaries/summaries.ts) checks each record's facts against the shape for its kind.

## Shapes

`fields` holds typed blocks and an optional `detail`. Which blocks a record may carry depends on its kind:

| Record | `fields` |
| --- | --- |
| `ability` with `ruleType` `enhancement` | `enhancement`, the [effect blocks](#effect-blocks), `detail` |
| `ability` with `ruleType` `stratagem` or `core-stratagem` | `stratagem`, the effect blocks, `detail` |
| any other `ability`, `core-ability`, `weapon-ability` | the effect blocks, `detail` |
| `mission-award` | `award` (required), `detail` |
| any other summary kind | `detail` |

A Stratagem's CP cost, phases, turn and type are the record's own `cp` and `stratagem` fields, not facts.

A typed value the source leaves open, or that is not typed yet, is `{ "unresolved": "<what is missing>" }`. Show the summary for it and treat it as not calculated.

### Typed blocks

Typed blocks are closed: every field is listed here, and a value the source leaves open is left out rather than guessed. `enhancement`, `stratagem` and `award` come from the typed rows of the official app build the record cites; the [effect blocks](#effect-blocks) are read from the rule as that build prints it.

**`enhancement`** says who may take an Enhancement:

| Field | Meaning |
| --- | --- |
| `type` | `model` for a model's Enhancement, `unit` for one that applies to the whole unit, `upgrade` for a unit upgrade. |
| `points` | Its points cost, as the Enhancement prints it. |
| `perRoster` | How many times one army may include it, when more than once. |
| `outsideLimit` | `true` when it does not count towards the army's Enhancement limit. |
| `eligibility.anyOf` | The bearer qualifies when it matches any entry. An entry lists `keywords` and `factionKeywords` the bearer must all have, or names one `unit` by catalogue reference, or both. |
| `eligibility.excludedKeywords` | Keywords that disqualify a bearer. |
| `eligibility.requiredWargear` | Wargear the bearer must have, by name. |
| `eligibility.epicHeroes`, `nonCharacters` | `true` when Epic Heroes, or units that are not Characters, may also take it. |
| `eligibility.notWarlord` | `true` when the bearer cannot be the Warlord. |

Keywords are written in upper case, as the rules print them.

**`stratagem`** says how often a Stratagem can be used, when, and on what:

| Field | Meaning |
| --- | --- |
| `limit` | How often a player can use it: once per `phase` (the core rules' limit), `turn`, `battle-round` or `battle`. |
| `perTarget` | How often the same unit or model can be its target, where the card limits that. |
| `restricted` | `true` when the card states another restriction, which only the summary gives. |
| `when.at` | The moment within its phases and turn: the `phase`, its `phase-start` or `phase-end`, a `turn-start` or `turn-end`, or the `reinforcements-step`. |
| `when.after` | The event it answers, such as `enemy-selected-targets`, `enemy-shot`, `friendly-fell-back` or `friendly-selected-to-fight`. The schema lists every value. |
| `target.count` | How many units or models it targets. `target.triggering` is `true` instead when it targets the unit named in `when.after`. |
| `target.side`, `target.entity` | `friendly` or `enemy`, and `unit` or `model`. |
| `target.keywords` | Keywords the target must all have. `target.anyOf` lists alternatives instead, each with its own `keywords`. |
| `target.excludedKeywords` | Keywords that disqualify a target. |
| `target.conditions` | Typed conditions on the target, such as `not-selected-to-shoot` or `targeted-by-the-attacking-unit`. |
| `target.more` | `true` when the target has further conditions that only the summary gives. |
| `extraCp` | The extra `cp` its optional additional effect costs, and `exclusive: true` when that effect replaces the main one. |

**`award`** describes how a mission award scores. Its `vp` and `max` are the record's own fields.

| Field | Meaning |
| --- | --- |
| `count` | `once` when the award is claimed or not, `each` when it scores for every occurrence. |
| `scoring` | For a secondary card, `fixed` or `tactical` when the award applies only when the card is played that way, `standard` when it applies however the card is played. |
| `cumulative` | `true` when the award adds to other awards claimed at the same moment. |
| `mutuallyExclusive` | `true` when the award cannot be claimed together with the card's other mutually exclusive awards. |
| `rounds` | The battle rounds it can be scored in, ascending. |
| `endOfBattle` | `true` when it can also be scored at the end of the battle. |

### Effect blocks

The effect blocks say what an ability, Stratagem, Enhancement, army or detachment rule, or core or weapon ability does to the game. A record carries only the blocks its rule gives; a rule with none of them does nothing these blocks can state. A record without effect blocks has not been read, or its rule states nothing they type: treat what its summary describes as not calculated.

Keyword values are written in capitals. A **selector** is a keyword, keywords printed together (`ADEPTUS ASTARTES INFANTRY`), or a datasheet's name, and a unit matches it when its keywords include every keyword of it (a keyword also matches its plural). A few selectors name a status a rule treats like a keyword, such as `BATTLE-SHOCKED` or `AFFLICTED`.

**`grants`**: the abilities the rule gives. `abilities` lists each grant; an empty list means the rule gives abilities none of which is a core ability by name.

| Field | Meaning |
| --- | --- |
| `ability` | The ability or abilities given, by name with any value as printed (`Feel No Pain 5+`, `Scouts 6"`, `Infiltrators and Stealth`). |
| `to` | Who gains it: the `bearer`, the `leader` attached to this unit, the `unit`, or the `models` the `models` selector names. |
| `named` | `true` when the rule names the ability outright, so it applies even where the unit has no such rule of its own. |
| `whileAttached` | `true` when it applies only while the bearer and its unit are attached. |
| `counterpart` | Selectors, any of which the unit on the other side of the attachment must match; an empty list matches no unit. |
| `linked` | `true` when it applies only to a unit that already has the ability, or may use deployment abilities it does not have. |
| `against` | The attacks a granted Feel No Pain is limited to: `psychic-attacks`, `mortal-wounds` or both. |

`grants.normalized` is the same statement read from the rule's text with its deployment abilities written out in full, where that reads differently; `null` when it states no grant.

**`weaponAbilities`**: weapon abilities the rule adds to weapons. Each gives `ability` (a weapon keyword as printed, such as `LETHAL HITS` or `SUSTAINED HITS 1`), the `attacks` it covers (`ranged`, `melee` or both) and `to`: the bearer's `own-unit`, the unit it is leading (`led-unit`), or units across the `army`, which must match one of `keywords` and none of `excludedKeywords`.

**`reserves`**: `exempt: true` when this unit's points do not count towards the Strategic Reserves limit, and `exemptUnits` for the selectors of friendly units whose points do not.

**`invulnerableSave`**: `{ "roll": n }`, an invulnerable save of n+ the rule gives.

**`upgradesWeapon`**: `true` for an Enhancement that improves a weapon its bearer is equipped with, named where the bearer takes it.

**`reminder`**: when a player acts on the rule. Each of `timings` gives `at` (`phase-start`, `phase-end`, `turn-start`, `turn-end`, `round-start` or `round-end`), the `phase` (`command`, `movement`, `shooting`, `charge`, `fight` or `any`) for a phase moment, the `turn` (`own`, `opponent` or `any`) and `firstRoundOnly`. `whileDestroyed: true` when the rule acts as its unit is destroyed.

**`roster`**: what the rule adds to an army list's capabilities. `addsUnits` lists units it adds to the army during the battle: the `unit` by name, the `trigger` (`shooting` for a unit that makes one instead of shooting, `kill` for one made when it destroys a model) and whether one unit with the ability may use it per turn (`shared`). `movement` lists moves it allows: `advance-and-charge`, or `surge-after-enemy-shooting` for a surge move after an enemy unit's attacks destroy one of its models.

**`attachment`**: the units a Leader text lets its bearer join (`units`, by name as printed), `requiresLeader` when only a unit that already has a Leader can take it, and `substitutes`: units a Leader that can join them may join this unit instead. A datasheet's own Leader units are its [attachment profile](datasheet-profiles.md); this block holds what other rules add.

**`references`**: the rules the rule's text names, as `{ kind, id }`. They are also the record's identity references.

**`combat`**: how the rule changes attacks, in every place a rule can apply from.

| Field | Meaning |
| --- | --- |
| `applies.target` | The units the rule can benefit: those matching all selectors of one of `anyOf` and none of `excluded`, every unit when absent, and none when `none` is `true`. |
| `applies.leading` | `true` when it applies while its model is leading a unit. |
| `applies.reachesAttached` | `true` when it reaches the unit its bearer is attached to. |
| `applies.selectsOther` | `true` when it selects another friendly unit to benefit. |
| `applies.recipient` | Present when the rule's effect goes to a unit it selects, with that unit's `target`. |
| `applies.orders` | Present for an army rule whose models issue Orders, with the `target` units that gain an Order's benefit. |
| `contexts` | For each context, the index of its tree in `trees`. A context the rule cannot be read in is absent: treat the rule as not calculated there. |
| `trees` | Decision trees. Node 0 is the root; a node is `{ "reading": n }` or `{ "ask": question, "yes": i, "no": j }`, which continues at node `i` or `j`. |
| `readings` | What the rule does once the questions are answered (below). |

A context is `<use>.<models>.<keywords>`:

- `use`: the rule as a unit's `own` ability; its model `leading` the unit; an `aura` from another unit; an `army` or detachment rule; or a Stratagem used for its unit's attacks in the Shooting phase (`stratagem-shooting`), the Fight phase (`stratagem-fight`) or both (`stratagem-both`).
- `models`: `one` for a lone model, `many` otherwise.
- `keywords`: `known` when the app knows the unit's keywords, `unknown` when it does not; with unknown keywords, questions about them become choices for the player.

A question is about the unit the rule applies to: `unitHas` a selector, `everyModelHas` a selector, has exactly the `keyword`, or whether the rule is a Psychic ability (`psychic`).

A reading gives the player's `choices` and the one that applies by `default`, 1-based, or 0 when none applies until the player picks one. A reading without `choices` is one the rule's effect cannot be calculated from. `shown` is the same reading with the weapon abilities and characteristics that change no roll left in, for a datasheet that shows everything the rule gives, where that differs (`null` when nothing is shown). `fallback` is a coarser reading to offer where `choices` are absent, and `roles` whether the rule takes part in attacking, defending or both.

A choice holds `effects` that apply together while its `conditions` hold. A condition is a `kind`: `option` (the player picked the choice's `option`, a named option of the rule), `leading`, `charged`, `remained-stationary`, `activated`, `selected-target`, `selected-visible-attacker`, `set-up-as-reinforcements`, `source-destroyed-unit`, `target-in-engagement-range`, `selected-target-in-engagement-range`, `target-closest`, `target-on-objective`, a distance in `inches` (`within`, `attacker-within`, `selected-unit-within`, `selected-target-within`, `target-within`, `objective-within`), `wounds-remaining` between `min` and `max`, a `roll` (`attacks`, `roll`), `activated-at-start` of a `turn`, the `keywords` the models (`for-models`) or units (`for-units`) must have, or `stated`: a condition only the summary gives, with a short `label` where one can be shown. `armyWide` marks an option picked for the whole army rather than per unit, and `selected` the keyword units selected for it gain.

An effect applies to one `role`, `attacker` or `defender`, for the `attacks` it covers. Its other fields, each optional:

| Field | Meaning |
| --- | --- |
| `weaponAbility` | A weapon ability the attacks gain. |
| `weaponHas` | The effect applies only to weapons with this weapon ability. |
| `weapon` | The effect applies only to this weapon, by name. |
| `characteristic` | A weapon characteristic (`attacks`, `ballistic-skill`, `weapon-skill`, `strength`, `armour-penetration`, `damage`) changed by `add` or set to `set`; `nonCumulative` when it does not stack with other changes. |
| `targetKeywords`, `excludedTargetKeywords` | Selectors the attack's target must match one of, or none of. |
| `excludedModelKeywords` | Models matching one of these make their attacks without the effect. |
| `condition` | A comparison the attack must meet: `stronger` (Strength above the target's Toughness), `not-stronger`, `double-strength`, or `critical-wound`. |
| `ignoreHitModifiers`, `ignoreWoundModifiers`, `ignoreSkillModifiers` | Modifiers to the roll or skill are ignored. |
| `criticalHit`, `criticalWound` | The unmodified roll that scores a Critical Hit or Wound; with `…RequiresSuccess` only when the roll also succeeds. |
| `allHitsCritical` | Every hit is a Critical Hit. |
| `unmodifiedSix` | One failed `hit` or `wound` roll per phase becomes an unmodified 6. |
| `invulnerable`, `save` | An invulnerable save, or a Save characteristic, of this roll. |
| `improveSave` | The Save characteristic improves `by`, never past `best`. |
| `toughness`, `targetToughness`, `targetSaveModifier` | Changes to the defender's Toughness, the target's Toughness, or the target's saving throws. |
| `damageDivisor`, `damageReduction` | Damage is divided by, or reduced by, this number. |
| `rolls` | `hitModifier`, `woundModifier` (added to the roll), `hitReroll`, `woundReroll` (`ones` or `failed`), `cover` (the defender has cover) and `singleRerolls` (one `hit`, `wound` or `damage` roll may be re-rolled). |
| `feelNoPain`, `psychicFeelNoPain`, `mortalFeelNoPain` | A Feel No Pain roll against all damage, psychic attacks, or mortal wounds. |
| `mortalWounds` | Mortal wounds inflicted `before` or `after` the attacks: `rolls` dice per unit, or per model when `perModel`, each mapping a result from `min` to `max` to `damage` (`dice` × D`sides` + `bonus`); `psychic` when they come from a psychic ability, and `sacrifice` for the attacker's own models destroyed first. |
| `damageReroll` | Damage rolls may be re-rolled: `ones` or `any`. |
| `unitStat` | A unit characteristic no roll reads (`movement`, `leadership`, `objective-control`) changed by `add`. |
| `ability` | A named ability the unit gains, such as Stealth. |
| `activates` | Named options of the unit's other rules this makes active together. |

### Detail

`detail` is the drafted structured reading of the rule: its triggers, conditions, targets and effects as objects and lists. It is not a closed vocabulary. Within it, an object's `kind` names what the object is, such as `re-roll` or `grant-ability`, and `operation` only ever names how a value changes (`add`, `subtract`, `improve`, `worsen`, `set`). Values the typed blocks or the record's own fields carry are left out of `detail`.

Use `detail` to show or compare structure. Read game behaviour from the typed blocks, or from the [mechanics release](releases.md) where the rule has a mechanic record, and treat a rule without them as not calculated.

## Versioning

Version `1` grows only by adding optional blocks for a kind. A change to the meaning or shape of an existing block, or a closed vocabulary for `detail`, is a new version. Records published before this format carry facts in an earlier, unversioned format, `catalogue-core-facts`, until their rules version's next release. Treat those like `detail`.
