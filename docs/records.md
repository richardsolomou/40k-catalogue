# Mechanic records

A mechanic record describes one ability as structured data that any app can validate and render the same way. The contract is the JSON Schema in [schema/mechanic.v1.schema.json](../schema/mechanic.v1.schema.json). The validator and summary renderer in `src/` are a reference implementation of that contract.

## Format version 1

| Field | Meaning |
| --- | --- |
| `formatVersion` | Always `1`. A change that would break existing consumers gets a new version and a new schema file. |
| `id` | Project ability ID, lowercase words separated by `.` or `-`. |
| `name` | Display name of the ability. |
| `summary` | Generated and reviewed prose body. Required in released records and optional while drafting. `name` and `usage.cp` provide the heading. |
| `summarySpans` | Generated bold and link ranges within `summary`. Each link names the destination by catalogue kind and ID. |
| `summaryTerms` | Optional reviewed phrases with bold formatting or an explicit destination for a named ability or rule. |
| `rulesVersion` | The `edition` and `update` the record was checked against. |
| `source` | Source `title` and at least one of `page` or `url`, so a reviewer can find the printed rule. |
| `attribution` | For an adapted record, the upstream `url`, pinned `revision`, contributor `credit`, `licence` URL and `changes` made to the input. |
| `usage` | Optional CP cost, turn or phase windows, a once-per-turn or once-per-phase limit, and bearer model eligibility. |
| `trigger` | A phase boundary, movement event, destruction, an always-on effect, or a use the player chooses during a usage window. Model destruction can specify that the window closes at a pending roll. |
| `target` | The source unit, a unit or model bound by the trigger, or a unit selected by side, keywords, and range. A triggering model can carry a destroyed-target exception. |
| `conditions` | Checks that must all pass. A `status` condition reads a unit's state now, when the phase began, or when the turn began. A `within` condition checks distance between two units. A `not-selected` condition checks that a unit has not been selected to shoot or to fight this phase. A `source-model-leading` condition checks whether the model carrying the ability is leading a unit. |
| `effect` | A roll or characteristic modifier, a re-roll of all results or only 1s, weapon abilities granted to the target's weapons, [core abilities](#core-abilities) granted to the target, mortal wounds, a roll threshold, activation of a named ability, Desperate Escape tests, or a movement distance threshold. |
| `duration` | How long the effect lasts. A roll threshold can be limited to a phase, and modifiers, re-rolls and granted weapon or core abilities require a duration unless they are always on. Immediate effects such as mortal wounds require a discrete trigger. |
| `restriction` | An optional second consequence checked at the end of a move, such as a charge restriction based on its endpoint. |

Conditions and ranges can refer to the source unit, the target, or a participant the trigger introduces. A unit-destruction trigger also binds the unit that made the kill. A model-destruction trigger binds the destroyed model. A `within` condition measures between two different units.

When the target is selected, a condition that mentions `target` restricts which unit can be selected. Other conditions are checked when the trigger fires, before anything is selected.

## Timing

An `always` trigger applies a continuous effect while the ability is in play and its conditions hold. It takes no duration, selected target, CP cost, window or usage limit. A `use` trigger lets the player choose when to use the ability during one of its `usage.windows`. Use explicit timing from the source for either trigger. Missing timing remains a gap.

## Weapons

A `re-roll` or `grant-weapon-abilities` effect can set `weapons` to `ranged` or `melee`. Without it, the effect covers every weapon the target's models are equipped with. A re-roll limited to a weapon type must re-roll Hit or Wound rolls. Granted abilities come from a fixed list of core weapon abilities: Melta, Rapid Fire and Sustained Hits carry a `value`, and Anti carries a `keyword` and a `threshold`.

## Core abilities

A `grant-abilities` effect gives the target one or more of Deep Strike, Fights First, Infiltrators, Lone Operative, Stealth, Scouts and Feel No Pain. Scouts carries its distance in `inches`. Feel No Pain carries a `threshold` and can list `against` as `psychic-attacks`, `mortal-wounds` or both. An omitted `against` covers every wound the model would lose. Other named abilities and abilities printed with the grant remain gaps.

## Gaps

When a part of an ability does not fit the format yet, replace that part with `{ "unresolved": "<what is missing, in your own words>" }`. Any of `trigger`, `target`, each condition, `effect`, and `duration` can be unresolved. The record stays valid, the validator lists each gap by its JSON pointer, and the summary shows `[unresolved: …]` where that part would be.

## Summaries

The renderer uses the structured fields to generate `summary`. The same record gives the same body regardless of key order. A typical selective effect renders in this order.

```text
<trigger>, [if <conditions>, ][select <unit>[ that <eligibility>], then ]<effect>[ <duration>].
```

Summaries are display text. Apps should read game behaviour from the structured fields. The [release guide](releases.md) explains how to package both.

The renderer keeps the casing of structured keyword labels and makes them bold. It assigns stable targets to weapon ability grants, known core abilities and recognised core rule phrases. A named rule can supply an exact `summaryTerms` label and `target` during authoring. Case alone never assigns a destination.

Each generated `summarySpans` entry has `start` and `end` offsets, with an exclusive end. The offsets index UTF-16 code units in the exact `summary` string, so `summary.slice(start, end)` returns the text to render. `bold: true` applies emphasis. A `target` is `{ kind, id }` in the record's `rulesVersion`. Resolve that pair through the catalogue index. Existing occurrences are already located in the JSON.

## Fixtures

[fixtures/valid](../fixtures/valid) holds invented abilities with the expected `summary` in each JSON record. [fixtures/invalid](../fixtures/invalid) holds records that must fail validation. A consumer with its own implementation can check itself against both folders.

## Local checks

Install dependencies with Node 24 or later and pnpm:

```sh
pnpm install
```

Validate one or more records. Each gap is listed, and any error makes the command exit with status 1:

```sh
pnpm validate fixtures/valid/unresolved-gaps.json
```

Render a summary:

```sh
pnpm render fixtures/valid/targeted-effect.json
```

Run the fixture tests, the type check, and the Markdown lint:

```sh
pnpm test
pnpm check
pnpm lint:md
```
