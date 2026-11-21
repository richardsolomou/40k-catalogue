# 40K Catalogue

**Versioned Warhammer 40,000 game data for third-party apps.**

[Releases](https://github.com/richardsolomou/40k-catalogue/releases) · [Record format](docs/records.md) · [Catalogue progress](docs/cutover-tracker.md) · [Contributing](CONTRIBUTING.md)

[![Latest release](https://img.shields.io/github/v/release/richardsolomou/40k-catalogue)](https://github.com/richardsolomou/40k-catalogue/releases) [![License](https://img.shields.io/github/license/richardsolomou/40k-catalogue)](LICENSE)

40K Catalogue is a community-maintained reference for gameplay mechanics, roster choices, missions and terrain. Apps can use the structured records for game behaviour and display original summaries with keyword formatting and links to related rules. Each record carries its rules version and source so it can be checked against the correct update.

## Scope

| Area | Status |
| --- | --- |
| Gameplay mechanics | The [Necrons pilot](https://github.com/richardsolomou/40k-catalogue/releases/tag/v0.1.0) publishes four Pantheon of Woe rules. The [coverage report](docs/gameplay-cutover.md#full-summary-coverage) tracks draft summaries across the wider catalogue. |
| Rosters and datasheets | Formats cover [roster definitions](docs/roster-definitions.md), [profiles and attachments](docs/datasheet-profiles.md), [points](docs/points.md) and [localised names](docs/localisation.md). |
| Missions and terrain | Formats cover [mission packs](docs/mission-packs.md) and [terrain geometry](docs/terrain.md). Source migrations are tracked in the [cutover tracker](docs/cutover-tracker.md). |
| Faction marks | The [original icon pack](https://github.com/richardsolomou/40k-catalogue/releases/tag/icons-v1.0.0) provides 37 reusable marks. |

## Use

Pin a release and its checksum to make a data update reproducible. [Mechanics releases](docs/releases.md) describe the JSON records, summaries and link IDs. [Catalogue releases](docs/catalogue-releases.md) describe the manifest for multiple categories, and [catalogue identity](docs/catalogue-identity.md) explains how records keep stable IDs across updates.

## Development

Use Node 24 or later and pnpm. Validate and render an invented mechanic, then run the project checks.

```sh
pnpm install --frozen-lockfile
pnpm validate fixtures/valid/targeted-effect.json
pnpm render fixtures/valid/targeted-effect.json
pnpm check
pnpm test
pnpm lint:md
```

The [roadmap](docs/roadmap.md) links to open work. The [authoring guide](docs/authoring.md) covers drafting, source attribution and review.

## Data and trademarks

Original project material is available under the [MIT License](LICENSE). Imported data carries its own source and attribution. [Source inventory](docs/source-inventory.md)

40K Catalogue is an independent community project. Warhammer 40,000 and related marks belong to Games Workshop.
