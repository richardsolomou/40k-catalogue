# Catalogue identity and versions

Every catalogue record has an ID that stays the same across releases, so a consumer can store it and resolve it later. The contract is the JSON Schema in [src/catalogue-identity/release.v1.schema.json](../src/catalogue-identity/release.v1.schema.json) plus the rules below, which the schema cannot express. [src/catalogue-identity/identity.ts](../src/catalogue-identity/identity.ts) is a reference implementation of both.

## Releases and entries

An identity release lists every entry published in one revision of a rules version.

| Field | Meaning |
| --- | --- |
| `formatVersion` | Always `1`. |
| `rulesVersion` | The `edition` and `update` the release describes, as in [mechanic records](records.md). |
| `revision` | A positive integer that identifies an immutable catalogue revision for that rules version. |
| `entries[].kind` | The record type, such as `faction`, `unit`, `wargear`, `roster-option`, `ability`, `mission`, or `mission-layout`. Lowercase words separated by `-`. |
| `entries[].id` | The project ID, lowercase words separated by `.` or `-`. A mechanic record's `id` is its `ability` entry's ID. |
| `entries[].name` | Display name in that rules version. |
| `entries[].aliases` | Other IDs of the same kind that resolve to this entry. |
| `entries[].retired` | Present when the entry no longer applies. `replacedBy` lists the active entries of the same kind that take its place, or is empty. Optional `sources` name the publications that retired it, each with a `title` and a `page` or `url`, such as the document that supersedes an FAQ. |
| `entries[].absent` | `true` when the rules version does not have the entity, though other sources for that version name it, such as a third-party list of detachments taken from a later app build. The entry keeps the entity's ID and carries the IDs those sources use as `aliases`, so a consumer can match and drop it. It has no record. |
| `entries[].references` | The entries this one depends on, each as `{ "kind", "id" }`. |

An entry is identified by its kind and ID together, and an ID is unique within its kind. A reference names both, so a roster option refers to its unit and its wargear, and a mission to its layout, without guessing the kind from the ID.

Within one release:

- Kind and ID pairs are unique, and an alias does not reuse an ID or another alias of its kind.
- Every reference and every `replacedBy` ID names an entry in the same release by its ID, not an alias.
- An entry is active when it is neither retired nor absent, and never both. An active entry refers only to active entries. A retired entry keeps its old references.
- `replacedBy` names active entries, so resolving a replacement takes one step. When a successor is retired later, point the original entry at the newest successors.

## Selecting a rules version

Releases are immutable once published. A correction or coverage improvement can publish a new catalogue revision for the same rules version. Store the rules version and catalogue revision alongside each saved reference to resolve it exactly. An unpublished version or revision returns `unknown-version`. A lookup that supplies just the rules version returns `ambiguous-version` when several revisions match. To show the record under current rules, select the current release explicitly.

## When an ID changes

Keep the ID for any edit to the same entity: a new name, points, profile, wording, layout geometry, or a corrected reference. Readers who need the old values look them up in the old release.

Mint a new ID only when saved data would mean something different under the old ID: an entity splits into several, several merge into a new one, or a different entity takes its place. Keep the old entry in every later release with `retired.replacedBy` listing the successors. Retire an entity that leaves the game with an empty `replacedBy`.

Use an alias when two IDs always meant the same entity, such as a duplicate published by mistake. Keep one entry and list the other ID in its `aliases`. Aliases resolve to the canonical entry with no change in meaning.

Across releases, each release keeps every ID and alias its predecessor published:

- An ID stays an ID, becomes an alias of a merged entry, or is retired. It is never dropped.
- A retired ID stays retired and is never reused for a new entity.
- An alias stays an alias. It never becomes an entry of its own.
- An active entry never becomes absent; retire it instead. An absent entry may become active when the entity enters a later rules version.

## Resolving a reference

Resolving a reference in a release gives one of:

| Status | Meaning |
| --- | --- |
| `current` | The ID names an active entry. |
| `aliased` | The ID is an alias. Use the canonical entry's ID from now on. |
| `retired` | The entry no longer applies. Choose among `replacedBy`, or keep reading the reference in its saved rules version. |
| `absent` | The rules version does not have the entity. Drop the reference or read it under a rules version that has the entity. |
| `missing` | The release has no entry of that kind with that ID. In a valid history this means the reference was never published. |

## Consumer mappings and upgrades

A consumer keeps its own IDs and stores a mapping from each one to a catalogue reference, rules version, and catalogue revision.

Before moving a mapping to a new release, run `checkUpgrade` with the new release and every catalogue reference the consumer maps. It returns each reference that is not `current`. Rewrite aliased references to the canonical ID, map or prompt for retired references, and treat any missing reference as a blocking error in the consumer's mapping. Data saved under an older rules version keeps its version and resolves against that release.

## Fixtures

[fixtures/catalogue-identity](../fixtures/catalogue-identity) holds two releases of an invented catalogue. The second renames a unit, merges a duplicate wargear entry into an alias, splits a roster option into two, and retires a mission layout. The `invalid` folder holds releases that must fail validation. The tests in [test/catalogue-identity.test.ts](../test/catalogue-identity.test.ts) cover history rules, historical lookups, and upgrade checks.
