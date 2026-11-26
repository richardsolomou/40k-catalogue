# MFM 1.5 rule summaries

Catalogue release input for Warhammer 40,000 11th edition, MFM 1.5: the `rules-reference` and `mission-rules` categories and its mission packs. [Rule summaries](../../../docs/rule-summaries.md) defines the records and [catalogue releases](../../../docs/catalogue-releases.md) explains how to build them.

Every summary is original wording, checked against the official sources it cites. They are pre-release drafts that no person has reviewed yet.

| Category | Active entries | Records | Unresolved |
| --- | --- | --- | --- |
| `rules-reference` | 6,790 | 6,781 | 9 |
| `mission-rules` | 285 | 285 | 0 |

6,353 records cite the signed app build in force at the update's cutoff, Warhammer 40,000: The App 2.7.1, data build 972, released 2026-10-02; 571 records that no app row carries cite only the dated Games Workshop page that prints it. 142 records are provisional: no official source in reach prints the rule (abilities of Crucible datasheets, printed only in the Crucible of Champions book), so they cite nothing and carry `provisional: true` until one does, naming that book as `source`. 935 records cite the Games Workshop PDF page that prints the rule, which is then their `source`. 19 records rest on a reading the sources leave open and carry an `interpretation` flag.

Typed facts follow the [rule facts](../../../docs/rule-facts.md) format: 818 Enhancements carry their eligibility and 197 awards their scoring from the app build's rows, and drafted structure is in `detail`. Effect blocks, read from each rule as the app build prints it, or a Warhammer Legends ability's PDF page: `combat` 2759, `grants` 373, `weaponAbilities` 127, `reminder` 2252, `reserves` 1, `invulnerableSave` 119, `upgradesWeapon` 21, `roster` 29, `options` 13, `attachment` 55, `references` 998 (4,440 records with at least one). 81 Crucible and Warhammer Legends abilities that no app row prints and no Legends page is read for have their blocks too. A record whose rule none of these prints has none; treat what its summary describes as not calculated.

The `rosters`, `profiles` and `points` categories hold the update's datasheets, built from the app build: 1,056 units with roster definitions (1,311 wargear options), 1,117 stat lines and 5,172 weapon profiles, and the `marine-points-1013` points snapshot of 1,055 units, 252 Detachments and 818 Enhancements. Datasheets are modelled once, not once per Space Marine chapter; each unit lists the BSData entry IDs it stands for as `aliases`. Each Detachment lists, in `stratagems` and `enhancements`, the rule summary IDs of the cards the app build gives it. 341 Warhammer Legends datasheets the app does not carry come from Games Workshop's Legends PDFs, with their profiles and, in the `marine-points-1013-legends` snapshot, the costs of 331 of them from the Munitorum Field Manual's Legends section. 322 Legends datasheets have roster definitions typed from the PDF's composition, equipment and wargear options (33 of them with options left out, listed below), and their weapon profiles name that wargear.

The `mission-packs` category holds the [mission pack](../../../docs/mission-packs.md) Chapter Approved 2026-2027, built from the app build's mission tables: 5 force dispositions, 6 deployments, 45 layouts, 25 primary missions, 18 secondary cards and 6 twists. Award criteria and twist effects are the summaries above. Each member lists its app ID, in the catalogue's alias form, as `aliases`.

The `mission-packs` category holds the [mission pack](../../../docs/mission-packs.md) Combat Patrol, built from the app build's mission tables: 0 force dispositions, 3 deployments, 3 layouts, 24 primary missions, 0 secondary cards and 0 twists. Award criteria and twist effects are the summaries above. Each member lists its app ID, in the catalogue's alias form, as `aliases`.

FAQs also name 1 publication, an identity entry of the retained `publications` category.

## Base sizes

1,078 stat lines take the base size the app build prints and 49 stat lines the one Games Workshop's Base Size Guide (in the Event Companion) prints, cited in `baseSizeSource`: where the app prints none or none the format types, and for a Warhammer Legends datasheet, whose PDF prints none, from the newest guide dated before the cutoff that lists it. For 9 units the guide says which model takes which of the sizes the app lists.

Where the app and the guide in force differ, the app's size is published (20 stat lines):

- `aeldari.yvraine`: app 74x42mm oval, guide 75x42mm oval
- `astra-militarum.attilan-rough-riders`: app 60x35mm oval, guide 60x35.5mm oval
- `astra-militarum.cadian-recon-squad`: app 28mm, guide 28.5mm
- `astra-militarum.krieg-command-squad`: app 25mm, guide 32mm
- `blood-angels.commander-dante`: app 40mm, guide 50mm
- `chaos-space-marines.red-corsairs-raiders`: app 32mm, guide 40mm
- `chaos-space-marines.red-corsairs-reave-captain`: app 40mm, guide 32mm
- `grey-knights.brotherhood-techmarine`: app 40mm, guide 32mm
- `orks.blitza-bommer`: app 120mm, guide 120x92mm oval
- `orks.burna-bommer`: app 120mm, guide 120x92mm oval
- `orks.dakkajet`: app 120mm, guide 120x92mm oval
- `orks.deffkoptas`: app 75mm, guide 75x42mm oval
- `orks.nobz`: app 40mm, guide 32mm
- `orks.squighog-boyz`: app 75mm or 90x52.5mm oval, guide 75x42mm oval
- `orks.warboss`: app 50mm, guide 40mm
- `orks.wazbom-blastajet`: app 120x92mm oval, guide 150x95mm oval
- `orks.weirdboy`: app 50mm, guide 40mm
- `space-marines.captain-in-terminator-armour`: app 40mm, guide 50mm
- `space-marines.chaplain-in-terminator-armour`: app 50mm, guide 40mm
- `space-marines.chaplain-with-jump-pack`: app 40mm, guide 32mm

### VS Data's own base sizes (312)

No official source in reach prints a base size for these datasheets, so their stat lines take VS Data's own, with no `baseSizeSource`.

- `adepta-sororitas.battle-sanctum`
- `adepta-sororitas.celestian-sacresant-aveline`
- `adepta-sororitas.crusaders`
- `adepta-sororitas.death-cult-assassins`
- `adepta-sororitas.repressor`
- `adeptus-mechanicus.secutarii-hoplites`
- `adeptus-mechanicus.secutarii-peltasts`
- `aeldari-2.amallyn-shadowguide`
- `aeldari-2.autarch-skyrunner`
- `aeldari-2.bonesinger`
- `aeldari-2.cobra`
- `aeldari-2.corsair-cloud-dancer-band`
- `aeldari-2.corsair-reaver-band`
- `aeldari-2.firestorm`
- `aeldari-2.hornet`
- `aeldari-2.illic-nightspear`
- `aeldari-2.irillyth`
- `aeldari-2.karandras`
- `aeldari-2.lynx`
- `aeldari-2.nightwing`
- `aeldari-2.phoenix`
- `aeldari-2.scorpion`
- `aeldari-2.shadow-spectres`
- `aeldari-2.skathach-wraithknight`
- `aeldari-2.vampire-hunter`
- `aeldari-2.vampire-raider`
- `aeldari-2.warp-hunter`
- `aeldari-2.wasp-assault-walker`
- `aeldari-2.webway-gate`
- `aeldari-2.wraithseer`
- `aeldari.clanblade`
- `aeldari.dragon-knights`
- `aeldari.leystalker`
- `aeldari.stonesinger`
- `astra-militarum.aquila-lander`
- `astra-militarum.arkurian-stormhammer`
- `astra-militarum.armageddon-pattern-medusa`
- `astra-militarum.arvus-lighter`
- `astra-militarum.atlas-recovery-vehicle`
- `astra-militarum.carnodon`
- `astra-militarum.centaur-light-carrier`
- `astra-militarum.ciaphas-cain`
- `astra-militarum.colossus`
- `astra-militarum.crassus`
- `astra-militarum.death-rider-commissar`
- `astra-militarum.dominus-armoured-siege-bombard`
- `astra-militarum.earthshaker-carriage-battery`
- `astra-militarum.earthshaker-platform`
- `astra-militarum.elysian-drop-sentinel`
- `astra-militarum.elysian-sniper-squad`
- `astra-militarum.gorgon-heavy-transport`
- `astra-militarum.griffon-mortar-carrier`
- `astra-militarum.hades-breaching-drill`
- `astra-militarum.heavy-mortar-team`
- `astra-militarum.heavy-quad-launcher-team`
- `astra-militarum.hells-last`
- `astra-militarum.hydra-platform`
- `astra-militarum.iron-hand-straken`
- `astra-militarum.macharius`
- `astra-militarum.macharius-omega`
- `astra-militarum.macharius-vanquisher`
- `astra-militarum.macharius-vulcan`
- `astra-militarum.malcador`
- `astra-militarum.malcador-annihilator`
- `astra-militarum.malcador-defender`
- `astra-militarum.malcador-infernus`
- `astra-militarum.manticore-platform`
- `astra-militarum.marauder-bomber`
- `astra-militarum.marauder-destroyer`
- `astra-militarum.medusa-carriage-battery`
- `astra-militarum.minotaur`
- `astra-militarum.mukaali-riders`
- `astra-militarum.munitorum-servitors`
- `astra-militarum.praetor`
- `astra-militarum.provisionally-prepared`
- `astra-militarum.quartermaster-cadre-squad`
- `astra-militarum.rapier-laser-destroyer-battery`
- `astra-militarum.regimental-attaches`
- `astra-militarum.rein-and-raus`
- `astra-militarum.sabre-weapons-battery`
- `astra-militarum.salamander-command-vehicle`
- `astra-militarum.salamander-scout-vehicle`
- `astra-militarum.sentinel-powerlifter`
- `astra-militarum.sergeant-harker`
- `astra-militarum.storm-chimera`
- `astra-militarum.stormblade`
- `astra-militarum.stygies-destroyer-tank-hunter`
- `astra-militarum.tarantula-battery`
- `astra-militarum.tauros-assault-vehicle`
- `astra-militarum.tauros-venator`
- `astra-militarum.trojan-support-vehicle`
- `astra-militarum.valdor`
- `astra-militarum.valkyrie-sky-talon`
- `astra-militarum.vendetta-gunship`
- `astra-militarum.voss-pattern-lightning`
- `astra-militarum.vulture-gunship`
- `blood-angels.brother-corbulo`
- `blood-angels.captain-tycho`
- `blood-angels.death-company-dreadnought-with-magna-grapple`
- `blood-angels.death-company-marines-with-boltguns`
- `blood-angels.death-company-marines-with-boltguns-and-jump-packs`
- `blood-angels.furioso-dreadnought`
- `blood-angels.gabriel-seth`
- `blood-angels.librarian-dreadnought`
- `blood-angels.sanguinary-priest-with-jump-pack`
- `blood-angels.tycho-the-lost`
- `chaos-daemons.aetaosraukeres`
- `chaos-daemons.anggrath-the-unbound`
- `chaos-daemons.exalted-seeker-chariot`
- `chaos-daemons.furies`
- `chaos-daemons.giant-chaos-spawn`
- `chaos-daemons.herald-of-slaanesh-on-steed-of-slaanesh`
- `chaos-daemons.plague-toads`
- `chaos-daemons.pox-riders`
- `chaos-daemons.scabeiathrax-the-bloated`
- `chaos-daemons.seeker-chariot`
- `chaos-daemons.spined-chaos-beast`
- `chaos-daemons.zarakynel`
- `chaos-space-marines.blood-slaughterer`
- `chaos-space-marines.chaos-deimos-predator`
- `chaos-space-marines.chaos-lord-on-bike`
- `chaos-space-marines.chaos-lord-on-disc-of-tzeentch`
- `chaos-space-marines.chaos-lord-on-juggernaut`
- `chaos-space-marines.chaos-lord-on-palanquin-of-nurgle`
- `chaos-space-marines.chaos-lord-on-steed-of-slaanesh`
- `chaos-space-marines.chaos-thunderhawk`
- `chaos-space-marines.cultist-mob-with-firearms`
- `chaos-space-marines.decimator`
- `chaos-space-marines.dreadclaw-drop-pod`
- `chaos-space-marines.exalted-champion`
- `chaos-space-marines.gellerpox-infected`
- `chaos-space-marines.greater-blight-drone`
- `chaos-space-marines.greater-brass-scorpion`
- `chaos-space-marines.hell-blade`
- `chaos-space-marines.hell-talon`
- `chaos-space-marines.kharybdis-assault-claw`
- `chaos-space-marines.kytan-ravager`
- `chaos-space-marines.mutoid-vermin`
- `chaos-space-marines.negavolt-cultists`
- `chaos-space-marines.renegade-enforcer`
- `chaos-space-marines.renegade-heavy-weapons-squad`
- `chaos-space-marines.renegade-ogryn-beast-handler`
- `chaos-space-marines.renegade-ogryn-brutes`
- `chaos-space-marines.renegade-plague-ogryns`
- `chaos-space-marines.rogue-psyker`
- `chaos-space-marines.sorcerer-on-bike`
- `chaos-space-marines.sorcerer-on-disc-of-tzeentch`
- `chaos-space-marines.sorcerer-on-palanquin-of-nurgle`
- `chaos-space-marines.sorcerer-on-steed-of-slaanesh`
- `dark-angels.deathwing-command-squad`
- `dark-angels.deathwing-strikemaster`
- `dark-angels.ravenwing-talonmaster`
- `death-guard.death-guard-chaos-lord`
- `death-guard.death-guard-chaos-lord-in-terminator-armour`
- `death-guard.death-guard-cultists`
- `death-guard.death-guard-possessed`
- `death-guard.death-guard-sorcerer-in-terminator-armour`
- `drukhari.raven-strike-fighter`
- `drukhari.reaper`
- `drukhari.tantalus`
- `genestealer-cults.tectonic-fragdrill`
- `grey-knights.grey-knights-dreadnought`
- `grey-knights.grey-knights-relic-razorback`
- `imperial-agents.daemonhost`
- `imperial-agents.damned-legionnaires`
- `imperial-agents.inquisitor-eisenhorn`
- `imperial-agents.inquisitor-in-terminator-armour`
- `imperial-agents.inquisitor-karamazov`
- `imperial-agents.inquisitor-ostromandeus`
- `imperial-agents.janus-draik`
- `imperial-agents.jokaero-weaponsmith`
- `imperial-agents.kill-team-cassius`
- `imperial-agents.neyam-shai-murad`
- `imperial-agents.proteus-kill-team`
- `imperial-agents.ur-025`
- `imperial-agents.veteran-bike-squad`
- `necrons.anrakyr-the-traveller`
- `necrons.canoptek-acanthrites`
- `necrons.canoptek-tomb-sentinel`
- `necrons.canoptek-tomb-stalker`
- `necrons.gauss-pylon`
- `necrons.lord`
- `necrons.nemesor-zahndrekh`
- `necrons.night-shroud`
- `necrons.sentry-pylon`
- `necrons.tesseract-ark`
- `necrons.tomb-citadel-walls`
- `necrons.vargard-obyron`
- `orks.mekboy-workshop`
- `space-marines.ancient-on-bike`
- `space-marines.apothecary-on-bike`
- `space-marines.assault-squad`
- `space-marines.assault-squad-with-jump-packs`
- `space-marines.astartes-servitors`
- `space-marines.attack-bike-squad`
- `space-marines.bike-squad`
- `space-marines.caestus-assault-ram`
- `space-marines.carab-culln-the-risen`
- `space-marines.chaplain-cassius`
- `space-marines.chaplain-venerable-dreadnought`
- `space-marines.command-squad`
- `space-marines.company-champion-on-bike`
- `space-marines.company-veterans-on-bikes`
- `space-marines.deathstorm-drop-pod`
- `space-marines.deimos-predator`
- `space-marines.deredeo-dreadnought`
- `space-marines.dreadnought-drop-pod`
- `space-marines.fellblade`
- `space-marines.ferren-areios`
- `space-marines.fire-raptor-gunship`
- `space-marines.hunter`
- `space-marines.imperial-space-marine`
- `space-marines.ironclad-dreadnought`
- `space-marines.javelin-attack-speeder`
- `space-marines.land-raider-achilles`
- `space-marines.land-raider-helios`
- `space-marines.land-raider-prometheus`
- `space-marines.land-raider-proteus`
- `space-marines.land-speeder-storm`
- `space-marines.land-speeder-tempest`
- `space-marines.land-speeder-tornado`
- `space-marines.land-speeder-typhoon`
- `space-marines.leviathan-dreadnought`
- `space-marines.librarian-on-bike`
- `space-marines.librarian-with-jump-pack`
- `space-marines.mortis-dreadnought`
- `space-marines.primaris-company-champion`
- `space-marines.relic-contemptor-dreadnought`
- `space-marines.relic-terminator-squad`
- `space-marines.scout-sniper-squad`
- `space-marines.sergeant-chronus`
- `space-marines.sergeant-telion`
- `space-marines.sicaran-arcus`
- `space-marines.sicaran-battle-tank`
- `space-marines.sicaran-omega`
- `space-marines.sicaran-punisher`
- `space-marines.sicaran-venator`
- `space-marines.sokar-pattern-stormbird`
- `space-marines.spartan`
- `space-marines.stalker`
- `space-marines.storm-eagle-gunship`
- `space-marines.techmarine-on-bike`
- `space-marines.terminus-ultra`
- `space-marines.thunderfire-cannon`
- `space-marines.thunderhawk-transporter`
- `space-marines.tyrannic-war-veterans`
- `space-marines.vindicator-laser-destroyer`
- `space-marines.whirlwind-scorpius`
- `space-marines.xiphon-interceptor`
- `space-wolves.canis-wolfborn`
- `space-wolves.cyberwolf`
- `space-wolves.harald-deathwolf`
- `space-wolves.hounds-of-morkai`
- `space-wolves.krom-dragongaze`
- `space-wolves.logan-grimnar-on-stormrider`
- `space-wolves.long-fangs`
- `space-wolves.lukas-the-trickster`
- `space-wolves.skyclaws`
- `space-wolves.stormfang-gunship`
- `space-wolves.stormwolf`
- `space-wolves.wolf-guard`
- `space-wolves.wolf-guard-battle-leader-in-terminator-armour`
- `space-wolves.wolf-guard-battle-leader-on-thunderwolf`
- `space-wolves.wolf-guard-pack-leader`
- `space-wolves.wolf-guard-pack-leader-in-terminator-armour`
- `space-wolves.wolf-guard-pack-leader-with-jump-pack`
- `space-wolves.wolf-lord-on-thunderwolf`
- `tau-empire.aunshi`
- `tau-empire.aunva`
- `tau-empire.barracuda`
- `tau-empire.commander-in-crisis-battlesuit`
- `tau-empire.crisis-battlesuits`
- `tau-empire.drone-sentry-turret`
- `tau-empire.great-knarloc`
- `tau-empire.heavy-gun-drones`
- `tau-empire.knarloc-riders`
- `tau-empire.longstrike`
- `tau-empire.orca-dropship`
- `tau-empire.remora-stealth-drones`
- `tau-empire.remote-sensor-tower`
- `tau-empire.rvarna-battlesuit`
- `tau-empire.shaso-ralai`
- `tau-empire.tactical-drones`
- `tau-empire.tetras`
- `tau-empire.tx42-piranha`
- `tau-empire.xv9-hazard-battlesuits`
- `tau-empire.yvahra-battlesuit`
- `tyranids.barbed-hierodule`
- `tyranids.dimachaeron`
- `tyranids.malanthrope`
- `tyranids.scythed-hierodule`
- `tyranids.sky-slasher-swarms`
- `unaligned-forces.aegis-defence-line-with-weapon-emplacement`
- `unaligned-forces.ambull`
- `unaligned-forces.bastion`
- `unaligned-forces.castellum-stronghold`
- `unaligned-forces.firestorm-redoubt`
- `unaligned-forces.fortress-of-redemption`
- `unaligned-forces.guardian-drone`
- `unaligned-forces.imperial-fortress-walls`
- `unaligned-forces.macro-cannon-aquila-strongpoint`
- `unaligned-forces.plasma-obliterator`
- `unaligned-forces.primaris-redoubt`
- `unaligned-forces.skyshield-landing-pad`
- `unaligned-forces.spindle-drones`
- `unaligned-forces.the-archivist`
- `unaligned-forces.vengeance-weapon-battery`
- `unaligned-forces.void-shield-generator`
- `unaligned-forces.vortex-missile-strongpoint`
- `unaligned-forces.wall-of-martyrs-bunker`
- `unaligned-forces.wall-of-martyrs-defence-emplacement`
- `unaligned-forces.wall-of-martyrs-defence-line`

### No base size: Warhammer Legends datasheets no guide lists (22)

No official source in reach prints their base size, so their stat lines carry a `no-source` gap.

- `adeptus-mechanicus.x-101`
- `astra-militarum.death-korps-grenadier-squad`
- `chaos-daemons.tormentbringer-on-exalted-seeker-chariot`
- `orks.attack-fighta`
- `orks.big-gunz`
- `orks.big-mek-on-warbike`
- `orks.big-mek-with-kustom-force-field`
- `orks.chinork-warkopta`
- `orks.da-red-gobbo`
- `orks.deff-rolla-battle-fortress`
- `orks.deffkoptas-with-big-shootas`
- `orks.fighta-bommer`
- `orks.grot-bomm-launcha`
- `orks.kannonwagon`
- `orks.kill-krusha`
- `orks.mega-dread`
- `orks.meka-dread`
- `orks.nobz-on-warbikes`
- `orks.painboy-on-warbike`
- `orks.skorchas`
- `orks.squiggoth`
- `orks.ufthak-blackhawk`

### No base size: sizes the format cannot attribute (1)

A source prints sizes for models or wargear the unit's roster definition does not type, so their stat lines carry an `unrepresentable` gap.

- `imperial-agents.spectrus-kill-team`

## Retired

6 FAQs superseded by newer publisher documents before the cutoff:

- `faq` `codex-chaos-knights.errata.iconoclast-fiefdom-detachment-preserve-the-idols-stratagem-target`, replaced by Chaos Knights Faction Pack: Version 1.2, page 4
- `faq` `codex-chaos-knights.errata.knight-abominant-volkite-combustor-weapon`, replaced by Chaos Knights Faction Pack: Version 1.2, page 25
- `faq` `codex-emperors-children.errata.slaaneshs-chosen-detachment-refusal-to-be-outdone-stratagem`, replaced by Emperor’s Children Faction Pack: Version 1.3, page 9
- `faq` `codex-necrons.errata.ophydian-destroyers-tunnelling-horrors-ability-2`, replaced by Necrons Faction Pack: Version 1.3, page 30
- `faq` `imperial-armour-grey-knights.errata.grey-knights-thunderhawk-gunship`, replaced by Grey Knights Faction Pack: Version 1.2, page 7; Grey Knights Faction Pack: Version 1.2, page 8
- `faq` `index-chaos-daemons.errata.feculent-gnarlmaw-screamers-skull-altar-keywords`, replaced by Chaos Daemons Faction Pack: Version 1.2, page 61; Chaos Daemons Faction Pack: Version 1.2, page 87; Chaos Daemons Faction Pack: Version 1.2, page 37

## Absent

7 BSData abilities that this version's official sources do not print on the datasheet BSData gives them to are entries with `absent: true`, no record and, where no other entry holds it, the BSData ID as an alias.

- `ability` `dark-angels.lazarus.keeper-of-the-unseen-ritual`
- `ability` `dark-angels.sammael.mobile`
- `ability` `imperial-agents.aquila-kill-team.attached-unit`
- `ability` `imperial-agents.corvus-blackstar.infernum-halo-launcher`
- `ability` `imperial-agents.deathwatch-kill-team.astartes-shield`
- `ability` `imperial-agents.watch-master.rites-of-battle`
- `ability` `imperial-agents.watch-master.strategic-knowledge`

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

### A Crucible datasheet, printed only in the Crucible of Champions book, which no official source in reach carries: an entry for its provisional abilities and its faction's (62)

- `unit` `adepta-sororitas.inspiring-devotee`
- `unit` `adepta-sororitas.militant-commander`
- `unit` `adepta-sororitas.reliquant-knight`
- `unit` `adeptus-custodes.guardian-of-the-throne`
- `unit` `adeptus-custodes.kataphraktoi-exemplar`
- `unit` `adeptus-custodes.null-maiden`
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
- chaos-space-marines allies that take the roster's faction keyword in place of their own
