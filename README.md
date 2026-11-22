<div align="center">

# VS Data

**Open Warhammer 40,000 rules data for army builders, battle trackers and reference apps.**

[Releases](https://github.com/richardsolomou/vs-data/releases) · [Documentation](docs/README.md) · [Issues](https://github.com/richardsolomou/vs-data/issues)

[![License](https://img.shields.io/github/license/richardsolomou/vs-data)](LICENSE)

</div>

VS Data gives apps structured data for rules, datasheets, roster choices, points, missions and terrain. A mechanic record tells your app when a rule applies and what it does. Its summary gives players the same rule in plain language, with bold keywords and links to related rules.

Catalogue IDs keep rules and other records linkable across updates. Pin the data for the rules version your app uses, so a saved roster or battle can still resolve its references later.

## Scope

VS Data describes what rules do, not how they are worded. Records hold structured mechanics, points and names with original summaries, and never copy Games Workshop rules text, artwork or PDFs. Each record cites the source it was checked against.

The data belongs to no single app. Any app can use the same releases.

## Use

1. Download an archive and its checksum from [Releases](https://github.com/richardsolomou/vs-data/releases). Choose the archive for the data you need and pin its version and SHA-256.
2. Verify the checksum, unpack the archive, and open `manifest.json` to find its records and rules versions.
3. Read the structured fields for game behaviour. Use the summary for display and resolve rule links by their supplied kind and ID.

The [release guides](docs/README.md#releases) explain the archive formats and verifiers.

## Example

This invented rule shows the shape of a mechanic record. The structured fields say when the rule applies, who it targets and what it does.

```json
{
  "id": "synthetic.hex-lantern",
  "name": "Hex Lantern",
  "trigger": { "kind": "phase-start", "phase": "shooting", "turn": "own" },
  "target": { "select": { "side": "enemy", "within": { "inches": 12, "of": "this-unit" } } },
  "conditions": [{ "kind": "status", "unit": "target", "status": "battle-shocked", "at": "now" }],
  "effect": { "kind": "modify-roll", "roll": "save", "by": -1 },
  "duration": { "until": "end-of-phase" }
}
```

Its summary is the text an app shows players:

> At the start of your Shooting phase, select one enemy unit that is Battle-shocked and is within 12" of this unit, then subtract 1 from saving throws for the selected unit until the end of the phase.

The [full example](fixtures/valid/targeted-effect.json) also has the rules version and source. The [mechanic format](docs/records.md) documents every field.

## Development

See [Contributing](CONTRIBUTING.md) to run the validators and tests or add a record. Use [GitHub Issues](https://github.com/richardsolomou/vs-data/issues) to report a data gap, request a change or follow planned work.

## Data and trademarks

Original project material is licensed under the [MIT License](LICENSE). Records carry their [sources and attribution](docs/source-inventory.md). VS Data is unofficial and is unaffiliated with Games Workshop. Warhammer 40,000 and related marks belong to Games Workshop.
