# Faction icons

This inventory covers the faction icons Praetorium displays, where they come from, what their terms allow, and what the catalogue can supply instead. It follows the [source inventory](source-inventory.md#faction-icons) and uses the same baseline, Praetorium [`a9b4a5b`][p-root]. It holds no upstream artwork.

## Current assets

Praetorium pins 37 SVG files from [Certseeds/wh40k-icon][s-repo] at [`99b7cb9`][s-pin] (30 August 2026, the upstream `master` head on 21 November 2026). The `icons` entry in [`catalogue/sources.json`][p-sources] maps each app faction ID to an upstream path. All 37 are files under `src/svgs`, not the packaged `dist` output.

| App faction ID | Upstream path under `src/svgs` |
| --- | --- |
| `adepta-sororitas` | `human_imperium/adepta-sororitas.svg` |
| `adeptus-astartes` | `human_imperium/adeptus-astartes.svg` |
| `adeptus-custodes` | `human_imperium/adeptus-custodes.svg` |
| `adeptus-mechanicus` | `human_imperium/adeptus-mechanicus.svg` |
| `adeptus-titanicus` | `human_imperium/mechanicum/collegia-titanica.svg` |
| `aeldari` | `xenos/eldar/craftworld-eldar.svg` |
| `agents-of-the-imperium` | `human_imperium/imperial-aquila.svg` |
| `astra-militarum` | `human_imperium/astra-militarum.svg` |
| `black-templars` | `human_imperium/astartes_chapters/black-templars.svg` |
| `blood-angels` | `human_imperium/astartes_legion/blood-angels.svg` |
| `chaos-daemons` | `chaos/chaos-daemons.svg` |
| `chaos-knights` | `chaos/questor-traitoris.svg` |
| `chaos-space-marines` | `chaos/heretic-astartes.svg` |
| `crimson-fists` | `human_imperium/astartes_chapters/crimson-fists.svg` |
| `dark-angels` | `human_imperium/astartes_legion/dark-angels.svg` |
| `death-guard` | `chaos/legions/death-guard.svg` |
| `deathwatch` | `human_imperium/astartes_chapters/deathwatch.svg` |
| `drukhari` | `xenos/durhkari/drukhari-2.svg` |
| `emperors-children` | `chaos/legions/emperors-children-1.svg` |
| `genestealer-cults` | `xenos/genestealer_cult/genestealer-cults.svg` |
| `grey-knights` | `human_imperium/astartes_chapters/grey-knights.svg` |
| `imperial-fists` | `human_imperium/astartes_legion/imperial-fists.svg` |
| `imperial-knights` | `human_imperium/imperial-knights.svg` |
| `iron-hands` | `human_imperium/astartes_legion/iron-hands.svg` |
| `leagues-of-votann` | `xenos/leagues-of-votann.svg` |
| `necrons` | `xenos/necrons/necrons.svg` |
| `orks` | `xenos/orks/orks.svg` |
| `raven-guard` | `human_imperium/astartes_legion/raven-guard.svg` |
| `salamanders` | `human_imperium/astartes_legion/salamanders.svg` |
| `space-wolves` | `human_imperium/astartes_legion/space-wolves.svg` |
| `tau-empire` | `xenos/tau_empire/tau-sept.svg` |
| `thousand-sons` | `chaos/legions/thousand-sons.svg` |
| `titanicus-traitoris` | `chaos/titanicus-traitoris.svg` |
| `tyranids` | `xenos/tyranids.svg` |
| `ultramarines` | `human_imperium/astartes_legion/ultramarines.svg` |
| `white-scars` | `human_imperium/astartes_legion/white-scars.svg` |
| `world-eaters` | `chaos/legions/world-eaters-1.svg` |

The app reuses the `adeptus-astartes` icon for `space-marines`. Every faction family in the live faction list on 21 November 2026 resolves to an icon. `crimson-fists` has an icon but no faction uses it. Together the 37 files are about 161 KiB as served, from 0.7 KiB (`tau-empire`) to 14 KiB (`adeptus-astartes`).

### How they reach the screen

1. [`catalogueMaterialize.ts`][p-materialize] downloads the pinned repository, copies each selected file to `icons/<app id>.svg`, and rejects files over 256 KiB, without an `<svg` element, or containing `<script`. The result is part of the private catalogue snapshot.
2. [`datacardFactions.ts`][p-dcfactions] reads that directory into base64 `data:` URIs keyed by app faction ID. If `adeptus-titanicus` or `titanicus-traitoris` is still missing, [`factionIconSources.ts`][p-iconsources] supplies a jsDelivr URL at the older commit `be23002`.
3. [`factionReferences.ts`][p-factionrefs] gives each faction summary an icon URL, `/api/faction-icons/<id>` in production and the `data:` URI in development. The [route][p-iconroute] decodes the URI and serves it with a one-year immutable cache header, or redirects with 307 when the value is a remote URL. An unknown ID returns 404.
4. [`FactionMark`][p-factionmark] draws the icon as a CSS mask over a solid faction colour. Only the shape's alpha matters, so the upstream fill colours are discarded. With no icon, it shows a diamond in the faction colour.
5. The [offline reference bundle][p-offline] stores each faction's icon as the `data:` URI, so the downloadable `offline-reference.html` file carries a copy of every icon.

### Where they appear

`FactionMark` is used on about 40 surfaces: the faction index and faction, detachment, and datasheet pages; roster lists, folders, discovery, summaries, and the builder's unit cards; battle identity, round summary, battle lines, and battle shelf; the simulator's combatant cards, side pickers, unit pickers, benchmark targets, recent simulations, and roster picker; collection cards, army headers, and wishlist; group overview, sealed event armies, profile and service record, player rankings, home, search results, data updates, and shared filter and select controls. The [Sources page][p-sourcespage] credits the icons to Certseeds/wh40k-icon "licensed under AGPL-3.0".

## Licence and pins

The manifest records `AGPL-3.0` with a licence URL of `blob/master/LICENSE`. That URL returns 404; the repository holds three licence files, `LICENSE_AGPL_V3_0.md`, `LICENSE_CC_BY_NC_SA_V4_0.md`, and `LICENSE_OFL_1_1_RFN.md`. GitHub's detected licence is AGPL-3.0, and `package.json` declares `(OFL-1.1-RFN AND AGPL-3.0-or-later AND CC-BY-NC-SA-4.0)`. The [README][s-readme] says that, from 7 December 2024, changed code is AGPL-3.0-or-later, documents are CC BY-NC-SA 4.0 or later, fonts in released packages are OFL-1.1-RFN, and other files in released packages are CC BY-NC-SA 4.0 or later. It also says the symbols and names belong to Games Workshop, and it credits three earlier artists.

So the AGPL-3.0 record is at best incomplete. The SVGs are artwork rather than code, and the closest stated term for them is CC BY-NC-SA 4.0. That licence forbids commercial use and requires adaptations to be shared under the same terms, and the README cannot license marks that it says belong to someone else. The README does not say whether the source files under `src/svgs` count as released files, or what terms applied to drawings that existed before 7 December 2024.

The retained profile build in [`catalogue/retained-profile-build.json`][p-retained] and the jsDelivr fallback both pin `be23002` (10 June 2026). `99b7cb9` is nine commits ahead and changes 136 files, of which one selected icon differs: `leagues-of-votann`. The fallback is not used in production: the live endpoint served both Titan factions inline with status 200 on 21 November 2026, because the main pin selects both files.

## What can move

Nothing from Certseeds/wh40k-icon can move into a 40K Catalogue release. The project's licence is MIT, releases must be usable by any consumer, and the icons depict Games Workshop marks under a non-commercial share-alike licence. Copying, redrawing, or tracing them would carry the same problems.

A replacement icon can move when it meets all of these conditions:

- It is drawn for the project, or it comes from a source whose licence allows commercial redistribution without imposing terms on the rest of the release. The verifier accepts `MIT`, `CC0-1.0`, and `CC-BY-4.0`.
- It does not reproduce, trace, or imitate a Games Workshop symbol. A generic shape identifies a faction through the colour and name that the app shows next to it.
- Its manifest entry records an app-independent ID, the file, a SHA-256 hash, the licence, the attribution text, and its provenance.
- It works as a mask: a single self-contained SVG with a `viewBox`, no scripts or event handlers, and no references outside the file, because a `data:` URI in an offline file cannot fetch anything.

The faction-to-icon mapping belongs in Praetorium, as with other consumer IDs.

### Verified sample

[`fixtures/icons/generic-hexagon.svg`](../fixtures/icons/generic-hexagon.svg) is an original 164-byte hexagon with a round cut-out, released under the repository's MIT licence. [`fixtures/icons/manifest.json`](../fixtures/icons/manifest.json) records it, and [`src/icons/verify.ts`](../src/icons/verify.ts) checks a manifest entry against its file. `test/icons.test.ts` covers the sample and the rejection of mismatched hashes, non-commercial licences, scripts, and external references.

On 21 November 2026 the sample also:

- passed Praetorium's materializer and loader checks for path, size, `<svg`, `<script`, and file name;
- round-tripped byte for byte through the `data:` URI and the decoding in the icon route, which is the same form the offline bundle embeds;
- rendered correctly as the Necrons mark on the live faction index after the mask was replaced in the page, keeping its evenodd cut-out at the 40-pixel card size.

### Original mark set

[The mark directory](../data/icons) contains 37 original geometric SVGs under the repository's MIT licence. The [manifest](../data/icons/manifest.json) gives each mark a stable shape ID, provenance, attribution and a SHA-256 pin. The set has enough distinct masks for the current and retained input IDs catalogued above. Its IDs describe shapes so any consumer can assign them to its own entities.

Each SVG has a solid outline and a transparent cut-out. The marks were checked as monochrome CSS masks at 20 px and 40 px. Keep the faction name visible alongside them. The consumer chooses the mapping and verifies that every faction ID, including historical ones, resolves in its own UI and offline bundle.

The files and licence can be built from a pinned commit with `git archive --format=tar <commit> LICENSE data/icons`. Verify each SVG against the manifest when consuming the archive.

## Missing icons

Praetorium already handles a missing icon: no icon URL is sent, the route returns 404, and `FactionMark` shows the diamond in the faction colour. A partial replacement should rely on that fallback rather than mixing sources for the same faction. A catalogue release should list factions without an icon so the consumer can tell a gap from an error.

Faction colours come from a separate table in `FactionMark`. Its T'au entry is keyed `t-au-empire`, but the faction ID is `tau-empire`, so T'au shows the grey default colour behind its icon. That is a Praetorium issue, not part of the icon source.

## What prevents a full switch

- Assign the original marks to faction families and chapter variants and review them against the consumer's colour table and diamond fallback.
- The current terms are unresolved. Until the upstream author or a rights holder confirms otherwise, Praetorium should record the icon licence as CC BY-NC-SA 4.0 with the Games Workshop notice, fix the licence URL, and remove the `be23002` pin and the unused jsDelivr fallback. Those changes stay in Praetorium.
- Preserve the attribution in the offline bundle and the selected mark IDs across pinned releases. [Cutover tracker](cutover-tracker.md)

[p-root]: https://github.com/richardsolomou/praetorium.gg/tree/a9b4a5b3d37484f696b275d0b0e10b89ca07c325
[p-sources]: https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/catalogue/sources.json
[p-retained]: https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/catalogue/retained-profile-build.json
[p-materialize]: https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/scripts/lib/catalogueMaterialize.ts#L29-L44
[p-dcfactions]: https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/src/server/datacardFactions.ts#L118-L125
[p-iconsources]: https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/src/server/factionIconSources.ts
[p-factionrefs]: https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/src/shared/factionReferences.ts#L113-L117
[p-iconroute]: https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/src/routes/api/faction-icons.$id.ts
[p-factionmark]: https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/src/client/components/FactionMark.tsx
[p-offline]: https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/scripts/lib/offlineReferenceBundle.ts#L111-L130
[p-sourcespage]: https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/src/client/features/legal/Sources.tsx#L70-L76
[s-repo]: https://github.com/Certseeds/wh40k-icon
[s-pin]: https://github.com/Certseeds/wh40k-icon/tree/99b7cb90655dddbd8acdef9ab40d52ae5fe61db0/src/svgs
[s-readme]: https://github.com/Certseeds/wh40k-icon/blob/99b7cb90655dddbd8acdef9ab40d52ae5fe61db0/README.md
