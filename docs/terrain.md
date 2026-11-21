# Terrain geometry

Terrain records describe the battlefield: where each terrain footprint sits, its outline, walls, and roofs, which objective it hosts, and the deployment zones and territories drawn over the board. The contract is the JSON Schema in [src/terrain/terrain.v1.schema.json](../src/terrain/terrain.v1.schema.json). [src/terrain/](../src/terrain) holds a reference implementation that verifies records, places them in board coordinates, and draws them for visual checks.

Nothing here is published layout data yet. The fixtures are invented shapes, because no proposed source of real layouts has a reuse basis (see [Sources and reuse](#sources-and-reuse)).

## Frames

All lengths are inches. Every point is `{ "x": number, "y": number }`.

| Frame | Origin | Axes |
| --- | --- | --- |
| Board | Top-left corner of the board, long edge horizontal | x right, y down. `board.width` is the long edge, so `width >= height`. |
| Footprint | `footprint.at`, in the board frame | The board axes turned by `footprint.rotation`. The footprint rectangle covers `[0, width] × [0, height]`. `outline` and `objective.at` use this frame. |
| Part | `part.at`, in the footprint frame | The footprint axes turned by `part.rotation`, after `mirror` reflects x to −x. `roof` and `walls` use this frame. |

A rotation is in degrees, in `[0, 360)`, and turns +x towards +y. With y pointing down, that is clockwise as drawn. A point `p` in a part frame reaches the board as:

```text
footprint point = part.at + R(part.rotation) · (mirror ? (−p.x, p.y) : p)
board point     = footprint.at + R(footprint.rotation) · footprint point
R(θ) · (x, y)   = (x cos θ − y sin θ, x sin θ + y cos θ)
```

`placeLayout` applies this and rounds each coordinate to 0.001″. [orientation.json](../fixtures/terrain/valid/orientation.json) puts the same asymmetric L shape at 0°, 90°, 180°, 270°, and 325°, plus a mirrored part. Its [placed output](../fixtures/terrain/valid/orientation.placed.json) is the expected result for any other implementation.

## Records

Both kinds carry `formatVersion: 1`, a `kind`, a project `id`, a `name`, `provenance`, and a `board`.

A **terrain layout** (`kind: "terrain-layout"`) has `areas`. Each area is one footprint:

| Field | Meaning |
| --- | --- |
| `id` | Stable within the layout. Area, part, and wall IDs share one namespace per layout. |
| `footprint` | `at`, `width`, `height`, `rotation`: the rectangle the outline is drawn in. |
| `outline` | The terrain boundary, used for the edge of the terrain area and for measurements. |
| `group` | Footprints with the same group form one terrain area. A footprint that is a terrain area on its own has `null`. |
| `objective` | `{ id, at }` when the footprint hosts an objective marker. Footprints sharing an objective `id` host one marker, as when a central marker straddles two footprints. |
| `parts` | Pieces of the footprint, each with `name`, `density` (`dense` or `light`), `roof` (a polygon or `null`), and `walls` (polylines with a `thickness`). `name` is free text such as a kit letter, and consumers decide whether to show it. |

A **deployment map** (`kind: "deployment-map"`) has two `zones`, one per role (`attacker`, `defender`), up to two `territories` by role, and `objectives` as `{ id, at }`. A board region outside every territory belongs to no one, unless the consumer's rules assign it.

## Provenance

`provenance.basis` is one of:

- `synthetic`: invented for tests.
- `original`: an independently designed layout with no outside source.
- `measured`: coordinates measured from a published map. It needs a `source` (`title` and `page` or `url`) and a `reuse` statement giving the basis for publishing the measurements. The schema rejects a measured record without one.

## Identity

Record IDs follow the mechanic-record pattern: lowercase words separated by `.` or `-`. An ID always names the same battlefield. A correction to its geometry keeps the ID. A different layout gets a new ID, and a retired ID is never reused.

A saved battle can also hold the ID of a footprint or an objective, so these are part of a layout's identity. Identity is by ID, not by position in `areas`. `droppedIds(previous, next)` lists every record, footprint, and objective ID that one release resolves and the next does not. A release should show an empty list, or document each loss.

### Joining mission packs

Mission packs ([#8](https://github.com/richardsolomou/40k-catalogue/issues/8), [mission packs](mission-packs.md)) own battlefield references: `layouts[].id`, `deployments[].id`, and which deployments each layout permits. A terrain layout's `id` equals the pack's layout ID, and a deployment map's `id` equals the pack's deployment ID. Geometry records do not repeat the permitted deployments. `joinBattlefields(pack, records)` takes any object with that shape and reports:

- **Gaps**, for a pack layout or deployment with no geometry. A pack can be released before its terrain.
- **Errors**, for a layout drawn on a different board from a deployment it permits.

The join assumes layout and deployment IDs are unique across a release. If [#14](https://github.com/richardsolomou/40k-catalogue/issues/14) scopes them to a pack, the key becomes the pack ID plus the layout ID.

## Checks

```sh
node src/terrain/cli.ts verify <record.json>...   # schema, geometry, and duplicate IDs across the files
node src/terrain/cli.ts place <layout.json>       # placed board coordinates as JSON
node src/terrain/cli.ts svg <layout.json> [<deployment.json>] > plan.svg
node --test test/terrain.test.ts
```

`verify` checks, beyond the schema:

- The board is landscape.
- IDs are unique within a layout.
- Every group has at least two footprints.
- Placed outlines, roofs, walls, zones, territories, and objectives lie on the board.
- No outline, roof, zone, or territory encloses zero area.
- Each objective lies inside its footprint's outline.
- A deployment map has one zone per role.

[fixtures/terrain/invalid](../fixtures/terrain/invalid) has one record for each failure, and the test lists the expected error for each.

**Visual check.** The SVG uses the board frame directly, so its pixel axes are the record's axes. Look for:

- A red dot at each footprint's origin.
- The footprint rectangle drawn dashed and the outline filled inside it.
- Walls thick, roofs darker, and objectives yellow.
- The attacker zone and territory in red, the defender in blue.

Check the following:

1. Each origin dot sits where `footprint.at` says.
2. A 90° footprint extends down the board from its dot.
3. Mirrored parts face the opposite way to their unmirrored twins.
4. A point-symmetric layout looks the same turned upside down.

## Praetorium audit

Audited at Praetorium [`a9b4a5b`][p-root], the [inventory baseline](source-inventory.md). Battlemaster detail files are read by [`rulesTerrain.ts`][p-rules] and joined to Game Datacards layouts by [`datacardTerrain.ts`][p-datacard] (Chapter Approved) and [`combatPatrolTerrain.ts`][p-cp] (Combat Patrol). The reader's output type is [`TerrainGeometry`][p-contract]. Counts below come from the local catalogue cache at that baseline. No values are reproduced.

| What Praetorium uses | Where it comes from | In this contract |
| --- | --- | --- |
| Layout IDs | Game Datacards `layouts[].id`, stored as `terrainLayoutId` and in sealed-event table battlefields. Battlemaster `terrain-<uuid>` IDs are found by archetype pair and variant letter (Chapter Approved) or the name `Layout A`–`C` (Combat Patrol), and are never stored. | Record `id`, joined through the pack |
| Board | Battlemaster `board.widthIn`/`heightIn`: 60 × 44 for Chapter Approved, 44 × 30 for Combat Patrol | `board` |
| Coordinate frame | Battlemaster: origin at the board centre, y up. Praetorium moves it to the top-left corner with y down: `(x + W/2, H/2 − y)`. | Board frame |
| Rotations | Footprint `rotationDeg` (arbitrary angles, negative and above 180) and part `rotationDeg` (multiples of 90, including ±360). Counter-clockwise in Battlemaster's y-up frame. | `rotation`, normalised to `[0, 360)` |
| Mirroring | Part `mirroredX`/`mirroredY` within the part's bounds | `mirror`. A y-mirror is an x-mirror plus 180°. |
| Terrain boundaries | Footprint `outline` | `outline` |
| Walls | Part `walls[].points`, `thicknessIn` | `walls` |
| Roofs | Part `outline` where present (462 of 1,306 parts) | `roof` |
| Density | Part `material`: `dense` or `light` | `density` |
| Terrain area groups | Praetorium file `terrain-areas.json`, by footprint index | `group` |
| Objectives | Chapter Approved: footprint centres flagged in Battlemaster's `.lite.json`, with `c1`/`c2` sharing one central marker. Combat Patrol: Praetorium file `terrain-objectives.json`. | `objective` |
| Kit-letter markers | Part names `AB`, `CD`, `EF`, `GH`, with label corrections in `terrain-labels.json`; dropped for Combat Patrol | Part `name`. Markers stay a consumer concern. |
| Placement measurements | Computed by Praetorium from footprint corners | `corners` in placed output |
| Deployment zones, territory, objectives | Chapter Approved: Battlemaster `deployment` (2 zones, 1 attacker territory, 5 objectives), joined by deployment name. Combat Patrol: Praetorium's measured `deployments.json` (zones and territory, no objectives). | Deployment map |
| Position corrections | Combat Patrol `terrain-positions.json` | Corrected `footprint.at` |

Coverage is 45 Chapter Approved layouts across 6 deployments, and 3 Combat Patrol layouts across 3 deployments, totalling 750 footprints. King of the Colosseum terrain comes from a separate tracing ([`kotcTerrain.ts`][p-kotc]) and is outside this audit.

### Frame equivalence

A local script converted every Battlemaster layout in the cache to this contract and placed it with `placeLayout`. It compared the result with Praetorium's own `battlemasterGeometry` output. The script and data stayed outside Git. The conversion was:

- `rotation = −rotationDeg mod 360`.
- `footprint.at` is the Battlemaster origin in the board frame, minus `R(rotation) · (0, height)`.
- Outline points become `(x, height − y)`.
- `part.at = (origin.x, height − origin.y)`.
- Part points are mirrored within their bounds, then become `(x, −y)`.

Result:

- All 48 layouts (45 Chapter Approved, 3 Combat Patrol) matched on every outline, roof, wall, and objective point: 160,254 points, with a largest difference of 0.001″, which is rounding.
- All 48 converted layouts passed `verify`.
- All 9 deployment overlays (6 Chapter Approved, 3 Combat Patrol) passed `verify` as deployment maps.

So the contract can carry everything Praetorium draws, in the same orientation.

### Saved battles

| Stored in a battle | Today | With this contract |
| --- | --- | --- |
| `terrainLayoutId`, `patternId`, sealed-event battlefields | Game Datacards layout and deployment IDs | Praetorium maps them to pack IDs ([#8](mission-packs.md#joining-saved-battles-and-terrain)), which are the record IDs |
| Objective keys in mission selections (guards, tempting target, consecrate, marker placements) | `area-N`, where `N` is the footprint's position in the Battlemaster file, because Battlemaster areas have no IDs; `group-center` for a shared central marker; `deployment-N` for deployment objectives when terrain hosts none | Praetorium needs a per-layout map from `area-N` and `group-center` to footprint and objective IDs. That map is built once against the pinned Battlemaster order, because any reordering upstream changes `N`. |
| Typed objective names (`manual-…`) | Player text | Unaffected |

A saved battle keeps reading under a replacement dataset only if its layout ID maps to a record and each objective key it holds maps to an ID that `droppedIds` never reports. No replacement record exists yet, so every saved battle still reads through Battlemaster.

## Sources and reuse

| Proposed input | Basis | Decision |
| --- | --- | --- |
| Battlemaster layout and deployment geometry | Public endpoints of one owner's packs. No licence was found, and redistribution permission is the [inventory's open question](source-inventory.md#battlemaster-geometry). | Not used. Coordinates, exports, and images stay out of Git. Used only for the local equivalence check above. |
| Publisher maps: the Chapter Approved mission pack layouts and the Combat Patrol rules' deployment maps | [Download terms](source-inventory.md#download-terms) exclude copying and redistribution. Whether coordinates measured from a printed map can be published is [unresolved](source-inventory.md#battlemaster-geometry). | Not used. The `measured` basis and its required `reuse` statement are ready for when it is decided. |
| Praetorium's correction files (labels, groups, positions, Combat Patrol zones) | Measured by Praetorium from the publisher maps and Battlemaster ([patches README][p-patches]) | Not used, for the same reasons |
| Game Datacards layout and deployment records | Identity and names only, with no geometry | Owned by [#8](https://github.com/richardsolomou/40k-catalogue/issues/8). The IDs stay in Praetorium's mapping. |
| Independently authored and synthetic shapes | Original project material | Used for every fixture |

### Chapter Approved and Combat Patrol comparison

The comparison is technically feasible. The equivalence check shows the contract reproduces Praetorium's current Chapter Approved and Combat Patrol geometry exactly. Building one layout of each in this repository and verifying it against the pinned reference is not supported yet. The pinned reference is Battlemaster, which has no redistribution permission. The only independent route is measuring the publisher's maps, and that has no reuse basis yet.

To finish:

1. Get either written permission from the Battlemaster owner to redistribute the two packs' geometry, or a decision that measured map coordinates may be published as facts under a `measured` provenance.
2. Author one Chapter Approved layout with its deployment map, and Combat Patrol Layout A with its deployment map, from that basis. Join them to #8's pack IDs.
3. Compare their placed output with Praetorium's `battlemasterGeometry` for the same layouts. Use a tolerance stated in the record's `reuse` note, because a measured layout will not match Battlemaster to 0.001″. Compare the SVG plans side by side with Praetorium's battlefield view.
4. Add Praetorium's mapping from `area-N` and `group-center` to the new IDs, and prove it resolves every key in stored battles.

Until then, all 45 Chapter Approved layouts, all 3 Combat Patrol layouts, and the 6 Chapter Approved deployment overlays depend on Battlemaster. The 3 Combat Patrol deployment overlays depend on Praetorium's own measurements of the publisher maps.

[p-root]: https://github.com/richardsolomou/praetorium.gg/tree/a9b4a5b3d37484f696b275d0b0e10b89ca07c325
[p-rules]: https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/src/server/rulesTerrain.ts
[p-datacard]: https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/src/server/datacardTerrain.ts
[p-cp]: https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/src/server/combatPatrolTerrain.ts
[p-kotc]: https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/src/server/kotcTerrain.ts
[p-contract]: https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/src/contracts/terrain.ts
[p-patches]: https://github.com/richardsolomou/praetorium.gg/blob/a9b4a5b3d37484f696b275d0b0e10b89ca07c325/catalogue/patches/README.md
