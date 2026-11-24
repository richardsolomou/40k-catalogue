# MFM 1.6 rule summaries

Catalogue release input for Warhammer 40,000 11th edition, MFM 1.6: the `rules-reference` and `mission-rules` categories and its mission packs. [Rule summaries](../../../docs/rule-summaries.md) defines the records and [catalogue releases](../../../docs/catalogue-releases.md) explains how to build them.

Every summary is original wording, checked against the official sources it cites. They are pre-release drafts that no person has reviewed yet.

| Category | Active entries | Records | Unresolved |
| --- | --- | --- | --- |
| `rules-reference` | 6,863 | 6,863 | 0 |
| `mission-rules` | 291 | 267 | 24 |

6,412 records cite the signed app build in force at the update's cutoff, Warhammer 40,000: The App 2.8.0, data build 981, released 2026-10-14; 582 records that no app row carries cite only the dated Games Workshop page that prints it. 136 records are provisional: no official source in reach prints the rule (abilities of Crucible datasheets, printed only in the Crucible of Champions book), so they cite nothing and carry `provisional: true` until one does, naming that book as `source`. 1,687 records cite the Games Workshop PDF page that prints the rule, which is then their `source`. 22 records rest on a reading the sources leave open and carry an `interpretation` flag.

Typed facts follow the [rule facts](../../../docs/rule-facts.md) format: 817 Enhancements carry their eligibility and 201 awards their scoring from the app build's rows, and drafted structure is in `detail`. Effect blocks, read from each rule as the app build prints it: `combat` 2519, `grants` 328, `weaponAbilities` 107, `reminder` 2142, `reserves` 1, `invulnerableSave` 105, `upgradesWeapon` 23, `roster` 69, `attachment` 48, `references` 1050 (4,116 records with at least one). A record whose rule no app row prints has none; treat what its summary describes as not calculated.

The `rosters`, `profiles` and `points` categories hold the update's datasheets, built from the app build: 1,061 units with roster definitions (1,312 wargear options), 1,122 stat lines and 5,177 weapon profiles, and the `mfm-1-6` points snapshot of 1,060 units, 256 Detachments and 817 Enhancements. Datasheets are modelled once, not once per Space Marine chapter; each unit lists the BSData entry IDs it stands for as `aliases`. Each Detachment lists, in `stratagems` and `enhancements`, the rule summary IDs of the cards the app build gives it. 341 Warhammer Legends datasheets the app does not carry come from Games Workshop's Legends PDFs, with their profiles and, in the `mfm-1-6-legends` snapshot, the costs of 331 of them from the Munitorum Field Manual's Legends section. 322 Legends datasheets have roster definitions typed from the PDF's composition, equipment and wargear options (33 of them with options left out, listed below), and their weapon profiles name that wargear.

The `mission-packs` category holds the [mission pack](../../../docs/mission-packs.md) Chapter Approved 2026-2027, built from the app build's mission tables: 5 force dispositions, 6 deployments, 45 layouts, 25 primary missions, 18 secondary cards and 6 twists. Award criteria and twist effects are the summaries above. Each member lists its app ID, in the catalogue's alias form, as `aliases`.

The `mission-packs` category holds the [mission pack](../../../docs/mission-packs.md) Combat Patrol, built from the app build's mission tables: 0 force dispositions, 3 deployments, 3 layouts, 26 primary missions, 0 secondary cards and 0 twists. Award criteria and twist effects are the summaries above. Each member lists its app ID, in the catalogue's alias form, as `aliases`.

FAQs also name 1 publication, an identity entry of the retained `publications` category.

## Retired

9 FAQs superseded by newer publisher documents before the cutoff:

- `faq` `codex-adepta-sororitas.errata.hallowed-martyrs-detachment-divine-intervention-stratagem-effect`, replaced by Adepta Sororitas Faction Pack: Version 1.4, page 13
- `faq` `codex-adeptus-mechanicus.errata.onager-dunecrawler`, replaced by Adeptus Mechanicus Faction Pack: Version 1.4, page 18
- `faq` `codex-chaos-knights.errata.iconoclast-fiefdom-detachment-preserve-the-idols-stratagem-target`, replaced by Chaos Knights Faction Pack: Version 1.2, page 4
- `faq` `codex-chaos-knights.errata.knight-abominant-volkite-combustor-weapon`, replaced by Chaos Knights Faction Pack: Version 1.2, page 25
- `faq` `codex-emperors-children.errata.slaaneshs-chosen-detachment-refusal-to-be-outdone-stratagem`, replaced by Emperor’s Children Faction Pack: Version 1.3, page 9
- `faq` `codex-necrons.errata.ophydian-destroyers-tunnelling-horrors-ability-2`, replaced by Necrons Faction Pack: Version 1.3, page 30
- `faq` `codex-tyranids.errata.the-swarmlord-abilities-malign-presence`, replaced by Tyranids Faction Pack: Version 1.3, page 20
- `faq` `imperial-armour-grey-knights.errata.grey-knights-thunderhawk-gunship`, replaced by Grey Knights Faction Pack: Version 1.2, page 7; Grey Knights Faction Pack: Version 1.2, page 8
- `faq` `index-chaos-daemons.errata.feculent-gnarlmaw-screamers-skull-altar-keywords`, replaced by Chaos Daemons Faction Pack: Version 1.2, page 61; Chaos Daemons Faction Pack: Version 1.2, page 87; Chaos Daemons Faction Pack: Version 1.2, page 37

1 roster entry the previous release published are retired: wargear bundles and options the roster definitions now key by their counts, with new IDs.

## Absent

3 BSData abilities that this version's official sources do not print on the datasheet BSData gives them to are entries with `absent: true`, no record and, where no other entry holds it, the BSData ID as an alias.

- `ability` `emperors-children.fulgrim.serpentine`
- `ability` `tyranids.the-swarmlord.lord-of-deceit-aura`
- `ability` `tyranids.toxicrene.damaged-1-5-wounds-remaining`

## Unresolved

Active entries without a record, by reason. An entry with several reasons is listed under each.

### A Crucible datasheet, printed only in the Crucible of Champions book, which no official source in reach carries: an entry for its provisional abilities and its faction's (59)

- `unit` `adepta-sororitas.inspiring-devotee`
- `unit` `adepta-sororitas.militant-commander`
- `unit` `adepta-sororitas.reliquant-knight`
- `unit` `adeptus-mechanicus.cohort-commander`
- `unit` `adeptus-mechanicus.ironstrider-alpha`
- `unit` `adeptus-mechanicus.magos`
- `unit` `aeldari-2.craftworld-warleader`
- `unit` `aeldari-2.ghost-warrior`
- `unit` `aeldari-2.skyrunner`
- `unit` `astra-militarum.augmented-bone-ead`
- `unit` `astra-militarum.front-line-commander`
- `unit` `astra-militarum.sentinel-commander`
- `unit` `chaos-daemons.daemonic-charioteer`
- `unit` `chaos-daemons.daemonic-herald`
- `unit` `chaos-daemons.immortal-champion`
- `unit` `chaos-space-marines.exalted-champion-2`
- `unit` `chaos-space-marines.sorcerous-champion`
- `unit` `chaos-space-marines.soul-forge-tyrant`
- `unit` `death-guard.plague-lord`
- `unit` `death-guard.plague-sorcerer`
- `unit` `death-guard.tri-lobe-vectors`
- `unit` `drukhari.archtormentor`
- `unit` `drukhari.flesh-crafter`
- `unit` `emperors-children.champion-of-excess`
- `unit` `emperors-children.excruciator`
- `unit` `emperors-children.flawless-champion`
- `unit` `genestealer-cults.cult-guerrilla`
- `unit` `genestealer-cults.cult-insurrectionist`
- `unit` `genestealer-cults.voice-of-the-patriarch`
- `unit` `grey-knights.champion-of-titan`
- `unit` `grey-knights.dreadknight-champion`
- `unit` `grey-knights.venerable-daemon-slayer`
- `unit` `imperial-agents.deathwatch-agent`
- `unit` `imperial-agents.enthroned-agent`
- `unit` `imperial-agents.martial-agent`
- `unit` `leagues-of-votann.kinhost-commander`
- `unit` `leagues-of-votann.living-ancestor`
- `unit` `leagues-of-votann.steeljack-elder`
- `unit` `necrons.dynastic-conqueror`
- `unit` `necrons.hyperscientist`
- `unit` `necrons.triarchal-overseer`
- `unit` `orks.hordeboss`
- `unit` `orks.upstart-gretchin`
- `unit` `orks.warphead`
- `unit` `space-marines.champion-of-the-chapter`
- `unit` `space-marines.librarius-adept`
- `unit` `space-marines.venerable-battle-brother`
- `unit` `tau-empire.battlesuit-veteran`
- `unit` `tau-empire.kinband-champion`
- `unit` `tau-empire.shasnel`
- `unit` `thousand-sons.brayherd-chieftain`
- `unit` `thousand-sons.brayherd-shaman`
- `unit` `thousand-sons.magister`
- `unit` `tyranids.macro-organism`
- `unit` `tyranids.node-organism`
- `unit` `tyranids.prime-organism`
- `unit` `world-eaters.bloodcult-champion`
- `unit` `world-eaters.butcherlord`
- `unit` `world-eaters.eight-blessed-lord`

### A Combat Patrol mission card, whose summary is not drafted yet (24)

- `mission-card` `combat-patrol.architects-of-agony`
- `mission-card` `combat-patrol.cult-ritual`
- `mission-card` `combat-patrol.defenders-of-the-golden-throne-2`
- `mission-card` `combat-patrol.defenders-of-the-golden-throne`
- `mission-card` `combat-patrol.duff-em-up`
- `mission-card` `combat-patrol.encircle-and-destroy`
- `mission-card` `combat-patrol.expansionary-campaign`
- `mission-card` `combat-patrol.for-cadia`
- `mission-card` `combat-patrol.for-the-kindred`
- `mission-card` `combat-patrol.grandiose-slaughter`
- `mission-card` `combat-patrol.honour-the-chapter`
- `mission-card` `combat-patrol.indescriminate-butchery`
- `mission-card` `combat-patrol.inexorable-conquest`
- `mission-card` `combat-patrol.inquisitorial-sanction`
- `mission-card` `combat-patrol.on-holy-ground`
- `mission-card` `combat-patrol.open-the-way`
- `mission-card` `combat-patrol.outflank-and-encircle`
- `mission-card` `combat-patrol.prepare-the-way`
- `mission-card` `combat-patrol.purification`
- `mission-card` `combat-patrol.seize-their-strongholds`
- `mission-card` `combat-patrol.shatter-the-veil`
- `mission-card` `combat-patrol.slay-the-oppressors`
- `mission-card` `combat-patrol.strike-from-on-high`
- `mission-card` `combat-patrol.uphold-your-vows`

### A Warhammer Legends datasheet from a Games Workshop PDF whose composition or default equipment did not read as typed values (19)

- `unit` `astra-militarum.death-korps-grenadier-squad`
- `unit` `astra-militarum.hells-last`
- `unit` `astra-militarum.macharius-vulcan`
- `unit` `astra-militarum.praetor`
- `unit` `astra-militarum.regimental-attaches`
- `unit` `astra-militarum.rein-and-raus`
- `unit` `chaos-space-marines.gellerpox-infected`
- `unit` `imperial-agents.fortis-kill-team`
- `unit` `imperial-agents.indomitor-kill-team`
- `unit` `imperial-agents.inquisitor-eisenhorn`
- `unit` `imperial-agents.inquisitor-ostromandeus`
- `unit` `imperial-agents.kill-team-cassius`
- `unit` `imperial-agents.proteus-kill-team`
- `unit` `imperial-agents.spectrus-kill-team`
- `unit` `necrons.night-shroud`
- `unit` `space-marines.bike-squad`
- `unit` `space-marines.fire-raptor-gunship`
- `unit` `tau-empire.aunva`
- `unit` `unaligned-forces.imperial-fortress-walls`

### A datasheet no official source in reach prints: an entry for its provisional abilities and its faction's (5)

- `unit` `orks.da-red-gobbos-a-bomb-inable-snowman`
- `unit` `orks.da-red-gobbos-tinboy`
- `unit` `orks.grotmas-gitz`
- `unit` `space-marines.chaplain-kastiel`
- `unit` `space-marines.judiciar-xacharus`

### A wargear named by other records that has no record of its own (1)

- `wargear` `imperial-agents.neural-shredder`

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
- `dark-angels.deathwing-command-squad`: option not typed: its wording is none of the typed forms (Legends PDF)
- `dark-angels.deathwing-command-squad`: option not typed: its wording is none of the typed forms (Legends PDF)
- `dark-angels.deathwing-strikemaster`: option not typed: its choices did not read as wargear (Legends PDF)
- `drukhari.grotesques`: option not typed: its wording is none of the typed forms (Legends PDF)
- `imperial-agents.deathwatch-terminator-squad`: option not typed: its choices did not read as wargear (Legends PDF)
- `imperial-agents.fortis-kill-team`: a model's default equipment not read (Legends PDF)
- `imperial-agents.indomitor-kill-team`: a model's default equipment not read (Legends PDF)
- `imperial-agents.inquisitor-eisenhorn`: default equipment not read (Legends PDF)
- `imperial-agents.inquisitor-in-terminator-armour`: option not typed: its wording is none of the typed forms (Legends PDF)
- `imperial-agents.inquisitor-in-terminator-armour`: option not typed: its wording is none of the typed forms (Legends PDF)
- `imperial-agents.inquisitor-ostromandeus`: a model's default equipment not read (Legends PDF)
- `imperial-agents.kill-team-cassius`: default equipment not read (Legends PDF)
- `imperial-agents.proteus-kill-team`: a model's default equipment not read (Legends PDF)
- `imperial-agents.spectrus-kill-team`: a model's default equipment not read (Legends PDF)
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
