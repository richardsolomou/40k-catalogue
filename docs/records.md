# Mechanic records

A mechanic record describes one ability as structured data that any app can validate and render the same way. The contract is the JSON Schema in [schema/mechanic.v1.schema.json](../schema/mechanic.v1.schema.json). The validator and summary renderer in `src/` are a reference implementation of that contract.

## Format version 1

| Field | Meaning |
| --- | --- |
| `formatVersion` | Always `1`. A change that would break existing consumers gets a new version and a new schema file. |
| `id` | Project ability ID, lowercase words separated by `.` or `-`. |
| `name` | Display name of the ability. |
| `rulesVersion` | The `edition` and `update` the record was checked against. |
| `source` | Source `title` and at least one of `page` or `url`, so a reviewer can find the printed rule. |
| `usage` | Optional CP cost, turn or phase windows, a once-per-turn limit, and bearer model eligibility. |
| `trigger` | A phase boundary, move selection or ending, move made through a named ability, or model or unit destruction. Model destruction can specify that the window closes at a pending roll. |
| `target` | The source unit, a unit or model bound by the trigger, or a unit selected by side, keywords, and range. A triggering model can carry a destroyed-target exception. |
| `conditions` | Checks that must all pass. A `status` condition reads a unit's state now, at the start of the phase, or at the start of the turn. A `within` condition checks distance between two units. |
| `effect` | A roll or characteristic modifier, mortal wounds, a roll threshold, activation of a named ability, Desperate Escape tests, or a movement distance threshold. |
| `duration` | How long the effect lasts. A roll threshold can be limited to a phase, and modifiers require a duration. Immediate effects such as mortal wounds apply at the trigger. |
| `restriction` | An optional second consequence checked at the end of a move, such as a charge restriction based on its endpoint. |

Conditions and ranges can refer to the source unit, the target, or a participant the trigger introduces. A unit-destruction trigger also binds the unit that made the kill. A model-destruction trigger binds the destroyed model. A `within` condition measures between two different units.

When the target is selected, a condition that mentions `target` restricts which unit can be selected. Other conditions are checked when the trigger fires, before anything is selected.

## Gaps

When a part of an ability does not fit the format yet, replace that part with `{ "unresolved": "<what is missing, in your own words>" }`. Any of `trigger`, `target`, each condition, `effect`, and `duration` can be unresolved. The record stays valid, the validator lists each gap by its JSON pointer, and the summary shows `[unresolved: …]` where that part would be.

## Summaries

The renderer uses the record's fields alone, so the same record always gives the same summary regardless of key order. A typical selective effect renders like this:

```text
<name>: <trigger>, [if <conditions>, ][select <unit>[ that <eligibility>], then ]<effect>[ <duration>].
```

Summaries are display text. Apps should read game behaviour from the structured fields.

## Fixtures

[fixtures/valid](../fixtures/valid) holds invented abilities, each with the summary it must render in a matching `.summary.txt` file. [fixtures/invalid](../fixtures/invalid) holds records that must fail validation. A consumer with its own implementation can check itself against both folders.

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
