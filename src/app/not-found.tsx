import Link from "next/link";

export default function NotFound() {
  return (
    <div className="wrap section not-found">
      <h1 className="listing-title">We couldn&apos;t find that page</h1>
      <p className="dek">It may have moved when the site was rebuilt. Search for the story, or start from the homepage.</p>
      <div className="not-found__actions">
        <Link href="/search" className="button button--primary">Search stories</Link>
        <Link href="/" className="button button--outline">Go to homepage</Link>
      </div>
    </div>
  );
}
