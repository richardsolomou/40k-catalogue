# Space Marines codex · 12 Oct 2026 rule summaries

Catalogue release input for Warhammer 40,000 11th edition, Space Marines codex · 12 Oct 2026: the `rules-reference` and `mission-rules` categories. [Rule summaries](../../../docs/rule-summaries.md) defines the records and [catalogue releases](../../../docs/catalogue-releases.md) explains how to build them.

Every summary is original wording, checked against the official sources it cites. They are pre-release drafts that no person has reviewed yet.

| Category | Active entries | Records | Unresolved |
| --- | --- | --- | --- |
| `rules-reference` | 5,931 | 5,918 | 13 |
| `mission-rules` | 236 | 236 | 0 |

Every record cites the signed app build in force at the update's cutoff, Warhammer 40,000: The App 2.7.1, data build 972, released 2026-10-02. 681 records cite the Games Workshop PDF page that prints the rule, which is then their `source`. 19 records rest on a reading the sources leave open and carry an `interpretation` flag.

Typed facts follow the [rule facts](../../../docs/rule-facts.md) format: 818 Enhancements carry their eligibility and 197 awards their scoring from the app build's rows, and drafted structure is in `detail`.

The `rosters`, `profiles` and `points` categories hold the update's datasheets, built from the app build: 1,056 units with roster definitions (1,311 wargear options), 1,116 stat lines and 5,172 weapon profiles, and the `marine-main` points snapshot of 1,055 units, 252 Detachments and 818 Enhancements. Datasheets are modelled once, not once per Space Marine chapter; each unit lists the BSData entry IDs it stands for as `aliases`. 307 Warhammer Legends datasheets the app does not carry come from Games Workshop's Legends PDFs, with their profiles and, in the `marine-main-legends` snapshot, the costs of 297 of them from the Munitorum Field Manual's Legends section. 291 Legends datasheets have roster definitions typed from the PDF's composition, equipment and wargear options (30 of them with options left out, listed below), and their weapon profiles name that wargear.

FAQs also name 1 publication, an identity entry of the retained `publications` category.

## Retired

6 FAQs superseded by newer publisher documents before the cutoff:

- `faq` `codex-chaos-knights.errata.iconoclast-fiefdom-detachment-preserve-the-idols-stratagem-target`, replaced by Chaos Knights Faction Pack: Version 1.2, page 4
- `faq` `codex-chaos-knights.errata.knight-abominant-volkite-combustor-weapon`, replaced by Chaos Knights Faction Pack: Version 1.2, page 25
- `faq` `codex-emperors-children.errata.slaaneshs-chosen-detachment-refusal-to-be-outdone-stratagem`, replaced by Emperor’s Children Faction Pack: Version 1.3, page 9
- `faq` `codex-necrons.errata.ophydian-destroyers-tunnelling-horrors-ability-2`, replaced by Necrons Faction Pack: Version 1.3, page 30
- `faq` `imperial-armour-grey-knights.errata.grey-knights-thunderhawk-gunship`, replaced by Grey Knights Faction Pack: Version 1.2, page 7; Grey Knights Faction Pack: Version 1.2, page 8
- `faq` `index-chaos-daemons.errata.feculent-gnarlmaw-screamers-skull-altar-keywords`, replaced by Chaos Daemons Faction Pack: Version 1.2, page 61; Chaos Daemons Faction Pack: Version 1.2, page 87; Chaos Daemons Faction Pack: Version 1.2, page 37

## Unresolved

Active entries without a record, by reason. An entry with several reasons is listed under each.

### A rule known only by name, which the catalogue links to its keyword's definition only in the current rules version (9)

- `ability` `core.conversion`
- `ability` `core.damaged`
- `ability` `core.devastating-wounds-non-monster-vehicle`
- `ability` `core.leader`
- `ability` `core.lethal-hits-non-monster-vehicle`
- `ability` `core.precision`
- `ability` `core.rapid-fire`
- `ability` `core.sustained-hits-1-non-monster-vehicle`
- `ability` `core.sustained-hits-2-non-monster-vehicle`

### The rule's text is not yet tied to an official source (6)

- `ability` `core.conversion`
- `ability` `core.devastating-wounds-non-monster-vehicle`
- `ability` `core.lethal-hits-non-monster-vehicle`
- `ability` `core.precision`
- `ability` `core.sustained-hits-1-non-monster-vehicle`
- `ability` `core.sustained-hits-2-non-monster-vehicle`

### The rule has no finished draft for this version (4)

- `ability` `shared.land-raider-crusader.damaged`
- `ability` `shared.land-raider-redeemer.damaged`
- `ability` `shared.land-raider.damaged`
- `ability` `shared.stormraven-gunship.damaged`

### The rule's text differs between the factions that share it (4)

- `ability` `shared.land-raider-crusader.damaged`
- `ability` `shared.land-raider-redeemer.damaged`
- `ability` `shared.land-raider.damaged`
- `ability` `shared.stormraven-gunship.damaged`

### A Warhammer Legends datasheet from a Games Workshop PDF whose composition or default equipment did not read as typed values (16)

- `unit` `astra-militarum.death-korps-grenadier-squad`
- `unit` `astra-militarum.hells-last`
- `unit` `astra-militarum.macharius-vulcan`
- `unit` `astra-militarum.praetor`
- `unit` `astra-militarum.regimental-attaches`
- `unit` `astra-militarum.rein-and-raus`
- `unit` `chaos-space-marines.gellerpox-infected`
- `unit` `imperial-agents.inquisitor-eisenhorn`
- `unit` `imperial-agents.inquisitor-ostromandeus`
- `unit` `imperial-agents.kill-team-cassius`
- `unit` `imperial-agents.proteus-kill-team`
- `unit` `necrons.night-shroud`
- `unit` `space-marines.bike-squad`
- `unit` `space-marines.fire-raptor-gunship`
- `unit` `tau-empire.aunva`
- `unit` `unaligned-forces.imperial-fortress-walls`

## Wargear options left out

Options a source gives that are not stated: from the app build, structures the roster format cannot express exactly; from a Legends PDF (marked so), option text not of a typed form. `checkRoster` refuses them rather than accept a choice the source forbids.

- `adeptus-mechanicus.secutarii-peltasts`: option not typed: no model of the unit carries what it replaces (Legends PDF)
- `aeldari-2.skathach-wraithknight`: option not typed: its choices did not read as wargear (Legends PDF)
- `astra-militarum.death-korps-grenadier-squad`: alternative unit compositions are printed (Legends PDF)
- `astra-militarum.griffon-mortar-carrier`: option not typed: its wording is none of the typed forms (Legends PDF)
- `astra-militarum.hells-last`: default equipment not typed (Legends PDF)
- `astra-militarum.macharius-vulcan`: default equipment not read (Legends PDF)
- `astra-militarum.praetor`: default equipment not read (Legends PDF)
- `astra-militarum.regimental-attaches`: a model's default equipment not read (Legends PDF)
- `astra-militarum.rein-and-raus`: a model's default equipment not read (Legends PDF)
- `astra-militarum.sabre-weapons-battery`: option not typed: its wording is none of the typed forms (Legends PDF)
- `blood-angels.death-company-dreadnought-with-magna-grapple`: option not typed: no model of the unit carries what it replaces (Legends PDF)
- `chaos-daemons.pox-riders`: option not typed: its choices did not read as wargear (Legends PDF)
- `chaos-daemons.pox-riders`: option not typed: its choices did not read as wargear (Legends PDF)
- `chaos-space-marines.cultist-mob-with-firearms`: option not typed: no model of the unit carries what it replaces (Legends PDF)
- `chaos-space-marines.cultist-mob-with-firearms`: option not typed: no model of the unit carries what it replaces (Legends PDF)
- `chaos-space-marines.cultist-mob-with-firearms`: option not typed: no model of the unit carries what it replaces (Legends PDF)
- `chaos-space-marines.cultist-mob-with-firearms`: option not typed: no model of the unit carries what it replaces (Legends PDF)
- `chaos-space-marines.decimator`: option not typed: its wording is none of the typed forms (Legends PDF)
- `chaos-space-marines.gellerpox-infected`: default equipment not typed (Legends PDF)
- `chaos-space-marines.renegade-heavy-weapons-squad`: option not typed: its wording is none of the typed forms (Legends PDF)
- `drukhari.grotesques`: option not typed: its wording is none of the typed forms (Legends PDF)
- `imperial-agents.inquisitor-eisenhorn`: default equipment not read (Legends PDF)
- `imperial-agents.inquisitor-in-terminator-armour`: option not typed: its wording is none of the typed forms (Legends PDF)
- `imperial-agents.inquisitor-in-terminator-armour`: option not typed: its wording is none of the typed forms (Legends PDF)
- `imperial-agents.inquisitor-ostromandeus`: a model's default equipment not read (Legends PDF)
- `imperial-agents.kill-team-cassius`: default equipment not read (Legends PDF)
- `imperial-agents.proteus-kill-team`: a model's default equipment not read (Legends PDF)
- `necrons.night-shroud`: default equipment not read (Legends PDF)
- `necrons.tomb-citadel-walls`: option not typed: its wording is none of the typed forms (Legends PDF)
- `space-marines.assault-squad-with-jump-packs`: option not typed: its wording is none of the typed forms (Legends PDF)
- `space-marines.assault-squad`: option not typed: its wording is none of the typed forms (Legends PDF)
- `space-marines.bike-squad`: a model's default equipment not read (Legends PDF)
- `space-marines.command-squad`: option not typed: no model of the unit carries what it replaces (Legends PDF)
- `space-marines.command-squad`: option not typed: no model of the unit carries what it replaces (Legends PDF)
- `space-marines.company-veterans-on-bikes`: option not typed: its wording is none of the typed forms (Legends PDF)
- `space-marines.company-veterans-on-bikes`: option not typed: its wording is none of the typed forms (Legends PDF)
- `space-marines.fire-raptor-gunship`: default equipment not read (Legends PDF)
- `space-marines.relic-terminator-squad`: option not typed: its wording is none of the typed forms (Legends PDF)
- `space-marines.scout-sniper-squad`: option not typed: no model of the unit carries what it replaces (Legends PDF)
- `space-marines.storm-eagle-gunship`: option not typed: no model of the unit carries what it replaces (Legends PDF)
- `space-marines.techmarine-on-bike`: option not typed: its wording is none of the typed forms (Legends PDF)
- `space-wolves.stormwolf`: option not typed: its wording is none of the typed forms (Legends PDF)
- `space-wolves.wolf-guard-pack-leader-in-terminator-armour`: option not typed: its choices did not read as wargear (Legends PDF)
- `space-wolves.wolf-guard-pack-leader-in-terminator-armour`: option not typed: its choices did not read as wargear (Legends PDF)
- `space-wolves.wolf-guard-pack-leader-with-jump-pack`: option not typed: its choices did not read as wargear (Legends PDF)
- `space-wolves.wolf-guard-pack-leader`: option not typed: its choices did not read as wargear (Legends PDF)
- `space-wolves.wolf-guard`: option not typed: its wording is none of the typed forms (Legends PDF)
- `tau-empire.aunva`: default equipment not typed (Legends PDF)
- `tau-empire.commander-in-crisis-battlesuit`: option not typed: its choices did not read as wargear (Legends PDF)
- `tau-empire.commander-in-crisis-battlesuit`: option not typed: its choices did not read as wargear (Legends PDF)
- `tau-empire.crisis-battlesuits`: option not typed: its choices did not read as wargear (Legends PDF)
- `tau-empire.crisis-battlesuits`: option not typed: its wording is none of the typed forms (Legends PDF)
- `tau-empire.xv9-hazard-battlesuits`: option not typed: its choices did not read as wargear (Legends PDF)
- `unaligned-forces.aegis-defence-line-with-weapon-emplacement`: option not typed: its wording is none of the typed forms (Legends PDF)
- `unaligned-forces.castellum-stronghold`: option not typed: its choices did not read as wargear (Legends PDF)
- `unaligned-forces.imperial-fortress-walls`: default equipment not typed (Legends PDF)
