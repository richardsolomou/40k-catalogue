# Praetorium catalogue cutovers

This tracker records the preparation, verification and release status of every game-data input for the 40K Catalogue cutover. The [source inventory](source-inventory.md) records provenance and consumers. Use [issue #13](https://github.com/richardsolomou/40k-catalogue/issues/13) to track progress across all data. Praetorium source changes belong to a later phase.

## Baseline

The initial comparison uses Praetorium commit `a9b4a5b3d37484f696b275d0b0e10b89ca07c325`, the baseline used in the inventory. Snapshot the actual production revision before any cutover and record it in that source's PR. The baseline below identifies the comparison inputs. [Source pins](https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/catalogue/sources.json) · [Composition](https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/catalogue/composition.json) · [Snapshot lock](https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/catalogue.json)

The full rehearsal uses snapshot `9d1bbd972c311e52f7e6d2e912e08513ca55f865100957f3481110da31072466`, the immutable snapshot installed for the [pilot release](https://github.com/richardsolomou/praetorium.gg/pull/1975). Record counts and field gaps separately for each version. A staged candidate is ready for comparison. A publishable candidate also needs source provenance, reuse and review recorded for its contents.

| Input | Baseline pin | Work item | Candidate and state | Required checks | Rollback |
| --- | --- | --- | --- | --- | --- |
| `wh40k-11e` roster definitions | `6fd981b` | [#39](https://github.com/richardsolomou/40k-catalogue/issues/39) | 84,344 definition records and 85,119 typed profile and attachment records validate across nine versions. The size-bound rerun matches 114,042 of 129,002 wargear probes and 3,619 of 4,842 whole-list verdicts. Retain the definitions pending legality, saved-ID and source review. [Definition rehearsal](definition-cutover.md) · [Profile rehearsal](datasheet-profiles.md#rehearsal) | Unit composition, wargear, constraints, saved roster IDs, imports, legality, offline construction | Restore the previous definition and overlay pins. |
| Game Datacards gameplay reference | `ebcd0cb`, faction and core files | [#7](https://github.com/richardsolomou/40k-catalogue/issues/7) | Four mapped pilot summaries are published. A comparison against 40kdc-data 1.5.1 identifies 2,909 candidate effects for 4,765 distinct current IDs. The candidates need source and mechanics review. [Gameplay staging](gameplay-cutover.md) | Versioned ability matching, reference/API and offline output, client-text tests, rule facts used by the app | Restore the previous reference input and summary mapping. |
| Game Datacards mission data | `ebcd0cb`, mission and layout files | [#8](https://github.com/richardsolomou/40k-catalogue/issues/8) | Four pack variants and all Combat Patrol primary assignments validate. A private Chapter Approved variant reproduces the consumer's 10,576 cases. Three legacy slugs have historical records because their objective positions differ from those of the current maps. Printed timing, caps and award criteria still need review. [Mission rehearsal](missions-terrain-cutover.md#mission-packs) · [Legacy deployments](missions-terrain-cutover.md#legacy-deployment-rehearsal) | Mission and layout IDs, deployment, objectives, scoring cases, saved battle replay | Restore the previous mission and layout inputs together. |
| Battlemaster geometry | `acabfa43bd2d7cabfc868789ff01c1d2f467e770baf1b77a5bf4c301ed3ab4e7` | [#9](https://github.com/richardsolomou/40k-catalogue/issues/9) | The [terrain rehearsal](missions-terrain-cutover.md#terrain) verified 50 layouts and 11 deployments, including two King of the Colosseum layouts. The private archives verify; the geometry still needs a recorded basis for reuse. | Chapter Approved and Combat Patrol maps, axes and orientation, walls and roofs, overlays, saved layout references | Restore the previous geometry pin and lookup. |
| Munitorum Field Manual points | `6eed7b1` | [#10](https://github.com/richardsolomou/40k-catalogue/issues/10) | The [points rehearsal](points-names-icons-cutover.md#points) validates five snapshots and matches 336,465 unit-price probes and 12,820 other cost checks across nine rules versions. Retain the source pending reuse and complete catalogue ID joins. | Complete ID joins, add-on mappings and saved-list totals | Restore the previous points pin and keep historical snapshots. |
| Translated names | `4dd982c` | [#11](https://github.com/richardsolomou/40k-catalogue/issues/11) | 81 private language files validate against the relevant identity releases. Book context resolved 391 unit lines in the non-English sample, up from 318 without it. Retain the source pending reuse and full import parity. [Versioned name comparison](localisation.md#stable-ids-and-book-context) | Aliases and display names, language handling, ambiguous imports, old names | Restore the previous translations pin and name matching. |
| Faction icons | `99b7cb9`, with `be23002` for retained and linked icons | [#38](https://github.com/richardsolomou/40k-catalogue/issues/38) | 37 original marks cover the 37 current and retained icon IDs in a private assignment. The consumer assignment, attribution and UI checks remain part of its cutover. [Original marks v1.0.0](https://github.com/richardsolomou/40k-catalogue/releases/tag/icons-v1.0.0) | Faction ID coverage, icon endpoint, offline and missing-icon display, attribution | Restore the previous icon pins and lookup. |
| Praetorium overlays, corrections, and retained versions | `a9b4a5b`, `catalogue/` and retained snapshot IDs | [#13](https://github.com/richardsolomou/40k-catalogue/issues/13), [#14](https://github.com/richardsolomou/40k-catalogue/issues/14) | Matched all nine composed versions to their compiled catalogues and inventoried three stored snapshots, 29 patches, eight compatibility files and 39 history entries. Replay the corrections against their replacement inputs. | Apply overlays, reconcile corrections, retain old catalogue and data IDs, exercise saved rosters and battles | Restore the previous composition and snapshot. Preserve migration history. |

The inventory also records tournament samples and drift comparisons used for verification. Keep private roster samples out of Git and report aggregate results.

## Cross-category checks

The nine versions in the definition, gameplay and points rehearsals match the snapshot's composition. All nine definition record sets, five points snapshots, four mission packs and nine localisation files pass their format validators. Both mission and terrain candidate archives pass archive verification.

The current join checks use the consumer's source IDs and the candidate identity ledger. The points row below starts with unit prices the consumer already maps. The name check limits the comparison to entries of kinds the roster format validates.

| Candidate join | Checked | Exact | Context required | Missing |
| --- | --- | --- | --- | --- |
| Existing unit-price joins to a roster entry | 2,301 | 2,299 | 0 | 2 |
| Proposed unit-price joins to a roster entry | 37 | 36 | 0 | 1 |
| Reference datasheets to roster entries | 2,230 | 2,216 | 0 | 14 |
| Localised unit, detachment and enhancement entries to a roster entry | 7,264 | 6,136 | 1,098 | 30 |

The separate profile stage captures all 2,470 current unit profiles and 11,302 current weapon profiles by recognised field. The [typed profile rehearsal](datasheet-profiles.md#rehearsal) expands those records across catalogue units that share a datasheet. It reports unmatched wargear, model and attachment links, and records capacity for the transport rules the existing reader can interpret.

The current roster candidate has 306 shared loadout bounds on 110 units. Targeted pair and single-choice agreement rose from 10,302 to 10,768 of 12,997 cases. Whole-list agreement remains 3,619 of 4,842. Direct weapon ancestry adds 125 verified wargear links across the nine versions without changing existing joins. [Loadout comparison](definition-cutover.md#shared-option-bounds-rerun) · [Weapon profile joins](datasheet-profiles.md#weapon-profile-joins)

The nine private aggregate archives verify 174,627 records across rosters, profiles, points, localisation, missions and terrain. The current rules version contributes 80,480. This includes the wargear records that identify the actual weapons in confirmed loadout bundles and 270 transport records with four capacity gaps. The manifests also pin the separately released original marks and retained gameplay input. The summary queue tracks review separately and holds 2,275 current drafts that passed automated checks, including 644 stratagems and 123 core rule or keyword summaries. [Full summary coverage](gameplay-cutover.md#full-summary-coverage)

## Cutover record

When a source passes its scope issue, record these details in a focused cutover issue before switching the app:

- The production input and rules-version pins, the candidate's immutable release URL and checksum, and the categories and versions it covers.
- Source provenance, the recorded basis for reuse, and any entries that continue to use an existing source.
- A comparison at equivalent rules versions, linked test results for online and offline consumers, saved roster and battle compatibility, and explanations for any coverage differences.
- The previous catalogue snapshot and app configuration that can be restored. Keep IDs and historical snapshots resolvable through the switch and rollback.

Run Praetorium's catalogue preflight against the candidate in a preview. Use the roster audit, points comparison, terrain check, and client-text integration test wherever the source affects those paths. Repeat the relevant checks after switching the pin and record the deployed revision. [Catalogue guide](https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/docs/development/catalogue-data.md)

The [catalogue release manifest](catalogue-releases.md) lists missing records, cross-category dependencies and retained source pins. The bundled test releases use invented roster, mission and terrain records. The Necrons pilot remains the published candidate for gameplay summaries. Use the production comparison above to decide when a category is ready to switch. Close the cutover tracker after each input has a verified replacement or a documented retention decision.
