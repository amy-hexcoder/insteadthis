import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { cache } from "react";
import { getTopic, type Topic, type TopicSlug } from "./topics";

const POSTS_DIR = path.join(process.cwd(), "content", "posts");

export type PostMeta = {
  slug: string;
  title: string;
  date: string;
  updated: string;
  author: string;
  topic: Topic;
  tags: string[];
  featured: boolean;
  description: string;
  image: string | null;
  imageAlt: string;
  readingTime: number;
};

export type Post = PostMeta & { body: string };

function parse(file: string): Post {
  const raw = fs.readFileSync(path.join(POSTS_DIR, file), "utf8");
  const { data, content } = matter(raw);
  const topic = getTopic(data.topic) ?? getTopic("culture")!;
  return {
    slug: data.slug ?? file.replace(/\.md$/, ""),
    title: data.title,
    date: data.date,
    updated: data.updated ?? data.date,
    author: data.author ?? "InsteadThis",
    topic,
    tags: data.tags ?? [],
    featured: Boolean(data.featured),
    description: data.description ?? "",
    image: data.image ?? null,
    imageAlt: data.imageAlt ?? data.title,
    readingTime: data.readingTime ?? 3,
    body: content,
  };
}

/** Every post, newest first. Cached per request/build. */
export const getAllPosts = cache((): Post[] => {
  return fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".md"))
    .map(parse)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
});

export function toMeta({ body: _body, ...meta }: Post): PostMeta {
  return meta;
}

export function getPost(slug: string): Post | undefined {
  return getAllPosts().find((p) => p.slug === slug);
}

export function getPostsByTopic(topic: TopicSlug): Post[] {
  return getAllPosts().filter((p) => p.topic.slug === topic);
}

export function getRelated(post: Post, count = 3): Post[] {
  const same = getPostsByTopic(post.topic.slug).filter((p) => p.slug !== post.slug);
  const tagSet = new Set(post.tags.map((t) => t.toLowerCase()));
  const scored = same
    .map((p) => ({ p, s: p.tags.filter((t) => tagSet.has(t.toLowerCase())).length + (p.image ? 0.5 : 0) }))
    .sort((a, b) => b.s - a.s);
  return scored.slice(0, count).map((x) => x.p);
}

export function paginate<T>(items: T[], page: number, perPage: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  return { items: items.slice((page - 1) * perPage, page * perPage), totalPages };
}

export function formatDate(iso: string) {
  return new Date(iso + (iso.endsWith("Z") ? "" : "Z")).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
