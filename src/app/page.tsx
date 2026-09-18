import Link from "next/link";
import { getAllPosts, getPostsByTopic, toMeta } from "@/lib/posts";
import { buildHomepage } from "@/lib/rotation";
import { TOPICS, topicStyle } from "@/lib/topics";
import { Cover } from "@/components/Cover";
import { CompactCard, PostGrid, TopicChip } from "@/components/PostCard";
import { TopicIcon } from "@/components/Icons";
import { Newsletter } from "@/components/Newsletter";

// Rebuild the homepage in the background at most once an hour.
// The picks themselves change once a day (see src/lib/rotation.ts).
export const revalidate = 3600;

export default function Home() {
  const all = getAllPosts();
  const home = buildHomepage(all);
  const { hero } = home;
  const counts = Object.fromEntries(TOPICS.map((t) => [t.slug, getPostsByTopic(t.slug).length]));

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

      <section className="wrap more" aria-label="More stories">
        {home.strip.map((p) => (
          <CompactCard key={p.slug} post={toMeta(p)} />
        ))}
      </section>

      {home.recent.length ? (
        <section className="wrap section section--flush" aria-labelledby="new-h">
          <div className="section-head">
            <h2 id="new-h" className="section-title">New on InsteadThis</h2>
            <Link href="/stories" className="section-link">See all {all.length} stories</Link>
          </div>
          <PostGrid posts={home.recent.map(toMeta)} />
        </section>
      ) : null}

      {home.season ? (
        <section className="season" aria-labelledby="season-h">
          <div className="wrap">
            <div className="section-head">
              <h2 id="season-h" className="section-title">{home.season.label}</h2>
            </div>
            <PostGrid posts={home.season.posts.map(toMeta)} />
          </div>
        </section>
      ) : null}

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

      <section className="wrap section" aria-labelledby="picks-h">
        <div className="section-head">
          <h2 id="picks-h" className="section-title">Picked for today</h2>
          <Link href="/stories" className="section-link">See all {all.length} stories</Link>
        </div>
        <PostGrid posts={home.picks.map(toMeta)} />
      </section>

      {home.spotlights.map(({ topic, posts }) =>
        posts.length ? (
          <section key={topic.slug} className="wrap section section--tight" aria-labelledby={`h-${topic.slug}`}>
            <div className="section-head">
              <h2 id={`h-${topic.slug}`} className="section-title">{topic.name}</h2>
              <Link href={`/topics/${topic.slug}`} className="section-link" style={{ color: topic.ink }}>More in {topic.name}</Link>
            </div>
            <PostGrid posts={posts.map(toMeta)} />
          </section>
        ) : null,
      )}

      <div className="wrap">
        <Newsletter />
      </div>
    </>
  );
}

function initials(name: string) {
  return name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}
