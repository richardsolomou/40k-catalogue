# Necrons gameplay reference coverage

This report measures how much of the Necrons gameplay reference Praetorium reads from Game Datacards is covered by reviewed mechanic records at the same rules version. It counts entries by name and ID only and reproduces no rules text. [#7](https://github.com/richardsolomou/40k-catalogue/issues/7)

## Baseline

| Input | Pin |
| --- | --- |
| Praetorium rules version | `mfm-1-6`, the released default, which takes the root source pins |
| Game Datacards | [`game-datacards/datasources@ebcd0cb`](https://github.com/game-datacards/datasources/tree/ebcd0cbedb197fd8246b7cff580fde3625c6f3f1/11th/gdc), `necrons.json` and `core.json`. The Necrons file reports data version 995, updated 16 October 2026 |
| Records | [v0.1.0](https://github.com/richardsolomou/40k-catalogue/releases/tag/v0.1.0), archive SHA-256 `536d57ca…`, four records checked against 11th edition, Necrons Faction Pack v1.3 |
| Mapping | `catalogue/rule-summaries.json` in [praetorium.gg#1975](https://github.com/richardsolomou/praetorium.gg/pull/1975) at `02b7b28`, which maps `mfm-1-6` to Faction Pack v1.3 and each record to its Game Datacards ID |

The comparison treats the Game Datacards file as Faction Pack v1.3, as the mapping does. Game Datacards does not record which Faction Pack version it transcribes, so that equivalence is an assumption ([source inventory](source-inventory.md#source-use-decision-for-3), unresolved decision 3). If it is wrong, all four covered entries become ambiguous.

## Results

An entry is covered when exactly one mapped record at the same rules version has no unresolved part. It has gaps when that record has unresolved parts, and it is ambiguous when several records map to it or its record names another rules version. Otherwise it is missing.

| Kind | Entries | Covered | Gaps | Ambiguous | Missing |
| --- | ---: | ---: | ---: | ---: | ---: |
| Army rule | 1 | 0 | 0 | 0 | 1 |
| Detachment rules | 12 | 0 | 0 | 0 | 12 |
| Detachment stratagems | 63 | 3 | 0 | 0 | 60 |
| Enhancements | 42 | 1 | 0 | 0 | 41 |
| Datasheet abilities | 126 | 0 | 0 | 0 | 126 |
| Core stratagems | 11 | 0 | 0 | 0 | 11 |
| Core abilities on Necrons datasheets | 12 | 0 | 0 | 0 | 12 |
| Weapon abilities on Necrons weapons | 17 | 0 | 0 | 0 | 17 |
| **Total** | **284** | **4** | **0** | **0** | **280** |

The faction file holds 52 datasheets and 12 detachments. Datasheet abilities count each datasheet's own, special, wargear, and grouped (`primarch`) abilities once per datasheet, plus one Damaged entry for each of the nine datasheets with a damaged profile. Core and weapon abilities count each mechanic once, so Feel No Pain 4+ and 5+ are one entry. Invulnerable saves are characteristics and are not counted. The faction ability every datasheet carries is the army rule.

The mapping reports no problems: all four records load, and all four Game Datacards IDs are in the inventory.

### Pantheon of Woe

The detachment has 11 entries. Four are mapped to the pilot, and seven are missing. The browser check for [#1975](https://github.com/richardsolomou/praetorium.gg/pull/1975) shows all four community summaries online and after a cold offline launch with external rules text disabled.

| Entry | Kind | Game Datacards ID | State |
| --- | --- | --- | --- |
| Cosmic Distortion | Detachment rule | `a7ec286c-a305-435b-b402-91140c67d809` (detachment) | Missing |
| Disharmonisation Cascade | Stratagem | `c236587e-6f3f-5062-a3e1-28d457193578` | Covered |
| Mass Transmogrification | Stratagem | `8dc612d3-3ec0-5cbb-b624-c57a3ebbc0b1` | Covered |
| Phase Melding | Stratagem | `ef2e051f-6a3c-573a-8646-4cba770e8bef` | Covered |
| Entrophasic Aura Targeting | Stratagem | `d47c8669-3842-59db-9c0b-a9c47501fc38` | Missing |
| Chronodistortion | Stratagem | `eb0a2556-e172-59de-ab32-55cb6890184a` | Missing |
| Molecular Erosion | Stratagem | `b9838b15-4d00-5807-90d7-f4d35517e8f9` | Missing |
| Reletavistic Tether | Enhancement | `1e2b0519-eeac-5062-a529-1b6bc12a75c5` | Covered |
| Singularity Matrix | Enhancement | `0032c15c-0d9f-5f7f-b961-287d32f28540` | Missing |
| Quantum Goad | Enhancement | `f51cf3a5-8a00-5be6-a3d7-0681f6a18526` | Missing |
| Animus Damper | Enhancement | `bd9bdaeb-3a8e-5f8f-8768-9182486de9d6` | Missing |

The other 11 detachments have no records.

### Mechanics the covered records depend on

The four records name mechanics that have no record of their own. Reanimation Protocols is the army rule and Deadly Demise is a core ability, both missing above. Transdimensional Displacement is a Transcendent C'tan datasheet ability, also missing. Fall Back, Desperate Escape tests, Battle-shock, Engagement Range, and Ingress and Advance moves are core rules sections, which Praetorium reads as rule documents rather than cards, so the inventory does not count them. Unravelling is not the name of any inventory entry. Finding the rule that defines it means reading rules text, which this audit does not do.

## How Praetorium uses these entries

Paths are on Praetorium `main`.

| Consumer | Entries | Use |
| --- | --- | --- |
| Battle tracker and battle preparation | Detachment and core stratagems | Behaviour. `src/shared/datacards.ts` and `src/server/rulesCards.ts` read each card's ID, CP cost, phases, turn, and limit. `src/core/sideStratagems.ts` builds each side's pool, and saved preparation stores the card ID. `src/core/stratagemCorrections.ts` fixes three cards' timing. A detachment card without rules text is dropped as incomplete, so replacing Game Datacards here needs structured usage fields and something in place of its text. |
| Combat simulator, loadout optimizer, roster comparison, roster grades, and MCP `simulate_combat` | Datasheet abilities, enhancements, the army rule, detachment rules, detachment and core stratagems, weapon abilities | Behaviour. `src/shared/rosterCombatRules.ts` gathers each rule's wording, and `src/core/combatRuleCompiler.ts` and `src/core/combatKeywords.ts` compile effects from it, refusing what they cannot read. Stratagem phases decide whether a card applies at range or in melee. |
| Reference pages, offline bundle, reference API, MCP reference tools | All kinds | Display. Names, numbers, and `textSources` links; the browser fetches the wording at the pinned commit. |
| Pilot summaries ([#1975](https://github.com/richardsolomou/praetorium.gg/pull/1975)) | The four mapped entries | Display only, on the detachment page and in the offline bundle. Combat rules, battle construction data, and search keep their existing inputs. |

The client-text boundary holds for the pilot. `scripts/clientText.integration.test.ts` audits every public and construction payload for Game Datacards and BSData rules text, and #1975 reports it passing against a snapshot with the v0.1.0 summaries in it. Summaries are original wording, so they sit outside that check by design.

## Drafting the missing Pantheon of Woe entries

The next drafts need independently written contributor notes from the Faction Pack. The [authoring workflow](authoring.md) describes how to record each rule's source, trigger, target, conditions, effects and exceptions. The seven missing rules have not been reviewed. The pilot's four records were reviewed as one batch without per-entry times.

Format version 1 is also likely to limit what can be drafted beyond the pilot. Its triggers are phase boundaries, move selection and ending, moves made through a named ability, and model or unit destruction. It has no trigger for an always-on rule, a unit being selected to shoot or fight, or a step of the attack sequence. Most detachment rules, enhancements, datasheet abilities, and weapon abilities are of those shapes, and two of the three missing stratagems are tagged for the Shooting or Fight phase. Confirm which of them actually need a new trigger or effect when the notes exist.

## Before replacing Game Datacards

1. Settle whether original summaries and structured facts can be published ([source inventory](source-inventory.md#source-use-decision-for-3), unresolved decision 1).
2. Confirm which Faction Pack version the Game Datacards pin transcribes, or have Praetorium compare against an inventory built from an authorised source.
3. Extend the record format for always-on rules, shoot and fight selection, and attack-sequence steps.
4. Author and review the remaining 280 Necrons entries, starting with the seven Pantheon of Woe entries, Reanimation Protocols, and the core mechanics the pilot depends on. Record per-entry review time.
5. For the battle tracker, publish usage fields for every stratagem, including core ones, and change Praetorium so a card stays usable without upstream text.
6. For the simulator, give Praetorium a structured-effect path that reads records instead of compiling wording, and compare its results with the current compiler before switching any entry.
7. Keep the mapping and the Praetorium rules version binding in Praetorium, as #1975 does.

## Reproducing

[src/gameplay-coverage](../src/gameplay-coverage) builds an inventory of names and IDs from a Game Datacards faction file and reports coverage against records and a consumer's mapping. Neither command reads or writes rules text. Keep downloaded source files outside the repository.

```sh
node src/gameplay-coverage/cli.ts inventory <necrons.json> --core <core.json> \
  --edition 11th --update "Necrons Faction Pack v1.3" \
  --title "Game Datacards 11th/gdc" --revision ebcd0cbedb197fd8246b7cff580fde3625c6f3f1 > necrons.inventory.json
node src/gameplay-coverage/cli.ts report necrons.inventory.json <mapping.json> <release>/records --entries
```

The mapping is a JSON object from record ID to entry ID; derive it from Praetorium's `rule-summaries.json` with `jq '.records | map_values(.datacards)'`. The report exits with status 1 when a mapping names a record that was not loaded or an entry the inventory lacks, or a record has no mapping. The inventory contract is [inventory.v1.schema.json](../src/gameplay-coverage/inventory.v1.schema.json), and `test/gameplay-coverage.test.ts` runs the synthetic cases in [fixtures/gameplay-coverage](../fixtures/gameplay-coverage).
