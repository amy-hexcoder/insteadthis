import Link from "next/link";
import { getAllPosts, getPostsByTopic, toMeta } from "@/lib/posts";
import { TOPICS, topicStyle } from "@/lib/topics";
import { Cover } from "@/components/Cover";
import { CompactCard, PostGrid, TopicChip } from "@/components/PostCard";
import { TopicIcon } from "@/components/Icons";
import { Newsletter } from "@/components/Newsletter";

export default function Home() {
  const all = getAllPosts();
  const generic = /^\s*(akira\s*-\s*)?product reviews?\s*$/i;
  const pool = all.filter((p) => !generic.test(p.title));
  const withImages = pool.filter((p) => p.image);
  const hero = withImages.find((p) => p.featured) ?? withImages[0] ?? pool[0];
  const rest = pool.filter((p) => p.slug !== hero.slug);
  const more = rest.filter((p) => p.image).slice(0, 3);
  const used = new Set([hero.slug, ...more.map((p) => p.slug)]);
  const latest = rest.filter((p) => !used.has(p.slug)).slice(0, 6);
  latest.forEach((p) => used.add(p.slug));
  const counts = Object.fromEntries(TOPICS.map((t) => [t.slug, getPostsByTopic(t.slug).length]));
  const spotlight = TOPICS.slice(0, 3).map((t) => ({
    topic: t,
    posts: getPostsByTopic(t.slug).filter((p) => !used.has(p.slug) && !generic.test(p.title)).slice(0, 3).map(toMeta),
  }));

  return (
    <>
      <section className="hero wrap">
        <Cover src={hero.image} alt={hero.imageAlt} topic={hero.topic} sizes="(max-width: 1000px) 100vw, 780px" priority className="hero__cover" />
        <div className="hero__text">
          <TopicChip post={hero} link />
          <h1 className="hero__title">{hero.title}</h1>
          {hero.description ? <p className="dek">{hero.description}</p> : null}
          <p className="byline">
            <span className="avatar" aria-hidden="true">{initials(hero.author)}</span>
            <span className="byline__name">{hero.author}</span>
            <span>{hero.readingTime} min read</span>
          </p>
          <Link href={`/stories/${hero.slug}`} className="button button--primary">Read the story</Link>
        </div>
      </section>

      <section className="wrap more" aria-label="More new stories">
        {more.map((p) => (
          <CompactCard key={p.slug} post={toMeta(p)} />
        ))}
      </section>

      <section className="band band--white" aria-labelledby="topics-h">
        <div className="wrap">
          <h2 id="topics-h" className="section-title">Find your corner</h2>
          <div className="topic-tiles">
            {TOPICS.map((t) => (
              <Link key={t.slug} href={`/topics/${t.slug}`} className="topic-tile" style={topicStyle(t)}>
                <TopicIcon slug={t.slug} />
                <span className="topic-tile__text">
                  <span className="topic-tile__name">{t.name}</span>
                  <span>{t.blurb}</span>
                  <span className="topic-tile__count">{counts[t.slug]} stories</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="wrap section" aria-labelledby="latest-h">
        <div className="section-head">
          <h2 id="latest-h" className="section-title">Latest stories</h2>
          <Link href="/stories" className="section-link">See all {all.length} stories</Link>
        </div>
        <PostGrid posts={latest.map(toMeta)} />
      </section>

      {spotlight.map(({ topic, posts }) => (
        <section key={topic.slug} className="wrap section section--tight" aria-labelledby={`h-${topic.slug}`}>
          <div className="section-head">
            <h2 id={`h-${topic.slug}`} className="section-title">{topic.name}</h2>
            <Link href={`/topics/${topic.slug}`} className="section-link" style={{ color: topic.ink }}>More in {topic.name}</Link>
          </div>
          <PostGrid posts={posts} />
        </section>
      ))}

      <div className="wrap">
        <Newsletter />
      </div>
    </>
  );
}

function initials(name: string) {
  return name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}
