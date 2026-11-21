# Catalogue releases

A catalogue release packages one revision of the [catalogue identity](catalogue-identity.md) with the data records of each category the catalogue covers, and records which categories still come from their existing source. Consumers pin each category they adopt and can see what changed since the release before it. The contract is the JSON Schemas in [src/catalogue-releases](../src/catalogue-releases) plus the rules below. [src/catalogue-releases/catalogue.ts](../src/catalogue-releases/catalogue.ts) builds and verifies releases.

[Mechanics releases](releases.md), such as the pinned pilot, keep their own format and archive. A catalogue release can list mechanics as a retained category whose source is that pinned archive.

## Inputs

A release is built from one tracked directory:

| Path | Content |
| --- | --- |
| `identity.json` | An identity release: rules version, catalogue revision, and every entry. |
| `categories.json` | Every category, with its `name`, the identity `kinds` it owns, its `sources`, and a `status` of `included` or `retained`. |
| `records/<category>/<name>.json` | One record for an entry of an included category. |
| `README.md` | Optional review notes, left out of the artifact. |

Each identity kind belongs to exactly one category. An included category holds records in this repository. A retained category holds no records and gives a `revision` for each source, such as a commit or an archive version.

A record names its entry by `kind` and `id`, repeats the identity's `rulesVersion`, gives the `source` it was checked against, and carries its category's facts in `data`. Joins between records come from the identity entry's `references`, not from the record. The category's own work item defines the shape of `data`.

An archive includes the schemas for roster definitions, datasheet profiles, points and their history, mission packs, terrain records, and localisation. It uses PAX path headers for record names longer than the ustar file-name field, so unpacking preserves the full ID.

The build fails when:

- the directory holds anything else, or a category directory holds anything but `.json` records
- the identity release or a record fails validation, or the categories do not match their schema
- a kind belongs to two categories or none, or a category is declared twice
- a record sits under a retained or undeclared category, or under a category that does not own its kind
- a record's entry is missing, an alias, or retired, its rules version differs from the identity's, or two records name the same entry
- an included category has no records

## Layout

| Path | Content |
| --- | --- |
| `manifest.json` | The index described below. |
| `identity.json` | The identity release, with entries in kind and ID order. |
| `schema/catalogue-identity/release.v1.schema.json` | The identity schema. |
| `schema/catalogue-releases/*.schema.json` | The record, manifest, and shared definition schemas. |
| `records/<category>/<kind>/<id>.json` | One record. |

Builds follow the [mechanics release rules](releases.md#repeatable-builds): canonical JSON, files in path order, and an uncompressed `.tar` with fixed metadata. Input file names, entry order, key order, and formatting do not affect the output, so the same commit always gives the same bytes.

## Manifest

| Field | Meaning |
| --- | --- |
| `formatVersion` | Always `1`. |
| `release` | The release version, `MAJOR.MINOR.PATCH`. |
| `commit` | The Git commit the release was built from. |
| `rulesVersion`, `revision` | The identity release's rules version and catalogue revision. |
| `previous` | The release this one follows: its `release`, `rulesVersion`, `revision`, and the SHA-256 of its `manifest.json`. `null` for the first release. |
| `schemas`, `identity` | The `path` and `sha256` of each schema and of `identity.json`. |
| `categories` | One entry per category in name order, described below. |

Each category lists:

| Field | Meaning |
| --- | --- |
| `name`, `kinds`, `sources` | As declared in `categories.json`. |
| `status` | `complete`, `partial`, or `retained`. |
| `statusBefore` | The status in the previous release, or `null`. |
| `entries` | The number of active identity entries of the category's kinds. |
| `records` | The `kind`, `id`, `path`, and `sha256` of each record, in kind and ID order. |
| `unresolved` | Active entries of an included category that have no record. |
| `unresolvedReferences` | References from this category's records to entries of an included category that have no record. |
| `dependsOn` | Other categories its records refer to, including retained ones. |
| `changes` | What changed since the previous release, described below. |

An included category is `complete` when every active entry has a record and none of its records refers to an unresolved entry. Otherwise it is `partial`. The status measures coverage against the release's own identity entries. Validate the payload with each category's format and compare it with the consumer's baseline before switching sources. A retained category is always `retained` and still counts its entries, so consumers can see what they must keep sourcing.

## Changes from the previous release

Pass the previous release when building. The build checks it against the [identity history rules](catalogue-identity.md#when-an-id-changes) and fails when an ID is dropped, a retired ID is reused, an alias becomes an entry, a category disappears, the release version is not newer, or the revision goes backwards for the same rules version. Each category then reports:

| Field | Meaning |
| --- | --- |
| `added` | Entries that are new in this release. |
| `renamed` | Entries whose name changed, with the old and new names. |
| `aliased` | Earlier IDs that now resolve to another entry, with the `canonical` ID. |
| `retired` | Entries removed from play since the previous release, with `replacedBy`. An empty list means the entity left the game. |
| `recordsAdded`, `recordsChanged`, `recordsRemoved` | Records that are new, have a different checksum, or are gone. |

The first release reports every entry and record as added.

## Building and verifying

Build from a clean checkout with every input tracked at the release commit:

```sh
node src/catalogue-releases/cli.ts build <input-dir> <out-dir> <release> [<previous-release-dir>]
```

It verifies the unpacked previous release first, writes the new release to `<out-dir>`, which must not exist yet, and writes the archive to `<out-dir>.tar`.

```sh
node src/catalogue-releases/cli.ts verify <release-dir>
```

Verification checks the manifest schema, that the release holds exactly the listed files with their checksums, that record paths match their kind and ID, that categories and records are in order, and that retained categories list no records. Like the mechanics check, it does not re-run validation, so later changes never invalidate a published release.

## Cutover evidence

The manifest supplies coverage evidence for the [cutover tracker](cutover-tracker.md) and [#13](https://github.com/richardsolomou/40k-catalogue/issues/13). A cutover record names the release URL and archive checksum, the categories it switches, and their `complete` status at that release. A `partial` category lists in `unresolved` and `unresolvedReferences` what would still need the existing source. Each retained category keeps its existing source pin. Rolling back one category means pinning that category to an earlier release or its retained source, without moving the others.

## Fixtures

[fixtures/catalogue-releases](../fixtures/catalogue-releases) holds two inputs for an invented catalogue with roster, mission, and terrain records and retained mechanics and points. The second renames a unit, merges a duplicate wargear entry, splits a roster option, retires a mission layout, and adds entries without records. [test/catalogue-releases.test.ts](../test/catalogue-releases.test.ts) covers coverage status, cross-category references, change reports, history checks, and repeatable archives.
