import Link from "next/link";
import { TOPICS } from "@/lib/topics";
import { Wordmark } from "./Logo";
import { MenuIcon, SearchIcon } from "./Icons";

export function Header({ activeTopic }: { activeTopic?: string }) {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="site-header__brand" aria-label="InsteadThis home">
          <Wordmark />
        </Link>
        <nav aria-label="Topics" className="site-header__nav">
          {TOPICS.map((t) => (
            <Link
              key={t.slug}
              href={`/topics/${t.slug}`}
              aria-current={activeTopic === t.slug ? "page" : undefined}
              style={activeTopic === t.slug ? { color: t.ink } : undefined}
            >
              {t.short}
            </Link>
          ))}
        </nav>
        <div className="site-header__actions">
          <Link href="/search" className="icon-button" aria-label="Search stories">
            <SearchIcon />
          </Link>
          <Link href="/#newsletter" className="button button--dark site-header__subscribe">
            Subscribe
          </Link>
          <details className="mobile-menu">
            <summary className="icon-button" aria-label="Open menu">
              <MenuIcon />
            </summary>
            <div className="mobile-menu__panel">
              <nav aria-label="Topics" className="mobile-menu__list">
                {TOPICS.map((t) => (
                  <Link key={t.slug} href={`/topics/${t.slug}`} style={{ color: t.ink }}>
                    {t.name}
                  </Link>
                ))}
                <Link href="/stories">All stories</Link>
                <Link href="/#newsletter">Subscribe</Link>
              </nav>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
