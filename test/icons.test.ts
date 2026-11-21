import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { type IconEntry, verifyIcon } from "../src/icons/verify.ts";

const dir = new URL("../fixtures/icons/", import.meta.url);
const [sample] = JSON.parse(readFileSync(new URL("manifest.json", dir), "utf8")) as IconEntry[];
const sampleSvg = readFileSync(new URL(sample!.file, dir));

function withSvg(svg: string, overrides: Partial<IconEntry> = {}) {
  const bytes = Buffer.from(svg);
  const entry = { ...sample!, sha256: createHash("sha256").update(bytes).digest("hex"), ...overrides };
  return verifyIcon(entry, bytes);
}

test("the generic sample icon is cleared for reuse", () => {
  assert.deepEqual(verifyIcon(sample!, sampleSvg), []);
});

test("an icon whose bytes differ from its pinned hash is rejected", () => {
  assert.deepEqual(verifyIcon({ ...sample!, sha256: "0".repeat(64) }, sampleSvg), ["sha256 does not match the pinned hash"]);
});

test("an icon under a non-commercial licence is rejected", () => {
  assert.deepEqual(withSvg(sampleSvg.toString(), { licence: "CC-BY-NC-SA-4.0" }), ["licence CC-BY-NC-SA-4.0 does not permit redistribution in releases"]);
});

test("an icon with a script is rejected", () => {
  assert.deepEqual(withSvg('<svg viewBox="0 0 24 24"><script>alert(1)</script></svg>'), ["contains active content"]);
});

test("an icon that loads an external resource is rejected", () => {
  assert.deepEqual(withSvg('<svg viewBox="0 0 24 24"><image href="https://example.com/a.png"/></svg>'), ["references a resource outside the file"]);
});

test("the original mark set has one verified asset per manifest entry", () => {
  const pack = new URL("../data/icons/", import.meta.url);
  const entries = JSON.parse(readFileSync(new URL("manifest.json", pack), "utf8")) as IconEntry[];
  assert.equal(new Set(entries.map(({ id }) => id)).size, entries.length);
  assert.deepEqual(entries.map(({ file }) => file).toSorted(), readdirSync(pack).filter((file) => file.endsWith(".svg")).sort());
  for (const entry of entries) assert.deepEqual(verifyIcon(entry, readFileSync(new URL(entry.file, pack))), [], entry.id);
});
