# Roadmap

40K Catalogue publishes structured game data and original summaries for third-party apps. Praetorium is the first consumer. The goal is to replace its catalogue inputs where we can establish a basis for reuse, reproduce the relevant gameplay facts, and verify compatibility. Keep app code and app-specific mappings in Praetorium.

## Start here

- [#1 Define the record format and renderer](https://github.com/richardsolomou/40k-catalogue/issues/1) can run entirely on synthetic fixtures.
- [#2 Inventory the current sources](https://github.com/richardsolomou/40k-catalogue/issues/2) starts from the pinned Praetorium manifest and can run in parallel with #1.
- [#3 Author the pilot](https://github.com/richardsolomou/40k-catalogue/issues/3), [#4 publish a pinned release](https://github.com/richardsolomou/40k-catalogue/issues/4), and [#5 integrate the release](https://github.com/richardsolomou/40k-catalogue/issues/5) follow in order. Use the acceptance checks and dependencies in the issue you pick up.

## Necrons pilot

Use the 11th-edition Pantheon of Woe detachment. The table records the cases the pilot has to preserve. Check them against the selected edition and update when authoring records. Keep exact printed wording in the source and use its page reference in the record. [Necrons Faction Pack v1.3, pages 11–12](https://assets.warhammer-community.com/eng_30-09_wh40k_faction_pack_necrons-1urphgbmpy-wbhocjbaba.pdf#page=11)

| Rule | Cases to verify |
| --- | --- |
| Disharmonisation Cascade | The window opens on destruction of a friendly Necrons Monster model and closes at that model's Deadly Demise roll. The targeting exception and 3+ threshold apply to that model. |
| Mass Transmogrification | Use the defeated enemy's Unravelling status at phase start. Measure 6 inches from the friendly Monster that made the kill to the friendly non-Monster recipient. The recipient's Reanimation Protocols activate only if the condition passes. |
| Phase Melding | Bind the engaged friendly target separately from the enemy selected to Fall Back. Check for the enemy's actual Fall Back move, one Desperate Escape test per enemy model, and the Battle-shock penalty. |
| Reletavistic Tether | Apply the 6-inch horizontal boundary to an ingress or advance through Transdimensional Displacement. Check the independent 8-inch charge restriction at the end of that same move. |

Use distinct project IDs and an explicit rules version. Verify mappings to consumer IDs in the app and keep old versions intact across updates. Measure how many of the four summaries appear in the app and how long review takes per entry.

## Catalogue transition

These are the migration work items. The [source inventory](source-inventory.md) records exactly which app features use each input and identifies any gaps in provenance or coverage. [Praetorium source manifest baseline](https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/catalogue/sources.json) · [Catalogue composition baseline](https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/catalogue/composition.json)

| Input | Migration issue |
| --- | --- |
| `wh40k-11e` units, wargear, and roster definitions | [#6 Definition compatibility](https://github.com/richardsolomou/40k-catalogue/issues/6) |
| Game Datacards gameplay reference, including unit, faction, detachment, and core rules | [#7 Rules reference coverage](https://github.com/richardsolomou/40k-catalogue/issues/7) |
| Game Datacards mission packs, scoring, deployments, and layout references | [#8 Mission pack coverage](https://github.com/richardsolomou/40k-catalogue/issues/8) |
| Battlemaster battlefield geometry and layout details | [#9 Terrain geometry](https://github.com/richardsolomou/40k-catalogue/issues/9) |
| Munitorum Field Manual points | [#10 Points updates](https://github.com/richardsolomou/40k-catalogue/issues/10) |
| Translated names and import aliases | [#11 Localised catalogue names](https://github.com/richardsolomou/40k-catalogue/issues/11) |
| Faction artwork and icons used by the catalogue | [#12 Faction icon assets](https://github.com/richardsolomou/40k-catalogue/issues/12) |

Integrate one source at a time. The [cutover tracker](cutover-tracker.md) records baseline pins, verification, and rollback steps for [#13](https://github.com/richardsolomou/40k-catalogue/issues/13).

## Shared work

- [Catalogue IDs and versioning](catalogue-identity.md) covers joins across record types, aliases, and historical records. [#14](https://github.com/richardsolomou/40k-catalogue/issues/14)
- [Authoring and review](authoring.md) turns the pilot workflow into a process contributors can run for other rules. [#15](https://github.com/richardsolomou/40k-catalogue/issues/15)
- [Catalogue release validation](catalogue-releases.md) extends the pilot packaging with cross-category validation, compatibility reports, and an inventory of what each release covers. [#16](https://github.com/richardsolomou/40k-catalogue/issues/16)

## Praetorium integration

Start app work from its current `main` and follow its catalogue guide. The earlier summary prototype is available as a reference. At the baseline above, its `src/server/ruleSummaries.ts` was only on the prototype branch. The client-text test and offline bundle builder were already on `main`. Bind the pilot to the same version and ability identity in online and offline views and keep summaries out of game calculations. [Catalogue guide](https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/docs/development/catalogue-data.md) · [Summary prototype](https://github.com/richardsolomou/praetorium.gg/blob/c742a9ef7e76029cbc900f236edc26bd84934986/src/server/ruleSummaries.ts)
