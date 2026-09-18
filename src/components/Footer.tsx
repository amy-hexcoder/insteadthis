import Link from "next/link";
import { TOPICS } from "@/lib/topics";
import { SITE } from "@/lib/site";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <span className="site-footer__wordmark">{SITE.wordmark}</span>
          <p>{SITE.description}</p>
        </div>
        <div className="site-footer__cols">
          <div>
            <h2>Topics</h2>
            {TOPICS.map((t) => (
              <Link key={t.slug} href={`/topics/${t.slug}`}>{t.name}</Link>
            ))}
          </div>
          <div>
            <h2>Read</h2>
            <Link href="/stories">All stories</Link>
            <Link href="/search">Search</Link>
            <Link href="/#newsletter">Newsletter</Link>
          </div>
        </div>
      </div>
      <div className="site-footer__legal">
        <span>© {new Date().getFullYear()} {SITE.name}</span>
      </div>
    </footer>
  );
}
