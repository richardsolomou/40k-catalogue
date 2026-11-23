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
| `ability` with `ruleType` `enhancement` | `enhancement`, `detail` |
| `ability` with `ruleType` `stratagem` or `core-stratagem` | `stratagem`, `detail` |
| `mission-award` | `award` (required), `detail` |
| any other summary kind | `detail` |

A Stratagem's CP cost, phases, turn and type are the record's own `cp` and `stratagem` fields, not facts.

A typed value the source leaves open, or that is not typed yet, is `{ "unresolved": "<what is missing>" }`. Show the summary for it and treat it as not calculated.

### Typed blocks

Typed blocks are closed: every field is listed here, and a value the source leaves open is left out rather than guessed. They come from the typed rows of the official app build the record cites.

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

### Detail

`detail` is the drafted structured reading of the rule: its triggers, conditions, targets and effects as objects and lists. It is not a closed vocabulary. Within it, an object's `kind` names what the object is, such as `re-roll` or `grant-ability`, and `operation` only ever names how a value changes (`add`, `subtract`, `improve`, `worsen`, `set`). Values the typed blocks or the record's own fields carry are left out of `detail`.

Use `detail` to show or compare structure. Read game behaviour from the typed blocks, or from the [mechanics release](releases.md) where the rule has a mechanic record, and treat a rule without them as not calculated.

## Versioning

Version `1` grows only by adding optional blocks for a kind. A change to the meaning or shape of an existing block, or a closed vocabulary for `detail`, is a new version. Records published before this format carry facts in an earlier, unversioned format, `catalogue-core-facts`, until their rules version's next release. Treat those like `detail`.
