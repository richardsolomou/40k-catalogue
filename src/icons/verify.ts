import { createHash } from "node:crypto";

export type IconEntry = { id: string; file: string; sha256: string; licence: string; attribution: string; provenance: string };

// Licences that allow commercial redistribution inside a downloaded offline bundle without binding the rest of the release.
const REUSABLE_LICENCES = new Set(["CC0-1.0", "CC-BY-4.0", "MIT"]);
// Praetorium's materializer rejects icons above this size.
const MAX_BYTES = 256 * 1024;

export function verifyIcon(entry: IconEntry, svg: Buffer): string[] {
  const errors: string[] = [];
  const text = svg.toString("utf8");
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(entry.id)) errors.push("id must be lowercase kebab-case");
  if (!/^[a-z0-9-]+\.svg$/.test(entry.file)) errors.push("file must be a plain .svg name in the manifest directory");
  if (!REUSABLE_LICENCES.has(entry.licence)) errors.push(`licence ${entry.licence} does not permit redistribution in releases`);
  if (!entry.attribution.trim() || !entry.provenance.trim()) errors.push("attribution and provenance are required");
  if (createHash("sha256").update(svg).digest("hex") !== entry.sha256) errors.push("sha256 does not match the pinned hash");
  if (svg.length > MAX_BYTES) errors.push(`larger than ${MAX_BYTES} bytes`);
  if (!/^\s*<svg[\s>][^>]*\bviewBox=/.test(text)) errors.push("must start with an <svg> element that has a viewBox");
  if (/<script[\s>]|<foreignObject[\s>]|\son[a-z]+\s*=|javascript:/i.test(text)) errors.push("contains active content");
  // A CSS mask or data: URI cannot fetch anything offline, so every reference must stay inside the file; xmlns is a name, not a fetch.
  if (/\b(?:href|src)\s*=\s*["'](?!#)|url\(\s*["']?(?!#)|@import/i.test(text)) errors.push("references a resource outside the file");
  return errors;
}
