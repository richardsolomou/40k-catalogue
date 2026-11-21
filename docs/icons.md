# Faction marks

Use the original SVG marks to give factions distinct shapes in an app. The [mark directory](../data/icons) contains the files and the [manifest](../data/icons/manifest.json) maps stable mark IDs to filenames, checksums and attribution.

## Use a mark

1. Pick a mark from the [release archive](https://github.com/richardsolomou/40k-catalogue/releases) or a pinned checkout.
2. Check its file against the `sha256` in the manifest.
3. Render the SVG directly or apply it as a CSS mask. A mask lets the app set the faction colour separately from the shape.

Store your faction-to-mark mapping with your app. The record IDs identify shapes and stay stable across catalogue updates.

## Validate the set

```sh
node --test test/icons.test.ts
```

The tests cover manifest checksums and restrictions on SVG content and licensing. The original marks are available under the [MIT License](../LICENSE).
