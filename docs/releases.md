# Mechanics releases

A release is an immutable, versioned set of reviewed [mechanic records](records.md) with embedded summaries. Apps pin one release by its version and checksum, upgrade when they choose, and can always reproduce what a given release displayed. The contract is the [version 2 manifest schema](../src/releases/manifest.v2.schema.json) plus the rules below. [src/releases/release.ts](../src/releases/release.ts) builds and verifies releases.

## Layout

A release unpacks to these files and no others:

| Path | Content |
| --- | --- |
| `manifest.json` | The index described below. |
| `schema/mechanic.v1.schema.json` | The record schema the records were validated against. |
| `records/<id>.json` | One mechanic record with the rendered body in `summary`, named by its `id`. |

It is published as one uncompressed `.tar` file holding those paths.

## Manifest

| Field | Meaning |
| --- | --- |
| `formatVersion` | The manifest format. New releases use `2`. The verifier also recognises the published [version 1 format](../src/releases/manifest.v1.schema.json). |
| `release` | The release version, `MAJOR.MINOR.PATCH`. |
| `commit` | The full Git commit of this repository the release was built from. |
| `recordSchema` | The record `formatVersion`, the schema's `path` in the release, and its `sha256`. |
| `rulesVersions` | Every distinct `edition` and `update` among the records, sorted. |
| `records` | One entry per record in ascending `id` order, with the `id` and its record's `path` and `sha256`. |

Provenance for each rule is in its record: `rulesVersion` names the edition and update it was checked against, and `source` names the publication and the page or URL. The manifest's `commit` identifies the reviewed inputs and the code that rendered them.

## Repeatable builds

The same commit always builds the same bytes. Every JSON file has sorted keys, two-space indentation, and a trailing newline, and array order is kept because it carries meaning. Files are ordered by path, and the archive stores every file with fixed metadata: mode `0644`, owner `0`, and a modification time of `0`. Input file order, key order, formatting, the machine, and the time of the build do not affect the output. The archive is uncompressed because compressed output can differ between zlib versions.

## Inputs

A release is built from one tracked directory that holds `<name>.json` records. Names use lowercase words separated by `-` or `.`. The reviewed summary is in each record's `summary` property. An optional `README.md` records the review and stays out of the artifact. The build fails validation when:

- the directory holds anything else, including a subdirectory, a symbolic link, or a hidden file
- a record lacks its `summary`
- a record fails validation, including a field the schema does not define
- a record has any unresolved part, because a release carries only fully reviewed records
- the rendered summary differs from the reviewed one
- two records share an ID
- the release version or commit does not match the manifest schema

## Building and verifying

Build from a clean checkout with all input files tracked at the release commit:

```sh
node src/releases/cli.ts build <records-dir> <out-dir> <release>
```

It writes the release to `<out-dir>`, which must not exist yet, and the archive to `<out-dir>.tar`.

Verify an unpacked release before using it:

```sh
node src/releases/cli.ts verify <release-dir>
```

Verification fails when the manifest does not match its schema, when a file is missing, unlisted, or has a different checksum, when a path does not match its record's ID, or when records are out of order. It checks the release's integrity only. It does not run the current validator or renderer, so later changes to them never invalidate a published release.

## Consuming a release

Pin the archive URL of an exact release and its SHA-256 checksum. Check the checksum after download, unpack the archive, and run verification or an equivalent check of every `sha256` in the manifest. Read game behaviour from the structured fields. Display `summary` alongside the ability's `name` and optional `usage.cp`.
