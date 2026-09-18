import type { Metadata } from "next";
import { getAllPosts } from "@/lib/posts";
import { SearchClient, type SearchItem } from "@/components/SearchClient";

export const metadata: Metadata = { title: "Search", robots: { index: false } };

export default function SearchPage() {
  const items: SearchItem[] = getAllPosts().map((p) => ({
    slug: p.slug,
    title: p.title,
    description: p.description,
    topic: p.topic.name,
    ink: p.topic.ink,
    tags: p.tags.join(" "),
  }));
  return (
    <div className="wrap section">
      <h1 className="listing-title">Search</h1>
      <SearchClient items={items} />
    </div>
  );
}
