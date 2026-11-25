# Contributing

Pick an [open issue](https://github.com/richardsolomou/vs-data/issues) whose dependencies are complete. Each issue has the context and checks needed to work on it independently. Keep each pull request focused on one issue.

## Develop locally

Use Node.js 24 or later and pnpm. The example is an invented mechanic you can validate and render.

```sh
pnpm install --frozen-lockfile
pnpm validate fixtures/valid/targeted-effect.json
pnpm render fixtures/valid/targeted-effect.json
pnpm check
pnpm test
pnpm lint:md
```

## Rules records

- Use structured fields and original wording. Include a source reference and a rules version so someone can verify the mechanic.
- Use synthetic examples for tooling and schema tests. Keep official prose, artwork, PDFs, catalogue exports, and source-derived model inputs out of Git, issues, pull requests, and CI artifacts.
- Follow the [authoring and review workflow](docs/authoring.md). Review model-assisted drafts against the source and record unresolved clauses as gaps.
- Before adding or distributing a new source, record its provenance and the basis for the intended reuse. The repository licence covers original project material its contributors have the right to license.

## Editing released data

Edit records, identity entries and categories in `data/<version>/rule-summaries/` directly. Updates converted from the official sources arrive as pull requests that change only the records whose source changed since the last update, so an edit made here is kept. When a source changes a record that was also edited here, the update keeps the edit and lists the record as a conflict to settle in review.

Two kinds of file are generated from other records, so edit the record they come from instead: `localisation/*.json` follows the identity entries, and a mission pack's award criteria and twist effects follow their `mission-rules` records.

## Reporting a gap

Give the ability or rule name, edition and update, source link or page reference, and a short account of the expected play outcome in your own words. Include an edge case if the issue turns on timing or eligibility.
