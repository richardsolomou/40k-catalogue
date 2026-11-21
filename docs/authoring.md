# Authoring and review

This workflow turns a rule a contributor is authorised to read into a reviewed [mechanic record](records.md). A proposal holds the draft record, how it was drafted, and the review of each part. Only an approved proposal publishes anything.

## Inputs

Read the source yourself and write notes in your own words. Keep those notes, model prompts and responses, and any other intermediate files in `author-inputs/` at the repository root. Git ignores that folder. Never paste official prose, page images, or extracts into a model, a proposal, an issue, a pull request, or a CI artifact. See [using source data](source-inventory.md#using-source-data).

## Draft a proposal

Write the proposal as JSON outside `author-inputs/`. The contract is [src/authoring/proposal.v1.schema.json](../src/authoring/proposal.v1.schema.json).

| Field | Meaning |
| --- | --- |
| `proposalVersion` | Always `1`. |
| `record` | The draft mechanic record, including its `source` page or URL and its `rulesVersion`. |
| `drafting.method` | `by-hand`, `model-assisted` or `structured-import` for a deterministic translation of structured fields. |
| `drafting.author` | Who wrote the draft. |
| `drafting.model`, `drafting.modelInputs` | Required for a model-assisted draft. Inputs can only be `contributor-notes` or `structured-fields`, so source prose cannot be declared as an input. |
| `review` | Added by the reviewer: `reviewer`, `date`, and `checks`. |

Put any part of the rule that the format cannot express into the record as a gap, as [records.md](records.md#gaps) describes. Do not approximate it.

A structured import requires `record.attribution` with the upstream URL, pinned revision, contributor credit, licence URL and a description of changes. Review the upstream terms and check that they cover the fields being adapted. Keep the published rule reference in `record.source`. The attribution travels with the released record.

## Review it

The reviewer compares every part of the draft against the source, regardless of how it was drafted. Each check names a part by its JSON pointer into the record and gives one outcome:

| Outcome | When to use it |
| --- | --- |
| `confirmed` | The part matches the source. |
| `needs-correction` | The part is wrong. Explain the mistake in `note`. The proposal is held. |
| `corrected` | The author fixed the part. Keep the wrong value in `draft` and the reason in `note`, so the correction stays on record. |
| `unresolved` | The part is a gap in the record. Explain in `note` what is missing. |

The reviewer must check `/rulesVersion`, `/source`, `/trigger`, `/target`, each `/conditions/<n>`, `/effect`, and `/attribution`, `/summaryTerms`, `/usage`, `/duration`, and `/restriction` when they are present. The reviewer must also check every gap the validator reports, such as `/effect/ifBattleShocked`. Pay particular attention to timing, targets, durations, and exceptions. Confirm named references against the entry in the same rules version.

## Decide and publish

```sh
node src/authoring/cli.ts check <proposal.json>...
```

A proposal is approved only when its record is valid and every part is reviewed. It also needs no outstanding corrections, every `corrected` part must differ from its draft, and every gap must be reviewed as `unresolved`. Otherwise the proposal is held, and the command lists each reason and exits with status 1.

```sh
node src/authoring/cli.ts publish <proposal.json> data/<faction>/<detachment> reviews/<faction>/<detachment>
```

Publishing an approved proposal writes two JSON files:

- `<id>.json` holds the record, generated `summary` body and any bold or link `summarySpans`.
- `<id>.review.json`, the review: `id`, `rulesVersion`, `outcome`, `drafting`, `reviewer`, `date`, and the checks with their notes and corrected drafts.

The review shares the record's `rulesVersion`. Keep the review outside the records directory so release archives contain only the mechanic records and their summaries. Before committing, check that review notes and corrected draft values contain only your own wording and structured fields. A proposal with a reviewed gap can be committed for further work, and the release tool holds that record until the gap is resolved.

## Example

[fixtures/authoring](../fixtures/authoring) holds a synthetic ability drafted with model assistance. `cinder-ward.wrong-timing.json` places it in your own Shooting phase instead of your opponent's, and `cinder-ward.wrong-target.json` selects a friendly unit instead of an enemy one. Both are held. `cinder-ward.corrected.json` applies the timing correction and records one unresolved condition. It publishes the files in [fixtures/authoring/published](../fixtures/authoring/published). `test/authoring.test.ts` runs these cases.
