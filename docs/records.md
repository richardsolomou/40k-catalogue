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
| `trigger` | When the ability fires: the start or end of a phase (`phase-start`, `phase-end`) in a given player's turn, or a unit ending a kind of move (`move-end`). |
| `target` | The unit affected: `this-unit`, the `triggering-unit` of a `move-end` trigger, or one unit the player selects, optionally within a range. |
| `conditions` | Checks that must all pass. A `status` condition reads a unit's state now, at the start of the phase, or at the start of the turn. A `within` condition checks distance between two units. |
| `effect` | What happens: `modify-roll`, `modify-characteristic`, or `mortal-wounds`. |
| `duration` | How long a modifier lasts. Modifiers must have one and immediate effects such as mortal wounds must not. |

Conditions and ranges refer to units as `this-unit`, `triggering-unit`, or `target`. A record can only refer to a triggering unit when its trigger introduces one, and a `within` condition must measure between two different units.

When the target is selected, a condition that mentions `target` restricts which unit can be selected. Other conditions are checked when the trigger fires, before anything is selected.

## Gaps

When a part of an ability does not fit the format yet, replace that part with `{ "unresolved": "<what is missing, in your own words>" }`. Any of `trigger`, `target`, each condition, `effect`, and `duration` can be unresolved. The record stays valid, the validator lists each gap by its JSON pointer, and the summary shows `[unresolved: …]` where that part would be.

## Summaries

The renderer produces one sentence from the record's fields alone, so the same record always gives the same summary regardless of key order:

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
