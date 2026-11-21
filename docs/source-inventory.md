# Source inventory

This inventory records where each class of Praetorium's game data comes from, which parts of the app read it, what it is used for, and what we know about reusing it. It describes sources in our own words and links to them. It holds no source payloads, rules text, or roster samples.

The baseline is Praetorium [`a9b4a5b`][p-root] (20 November 2026). Its pins are in [`catalogue/sources.json`][p-sources], [`catalogue/composition.json`][p-composition], and the lock file [`catalogue.json`][p-lock]. Production had already moved past this baseline when the inventory was written: on 21 November 2026 the live reference service cited Game Datacards at `2ab4e82` and different definitions and points content hashes. Every check below uses the baseline pins unless it says otherwise.

## How the catalogue is built

[`scripts/lib/catalogueMaterialize.ts`][p-materialize] downloads each source at its pinned commit, applies the local corrections in [`catalogue/patches/`][p-patches], layers the overlays and rules versions from `composition.json`, and writes `revision.json`. When a source has corrections, its recorded revision is a SHA-256 of the upstream commit plus the corrections, which is why `catalogue.json` holds hashes rather than commits for definitions, points, and Game Datacards. [`scripts/lib/catalogueUpstream.ts`][p-upstream] advances pins to branch heads but leaves retired rules versions and snapshot-backed versions alone. The result is published as a snapshot to a private bucket because it contains rules text ([catalogue guide, Rules text][p-guide]).

The app never serves rules text from either rules source. Game Datacards text is read in the browser from `raw.githubusercontent.com` at the pinned commit ([`src/server/sourceTexts.ts`][p-sourcetexts], [`src/core/sourceText.ts`][p-sourcetext]), and BSData text is held server-side as tokens. The public [Data sources page][p-sources-page] states this to users.

## Inventory

| Input | Pin at baseline | Main consumers | Migration issue |
| --- | --- | --- | --- |
| `wh40k-11e` definitions | [`richardsolomou/wh40k-11e@6fd981b`][s-defs] | Roster builder and legality, datasheet and detachment pages, imports, simulator, offline bundle, reference API | [#6][i6] |
| Munitorum Field Manual points | [`richardsolomou/wh40k-11e-mfm@6eed7b1`][s-mfm], `data/` | Unit, enhancement, upgrade, and detachment costs, points checks, data-update history | [#10][i10] |
| Game Datacards gameplay reference | [`game-datacards/datasources@ebcd0cb`][s-gdc], `11th/gdc` | Factions, detachments, stratagems, enhancements, core rules, rule documents, client rules text | [#7][i7] |
| Game Datacards mission packs | same pin, `11th/gdc` mission and layout files | Missions, primaries, secondaries, twists, force dispositions, deployments, layout identity | [#8][i8] |
| Battlemaster geometry | `battlemaster.online`, catalogue hash `acabfa4…` | Terrain areas, walls, roofs, and objective hosts for Chapter Approved and Combat Patrol layouts | [#9][i9] |
| Translated names | [`richardsolomou/wh40k-11e-translations@4dd982c`][s-tr], `data/` | Matching foreign-language list imports to catalogue names | [#11][i11] |
| Faction icons | [`Certseeds/wh40k-icon@99b7cb9`][s-icons], `src/svgs` | Faction icon endpoint and faction pickers | [#12][i12] |
| Locally maintained data | `catalogue/` in the Praetorium repository | Overlays, corrections, rules versions, ID migrations, retired IDs | [#13][i13], [#14][i14] |

### `wh40k-11e` definitions

- **Source.** A community BattleScribe-format catalogue, one JSON file per faction. The pinned repository is a fork of [`kgu28/wh40k-11e`][s-kgu]. Both READMEs credit the BSData organisation and link to `BSData/wh40k-11e`, which returned 404 from GitHub on 21 November 2026. The catalogue guide says definitions "no longer update upstream" and are kept current by working the `just drift` report against Game Datacards ([catalogue guide, Data][p-guide-data]).
- **Consumers.** [`src/server/canonicalCatalogue.ts`][p-canonical] compiles entries, constraints, modifiers, and options into the records behind the roster builder, legality checks (`evaluate.ts`), datasheet and detachment pages, the reference API ([`src/server/referenceOpenApi.ts`][p-openapi]), the MCP tools, and the offline construction bundle ([`src/client/offline/constructionSource.ts`][p-offline]). [`src/server/rules.ts`][p-rules] reads army rules that Game Datacards lacks from these files.
- **Intended use.** Unit, wargear, and roster construction definitions and the IDs saved rosters hold.
- **Reuse terms.** No licence file in the fork or its parent; the manifest records `license: null` with the attribution "Community catalogue data from BSData". The data transcribes datasheet profiles from publisher material.
- **Open questions.** Who holds rights in the catalogue structure now that the original repository is gone, and whether any licence was ever granted. Whether profiles copied from datasheets can be republished at all, or only referenced.

### Munitorum Field Manual points

- **Source.** A scraper and YAML dataset of the publisher's online [Munitorum Field Manual][s-mfm-site], one file per faction, at MFM 1.6 for the current rules. Retired rules versions pin MFM 1.5 commits (`8e0e635`, `8355616`).
- **Consumers.** [`src/server/mfm.ts`][p-mfm] loads the files; the canonical catalogue takes costs from them in preference to Game Datacards ([`canonicalCatalogue.ts`][p-canonical]). Roster totals, sealed-event budgets, roster search, and data-update history read the resulting points. [`scripts/checkPoints.ts`][p-checkpoints] (`just points`) holds the 99.9% match bar.
- **Intended use.** Unit-size, enhancement, upgrade, and detachment-point costs per rules version.
- **Reuse terms.** The repository is [MIT-licensed][s-mfm-licence] ("Copyright 2026 BSData"). That licence covers the repository's own work. The prices are facts published by Games Workshop on its own site.
- **Open questions.** Whether the MIT grant is meant to cover the scraped dataset and who the named copyright holder is. Whether the publisher's site terms allow scraping and redistributing price tables.

### Game Datacards gameplay reference

- **Source.** Per-faction JSON from the Game Datacards project, plus core rules, rule documents, and Combat Patrol rules under `11th/gdc/core/`.
- **Consumers.** [`src/server/rules.ts`][p-rules] builds factions and detachments ([`datacardFactions.ts`][p-dcfactions]), core rule cards ([`rulesCards.ts`][p-rulescards]), rule documents ([`rulesCore.ts`][p-rulescore]), and keyword ability descriptions. The canonical catalogue joins cards to definitions and records `provenance.datacards`. Reference pages and MCP records expose names, numbers, and `textSources` links; the browser fetches the wording itself. The drift report treats Game Datacards as the authority for definition fixes.
- **Intended use.** Unit, faction, detachment, stratagem, enhancement, and core rules reference, and stable record IDs for stratagems and enhancements.
- **Reuse terms.** No licence file at the pin and none reported by GitHub. The manifest records `license: null` and the attribution "Data provided by game-datacards", which the app shows.
- **Open questions.** Any reuse basis beyond linking. Our releases do not carry its record IDs; Praetorium keeps them in its own mappings.

### Game Datacards mission packs

- **Source.** The same repository's mission-pack and layout files.
- **Consumers.** [`missionPacks.ts`][p-missionpacks], [`datacardMissions.ts`][p-dcmissions], and [`missionTwists.ts`][p-twists] build missions, mission cards, primaries, secondaries, twists, fixed secondary caps, and force dispositions. [`datacardTerrain.ts`][p-dcterrain] takes deployment and layout IDs and names from these files and joins Battlemaster geometry to them by name. Battle setup, the tracker, mission matchups, and sealed-event table battlefields use the results.
- **Intended use.** Mission setup and scoring structure, deployment zones, layout identity.
- **Reuse terms.** As for the gameplay reference.
- **Open questions.** As for the gameplay reference, plus whether award structure (VP, caps, timing) counts as a reusable fact or as reproduced rules.

### Battlemaster geometry

- **Source.** Public layout endpoints of [battlemaster.online][s-bm] for the `chapter-approved-2026` and `combat-patrol` packs published by one owner account. The pin is a SHA-256 of the fetched catalogue, not a commit ([`src/server/sync.ts`][p-sync]).
- **Consumers.** [`datacardTerrain.ts`][p-dcterrain] and [`combatPatrolTerrain.ts`][p-cpterrain] attach terrain areas, walls, roofs, and objective hosts to Game Datacards layouts. [`scripts/checkTerrain.ts`][p-checkterrain] checks them. Three local patches correct labels and areas and add Combat Patrol layouts.
- **Intended use.** Exact battlefield geometry for battle setup and table views.
- **Reuse terms.** No licence in the manifest. No published terms were located on the site on 21 November 2026, so reuse terms remain unresolved.
- **Open questions.** Whether the owner permits redistribution of the geometry, and whether a geometry traced from printed deployment maps would be original enough to publish.

### Translated names

- **Source.** A pinned copy of New Recruit's community translations from [nrdata.org][s-nr], one JSON map per language, refreshed by the repository's `bin/update`. Its README says the translations belong to New Recruit and its contributors and include entries awaiting moderation.
- **Consumers.** [`src/server/catalogueTranslations.ts`][p-translations] loads names up to 200 characters; [`src/server/rosterImport.ts`][p-rosterimport] uses them to match faction, detachment, and disposition names in imported lists.
- **Intended use.** Reading lists exported in another language back to the catalogue's own names.
- **Reuse terms.** No licence. Attribution only.
- **Open questions.** Reuse terms from New Recruit remain unresolved: nrdata.org returned HTTP 502 on 21 November 2026, so its terms could not be read. Whether unmoderated entries should ship.

### Faction icons

- **Source.** SVG faction symbols from [Certseeds/wh40k-icon][s-icons-repo], selected and renamed by the map in `sources.json`.
- **Consumers.** `catalogueMaterialize.ts` copies the selected files; [`datacardFactions.ts`][p-dcfactions] embeds them; the [`/api/faction-icons/$id`][p-iconroute] route serves them to the simulator pickers and other faction views. [`src/server/factionIconSources.ts`][p-iconsources] links two Titan factions' icons through jsDelivr at a different commit, `be23002`, which is also the icon pin in [`catalogue/retained-profile-build.json`][p-retained-build].
- **Intended use.** Faction artwork in the interface.
- **Reuse terms.** The manifest records AGPL-3.0. The upstream [README][s-icons-readme] applies AGPL-3.0 to code, CC BY-NC-SA 4.0 to documents and released non-font files, and OFL-1.1 to fonts, and says the symbols and names belong to Games Workshop.
- **Open questions.** Which licence covers the SVGs we use; the manifest's AGPL-3.0 may be wrong. Whether a non-commercial share-alike licence is acceptable for our releases. Whether the depicted marks can be redistributed at all. The two icon pins should be reconciled.

### Locally maintained data

Praetorium keeps these in [`catalogue/`][p-catalogue-dir]. They are original work or corrections with recorded provenance, but several draw on sources outside the manifest.

- **Overlays.** The current rules replace Adeptus Custodes definitions and cards with the fork branch `feat/custodes-codex@3b8a13e`, credited as transcribed from [orpheax/custobuilder][s-custo] (no licence) and checked against scanned codex pages. A retired preview used `feat/custodes-11e-preview@3c57378`, including preview points. A retired Space Marines rules version used `Space-Marine-Codex@87f63a4`.
- **Rules versions.** `composition.json` defines nine rules versions, of which `mfm-1-6` is the released default. Three retired versions point to stored snapshots in the private bucket by snapshot ID and archive SHA-256 rather than to source commits.
- **Corrections.** 29 patch files across definitions, points, Game Datacards, and Battlemaster, with provenance notes in the [patches README][p-patches]. Some cite sources outside the manifest: the publisher's Event Companion PDF, Play On Tabletop's King of the Colosseum graphics, a Frontline Gaming mat, and exports from the official app. Two stratagem corrections are mirrored in `src/core/stratagemCorrections.ts`.
- **Identity and migration records.** `edition-migrations.json`, `roster-migrations.json`, `retained-roster-rules.json`, `retired-ids.json`, `accepted-id-drops.json`, `accepted-coverage-losses.json`, `revocations.json`, and `retained-profile-build.json` keep saved rosters readable as sources change.
- **Reuse terms.** Praetorium's [AGPL-3.0 licence][p-licence] covers its own code and corrections. Corrections that restate source facts inherit the source's open questions.
- **Open questions.** Reuse basis for the Custodes overlay and the King of the Colosseum tracing.

### Inputs used only for verification

These do not ship in the catalogue and have no migration issue, but they shape it.

- **40kdc-data.** A second opinion in the drift report ([`scripts/lib/catalogueDrift.ts`][p-drift]); never an edit on its own.
- **Tournament list corpora.** 40k Stats, Mini Headquarters, Lexmechanic, and ListForge feeds ([`scripts/lib/importCorpusSources.ts`][p-corpus], [`src/server/winningLists.ts`][p-winning]) set the 95% clean-import bar and feed the Tournament lists tab. They are roster samples and stay out of this repository.
- **Retired sources.** Published snapshots still name `rules` and `marineCodex` sources, read as history only ([`src/server/catalogueSources.ts`][p-catsources]).

## Identity the app must preserve

Saved rosters, battles, events, and public links store source IDs directly. A replacement source has to keep these resolvable or supply mappings. The guide requires retired IDs to stay resolvable and illegal, never dropped or reused, and [`checkIdDrops`][p-guide-migration] fails a publish that drops an ID a roster can hold.

| What is stored | Where | ID origin | Issue |
| --- | --- | --- | --- |
| Faction book, optionally qualified as `<rules-version>~<book>` | `rosters.catalogueId`, favourites, loadouts, URLs ([`catalogueEdition.ts`][p-edition]) | Definitions catalogue ID; rules version from composition | [#6][i6], [#14][i14] |
| Detachments, borrowed detachment | `rosters.detachmentId`, `borrowedDetachmentId`, `detachmentIds` | Definitions entry ID | [#6][i6] |
| Units and choices | `rosters.picks`: `entryId`, `catalogueId`, `choices`, `spreads`, `toggles` keyed by paths of definition IDs ([`commands.ts`][p-commands]) | Definitions entry and option IDs | [#6][i6] |
| Collection and favourite units | `collection.entryId`, `favouriteDatasheets.entryId` ([`productSchema.ts`][p-schema]) | Definitions entry ID | [#6][i6] |
| Force disposition | `rosters.disposition`, sealed-event teams | Game Datacards disposition | [#8][i8] |
| Battle roster snapshot | `attach-roster` command: catalogue ID, rules version summary, catalogue revision, picks, unit keys | Definitions IDs plus composition revision | [#6][i6], [#14][i14] |
| Battle preparation | Stratagem `key`, secondary and primary `key` | Game Datacards record IDs | [#7][i7], [#8][i8] |
| Battle setup | `missionPackId`, `twistId`, `cardKey`, `patternId`, `terrainLayoutId`; `event_battlefields` | Game Datacards pack, card, deployment, and layout IDs | [#8][i8], [#9][i9] |
| Points marks | `rosterPointsMarks.revision`, `points` | Points revision hash | [#10][i10] |
| Public URLs | `/factions/$catalogueId/rules/$rulesVersion/...`, `/missions/$packId/secondaries/$cardId`, `/force-dispositions/$dispositionId` | Slugs and IDs above | [#14][i14] |
| Catalogue history | Snapshot IDs and archive hashes, `retired-ids.json`, the immutable change history | Praetorium | [#13][i13], [#14][i14] |

Fields a replacement must reproduce, beyond IDs: names as printed (imports match on them), costs per unit size and rules version, detachment points, phase and turn of stratagems, CP costs, keywords, faction membership, and the composition joins between definitions, cards, and points.

## Pilot input assessment

The pilot is the four Pantheon of Woe rules named in the [roadmap][roadmap-pilot]. The table records the consumer IDs Praetorium uses for them today, as evidence for the mapping Praetorium will hold (see [Where mappings live](#where-mappings-live)). All IDs below are the same at the baseline Game Datacards pin and in production on 21 November 2026.

| Rule | Kind | Game Datacards ID | Definitions ID | App anchor in `mfm-1-6` |
| --- | --- | --- | --- | --- |
| Disharmonisation Cascade | Stratagem, Epic Deed, 1 CP | `c236587e-6f3f-5062-a3e1-28d457193578` | none | `#stratagem-disharmonisation-cascade` |
| Mass Transmogrification | Stratagem, Epic Deed, 1 CP | `8dc612d3-3ec0-5cbb-b624-c57a3ebbc0b1` | none | `#stratagem-mass-transmogrification` |
| Phase Melding | Stratagem, Strategic Ploy, 1 CP | `ef2e051f-6a3c-573a-8646-4cba770e8bef` | none | `#stratagem-phase-melding` |
| Reletavistic Tether | Enhancement, 40 points | `1e2b0519-eeac-5062-a529-1b6bc12a75c5` | option `4b7a-0ee7-9cf0-8434` | `#enhancement-reletavistic-tether` |

The detachment is Game Datacards `a7ec286c-a305-435b-b402-91140c67d809` and definitions entry `1707-57c5-676e-90d9` in the Necrons catalogue `b654-a18a-ea1-3bf2`, at 2 detachment points with the Disruption disposition. Its app page is [`/factions/necrons/rules/mfm-1-6/detachments/pantheon-of-woe`][app-pow] and its MCP reference ID is `detachment:necrons:pantheon-of-woe`. The Tether's 40 points come from the pinned [MFM Necrons file][s-mfm-necrons].

**Source reference.** Author from the publisher's [Necrons Faction Pack v1.3, pages 11–12][s-pack], which was reachable on 21 November 2026. Records cite the page and carry original wording. Game Datacards and the definitions are not authoring sources: neither grants reuse, and their wording must not feed a record.

### Download terms

The Faction Pack is a PDF offered for download from Warhammer Community. The site's [Terms of Website Use][s-wc-terms], read on 21 November 2026, show no last-updated date and [can change whenever the page is amended][wc-variations], so re-read them before each release. In our own words, by section:

- **[Downloadable Material Licence][wc-download], paragraph 1.** Downloadable game rules and PDFs come with a personal, non-exclusive, non-transferable, free licence to keep copies on devices you own and to open them.
- **Paragraph 2.** Any use or storage beyond that is outside the licence.
- **Paragraph 3.** You may not share the material with people who lack a licence (3.1, 3.2), print and hand out copies (3.3), or use it commercially or for a business (3.5).
- **[Intellectual property rights][wc-ip].** Site material may not be copied, republished, uploaded, or distributed; any other use needs a request through the publisher's contact route. The terms point to no fan-content or IP guidelines.
- **[Footer][wc-ai].** Using site content to train generative AI is prohibited.
- **Not addressed.** Sending content to a model for drafting without training it, automated download or text and data mining, derivative works by name, and publishing original summaries or facts drawn from the material.

Unverified: that these terms govern the PDF on the `assets.warhammer-community.com` host as well as the site, and that a non-commercial volunteer project falls outside paragraph 3.5. Both are assumptions to confirm.

### Source-use decision for #3

This sets project practice for [#3][i3]. It does not rule on what the terms permit or whether any use is lawful.

| Activity | What the terms say | Project practice for #3 |
| --- | --- | --- |
| A contributor downloads the PDF and reads it as a personal reference while writing a record | Within the paragraph 1 grant to keep and open copies, subject to the unverified points above | Allowed |
| Sending official prose to a model, whether page images, extracted text, or pasted excerpts | Paragraph 2 confines use to keeping and opening copies; training is prohibited; prompting without training is not addressed, so this use is unverified | Not done while the use stays unverified. Model assistance takes only a contributor's own notes and structured fields. Revisit if a basis for the use is established |
| Committing the PDF, its text, or extracts as an input to Git, issues, pull requests, CI artifacts, or a release | Copying, republishing, uploading, distributing, and sharing with unlicensed people are all excluded | Not done |
| Linking to the PDF with a page reference | [Linking][wc-link] is allowed for personal, non-commercial reasons when fair and lawful; whether a public project link qualifies is unverified | Used as the citation form, pending that check |
| Publishing original summaries, structured facts such as CP cost, phase, and points, and page references | Not addressed | Unresolved. The owner decides before [#4][i4] publishes anything |

### Where mappings live

Catalogue records carry only project IDs and an explicit rules version, as the [roadmap][roadmap-pilot] requires. Mappings from those IDs to Game Datacards IDs, definitions IDs, or app anchors are app-specific and belong in Praetorium ([#5][i5]), alongside its other catalogue adapters. The consumer IDs above are evidence for that mapping, not fields of a record.

**Unresolved decisions.**

1. Whether publishing original summaries and structured facts is acceptable to the publisher, as set out in the source-use table. This inventory does not decide it.
2. The cross-references the four rules depend on, such as Deadly Demise, Fall Back, Desperate Escape, Battle-shock, Reanimation Protocols, and the Necrons Unravelling status, have not been located, and their sources are not yet identified. [#3][i3] needs them. When each source is found, check its own terms before using it as above.
3. The Faction Pack version Game Datacards transcribes is not recorded at its pin, so we cannot confirm it matches v1.3. This affects Praetorium's mapping check, not authoring.
4. The [summary prototype][p-prototype] matched summaries to rules by wording digest. Praetorium's mapping should bind to stable IDs so a wording change upstream does not detach a summary.

## Open questions

| Source | Question | Issue |
| --- | --- | --- |
| Definitions | Rights holder and licence after the original BSData repository disappeared | [#6][i6] |
| Points | Whether the MIT grant covers scraped prices and whether the publisher's site terms allow redistribution | [#10][i10] |
| Game Datacards | Any reuse basis for its data; its IDs stay in Praetorium's mappings | [#7][i7], [#8][i8] |
| Battlemaster | Owner permission for geometry redistribution | [#9][i9] |
| Translations | New Recruit's terms; unmoderated entries | [#11][i11] |
| Icons | Which licence covers the SVGs; trademark status; two icon pins | [#12][i12] |
| Custodes overlay, King of the Colosseum tracing | Reuse basis of material outside the manifest | [#13][i13] |
| Pilot | Publishing original summaries and facts under the publisher's terms; whether the terms cover the assets host and a non-commercial project; cross-reference pages | [#3][i3], [#4][i4] |

[p-root]: https://github.com/richardsolomou/praetorium.gg/tree/a9b4a5b3d37484f696b275d0b0e10b89ca07c325
[p-sources]: https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/catalogue/sources.json
[p-composition]: https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/catalogue/composition.json
[p-lock]: https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/catalogue.json
[p-catalogue-dir]: https://github.com/richardsolomou/praetorium.gg/tree/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/catalogue
[p-patches]: https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/catalogue/patches/README.md
[p-retained-build]: https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/catalogue/retained-profile-build.json
[p-licence]: https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/LICENSE
[p-guide]: https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/docs/development/catalogue-data.md#rules-text
[p-guide-data]: https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/docs/development/catalogue-data.md#data
[p-guide-migration]: https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/docs/development/catalogue-data.md#roster-migration
[p-materialize]: https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/scripts/lib/catalogueMaterialize.ts
[p-upstream]: https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/scripts/lib/catalogueUpstream.ts
[p-drift]: https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/scripts/lib/catalogueDrift.ts
[p-corpus]: https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/scripts/lib/importCorpusSources.ts
[p-checkpoints]: https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/scripts/checkPoints.ts
[p-checkterrain]: https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/scripts/checkTerrain.ts
[p-catsources]: https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/src/server/catalogueSources.ts
[p-sourcetexts]: https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/src/server/sourceTexts.ts
[p-sourcetext]: https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/src/core/sourceText.ts
[p-sources-page]: https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/src/client/features/legal/Sources.tsx
[p-canonical]: https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/src/server/canonicalCatalogue.ts
[p-openapi]: https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/src/server/referenceOpenApi.ts
[p-offline]: https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/src/client/offline/constructionSource.ts
[p-rules]: https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/src/server/rules.ts
[p-mfm]: https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/src/server/mfm.ts
[p-dcfactions]: https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/src/server/datacardFactions.ts
[p-rulescards]: https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/src/server/rulesCards.ts
[p-rulescore]: https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/src/server/rulesCore.ts
[p-missionpacks]: https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/src/server/missionPacks.ts
[p-dcmissions]: https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/src/server/datacardMissions.ts
[p-twists]: https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/src/server/missionTwists.ts
[p-dcterrain]: https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/src/server/datacardTerrain.ts
[p-cpterrain]: https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/src/server/combatPatrolTerrain.ts
[p-sync]: https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/src/server/sync.ts
[p-translations]: https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/src/server/catalogueTranslations.ts
[p-rosterimport]: https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/src/server/rosterImport.ts
[p-iconroute]: https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/src/routes/api/faction-icons.$id.ts
[p-iconsources]: https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/src/server/factionIconSources.ts
[p-winning]: https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/src/server/winningLists.ts
[p-edition]: https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/src/core/catalogueEdition.ts
[p-commands]: https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/src/core/commands.ts
[p-schema]: https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/spacetimedb/src/productSchema.ts
[p-prototype]: https://github.com/richardsolomou/praetorium.gg/blob/c742a9ef7e76029cbc900f236edc26bd84934986/src/server/ruleSummaries.ts
[s-defs]: https://github.com/richardsolomou/wh40k-11e/tree/6fd981b3da1e4079804c1224d844d12ca8ec6ced
[s-kgu]: https://github.com/kgu28/wh40k-11e
[s-mfm]: https://github.com/richardsolomou/wh40k-11e-mfm/tree/6eed7b100ae508c1faa76a42bf7b55ecabb59107
[s-mfm-licence]: https://github.com/richardsolomou/wh40k-11e-mfm/blob/6eed7b100ae508c1faa76a42bf7b55ecabb59107/LICENSE
[s-mfm-necrons]: https://github.com/richardsolomou/wh40k-11e-mfm/blob/6eed7b100ae508c1faa76a42bf7b55ecabb59107/data/necrons.yaml
[s-mfm-site]: https://mfm.warhammer-community.com/en
[s-gdc]: https://github.com/game-datacards/datasources/tree/ebcd0cbedb197fd8246b7cff580fde3625c6f3f1/11th/gdc
[s-bm]: https://battlemaster.online
[s-tr]: https://github.com/richardsolomou/wh40k-11e-translations/tree/4dd982ca14a0ed9e7b99ce42ae03a569ab171ecb
[s-nr]: https://nrdata.org
[s-icons]: https://github.com/Certseeds/wh40k-icon/tree/99b7cb90655dddbd8acdef9ab40d52ae5fe61db0/src/svgs
[s-icons-repo]: https://github.com/Certseeds/wh40k-icon
[s-icons-readme]: https://github.com/Certseeds/wh40k-icon/blob/99b7cb90655dddbd8acdef9ab40d52ae5fe61db0/README.md
[s-custo]: https://github.com/orpheax/custobuilder
[s-pack]: https://assets.warhammer-community.com/eng_30-09_wh40k_faction_pack_necrons-1urphgbmpy-wbhocjbaba.pdf#page=11
[s-wc-terms]: https://www.warhammer-community.com/en-gb/terms-of-use/
[wc-download]: https://www.warhammer-community.com/en-gb/terms-of-use/#:~:text=Downloadable%20Material%20Licence
[wc-ip]: https://www.warhammer-community.com/en-gb/terms-of-use/#:~:text=Intellectual%20property%20rights
[wc-link]: https://www.warhammer-community.com/en-gb/terms-of-use/#:~:text=Linking%20to%20our%20site
[wc-variations]: https://www.warhammer-community.com/en-gb/terms-of-use/#:~:text=Variations
[wc-ai]: https://www.warhammer-community.com/en-gb/terms-of-use/#:~:text=generative%20artificial%20intelligence
[app-pow]: https://praetorium.gg/factions/necrons/rules/mfm-1-6/detachments/pantheon-of-woe
[roadmap-pilot]: roadmap.md#necrons-pilot
[i3]: https://github.com/richardsolomou/40k-catalogue/issues/3
[i4]: https://github.com/richardsolomou/40k-catalogue/issues/4
[i5]: https://github.com/richardsolomou/40k-catalogue/issues/5
[i6]: https://github.com/richardsolomou/40k-catalogue/issues/6
[i7]: https://github.com/richardsolomou/40k-catalogue/issues/7
[i8]: https://github.com/richardsolomou/40k-catalogue/issues/8
[i9]: https://github.com/richardsolomou/40k-catalogue/issues/9
[i10]: https://github.com/richardsolomou/40k-catalogue/issues/10
[i11]: https://github.com/richardsolomou/40k-catalogue/issues/11
[i12]: https://github.com/richardsolomou/40k-catalogue/issues/12
[i13]: https://github.com/richardsolomou/40k-catalogue/issues/13
[i14]: https://github.com/richardsolomou/40k-catalogue/issues/14
