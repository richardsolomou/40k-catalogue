# 40K Catalogue

**Versioned Warhammer 40,000 data for army builders, battle trackers and reference apps.**

[Releases](https://github.com/richardsolomou/40k-catalogue/releases) · [Documentation](docs/README.md) · [Issues](https://github.com/richardsolomou/40k-catalogue/issues)

[![MIT License](https://img.shields.io/github/license/richardsolomou/40k-catalogue)](LICENSE)

40K Catalogue gives apps structured data for rules, datasheets, roster choices, points, missions and terrain. A mechanic record tells your app when a rule applies and what it does. Its summary gives players the same rule in plain language, with bold keywords and links to related rules.

Catalogue IDs keep rules and other records linkable across updates. Pin the data for the rules version your app uses, so a saved roster or battle can still resolve its references later.

## Use

1. Download an archive and its checksum from [Releases](https://github.com/richardsolomou/40k-catalogue/releases). Choose the archive for the data you need and pin its version and SHA-256.
2. Verify the checksum, unpack the archive, and open `manifest.json` to find its records and rules versions.
3. Read the structured fields for game behaviour. Use the summary for display and resolve rule links by their supplied kind and ID.

The [release guides](docs/README.md#releases) explain the archive formats and verifiers.

## Try a mechanic

From the repository root, read the effect and summary of an invented rule with Node.js.

```sh
node -p 'require("./fixtures/valid/targeted-effect.json").effect'
node -p 'require("./fixtures/valid/targeted-effect.json").summary'
```

The first command shows a modifier that subtracts 1 from saving throws. The record's trigger, target, conditions and duration say who it applies to and when. The second command prints the text an app can show players. See the [example JSON](fixtures/valid/targeted-effect.json) and the [mechanic format](docs/records.md).

## Development

See [Contributing](CONTRIBUTING.md) to run the validators and tests or add a record. Use [GitHub Issues](https://github.com/richardsolomou/40k-catalogue/issues) to report a data gap, request a change or follow planned work.

## Data and trademarks

Original project material is licensed under the [MIT License](LICENSE). Records carry their [sources and attribution](docs/source-inventory.md). 40K Catalogue is unofficial and is unaffiliated with Games Workshop. Warhammer 40,000 and related marks belong to Games Workshop.
