import { notFound } from "next/navigation";
import { getPostsByTopic, paginate, toMeta } from "@/lib/posts";
import { getTopic, TOPICS, topicStyle } from "@/lib/topics";
import { SITE } from "@/lib/site";
import { PostGrid } from "@/components/PostCard";
import { Pagination } from "@/components/Pagination";
import { TopicIcon } from "@/components/Icons";

export function topicPageParams() {
  return TOPICS.flatMap((t) => {
    const pages = Math.ceil(getPostsByTopic(t.slug).length / SITE.postsPerPage);
    return Array.from({ length: Math.max(0, pages - 1) }, (_, i) => ({ topic: t.slug, n: String(i + 2) }));
  });
}

export function TopicListing({ slug, page }: { slug: string; page: number }) {
  const topic = getTopic(slug);
  if (!topic) notFound();
  const posts = getPostsByTopic(topic.slug);
  const { items, totalPages } = paginate(posts, page, SITE.postsPerPage);
  if (!items.length) notFound();
  return (
    <>
      <header className="topic-head" style={topicStyle(topic)}>
        <div className="wrap topic-head__inner">
          <TopicIcon slug={topic.slug} size={44} />
          <h1 className="listing-title">{topic.name}</h1>
          <p className="topic-head__blurb">{topic.blurb}. {posts.length} stories.</p>
        </div>
      </header>
      <div className="wrap section">
        <PostGrid posts={items.map(toMeta)} />
        <Pagination page={page} totalPages={totalPages} base={`/topics/${topic.slug}`} />
      </div>
    </>
  );
}
