# Terrain geometry

Terrain records describe the battlefield: where each terrain footprint sits, its outline, walls, and roofs, which objective it hosts, and the deployment zones and territories drawn over the board. The contract is the JSON Schema in [src/terrain/terrain.v1.schema.json](../src/terrain/terrain.v1.schema.json). [src/terrain/](../src/terrain) holds a reference implementation that verifies records, places them in board coordinates, and draws them for visual checks.

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

[Mission packs](mission-packs.md) own battlefield references: `layouts[].id`, `deployments[].id`, and which deployments each layout permits. A terrain layout's `id` equals the pack's layout ID, and a deployment map's `id` equals the pack's deployment ID. Geometry records do not repeat the permitted deployments. `joinBattlefields(pack, records)` takes any object with that shape and reports:

- **Gaps**, for a pack layout or deployment with no geometry. A pack can be released before its terrain.
- **Errors**, for a layout drawn on a different board from a deployment it permits.

The join expects layout and deployment IDs to be unique across a release.

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
