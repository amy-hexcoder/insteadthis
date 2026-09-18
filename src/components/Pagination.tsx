import Link from "next/link";

export function Pagination({ page, totalPages, base }: { page: number; totalPages: number; base: string }) {
  if (totalPages <= 1) return null;
  const href = (n: number) => (n === 1 ? base : `${base}/page/${n}`);
  const window = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (n) => n === 1 || n === totalPages || Math.abs(n - page) <= 2,
  );
  const items: (number | "gap")[] = [];
  window.forEach((n, i) => {
    if (i && n - window[i - 1] > 1) items.push("gap");
    items.push(n);
  });
  return (
    <nav className="pagination" aria-label="Pages">
      {page > 1 ? <Link href={href(page - 1)} className="button button--outline">Newer stories</Link> : <span />}
      <ol>
        {items.map((n, i) =>
          n === "gap" ? (
            <li key={`g${i}`} aria-hidden="true">…</li>
          ) : (
            <li key={n}>
              <Link href={href(n)} aria-current={n === page ? "page" : undefined}>{n}</Link>
            </li>
          ),
        )}
      </ol>
      {page < totalPages ? <Link href={href(page + 1)} className="button button--outline">Older stories</Link> : <span />}
    </nav>
  );
}
