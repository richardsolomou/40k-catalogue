import type { Ref } from "../catalogue-identity/identity.ts";

/**
 * A rule summary's text is Markdown restricted to paragraphs, unordered and ordered lists, bold and links to
 * catalogue entries, so that any CommonMark renderer shows it the same way (docs/rule-summaries.md#summary-text).
 */
export type Text = { text: string };
export type Link = { link: string; target: Ref };
export type Strong = { strong: (Text | Link)[] };
export type Inline = Text | Link | Strong;
export type Line = Inline[];
export type Block = { paragraph: Line[] } | { list: "unordered" | "ordered"; items: Line[] };
export type ParsedSummary = { ok: true; blocks: Block[] } | { ok: false; error: string };

const SLUG = "[a-z0-9]+(?:-[a-z0-9]+)*";
const ID = "[a-z0-9]+(?:[.-][a-z0-9]+)*";
const DESTINATION = new RegExp(`^\\(vsdata:(${SLUG})/(${ID})\\)`);
// Characters CommonMark or its common extensions would read as markup this grammar does not have: code, HTML,
// escapes, underscore emphasis, strikethrough, tables, images, entities and bare URLs.
const FORBIDDEN = /[`<\\_~|]|!\[|&(?:#[0-9]+|#x[0-9a-f]+|[a-z][a-z0-9]*);|https?:\/\/|www\./i;
const LIST_MARKER = /^(?:[-+*]|[0-9]{1,9}[.)])(?:\s|$)/;
// A line that would open another block: a heading, a quote, a thematic break or setext underline, or a reference
// definition (a bracketed label, a colon, one destination and at most a quoted title).
const OTHER_BLOCK = /^(?:#{1,6}(?:\s|$)|>|[-=]+$|\[[^\]]*\]:\s*(?:\S+\s*(?:["'(].*)?)?$)/;
const space = (c: string | undefined) => c === undefined || /\s/.test(c);
const punctuation = (c: string | undefined) => c !== undefined && /[\p{P}\p{S}]/u.test(c);

function link(line: string, at: number): { end: number; value: Link } | string | undefined {
  let depth = 0;
  for (let j = at; j < line.length; j++) {
    if (line[j] === "[") depth++;
    else if (line[j] === "]" && --depth === 0) {
      if (line[j + 1] !== "(") return undefined;
      const destination = DESTINATION.exec(line.slice(j + 1));
      if (!destination) return "has a link that does not point to vsdata:<kind>/<id>";
      const text = line.slice(at + 1, j);
      if (!text || text !== text.trim() || text.includes("*") || text.includes("](")) return "has a link whose text is empty, padded or marked up";
      return { end: j + 1 + destination[0].length, value: { link: text, target: { kind: destination[1]!, id: destination[2]! } } };
    }
  }
  return undefined;
}

function inline(line: string): Line | string {
  if (FORBIDDEN.test(line)) return `uses markup outside the summary grammar (${FORBIDDEN.exec(line)![0]})`;
  const out: Line = [];
  let strong: (Text | Link)[] | undefined;
  let text = "";
  const flush = () => {
    if (text) (strong ?? out).push({ text });
    text = "";
  };
  for (let i = 0; i < line.length; ) {
    if (line.startsWith("**", i)) {
      if (line[i + 2] === "*") return "has a run of three or more asterisks";
      const [before, after] = [line[i - 1], line[i + 2]];
      flush();
      if (!strong) {
        // CommonMark opens bold only on a left-flanking delimiter run.
        if (space(after) || (punctuation(after) && !space(before) && !punctuation(before))) return "opens bold where CommonMark would not";
        strong = [];
      } else {
        if (space(before) || (punctuation(before) && !space(after) && !punctuation(after))) return "closes bold where CommonMark would not";
        if (!strong.length) return "has empty bold";
        out.push({ strong });
        strong = undefined;
      }
      i += 2;
      continue;
    }
    if (line[i] === "*") return "has a single asterisk";
    if (line[i] === "[") {
      const found = link(line, i);
      if (typeof found === "string") return found;
      if (found) {
        flush();
        (strong ?? out).push(found.value);
        i = found.end;
        continue;
      }
    }
    if (line[i] === "]" && line[i + 1] === "(") return "has a link that does not point to vsdata:<kind>/<id>";
    text += line[i++];
  }
  if (strong) return "leaves bold open";
  flush();
  return out;
}

/** Parses a summary with the strict grammar, or names the first thing it does not allow. */
export function parseSummary(summary: string): ParsedSummary {
  const fail = (error: string): ParsedSummary => ({ ok: false, error });
  if (!summary.trim()) return fail("is empty");
  if (summary !== summary.trim()) return fail("starts or ends with whitespace");
  if (/[\r\t]/.test(summary)) return fail("has a tab or carriage return");
  if (summary.includes("\n\n\n")) return fail("has more than one blank line between blocks");
  const blocks: Block[] = [];
  for (const [b, block] of summary.split("\n\n").entries()) {
    const lines = block.split("\n");
    const at = `block ${b + 1}`;
    if (lines.some((l) => l !== l.trim())) return fail(`${at} has a line with leading or trailing whitespace`);
    const ordered = lines.every((l, i) => l.startsWith(`${i + 1}. `));
    const kind = lines.every((l) => l.startsWith("- ")) ? "unordered" : ordered ? "ordered" : undefined;
    if (kind) {
      const previous = blocks.at(-1);
      // CommonMark joins two lists of one type that only a blank line separates into a single list.
      if (previous && "list" in previous && previous.list === kind) return fail(`${at} is a list of the same type as the list before it`);
      const items: Line[] = [];
      for (const l of lines) {
        const content = l.slice(l.indexOf(" ") + 1);
        if (!content.trim() || content !== content.trimStart() || LIST_MARKER.test(content) || OTHER_BLOCK.test(content)) return fail(`${at} has an empty or nested list item`);
        const parsed = inline(content);
        if (typeof parsed === "string") return fail(`${at} ${parsed}`);
        items.push(parsed);
      }
      blocks.push({ list: kind, items });
      continue;
    }
    if (lines.some((l) => LIST_MARKER.test(l))) return fail(`${at} mixes list items with other lines, or numbers a list out of order`);
    if (lines.some((l) => OTHER_BLOCK.test(l))) return fail(`${at} has a line that would start a heading, quote, rule or definition`);
    const paragraph: Line[] = [];
    for (const l of lines) {
      const parsed = inline(l);
      if (typeof parsed === "string") return fail(`${at} ${parsed}`);
      paragraph.push(parsed);
    }
    blocks.push({ paragraph });
  }
  return { ok: true, blocks };
}

const lineText = (line: Line): string =>
  line.map((x) => ("text" in x ? x.text : "link" in x ? x.link : x.strong.map((y) => ("text" in y ? y.text : y.link)).join(""))).join("");

/**
 * The summary as plain text: bold and link markup removed, paragraphs separated by a blank line, a paragraph's
 * lines and a list's items by a line break, each item keeping its "- " or "1. " marker. Throws on an invalid summary.
 */
export function plain(summary: string): string {
  const parsed = parseSummary(summary);
  if (!parsed.ok) throw new Error(`summary ${parsed.error}`);
  return parsed.blocks
    .map((block) =>
      "paragraph" in block
        ? block.paragraph.map(lineText).join("\n")
        : block.items.map((item, i) => `${block.list === "ordered" ? `${i + 1}.` : "-"} ${lineText(item)}`).join("\n"),
    )
    .join("\n\n");
}

/** The catalogue entries a parsed summary links to, in reading order. */
export function links(blocks: Block[]): Ref[] {
  const lines = blocks.flatMap((block) => ("paragraph" in block ? block.paragraph : block.items));
  return lines.flatMap((line) => line.flatMap((x) => ("link" in x ? [x.target] : "strong" in x ? x.strong.flatMap((y) => ("link" in y ? [y.target] : [])) : [])));
}
