# Rule summaries

A rule summary gives players one rule in plain language, with bold keywords and links to related rules, and names the official sources it was checked against. Summaries are the `data` of two [catalogue release](catalogue-releases.md) categories, one record per [identity](catalogue-identity.md) entry: `rules-reference` for abilities, core rules, keywords and FAQs, and `mission-rules` for mission cards, awards, actions and twists. The contract is [src/rule-summaries/summaries.v1.schema.json](../src/rule-summaries/summaries.v1.schema.json) plus the rules below, and [src/rule-summaries/summaries.ts](../src/rule-summaries/summaries.ts) is a reference implementation of both.

A rule that the [mechanic format](records.md) fully describes also ships as a mechanic record. Its summary record carries the same structured fields as typed facts.

The [MFM 1.6 input](../data/mfm-1-6/rule-summaries/README.md) holds the summaries for the current rules version and lists the entries still unresolved. Each earlier 11th-edition rules version has its own input under `data/<version>/rule-summaries/`, so data saved under it keeps resolving, and each is released on a [line of its own](catalogue-releases.md#release-lines).

## Records

| Category | Kind | `data` beside the common fields |
| --- | --- | --- |
| `rules-reference` | `ability` | `ruleType`, optional `group`, for a Stratagem or Enhancement an optional `detachment`, and for a Stratagem `cp` and optional `stratagem` timing. |
| `rules-reference` | `core-rule` | `document`, optional `section` and `ruleNumber`. |
| `rules-reference` | `core-ability`, `weapon-ability` | `parameterized: true` when the keyword takes values, such as Sustained Hits X. |
| `rules-reference` | `faq` | `publication`, `amends`, optional `amendsUnlisted`. |
| `mission-rules` | `mission-card` | `pack` and `card`. |
| `mission-rules` | `mission-award` | `pack`, `card`, `vp` and optional `max`. |
| `mission-rules` | `mission-action`, `mission-twist` | `pack`. |

`ruleType` is `army-rule`, `detachment-rule`, `stratagem`, `core-stratagem`, `enhancement`, `unit-ability`, `core-ability` or `weapon-ability`. A `core-ability` or `weapon-ability` is a core ability or weapon ability as a faction's rules list it, such as Deep Strike or Deadly Demise D6; its entry references the `core-ability` or `weapon-ability` record that defines the keyword. `group` is the display heading the rule is printed under, such as its detachment. `detachment` names the Detachment entry a detachment's Stratagem or Enhancement belongs to, by `{ kind: "detachment", id }`, so an app can join them without matching names; a core Stratagem has none. A Stratagem states its `cp` cost, and only a Stratagem has one. Its `stratagem` timing gives the `phases` it can be used in, the `turn` (`own`, `opponent`, `any`), its `type` (`battle-tactic`, `strategic-ploy`, `epic-deed`, `wargear`) and `oncePerPhase`:

- `phases` are `command`, `movement`, `shooting`, `charge`, `fight` and `end-of-turn`, the end of a turn after its Fight phase. A Stratagem usable in any phase lists all six, so it differs from one that names the five phases.
- Where the phases' turns differ, such as your opponent's Shooting phase or either player's Fight phase, `windows` gives each phase its `turn`, as `[{ phase, turn }]` in the order of `phases`, and `turn` is `any`.
- `type` is left out where the official source gives the Stratagem none; it is never inferred.

`pack` and `publication` are display names. `card` is `primary` or `secondary`. An award scores `vp` victory points, up to `max` where the card caps it.

The record's display name is its identity entry's `name`.

## Common fields

| Field | Meaning |
| --- | --- |
| `summary` | The rule in original wording. |
| `summarySpans` | Bold and link ranges within `summary`, as in [mechanic summaries](records.md#summaries): UTF-16 offsets with an exclusive end, in ascending order and never overlapping. A link names its destination by `{ kind, id }` in the record's rules version. |
| `citations` | The official sources the summary was checked against, described below. |
| `interpretation` | Open questions the summary's reading rests on, each as `{ question }`. The summary states the reading the project chose. Show the flag so players know the source leaves the point open. |
| `facts` | Optional typed facts as `{ format, version, fields }`. |

The record's `source` locates the printed rule, so it is the publisher document where there is one, else the app build. A record that adapts upstream data carries an `attribution`, as any [catalogue record](catalogue-releases.md#inputs) can.

## Citations

| `type` | Fields | Meaning |
| --- | --- | --- |
| `app` | `title`, `appVersion`, `dataBuild`, `releaseDate` | A signed build of an official app: its version, data build number and release date (`YYYY-MM-DD`). |
| `publisher` | `title`, `url`, optional `page` | A publisher document, titled as it titles itself. A URL without a page is allowed where the page is not known. |

## Typed facts

`format` names the vocabulary of `fields` and `version` its version. [Rule facts](rule-facts.md) defines the `vs-data-facts` format, version `1`: closed typed blocks, such as an Enhancement's eligibility or an award's scoring, and the drafted structured reading as `detail`. Facts in the `vs-data-mechanic` format, version `1`, are a mechanic record's structured fields (`usage`, `trigger`, `target`, `conditions`, `effect`, `duration`, `restriction`) and must validate as a mechanic record with the summary record's ID, name, rules version and source. Other formats are carried as given. Read behaviour from the mechanics release where the rule has a mechanic record.

## FAQs

Each FAQ is its own record. `amends` lists the rules it changes or answers, by `{ kind, id }`, and needs at least one. A unit, detachment or publication it amends can be an entry of a retained category, such as `rosters`, before that category publishes records. `amendsUnlisted` names targets the catalogue has no entry for yet, by the `kind` they will have, such as `unit` or `detachment`, and their printed `name`. `summaries.amendedBy(rule)` lists the FAQs that amend a rule, so an app can show them beside it.

An FAQ that a newer publication replaces is retired in the identity release with `retired.sources` naming that publication. Its record leaves the release, and the [change report](catalogue-releases.md#changes-from-the-previous-release) lists the sources with the retirement.

## Coverage

Identity entries without a record are listed as `unresolved`, and their category reports `partial`, until a reviewed summary is published. A link or FAQ target whose entry has no record is listed in the category's `unresolvedReferences`.

## Validation

`validateSummaries(identity, records)` takes the identity release that holds the summary entries and every rule they name. It checks each record's `data` against its kind and these rules, which the schema cannot express:

- Every record uses the identity release's rules version, its entry is current, and an entry has at most one record.
- Spans lie within the summary, in ascending order, without overlapping.
- Every rule a span links to or an FAQ amends is current and appears in the identity entry's `references`, so a release's `dependsOn` and `unresolvedReferences` include it. A summary may link its own rule's name without a reference.
- A Stratagem has a `cp` cost, and no other ability has a cost or Stratagem timing.
- A Stratagem's `windows` give each of its `phases` in order, with turns that differ, and its `turn` is `any`.
- Only a Stratagem or Enhancement names a `detachment`, which is current and appears in its identity entry's `references`.
- `vs-data-facts` facts match the shape for the record's kind, with award rounds in ascending order, and `vs-data-mechanic` facts validate as a mechanic record.

## Versioning

Summaries follow the [identity rules](catalogue-identity.md). A rewording or correction keeps the ID. A rule that splits or is replaced retires its old ID with `replacedBy`, and a retired FAQ names the publication that superseded it.

## Fixtures

[fixtures/rule-summaries](../fixtures/rule-summaries) is a catalogue release input for an invented faction and mission pack, with one record of each kind, an FAQ amending an army rule and an unlisted detachment, an interpretation flag, an attributed record, mechanic facts, a retired FAQ and an undrafted entry. [test/rule-summaries.test.ts](../test/rule-summaries.test.ts) validates it, builds it as a release and covers the rules above.
