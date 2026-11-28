# Points snapshots

A points snapshot holds every cost for one points update: unit sizes by copy, wargear, detachment points, enhancements, and upgrades. Each update gets its own snapshot and keeps it, so a list built under an old update can still be priced the way it was. The contract is [src/points/points.v1.schema.json](../src/points/points.v1.schema.json), and [src/points/history.v1.schema.json](../src/points/history.v1.schema.json) for the list of retained updates. The code in `src/points/` is a reference implementation of that contract.

## Format version 1

| Field | Meaning |
| --- | --- |
| `id` | Update ID, such as `mfm-1-6`. It never changes meaning once published. |
| `rulesVersion` | The `edition` and `update` the costs belong to. |
| `published` | The date the publisher released the update. |
| `source` | Where the costs were read: `title`, a `url` or `page`, and the `revision` when the source is versioned. |
| `basis` | The stated basis for reusing these values, in one sentence. |
| `factions[].units[]` | `id`, `name`, optional `group` and `legends`, the cost `tiers`, and per-item `wargear`. |
| `tiers[]` | The `copies` it applies to and its `costs`. Ranges start at the first copy and are contiguous. An omitted `to` makes the final tier open-ended. If the final tier has a `to`, later copies return `no-tier`. |
| `costs[]` | `models` and `points`, plus `composition` when two rows share a model count, and `mix` when a row is priced by the models it holds: the count of each model, by model ID, summing to `models`. |
| `factions[].detachments[]` | `id`, `name`, `dp`, and `enhancements`. An enhancement with `upgrade: true` is an upgrade. |

Any `points` or `dp` can be `{ "unresolved": "<what is missing>" }` when the source lists the entry without a usable value. The validator reports each one by JSON pointer.

## In catalogue releases

A catalogue release carries a snapshot as one record of kind `points-snapshot` in the `points` category, with the update ID as its record ID and the snapshot as its `data`. Its units, wargear and detachments are the release's `unit`, `wargear` and `detachment` entries, a wargear `item` is a wargear ID, a `mix` names the unit's `model` entries, and an enhancement's `id` is the ID of its `ability` rule summary, so the cost and the rule join by one ID. The record's identity entry references every entry the snapshot names.

Where the source prices one model count differently by circumstance, such as in another faction's army or in a particular Detachment, each row's `composition` says which circumstance it is (`in an army of Agents of the Imperium`, or `in the <Detachment> Detachment`), and other rows sharing a model count name the models they hold. A row priced by the models it holds, such as three Headtakers and three Hunting Wolves against six Headtakers, also gives them as a `mix`, so a list's models pick the row without reading the `composition` text.

## Looking up a cost

`lookupPoints(snapshot, ref)` takes a unit, wargear item, detachment, or enhancement by ID. For a unit it also takes the model count, which copy of the unit this is (from 1), and a composition or a mix when one is needed. It returns `{ ok: true, points }` or a miss with a reason:

- The tier is the one whose copy range holds the copy, so the third copy of a unit priced "1st to 2nd" and "3rd+" uses the second tier.
- A model count prints a price only if a row has that count. In a table with exactly two rows, any count between them costs the upper row, following the publisher's starting-strength guidance. Longer tables give `no-size` for counts they do not print.
- Rows that share a model count give `ambiguous-size` until a `composition` picks one, or a `mix`: the count of each model the unit fields, by model ID. A mix matches a row whose `mix` gives the same count for each model, a model missing from either counting as zero. Once any row at that count gives a `mix`, a mix none of them gives is `no-size`, even beside rows without one. A row without a `mix` is otherwise matched by its model count alone, so a circumstance row beside a matching mix still gives `ambiguous-size`. No two rows at one count give the same mix.
- An unresolved value gives `unresolved` with its note. An ID the snapshot lacks gives `unknown-unit` (or the matching reason), never zero.

`pointsAt(snapshots, update, ref)` reads the requested update. It returns `unknown-update` if it is missing and `ambiguous-update` if more than one snapshot uses its ID.

## History

A history lists each retained update with its status (`current` or `retired`) and the SHA-256 of its snapshot, computed over the snapshot with keys sorted so formatting does not matter. `historyErrors` requires exactly one snapshot per listed update, verifies its digest, and rejects unlisted snapshots. A new update adds a snapshot and a history entry, and the old entry becomes `retired` with its digest unchanged.

## Importing MFM data

The adapter in [src/points/mfm-fork.ts](../src/points/mfm-fork.ts) maps that dataset as follows:

| Dataset | Snapshot |
| --- | --- |
| Faction `slug` | Faction `id` |
| Unit `name`, `groupTitle`, `legends` | Unit `id` (a slug of the name, prefixed by the group's slug when two units share a name), `name`, `group`, `legends` |
| `pricing[].range` (`[1,2]`, `[3,)`) | `tiers[].copies` |
| `costs[]` with `desc` | `costs[]` with `composition` |
| `costs[]` with `addon: true` | `wargear[]`, named by its `desc` |
| `wargear[]` | `wargear[]` |
| Detachment `name`, `dp` | Detachment `id`, `name`, `dp` |
| Enhancement ending `(Upgrade)` | Enhancement with `upgrade: true`, the mark removed from the name |

The adapter reads costs. Resolve its provisional slugs to [catalogue IDs](catalogue-identity.md) before publishing a snapshot.

## Refresh and verification

1. Check out the dataset at the commit that carries the new update, then convert each file in `data/` except `meta.yaml` with `yq -o=json data/<faction>.yaml > <dir>/<faction>.json`.
2. Build the candidate. The command validates it and prints every choice the adapter had to make:

   ```sh
   node src/points/cli.ts from-mfm-fork <dir> --id new-update --edition "Warhammer 40,000 11th edition" \
     --update "<update>" --published <yyyy-mm-dd> --title "Munitorum Field Manual" \
     --url https://github.com/richardsolomou/wh40k-11e-mfm/tree/<sha>/data --revision <sha> --basis "<reuse basis>" > new-update.json
   ```

3. Compare it with the previous update: `node src/points/cli.ts compare new-update.json previous-update.json`. Review every changed, missing, and new row against the publisher's changelog for the update.
4. Spot-check against the publisher's pages, by hand or with a local script, and record the match rate and each mismatch in the issue for the update.
5. Run `node src/points/cli.ts digest new-update.json`, add the update to the history as `current`, mark the previous one `retired` without touching its digest, and run `node src/points/cli.ts history <history.json> <every snapshot>`.
