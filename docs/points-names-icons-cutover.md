# Points, names and icons cutover evidence

This records the full-coverage check of points ([#10](https://github.com/richardsolomou/40k-catalogue/issues/10)), localised names ([#11](https://github.com/richardsolomou/40k-catalogue/issues/11)) and faction icons ([#12](https://github.com/richardsolomou/40k-catalogue/issues/12)) for the cutover in [#13](https://github.com/richardsolomou/40k-catalogue/issues/13). It extends the samples in [points](points.md), [localisation](localisation.md) and [icons](icons.md) to every faction, retained rules version and language Praetorium serves. It holds aggregate counts only; the converted files, maps and scripts stay outside Git.

Checked on 21 November 2026 with this repository at `eb0d8cc`, Praetorium at `4e4f122`, and Praetorium's private catalogue snapshot `9d1bbd9`, which carries all nine rules versions. Praetorium's own loaders and join functions ran unchanged against the snapshot.

## Points

### Inputs

Every points dataset in the snapshot, and in the 56 older cached snapshots, is one of these. Each is byte-identical to the listed dataset commit, except where Praetorium patches it.

| Candidate | Dataset | Praetorium rules versions |
| --- | --- | --- |
| `mfm-1-6` | `6eed7b1` with Praetorium's two points patches | `mfm-1-6` (current) |
| `mfm-1-5-2026-10-13` | `8355616` (data of `189e2a1`) | `marine-points-1013` |
| `mfm-1-5` | `8e0e635` | `current-rosters`, `marine-main`, `marine-2026-10-13`, `legacy-profiles` |
| `mfm-1-4` | `27c6ec5` (data of `61a687e`) | `legacy-rosters`, `legacy-marine-old` |
| `custodes-preview-2026-10-17` | `8e0e635` plus the Custodes preview sheet from the Praetorium fork of `wh40k-11e` at `3c57378` | `custodes-11e` |

The private snapshots behind `legacy-profiles` (MFM 1.5, 2 October) and the two MFM 1.4 versions match `8e0e635` and `61a687e` byte for byte. The historical gap that [points](points.md#limits) recorded for them is closed. One more dataset appears in five older cached snapshots: `6eed7b1` with only the first patch, a superseded build of `mfm-1-6`.

### Conversion

`from-mfm-fork` built all five candidates. All five validate without unresolved point values.

| Candidate | Units | Tiers | Detachments | Enhancements (upgrades) | Unit rows |
| --- | --- | --- | --- | --- | --- |
| `mfm-1-6` | 1,797 | 2,395 | 334 | 977 (127) | 3,057 |
| `mfm-1-5-2026-10-13` | 1,792 | 2,384 | 330 | 978 (123) | 3,056 |
| `mfm-1-5` | 1,792 | 2,378 | 330 | 978 (123) | 3,050 |
| `mfm-1-4` | 1,789 | 2,348 | 348 | 1,193 (96) | 2,973 |
| `custodes-preview-2026-10-17` | 1,788 | 2,410 | 334 | 977 (126) | 3,093 |

- **Custodes preview.** The 27 units with a closed final tier return `no-tier` past the last priced copy. The overlay file omits the faction name, which the conversion took from MFM 1.5.
- **Praetorium's patches change the snapshot.** Against unpatched `6eed7b1`, the spelling fix moves Nightforged Battery from an enhancement to an upgrade under a new ID. The Legends fix flags the second Space Wolves Venerable Dreadnought as Legends, but its ID stays `venerable-dreadnought-2` because nothing else tells the two apart.
- **History.** The candidate history passes `history`. Changing one cost in `mfm-1-5` makes it fail.
- **Row changes between updates.** MFM 1.4 to 1.5: 58.28% of 4,628 rows unchanged. 1.5 to the 13 October refresh: 88.86% of 4,488. Refresh to 1.6: 97.51% of 4,496.

### Parity with Praetorium

For all nine rules versions, `lookupPoints` was compared with Praetorium's `mfmPrice` for every unit. The probes covered each model count from 1 to one past the unit's largest row, for copies 1 to 5. All 336,465 probes agreed, including 37,200 for the Custodes preview.

Another 12,820 checks agreed for the same versions. They cover 3,671 detachment costs, 6,807 enhancement costs, 1,223 upgrade costs and 1,119 wargear prices. Detachments, enhancements and upgrades use the existing joins. Wargear checks compare the explicitly named price rows. Proposed alias joins and 21 add-on rows represented as wargear in the candidate still need saved-list and loadout comparison.

### Joining Praetorium's catalogue IDs

Praetorium's own join (`mfmUnitFor`, `mfmDetachmentFor`, and enhancement matching) ran over every faction's datasheets and detachments in each rules version. Each joined row was then mapped to its candidate ID. For reference datasheets, the rows a faction page lists:

| Rules version | Resolved | Allied, priced in home faction | Legends, no points row | No points row | Row exists, not joined | Ambiguous | Alias-resolvable |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `mfm-1-6` | 1,239 | 166 | 893 | 124 | 4 | 0 | 37 (+14 ambiguous) |
| `mfm-1-5` versions (4) | 1,236–1,292 | 62–84 | 897–898 | 124–126 | 4–13 | 1 | 36 (+14) |
| `marine-points-1013` | 1,236 | 62 | 898 | 124 | 4 | 1 | 36 (+14) |
| `mfm-1-4` versions (2) | 1,305–1,370 | 122–139 | 777 | 119–122 | 4 | 0 | 36 (+14) |

"No points row" means no faction file has a row of that name. In `mfm-1-6` that is 22 distinct names, including retired units such as Tactical Squad and Devastator Squad, named characters such as Uriel Ventris, and sub-units such as Spore Mines (Biovore). Praetorium prices these from the catalogue's own costs.

Gaps in Praetorium's join, outside this repository:

- **Agents of the Imperium, Adeptus Titanicus, Titanicus Traitoris.** `mfmSlugs` derives `agents-of-the-imperium`, `adeptus-titanicus` and `titanicus-traitoris`, but the dataset files are `imperial-agents`, `titan-legions` and `chaos-titan-legions`. Their datasheets and detachments never reach a points row. Passing those aliases resolves 37 more reference datasheets (36 in older versions) and 5 detachments. 14 datasheets stay ambiguous because `imperial-agents` lists several of its units twice at different costs.
- **Retained chapter books.** `legacy-profiles` and `legacy-marine-old` carry books named like `Imperium - Imperial Fists (11e)`. The name lacks "Adeptus Astartes", so their detachments never fall back to `space-marines`. A `space-marines` alias resolves 96 detachments in `legacy-profiles` and 23 in `legacy-marine-old`. The rest have no row in their version's file.
- **Typographic dashes.** MFM 1.6 names a Custodes unit with a non-breaking hyphen, which Praetorium's name matching keeps, so the datasheet misses its row. Folding dashes resolves it.
- **MFM 1.4 enhancements.** 69 enhancement rows, 9 distinct names, do not join in both MFM 1.4 versions. One is the unfixed "(Upgarde)" spelling.

Detachments resolve 426 of 445 in `mfm-1-6`. The rest are the alias cases above, plus 14 whose row is in another faction's file. Enhancements and upgrades resolve 979 of 999; the 20 misses belong to unresolved detachments. 58 `mfm-1-6` points units join no datasheet. 43 are `imperial-agents` rows that the alias pass leaves out, mostly units listed twice. The rest are 6 Tarantula Air Defence Battery rows in Space Marine chapter files, 4 Chaos Titans named differently from their datasheets, 3 new Custodes rows, X-101, and a Soul Grinder.

## Localised names

All nine languages in the translations pin `4dd982c` were converted to format version 1. The entries are keyed by Praetorium's catalogue IDs: book IDs for factions, entry IDs for units and enhancements, and detachment option IDs. Wargear is keyed by a slug of its name, because one wargear name stands for many entries. Each source name is the `display` name; other spellings of the same entity are `spelling` aliases. Names that an ID carried in one of the six retired rules versions became `historical` aliases. Across those versions, 164 IDs carried a different name from today.

All nine files validate. Every source pair that names a catalogue entity resolves back to the same entity. Every ambiguity is settled by narrowing to the entity's kind and IDs, and none resolves to a different entity. Praetorium's `englishNames` returns the same entity for every pair whose translation differs from its English name, both per language and over the merged map the app loads.

| Language | Entries | Factions | Detachments | Units | Enhancements | Wargear | Historical aliases | Ambiguous names |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Portuguese | 6,058 | 33/36 | 145/256 | 1,593/1,753 | 559/801 | 3,727/4,461 | 35 | 363 |
| French | 3,078 | 30 | 219 | 906 | 254 | 1,665 | 26 | 301 |
| Spanish | 2,222 | 31 | 215 | 733 | 154 | 1,084 | 26 | 172 |
| Chinese | 1,664 | 8 | 218 | 406 | 138 | 889 | 14 | 114 |
| Italian | 987 | 29 | 216 | 253 | 76 | 408 | 3 | 112 |
| German | 723 | 23 | 214 | 121 | 82 | 278 | 2 | 31 |
| Korean | 680 | 30 | 218 | 99 | 72 | 256 | 2 | 34 |
| Japanese | 630 | 8 | 217 | 76 | 72 | 252 | 2 | 28 |
| Russian | 140 | 29 | 0 | 8 | 0 | 103 | 0 | 6 |

- **Source names outside the catalogue.** About half of each file's names match no entity: keywords, abilities, rules terms, option lines such as "1-3 Pyrovores", and experience ranks. They stay out of the candidates.
- **Ambiguity is real.** Most ambiguous names are units that two books carry under different entry IDs, such as a Chaos Rhino in five books. The resolver reports them, and narrowing to one faction's IDs settles every one.
- **Faction names in Japanese and Chinese.** Japanese has no `Faction:` keyword entries. Chinese writes them with a full-width colon, which Praetorium's keyword pattern does not read. Both therefore name only 8 of 36 factions.
- **Unsupported languages.** Every other language resolves as `unknown-language`, as a Polish probe confirmed. Russian has no detachment or enhancement names. Portuguese has detachment names for only 145 of 256 detachments, though it covers the most units.
- **Reuse.** The source records no licence and names New Recruit's community translators. No entry can be redistributed until that is settled, so the candidates carry an unresolved `reuse`.

## Faction icons

The inventory covers the current set and the three retained sets (`legacy-marine-old`, `legacy-profiles`, and `legacy-rosters` under `faction-icons`). Each set has 37 files, about 161 KiB. Every file matches an upstream blob of Certseeds/wh40k-icon at the path the manifest names. 36 are identical at `99b7cb9` and `be23002`. Only `leagues-of-votann` differs: the current set has the `99b7cb9` drawing and the retained sets have the `be23002` one. No retained rules version renders an icon that is not in upstream history.

Run through `verifyIcon` under the closest stated term, CC BY-NC-SA 4.0, none of the 148 files passes. Every file fails the licence check, and none is recorded here as covered by a licence. 24 files per set also fail the structural check, because they open with an Illustrator or Inkscape generator comment before the `<svg>` element. All 37 have a `viewBox`, no scripts and no external references, and Praetorium's materializer accepts them. The comments carry no attribution.

## Publication state at the baseline

No converted record from this pass meets every criterion for release:

- **Points values.** The dataset's MIT licence names BSData. The inventory has no recorded reuse basis for values sourced from the publisher's manual.
- **Name translations.** No licence or redistribution basis.
- **Icons.** Non-commercial share-alike terms, and they depict marks that their own README attributes to Games Workshop.
- **ID maps.** They join provisional slugs to BSData entry IDs, so they depend on the catalogue identity contract ([#14](https://github.com/richardsolomou/40k-catalogue/issues/14)) and on the points snapshot they point into.

The `generic-hexagon` entry in [fixtures/icons/manifest.json](../fixtures/icons/manifest.json) was the original sample at the time of this audit. The separate [original marks release](https://github.com/richardsolomou/40k-catalogue/releases/tag/icons-v1.0.0) now supplies a full asset set. The contributor-written [necrons.fr.json](../fixtures/localisation/candidates/necrons.fr.json) still needs a reviewer with the French books.

## Remaining source dependence

- Points stay on the community dataset until the project records a reuse basis and maps points rows to stable IDs.
- Translations stay on New Recruit's project until a language has a source that permits redistribution and a measured import check.
- The original asset set is available. Assignments and online and offline verification belong to the consumer's icon cutover.
- Praetorium's faction aliases, retained chapter books and dash folding are fixes in the consuming app. They are needed before its catalogue IDs can join a snapshot by ID rather than by name.
