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

Entry IDs are [catalogue identity](catalogue-identity.md) IDs, and `kind` names the identity kind, so an entry is the release entry with that kind and ID. An app with its own IDs can use them in its own files, but then cannot check them against a release.

## Checking a file against a release

`releaseErrors(file, release)` checks a validated file against the identity release it is read with. It returns an error when the file's `rulesVersion` differs from the release's, and for each entry whose kind and ID the release does not publish, that the release publishes only as an alias, or that the release names differently from the entry's `name`. A retired entry passes, since the release still publishes it and lists written before it retired still name it. Select the release as [catalogue identity](catalogue-identity.md#selecting-a-rules-version) describes, then check each file before indexing it.

An empty result means every ID the resolver can return is published in that release under the name a reviewer sees. The resolver itself never reads a release, so it cannot catch an ID joined to the wrong entity.

## Resolving a name

`indexNames(files)` builds one index over any number of validated files, and `resolve(name, query)` returns one of:

- `matched`, with the ID, its kind, and every hit that led to it.
- `ambiguous`, with every hit, when the name belongs to more than one ID.
- `unmatched`.
- `unknown-language`, when the query names a language no loaded file serves.

A query can narrow the lookup by `language`, by `kinds`, and by `ids`, the set of IDs that make sense where the name was read, such as one faction's datasheets. Narrowing is how an app settles an ambiguity; the resolver never guesses.

`idsWithin(release, ref)` builds a scope from a faction, detachment or unit and its owned entries. A faction scope includes its units and detachments. A detachment scope includes its enhancements. A unit scope includes wargear carried or offered by its models and options. Cross-faction relationships do not add another book's units to the scope. An app that allows allies can look up names in their books separately. A regional tag falls back to its base language, so `fr-CA` reads `fr` files. A lookup without a language searches every loaded language.

Matching runs in two tiers. The first compares normalized names: compatibility forms folded, typographic quotes and dashes made plain, whitespace collapsed, space before `:;!?` dropped, and case folded without a locale. Only if nothing matches, the second also removes accents from Latin, Greek, and Cyrillic letters. Marks in other scripts stay, because a Japanese voicing mark makes a different word. Looser matching, such as plural endings or word order, depends on the language and belongs in the consuming app.

A historical alias always resolves and its hit says `historical`, so lists written before a rename still import. When the same spelling is a current name of another entity, the current name wins.

## Validation

Besides the schema, validation rejects a repeated ID and an alias that repeats a name the entry already answers to. It reports each name that two entities of the same kind share as an ambiguity rather than an error, since real languages do give two things one name. Historical names that a current name overrides are not reported.

## Local checks

```sh
node src/localisation/cli.ts fixtures/localisation/candidates/necrons.fr.json
node --test test/localisation.test.ts
```

[fixtures/localisation](../fixtures/localisation) holds an invented faction in French and Spanish that exercises each rule above, a second invented book that shares a printed name with it, the identity release both are checked against, and files that must fail validation. [fixtures/localisation/candidates](../fixtures/localisation/candidates) holds the contributor-written sample.

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

## Stable IDs and book context

Measured on 21 November 2026 against the private definition rehearsal for Praetorium snapshot `9d1bbd9`, which carries nine identity releases and the ledger from Praetorium IDs to candidate stable IDs. The nine New Recruit candidates in the [cutover evidence](points-names-icons-cutover.md#localised-names) were rekeyed through that ledger, checked with `releaseErrors`, and resolved with `idsWithin`. The rekeyed files, the ledger joins and the scripts stayed outside Git.

### Checking IDs against each release

Praetorium keys a unit or enhancement used by several books by one entry ID, so one source entry becomes one stable entry per book. Of the 16,182 source entries, 13,230 reached a stable ID published in MFM 1.6. Most of the rest are wargear and option names with no wargear entry in the release, and the 35 force dispositions, which identity releases do not list.

| Release | Stable entries | Pass | Not published | Different name |
| --- | --- | --- | --- | --- |
| `mfm-1-6` | 47,838 | 47,660 | 143 | 35 |
| `marine-points-1013` | 8,635 | 8,355 | 244 | 36 |
| `marine-2026-10-13` | 7,554 | 7,316 | 224 | 14 |
| `marine-main` | 7,554 | 7,292 | 224 | 38 |
| `current-rosters` | 7,554 | 7,292 | 240 | 22 |
| `legacy-rosters` | 5,774 | 5,529 | 174 | 71 |
| `legacy-profiles` | 2,455 | 2,323 | 126 | 6 |
| `legacy-marine-old` | 1,913 | 1,768 | 134 | 11 |
| `custodes-11e` | 1,087 | 1,035 | 52 | 0 |

Each release counts only the books it carries. "Not published" is a ledger ID that another rules version carries. "Different name" is an ID that the ledger reaches from an entity with another English name, which would join a translation to the wrong entry. The passing entries form 81 files, one per language and release, and all of them validate and pass `releaseErrors`.

The converter adapts two Praetorium conventions before checking: faction names taken from `Faction:` keywords and a `[Legends]` suffix on unit names. It replaces each with the release's name only when the rest matches apart from case and spacing. Without that adapter, thousands of MFM 1.6 entries failed the name check, so a converter must adopt the release's names deliberately rather than copy its source's.

Of the 110 historical aliases, 65 name an ID that the release for that version publishes, each under the older English name. The other 45 name a book that the rehearsal for that version does not carry, because the retained versions convert only their changed factions. No alias names an ID that its book lacks.

### Shared printed names

Each MFM 1.6 entry's display name and aliases were resolved by kind, first without context and then within the entry's own book.

| Lookups: 48,231 | Own entry | Ambiguous | Another entry | Unmatched |
| --- | --- | --- | --- | --- |
| No context | 8,243 | 39,856 | 132 | 0 |
| Own book | 47,286 | 666 | 5 | 0 |

No stable ID fell in two books. Another 274 lookups name entries in no book, such as wargear that no model or option uses.

- **Narrower context.** The 90 enhancement names that one book uses in two detachments resolve within their detachment. 221 of the 248 ambiguous wargear lookups resolve within a unit that lists the item; in the other 27, every such unit lists both items.
- **Still ambiguous.** 326 unit lookups name a book that carries two datasheets under one name, and two name detachments. The release has no context that tells them apart, so they stay ambiguous.
- **Another entry.** The five lookups resolve a historical enhancement name that a different detachment's enhancement now carries. The current name wins within the book. Within the enhancement's detachment, the historical entry is the match.
- **Merged.** With all nine languages in one index, no language and each entry's own book, 47,259 of 47,957 lookups resolve to their own entry, 693 stay ambiguous, five resolve to another entry, and none are unmatched.

### Imports of real lists

The import check read 54 non-English list exports from public tournament results: 28 French, 15 German, six Japanese, three Chinese and two Korean. It loaded the release's English names as a base file so that untranslated names resolve too. 46 are official app exports, and 37 of those named a faction that the source covers. The other nine use Japanese faction names, or German and Korean names for Imperial Knights, which the source lacks; they resolve as `unmatched`, never as a nearby faction.

| Lines in the 37 lists | Matched | Ambiguous | Unmatched |
| --- | --- | --- | --- |
| Units, within the list's book | 391 | 4 | 142 |
| Units, without the book | 318 | 77 | 142 |
| Wargear, within its unit | 1,226 | 0 | 593 |
| Enhancements, within the book | 32 | 0 | 28 |

The book settles 73 of the 77 unit names that several books share. Most unmatched units are French and German Ork datasheet names that the source does not translate. Six of the lists also have results from Praetorium's own import. On the two French Ork lists, Praetorium reports 15 and 14 unknown units, against 14 and 14 unmatched here. On a French T'au list, Praetorium imports two lines that this check leaves unmatched, because the definition rehearsal has no entry for that datasheet. On the other three, the unit counts agree, except that one German Space Wolves line is ambiguous here while Praetorium reports one unknown name on that list.

### Not verified at this scale

- The ledger and identity releases are a private rehearsal and are not yet published identity releases.
- The detachment line of an app export joins several names with a language's word for "and", and the private parser split them only roughly. Its results are left out above.
- No Spanish, Italian, Portuguese or Russian list export was available.

## Unsupported languages

A language no file serves resolves as `unknown-language`, so an app can tell the player the language is unsupported rather than report every name as unknown. Today that is every language except the nine above, including Polish and Dutch. Russian is supported in name only: its 284 entries cover few entities.

## Keeping the existing source

New Recruit's reuse terms are still unresolved ([source inventory](source-inventory.md#translated-names)), so none of its entries are in this repository. Reasons to keep it in Praetorium until replacements cover its use:

- It is the only source for most enhancement and wargear names, and for any Portuguese or Russian name.
- It holds many spellings per language, which catch names that list builders and the official app print differently.

Moving off it needs, per language, files from a source whose terms allow redistribution, and a measured check that real lists still import.
