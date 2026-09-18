"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type SearchItem = { slug: string; title: string; description: string; topic: string; ink: string; tags: string };

export function SearchClient({ items }: { items: SearchItem[] }) {
  const [q, setQ] = useState("");
  const results = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    return items
      .map((it) => {
        const title = it.title.toLowerCase();
        const rest = `${it.description} ${it.tags} ${it.topic}`.toLowerCase();
        let score = 0;
        for (const w of words) {
          if (title.includes(w)) score += 3;
          else if (rest.includes(w)) score += 1;
          else return null;
        }
        return { it, score };
      })
      .filter((x): x is { it: SearchItem; score: number } => x !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, 50);
  }, [q, items]);

  return (
    <div className="search">
      <label htmlFor="q" className="search__label">Search {items.length} stories</label>
      <input id="q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Try “long distance” or “winter outfits”" autoFocus />
      <p className="meta" role="status">
        {q.trim() ? `${results.length === 50 ? "Top 50" : results.length} ${results.length === 1 ? "result" : "results"}` : ""}
      </p>
      <ul className="search__results">
        {results.map(({ it }) => (
          <li key={it.slug}>
            <Link href={`/stories/${it.slug}`}>
              <span className="compact__topic" style={{ color: it.ink }}>{it.topic}</span>
              <span className="search__title">{it.title}</span>
              {it.description ? <span className="search__desc">{it.description}</span> : null}
            </Link>
          </li>
        ))}
      </ul>
      {q.trim() && !results.length ? (
        <p className="search__empty">No stories match that. Try a shorter word, or browse a topic from the menu.</p>
      ) : null}
    </div>
  );
}
