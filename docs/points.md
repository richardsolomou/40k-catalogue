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
| `costs[]` | `models` and `points`, plus `composition` when two rows share a model count. |
| `factions[].detachments[]` | `id`, `name`, `dp`, and `enhancements`. An enhancement with `upgrade: true` is an upgrade. |

Any `points` or `dp` can be `{ "unresolved": "<what is missing>" }` when the source lists the entry without a usable value. The validator reports each one by JSON pointer.

## Looking up a cost

`lookupPoints(snapshot, ref)` takes a unit, wargear item, detachment, or enhancement by ID. For a unit it also takes the model count, which copy of the unit this is (from 1), and a composition when one is needed. It returns `{ ok: true, points }` or a miss with a reason:

- The tier is the one whose copy range holds the copy, so the third copy of a unit priced "1st to 2nd" and "3rd+" uses the second tier.
- A model count prints a price only if a row has that count. In a table with exactly two rows, any count between them costs the upper row, following the publisher's starting-strength guidance. Longer tables give `no-size` for counts they do not print.
- Rows that share a model count give `ambiguous-size` until a `composition` picks one.
- An unresolved value gives `unresolved` with its note. An ID the snapshot lacks gives `unknown-unit` (or the matching reason), never zero.

`pointsAt(snapshots, update, ref)` reads the requested update. It returns `unknown-update` if it is missing and `ambiguous-update` if more than one snapshot uses its ID.

## History

A history lists each retained update with its status (`current` or `retired`) and the SHA-256 of its snapshot, computed over the snapshot with keys sorted so formatting does not matter. `historyErrors` requires exactly one snapshot per listed update, verifies its digest, and rejects unlisted snapshots. A new update adds a snapshot and a history entry, and the old entry becomes `retired` with its digest unchanged.

## Praetorium requirements

At the baseline in the [source inventory](source-inventory.md) (Praetorium `a9b4a5b`), Praetorium loads the [community MFM dataset](https://github.com/richardsolomou/wh40k-11e-mfm/tree/6eed7b100ae508c1faa76a42bf7b55ecabb59107) at `6eed7b1` ("Munitorum Field Manual 1.6", released 14 October 2026) through `src/server/mfm.ts` and prices units with `mfmPrice` in `src/shared/mfm.ts`. Its retired rules versions pin MFM 1.5 commits `8e0e635` and `8355616`, or private snapshots for MFM 1.4 and the 2 October MFM 1.5 build. Saved lists keep their rules version when the default moves.

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

Leader and support lists, objectives, unique tags, tier labels, and the manual's prose (`meta.yaml`) are not points and are left out. Joining these IDs to Praetorium's catalogue IDs stays in Praetorium, which joins by name today.

## Parity at the baseline

Checked on 21 November 2026 with the three pinned revisions converted locally. No converted values are in this repository.

| Check | Result |
| --- | --- |
| Conversion of `6eed7b1` | 30 factions, 1,797 units, 2,395 tiers (598 units have more than one), 334 detachments, 977 enhancements of which 126 are upgrades, 4,499 priced rows, no unresolved values. The two Titan Legions files have no detachments. |
| `lookupPoints` against Praetorium's `mfmPrice` | Every unit at every model count from 1 to one past its largest row, for copies 1 to 5: 112,080 probes over `6eed7b1`, `8e0e635`, and `8355616`, all identical, including rows that share a model count, where both give no price. |
| `6eed7b1` against the publisher's live pages | The publisher's pages, still at v1.6, render 3,957 rows into their HTML. 3,944 of the 3,947 rows both sides have are equal (99.92%), and the three that differ are join artifacts, not price disagreements. |
| MFM 1.5 (`8e0e635`) to 1.6 | 4,358 rows in both, 481 changed (476 unit, 3 detachment, 2 enhancement), 141 added, 130 removed. |

Mismatches and gaps against the live pages:

- **Imperial Agents, Inquisitor (2 rows).** The dataset has two units with this name, one with no group and one in the "Every Model Has The Imperium Keyword" group, at different costs. The page shows them in the opposite order, so an order-based join swaps them. Units with a shared name need their group to be identified, which is why the adapter puts the group in the ID.
- **T'au Empire, Tidewall Shieldline (1 row).** The page prints the defence platform as a second one-model row in the same table. The dataset marks it as an add-on, Praetorium ignores add-on rows when pricing the unit, and the snapshot carries it as wargear.
- **Space Wolves, second Venerable Dreadnought.** The dataset lists two units with this name and no group. The second sits among the Legends units but is not flagged as Legends, and the page does not render it into its HTML. The adapter names it `venerable-dreadnought-2` and reports it. Whether it is a Legends entry is unverified.
- **Shared model counts.** Space Wolves Wolf Guard Headtakers have two six-model rows that differ only by composition. Both Praetorium and the snapshot refuse to price six models without the composition.
- **Not checked.** 537 Legends rows load in the browser only, and 11 dataset rows have their unit headings streamed out of order on the page, so a plain HTML read cannot attribute them. Where those values were visible they agreed.

## Historical retention

The real builds of `mfm-1-5`, `mfm-1-5-2026-10-13`, and `mfm-1-6` were listed in a local history and checked with `history`. Pricing the first copy of Adepta Sororitas Exorcist with `pointsAt` returned the MFM 1.5 cost under both 1.5 updates and the 5-point cheaper 1.6 cost under `mfm-1-6`. An unknown update returned `unknown-update`, and editing one cost in the retained 1.5 snapshot failed the history check. The synthetic fixtures repeat these checks in `test/points.test.ts`.

## Refresh and verification

1. Check out the dataset at the commit that carries the new update, then convert each file in `data/` except `meta.yaml` with `yq -o=json data/<faction>.yaml > <dir>/<faction>.json`.
2. Build the candidate. The command validates it and prints every choice the adapter had to make:

   ```sh
   node src/points/cli.ts from-mfm-fork <dir> --id mfm-1-7 --edition "Warhammer 40,000 11th edition" \
     --update "MFM 1.7" --published <yyyy-mm-dd> --title "Munitorum Field Manual" \
     --url https://github.com/richardsolomou/wh40k-11e-mfm/tree/<sha>/data --revision <sha> --basis "<reuse basis>" > mfm-1-7.json
   ```

3. Compare it with the previous update: `node src/points/cli.ts compare mfm-1-7.json mfm-1-6.json`. Review every changed, missing, and new row against the publisher's changelog for the update.
4. Spot-check against the publisher's pages, by hand or with a local script, and record the match rate and each mismatch in this document.
5. Run `node src/points/cli.ts digest mfm-1-7.json`, add the update to the history as `current`, mark the previous one `retired` without touching its digest, and run `node src/points/cli.ts history <history.json> <every snapshot>`.

## Limits

- **No real snapshot in Git.** Reuse is still open: the dataset's MIT licence names "BSData" and may not cover the scraped values, and the publisher's site terms on reusing price tables are unchecked. Only synthetic fixtures are committed, under [fixtures/points](../fixtures/points). Publishing a real snapshot needs that basis settled and written into its `basis` field.
- **Source dependence.** Every value still comes from the community scraper, which depends on the publisher's page layout. Legends prices load in the browser only, so a plain HTML check cannot verify them. MFM 1.4 and the 2 October MFM 1.5 build exist in Praetorium only as private snapshots, and the dataset's MFM 1.4 commit (`61a687e`) has not been checked against them.
- **IDs are provisional.** The converter assigns slugs of names. Assign stable IDs from the [catalogue identity contract](catalogue-identity.md) before publishing. A rename in the source can change a provisional ID, and `compare` reports it as one missing row and one new row.
