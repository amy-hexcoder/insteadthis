import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";
import type { Root, Element, ElementContent } from "hast";

const YT = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([\w-]{11})/;

function textOf(node: ElementContent): string {
  if (node.type === "text") return node.value;
  if (node.type === "element") return node.children.map(textOf).join("");
  return "";
}

/** Turns bare YouTube links into embedded players, lazy-loads images, and opens outside links in a new tab. */
function rehypeInsteadThis() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element, index, parent) => {
      if (node.tagName === "p" && parent && typeof index === "number") {
        const kids = node.children.filter((c) => !(c.type === "text" && !c.value.trim()));
        if (kids.length === 1) {
          const only = kids[0];
          const href =
            only.type === "element" && only.tagName === "a" ? String(only.properties?.href ?? "") : only.type === "text" ? only.value.trim() : "";
          const m = href.match(YT);
          if (m) {
            parent.children[index] = {
              type: "element",
              tagName: "div",
              properties: { className: ["embed"] },
              children: [
                {
                  type: "element",
                  tagName: "iframe",
                  properties: {
                    src: `https://www.youtube-nocookie.com/embed/${m[1]}`,
                    title: "YouTube video",
                    loading: "lazy",
                    allow: "accelerometer; encrypted-media; gyroscope; picture-in-picture",
                    allowFullScreen: true,
                  },
                  children: [],
                },
              ],
            };
            return;
          }
        }
        // a paragraph that only holds an image becomes a figure
        if (kids.length === 1 && kids[0].type === "element" && kids[0].tagName === "img") {
          node.tagName = "figure";
        }
      }
      if (node.tagName === "img") {
        node.properties = { ...node.properties, loading: "lazy", decoding: "async" };
        if (node.properties.alt === undefined) node.properties.alt = "";
      }
      if (node.tagName === "a") {
        const href = String(node.properties?.href ?? "");
        if (/^https?:\/\//.test(href) && !href.includes("insteadthis.com")) {
          node.properties = { ...node.properties, target: "_blank", rel: ["noopener", "noreferrer"] };
        }
      }
      // headings from the old site were often ALL CAPS; the CSS tones them down
      if (/^h[2-4]$/.test(node.tagName)) {
        const t = node.children.map(textOf).join("");
        if (t.length > 6 && t === t.toUpperCase() && /[A-Z]/.test(t)) {
          node.properties = { ...node.properties, className: ["shouty"] };
        }
      }
    });
  };
}

export async function renderMarkdown(md: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSlug)
    .use(rehypeInsteadThis)
    .use(rehypeStringify)
    .process(md);
  return String(file);
}

/** h2 headings for the "In this story" list */
export function getHeadings(md: string) {
  const out: { id: string; text: string }[] = [];
  const seen = new Map<string, number>();
  for (const line of md.split("\n")) {
    const m = line.match(/^##\s+(.+?)\s*#*\s*$/);
    if (!m) continue;
    const text = m[1].replace(/[*_`]/g, "").replace(/\[(.*?)\]\(.*?\)/g, "$1").trim();
    if (!text) continue;
    let id = text.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, "").trim().replace(/\s/g, "-");
    const n = seen.get(id) ?? 0;
    seen.set(id, n + 1);
    if (n) id = `${id}-${n}`;
    out.push({ id, text: text === text.toUpperCase() ? text.charAt(0) + text.slice(1).toLowerCase() : text });
  }
  return out;
}
