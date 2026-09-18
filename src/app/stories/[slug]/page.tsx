import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate, getAllPosts, getPost, getRelated, toMeta } from "@/lib/posts";
import { getHeadings, renderMarkdown } from "@/lib/markdown";
import { SITE } from "@/lib/site";
import { Cover } from "@/components/Cover";
import { PostGrid, TopicChip } from "@/components/PostCard";
import { ShareButtons } from "@/components/ShareButtons";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = getPost((await params).slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/stories/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      publishedTime: post.date,
      modifiedTime: post.updated,
      authors: [post.author],
      images: post.image ? [{ url: post.image, alt: post.imageAlt }] : undefined,
    },
  };
}

export default async function StoryPage({ params }: Props) {
  const post = getPost((await params).slug);
  if (!post) notFound();
  const html = await renderMarkdown(post.body);
  const headings = getHeadings(post.body);
  const related = getRelated(post).map(toMeta);
  const url = `${SITE.url}/stories/${post.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.updated,
    author: { "@type": "Person", name: post.author },
    image: post.image ? `${SITE.url}${post.image}` : undefined,
    mainEntityOfPage: url,
  };

  return (
    <>
      <article className="story">
        <header className="story__head wrap">
          <TopicChip post={post} link />
          <h1 className="story__title">{post.title}</h1>
          {post.description ? <p className="dek story__dek">{post.description}</p> : null}
          <p className="byline">
            <span className="avatar" aria-hidden="true">{post.author.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase()}</span>
            <span className="byline__stack">
              <span className="byline__name">{post.author}</span>
              <span>
                <time dateTime={post.date}>{formatDate(post.date)}</time>, {post.readingTime} min read
              </span>
            </span>
          </p>
        </header>

        {post.image ? (
          <div className="wrap">
            <Cover src={post.image} alt={post.imageAlt} topic={post.topic} sizes="(max-width: 1440px) 100vw, 1280px" priority className="story__cover" />
          </div>
        ) : null}

        <div className="story__layout wrap">
          <aside className="story__side">
            <ShareButtons url={url} title={post.title} />
          </aside>
          <div className="prose" style={{ "--tint": post.topic.tint, "--t-ink": post.topic.ink } as React.CSSProperties} dangerouslySetInnerHTML={{ __html: html }} />
          <aside className="story__side story__side--right">
            {headings.length > 1 ? (
              <nav aria-label="In this story" className="toc">
                <span className="toc__label">In this story</span>
                {headings.slice(0, 12).map((h) => (
                  <a key={h.id} href={`#${h.id}`}>{h.text}</a>
                ))}
              </nav>
            ) : null}
          </aside>
        </div>

        {post.tags.length ? (
          <div className="wrap story__tags" aria-label="Tags">
            {post.tags.slice(0, 8).map((t) => (
              <span key={t} className="tag">#{t.replace(/^#/, "")}</span>
            ))}
          </div>
        ) : null}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </article>

      {related.length ? (
        <section className="band band--white" aria-labelledby="more-h">
          <div className="wrap">
            <div className="section-head">
              <h2 id="more-h" className="section-title">Keep reading</h2>
              <Link href={`/topics/${post.topic.slug}`} className="section-link" style={{ color: post.topic.ink }}>More in {post.topic.name}</Link>
            </div>
            <PostGrid posts={related} />
          </div>
        </section>
      ) : null}
    </>
  );
}
