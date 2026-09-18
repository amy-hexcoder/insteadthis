import { notFound } from "next/navigation";
import { getAllPosts, paginate, toMeta } from "@/lib/posts";
import { SITE } from "@/lib/site";
import { PostGrid } from "@/components/PostCard";
import { Pagination } from "@/components/Pagination";

export function storyPageCount() {
  return Math.ceil(getAllPosts().length / SITE.postsPerPage);
}

export function StoriesListing({ page }: { page: number }) {
  const all = getAllPosts();
  const { items, totalPages } = paginate(all, page, SITE.postsPerPage);
  if (!items.length) notFound();
  return (
    <div className="wrap section">
      <header className="listing-head">
        <h1 className="listing-title">All stories</h1>
        <p className="dek">{all.length} stories on relationships, style, wellness, food, travel, and more.</p>
      </header>
      <PostGrid posts={items.map(toMeta)} />
      <Pagination page={page} totalPages={totalPages} base="/stories" />
    </div>
  );
}
