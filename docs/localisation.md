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
| `kind` | `faction`, `detachment`, `ability`, `enhancement`, `unit`, `model`, `wargear`, or `disposition`. |
| `name` | The catalogue's own name, so a reviewer can check the entry and an app keyed on names can join it. |
| `display` | The one name to show in this language. |
| `aliases` | Names to accept on import but never show. `use` is `spelling` for another current spelling, such as one a list builder prints, or `historical` with `until` naming the update that retired it. |

Display names and aliases are separate so an app never shows an import-only spelling. An entity, a kind and ID, must keep the same catalogue name in every file; indexing files that disagree fails. Kinds have separate ID spaces, as in the identity, so a piece of wargear and the ability it gives can share an ID.

Entry IDs are [catalogue identity](catalogue-identity.md) IDs, and `kind` names the identity kind, so an entry is the release entry with that kind and ID. An Enhancement is an identity `ability`. `enhancement` and `disposition` are for an app with its own IDs, which can use them in its own files but then cannot check them against a release.

A [catalogue release](catalogue-releases.md) can carry one file per language under `localisation/`, each checked against the release's identity when it is built.

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

`idsWithin(release, ref)` builds a scope from a faction, detachment or unit and its owned entries. A faction scope includes its units and detachments. A detachment scope includes its enhancements and the abilities that name it. A unit scope includes wargear carried or offered by its models and options. Cross-faction relationships do not add another book's units to the scope. An app that allows allies can look up names in their books separately. A regional tag falls back to its base language, so `fr-CA` reads `fr` files. A lookup without a language searches every loaded language.

Matching runs in two tiers. The first compares normalized names: compatibility forms folded, typographic quotes and dashes made plain, whitespace collapsed, space before `:;!?` dropped, and case folded without a locale. Only if nothing matches, the second also removes accents from Latin, Greek, and Cyrillic letters. Marks in other scripts stay, because a Japanese voicing mark makes a different word. Looser matching, such as plural endings or word order, depends on the language and belongs in the consuming app.

A historical alias always resolves and its hit says `historical`, so lists written before a rename still import. When the same spelling is a current name of another entity, the current name wins.

## Validation

Besides the schema, validation rejects a repeated kind and ID and an alias that repeats a name the entry already answers to. It reports each name that two entities of the same kind share as an ambiguity rather than an error, since real languages do give two things one name. Historical names that a current name overrides are not reported.

## Local checks

```sh
node src/localisation/cli.ts fixtures/localisation/candidates/necrons.fr.json
node --test test/localisation.test.ts
```

[fixtures/localisation](../fixtures/localisation) holds an invented faction in French and Spanish that exercises each rule above, a second invented book that shares a printed name with it, the identity release both are checked against, and files that must fail validation. [fixtures/localisation/candidates](../fixtures/localisation/candidates) holds the contributor-written sample.

## Stable IDs and book context

[Tracking issue](https://github.com/richardsolomou/vs-data/issues/11) · [Archived evidence](https://github.com/richardsolomou/vs-data/blob/80733c1fb93dd338b3078408c7f46c30c4ec422d/docs/localisation.md#stable-ids-and-book-context)
