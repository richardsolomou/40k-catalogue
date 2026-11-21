# Localised names

A localisation file gives the names one language uses for catalogue entities, so an app can show them and read a list written in that language back to the right IDs. The contract is the JSON Schema in [src/localisation/localisation.v1.schema.json](../src/localisation/localisation.v1.schema.json). The validator and resolver beside it are a reference implementation.

## Format version 1

One file holds one language from one source, so each file carries its own provenance and an app can choose which sources to load.

| Field | Meaning |
| --- | --- |
| `formatVersion` | Always `1`. |
| `language` | BCP 47 tag, such as `fr` or `pt-BR`. |
| `rulesVersion` | The `edition` and `update` the names were checked against. |
| `source` | `title`, optional `url`, and `reuse`: who wrote the names and the basis on which this project may redistribute them. |
| `entries` | One per entity, each with at least a `display` name or one alias. |

Each entry has:

| Field | Meaning |
| --- | --- |
| `id` | The entity's catalogue ID. The resolver returns it unchanged. |
| `kind` | `faction`, `detachment`, `enhancement`, `unit`, `wargear`, or `disposition`. |
| `name` | The catalogue's own name, so a reviewer can check the entry and an app keyed on names can join it. |
| `display` | The one name to show in this language. |
| `aliases` | Names to accept on import but never show. `use` is `spelling` for another current spelling, such as one a list builder prints, or `historical` with `until` naming the update that retired it. |

Display names and aliases are separate so an app never shows an import-only spelling. An ID must keep the same kind and catalogue name in every file; indexing files that disagree fails.

Catalogue IDs are still provisional until [#14](https://github.com/richardsolomou/40k-catalogue/issues/14) defines them. The sample uses project-style IDs; an app with its own IDs can use them in its own files.

## Resolving a name

`indexNames(files)` builds one index over any number of validated files, and `resolve(name, query)` returns one of:

- `matched`, with the ID, its kind, and every hit that led to it.
- `ambiguous`, with every hit, when the name belongs to more than one ID.
- `unmatched`.
- `unknown-language`, when the query names a language no loaded file serves.

A query can narrow the lookup by `language`, by `kinds`, and by `ids`, the set of IDs that make sense where the name was read, such as one faction's datasheets. Narrowing is how an app settles an ambiguity; the resolver never guesses. A regional tag falls back to its base language, so `fr-CA` reads `fr` files. Without a language, every loaded language is searched, as a list rarely says which one it uses.

Matching runs in two tiers. The first compares normalized names: compatibility forms folded, typographic quotes and dashes made plain, whitespace collapsed, space before `:;!?` dropped, and case folded without a locale. Only if nothing matches, the second also removes accents from Latin, Greek, and Cyrillic letters. Marks in other scripts stay, because a Japanese voicing mark makes a different word. Looser matching, such as plural endings or word order, depends on the language and belongs in the consuming app.

A historical alias always resolves and its hit says `historical`, so lists written before a rename still import. When the same spelling is a current name of another entity, the current name wins.

## Validation

Besides the schema, validation rejects a repeated ID and an alias that repeats a name the entry already answers to. It reports each name that two entities of the same kind share as an ambiguity rather than an error, since real languages do give two things one name. Historical names that a current name overrides are not reported.

## Local checks

```sh
node src/localisation/cli.ts fixtures/localisation/candidates/necrons.fr.json
node --test test/localisation.test.ts
```

[fixtures/localisation](../fixtures/localisation) holds an invented faction in French and Spanish that exercises each rule above, and files that must fail validation. [fixtures/localisation/candidates](../fixtures/localisation/candidates) holds the contributor-written sample.

## What Praetorium uses today

Checked against Praetorium [`a9b4a5b`](https://github.com/richardsolomou/praetorium.gg/tree/a9b4a5b3d37484f696b275d0b0e10b89ca07c325), whose translation consumers are unchanged at `c742a9e`, and the translations pin `4dd982c` described in the [source inventory](source-inventory.md#translated-names).

- **Shape.** One flat map per language from English name to translated name, with no IDs and no faction scope. [`catalogueTranslations.ts`](https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/src/server/catalogueTranslations.ts) merges every language into one English-to-names map, drops names over 200 characters, and derives faction names from the `Faction:` keyword entries.
- **Display versus import.** The app uses the translations only to read imports, on the server and in the offline import ([`constructionFunctions.ts`](https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/src/client/offline/constructionFunctions.ts)). It never displays them.
- **Languages.** German, Spanish, French, Italian, Japanese, Korean, Portuguese, Russian, and Chinese. Entry counts range from 284 (Russian) to 11,763 (Portuguese).
- **Entities.** [`rosterFiles.ts`](https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/src/shared/rosterFiles.ts) resolves factions, detachments, force dispositions, datasheets, wargear, and enhancements through English names, then to BSData entry IDs by the catalogue's own name lookup.
- **Matching.** [`englishNames`](https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/src/shared/catalogueTranslations.ts) tries an exact normalized match, then a loose one that also ignores accents, plural endings, and word order. Where a translated name stands for several English names it returns all of them, and the caller keeps the first one it can place in the list.
- **Second source.** Datasheet and wargear names also come from Game Datacards cards that print them in several languages. At the snapshot checked, only Space Marine chapters and Orks had every card in German, Spanish, French, Italian, Japanese, Korean, and Chinese; Aeldari and Agents of the Imperium had a few, and no card had Portuguese or Russian.

## Necrons in French

### Measured

- **The format carries the existing source without loss.** Converting every French entry for a Necrons entity (faction, detachments, enhancements, datasheets) into this format gave 19 entries. All 19 validate, none is ambiguous, and each resolves to the same English names, and so the same catalogue entities, as Praetorium's `englishNames`.
- **The existing source covers Necrons thinly.** It names the faction, all 12 detachments, 1 of 37 enhancements, and 5 of 87 datasheets, and the Necrons Game Datacards cards print English only. A French Necrons list therefore imports through the existing source mainly by faction and detachment.
- **The sample.** [necrons.fr.json](../fixtures/localisation/candidates/necrons.fr.json) has 15 entries written for this project, not copied from the existing source. Every catalogue name in it matches a Necrons entity of the same kind. Its faction name and three of four detachment names agree with the existing source. For Hypercrypt Legion they spell the name differently, and neither the existing source nor accent folding links the two. The existing source has no French name for the sample's enhancement or its nine datasheets.

The measurement ran Praetorium's own loader and `englishNames` against its local catalogue snapshot. The script and the converted file stayed outside Git.

### Not verified

- The sample's French names have not been checked against a printed French source. Its ten names that the existing source lacks, and the Hypercrypt Legion spelling, need a reviewer with the French books before release.
- No language other than French was measured, and no real French list was imported end to end.

## Unsupported languages

A language no file serves resolves as `unknown-language`, so an app can tell the player the language is unsupported rather than report every name as unknown. Today that is every language except the nine above, including Polish and Dutch. Russian is supported in name only: its 284 entries cover few entities.

## Keeping the existing source

New Recruit's reuse terms are still unresolved ([source inventory](source-inventory.md#translated-names)), so none of its entries are in this repository. Reasons to keep it in Praetorium until replacements cover its use:

- It is the only source for most enhancement and wargear names, and for any Portuguese or Russian name.
- It holds many spellings per language, which catch names that list builders and the official app print differently.

Moving off it needs, per language, files from a source whose terms allow redistribution, and a measured check that real lists still import.
