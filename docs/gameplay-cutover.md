# Gameplay data cutover

The comparison uses the nine rules versions in the Praetorium snapshot pinned by [PR #1975](https://github.com/richardsolomou/praetorium.gg/pull/1975), with snapshot ID `9d1bbd972c311e52f7e6d2e912e08513ca55f865100957f3481110da31072466`. The released rules version is `mfm-1-6`. The other eight are retained versions.

## Staged fields and coverage

The private rehearsal preserves faction file membership, source identities, names, and the CP, phase and turn fields of stratagems. It counts rule documents, keyword entries and FAQ entries separately. The staging output contains no rules prose. It serves as a source inventory and comparison input.

| Data in `mfm-1-6` | Count |
| --- | ---: |
| Faction files | 29 |
| Faction and core inventory entries, including shared entries in multiple files | 5,553 |
| Distinct inventory IDs within each kind | 4,765 |
| Stratagem rows with CP, phase and turn present | 1,213 of 1,214 |
| Core rule document files | 6 |
| Keyword entries | 57 |
| FAQ entries | 675 |
| Matches to published pilot records | 4 |

The eight historical sources each contain 29 faction files and between 5,526 and 5,560 inventory entries. Staging all nine versions produced 49,999 inventory rows and 10,954 stratagem usage rows. These counts include entries that recur in several versions. A faction record in a historical source file can be outside the roster scope of that rules version.

The four matches use the IDs and version binding in the [Necrons audit](necrons-coverage.md). The rest still need reviewed mechanic records. Cost and timing metadata helps preserve stratagem identity and usage. Each effect still needs a verified record before this data can replace a game-rule implementation.

## Reproduce the staging output

Run the [gameplay coverage CLI](../src/gameplay-coverage/cli.ts) on each source revision. For the default version, use the snapshot's root `datacards/11th/gdc` directory. For a retained version, use the directory under `editions/<rules-version>` and the revision in that version's `revision.json`.

```sh
node src/gameplay-coverage/cli.ts stage <datacards-directory> --edition 11th \
  --update <rules-version> --title "Game Datacards" --revision <revision>
```

Keep the output outside Git. Match the report to verified records by rules version and source ID, using the consuming app's mapping. Preserve older source pins for any historical version that still needs those records. Track release readiness in [issue #13](https://github.com/richardsolomou/40k-catalogue/issues/13).
