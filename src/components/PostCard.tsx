import Link from "next/link";
import type { PostMeta } from "@/lib/posts";
import { topicStyle } from "@/lib/topics";
import { Cover } from "./Cover";

export function TopicChip({ post, link = false }: { post: Pick<PostMeta, "topic">; link?: boolean }) {
  const t = post.topic;
  return link ? (
    <Link href={`/topics/${t.slug}`} className="chip" style={topicStyle(t)}>
      {t.name}
    </Link>
  ) : (
    <span className="chip" style={topicStyle(t)}>
      {t.name}
    </span>
  );
}

export function PostCard({ post, showDescription = true }: { post: PostMeta; showDescription?: boolean }) {
  return (
    <article className="card">
      <Link href={`/stories/${post.slug}`} className="card__link">
        <Cover src={post.image} alt="" topic={post.topic} sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 400px" className="card__cover" />
        <TopicChip post={post} />
        <h3 className="card__title">{post.title}</h3>
        {showDescription && post.description ? <p className="card__desc">{post.description}</p> : null}
        <span className="meta">{post.readingTime} min read</span>
      </Link>
    </article>
  );
}

export function CompactCard({ post }: { post: PostMeta }) {
  return (
    <Link href={`/stories/${post.slug}`} className="compact">
      <Cover src={post.image} alt="" topic={post.topic} sizes="112px" className="compact__cover" />
      <span className="compact__text">
        <span className="compact__topic" style={{ color: post.topic.ink }}>{post.topic.name}</span>
        <span className="compact__title">{post.title}</span>
      </span>
    </Link>
  );
}

export function PostGrid({ posts }: { posts: PostMeta[] }) {
  return (
    <div className="grid">
      {posts.map((p) => (
        <PostCard key={p.slug} post={p} />
      ))}
    </div>
  );
}
