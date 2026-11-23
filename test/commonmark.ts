import MarkdownIt from "markdown-it";
import type { Block, Inline, Line, Link, Text } from "../src/rule-summaries/markdown.ts";

const md = new MarkdownIt("commonmark");
type Token = ReturnType<typeof md.parse>[number];

function lines(children: Token[]): Line[] {
  const out: Line[] = [[]];
  let strong: (Text | Link)[] | undefined;
  let link: Link | undefined;
  const push = (x: Inline) => {
    const line = out.at(-1)!;
    const into: Inline[] = strong ?? line;
    const last = into.at(-1);
    if ("text" in x && last && "text" in last) last.text += x.text;
    else into.push(x as Text);
  };
  for (const t of children) {
    if (t.type === "softbreak") out.push([]);
    else if (t.type === "strong_open") strong = [];
    else if (t.type === "strong_close") (out.at(-1)!.push({ strong: strong! }), (strong = undefined));
    else if (t.type === "link_open") {
      const [, kind, id] = /^vsdata:([^/]+)\/(.+)$/.exec(String(t.attrGet("href"))) ?? [];
      link = { link: "", target: { kind: kind!, id: id! } };
    } else if (t.type === "link_close") (push(link!), (link = undefined));
    else if (t.type === "text" && link) link.link += t.content;
    else if (t.type === "text") t.content && push({ text: t.content });
    else throw new Error(`CommonMark reads a ${t.type}`);
  }
  return out;
}

/** How a CommonMark renderer reads a summary, in the shape of the strict parser's result. */
export function commonmark(summary: string): Block[] {
  const tokens = md.parse(summary, {});
  const blocks: Block[] = [];
  let lists = 0;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]!;
    if (t.type === "bullet_list_close" || t.type === "ordered_list_close") lists--;
    if (t.type === "paragraph_open" && !lists) blocks.push({ paragraph: lines(tokens[i + 1]!.children!) });
    else if (t.type === "bullet_list_open" || t.type === "ordered_list_open") {
      if (t.type === "ordered_list_open" && (t.attrGet("start") ?? "1") !== "1") throw new Error("CommonMark reads a list that does not start at 1");
      if (lists++) throw new Error("CommonMark reads a nested list");
      blocks.push({ list: t.type === "bullet_list_open" ? "unordered" : "ordered", items: [] });
    } else if (t.type === "inline" && lists) {
      const block = blocks.at(-1)!;
      if (!("items" in block)) throw new Error("CommonMark reads nested blocks");
      const item = lines(t.children!);
      if (item.length !== 1) throw new Error("CommonMark reads a list item over several lines");
      block.items.push(item[0]!);
    } else if (!/^(paragraph_(open|close)|inline|(bullet|ordered)_list_close|list_item_(open|close))$/.test(t.type)) throw new Error(`CommonMark reads a ${t.type}`);
  }
  return blocks;
}
