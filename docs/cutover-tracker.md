# Praetorium catalogue cutovers

This tracker records whether a 40K Catalogue release can replace each Praetorium game-data input. The [source inventory](source-inventory.md) records provenance and consumers. Use [issue #13](https://github.com/richardsolomou/40k-catalogue/issues/13) to track cutovers and retain a separate PR and rollback point for each source.

## Baseline

The initial comparison uses Praetorium commit `a9b4a5b3d37484f696b275d0b0e10b89ca07c325`, the baseline used in the inventory. Snapshot the actual production revision before any cutover and record it in that source's PR. The baseline below identifies the comparison inputs. [Source pins](https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/catalogue/sources.json) · [Composition](https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/catalogue/composition.json) · [Snapshot lock](https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/catalogue.json)

| Input | Baseline pin | Work item | Candidate and state | Required checks | Rollback |
| --- | --- | --- | --- | --- | --- |
| `wh40k-11e` roster definitions | `6fd981b` | [#6](https://github.com/richardsolomou/40k-catalogue/issues/6) | Candidate pending. Retain definitions while replacement roster and import parity is assessed. | Unit composition, wargear, constraints, saved roster IDs, imports, legality, offline construction | Restore the previous definition and overlay pins. |
| Game Datacards gameplay reference | `ebcd0cb`, faction and core files | [#7](https://github.com/richardsolomou/40k-catalogue/issues/7) | Candidate pending. The [pilot](https://github.com/richardsolomou/40k-catalogue/issues/3) checks four summaries before any source switch. | Versioned ability matching, reference/API and offline output, client-text tests, rule facts used by the app | Restore the previous reference input and summary mapping. |
| Game Datacards mission data | `ebcd0cb`, mission and layout files | [#8](https://github.com/richardsolomou/40k-catalogue/issues/8) | Candidate pending. Retain the mission source while setup and scoring parity are assessed. | Mission and layout IDs, deployment, objectives, scoring cases, saved battle replay | Restore the previous mission and layout inputs together. |
| Battlemaster geometry | `acabfa43bd2d7cabfc868789ff01c1d2f467e770baf1b77a5bf4c301ed3ab4e7` | [#9](https://github.com/richardsolomou/40k-catalogue/issues/9) | Candidate pending. Reuse terms and layout coverage are unresolved. | Chapter Approved and Combat Patrol maps, axes and orientation, walls and roofs, overlays, saved layout references | Restore the previous geometry pin and layout mappings. |
| Munitorum Field Manual points | `6eed7b1` | [#10](https://github.com/richardsolomou/40k-catalogue/issues/10) | Candidate pending. Retain the points source while parity and reuse terms are assessed. | Complete cost comparison, per-size prices, detachment points, old-version totals | Restore the previous points pin and keep historical snapshots. |
| Translated names | `4dd982c` | [#11](https://github.com/richardsolomou/40k-catalogue/issues/11) | Candidate pending. Reuse terms and supported import coverage are unresolved. | Aliases and display names, language handling, ambiguous imports, old names | Restore the previous translations pin and name matching. |
| Faction icons | `99b7cb9`, with `be23002` for retained and linked icons | [#12](https://github.com/richardsolomou/40k-catalogue/issues/12) | Candidate pending. Asset provenance and attribution need review. | Faction ID coverage, icon endpoint, offline and missing-icon display, attribution | Restore the previous icon pins and lookup. |
| Praetorium overlays, corrections, and retained versions | `a9b4a5b`, `catalogue/` and retained snapshot IDs | [#13](https://github.com/richardsolomou/40k-catalogue/issues/13), [#14](https://github.com/richardsolomou/40k-catalogue/issues/14) | Retain app-specific mappings and historic inputs. Assess each source correction when its input moves. | Apply overlays, reconcile corrections, retain old catalogue and data IDs, exercise saved rosters and battles | Restore the previous composition and snapshot. Preserve migration history. |

The inventory also records tournament samples and drift comparisons used for verification. Keep private roster samples out of Git and report aggregate results.

## Cutover record

When a source passes its scope issue, record these details in a focused cutover issue before switching the app:

- The production input and rules-version pins, the candidate's immutable release URL and checksum, and the categories and versions it covers.
- Source provenance, the recorded basis for reuse, and any entries that continue to use an existing source.
- A comparison at equivalent rules versions, linked test results for online and offline consumers, saved roster and battle compatibility, and explanations for any coverage differences.
- The previous catalogue snapshot and app configuration that can be restored. Keep IDs and historical snapshots resolvable through the switch and rollback.

Run Praetorium's catalogue preflight against the candidate in a preview. Use the roster audit, points comparison, terrain check, and client-text integration test wherever the source affects those paths. Repeat the relevant checks after switching the pin and record the deployed revision. [Catalogue guide](https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/docs/development/catalogue-data.md)

[Release validation](https://github.com/richardsolomou/40k-catalogue/issues/16) provides the evidence for eligible inputs. Close the cutover tracker after each input has a verified replacement or a documented retention decision.
