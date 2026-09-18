import type { TopicSlug } from "@/lib/topics";

const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" {...common} strokeWidth={2} aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-4-4" />
    </svg>
  );
}

export function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" {...common} strokeWidth={2} aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function TopicIcon({ slug, size = 36 }: { slug: TopicSlug; size?: number }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", ...common, "aria-hidden": true };
  switch (slug) {
    case "relationships":
      return <svg {...p}><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /></svg>;
    case "style":
      return <svg {...p}><path d="M8 3l4 3 4-3 4 4-3 3v11H7V10L4 7z" /></svg>;
    case "wellness":
      return <svg {...p}><path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14" /><path d="M5 19l7-7" /></svg>;
    case "food":
      return <svg {...p}><path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z" /><path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17" /><path d="M8 3v3M12 3v3" /></svg>;
    case "travel":
      return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M15.5 8.5l-2 5-5 2 2-5z" /></svg>;
    case "culture":
      return <svg {...p}><path d="M9 18V5l11-2v13" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="17.5" cy="16" r="2.5" /></svg>;
    case "home":
      return <svg {...p}><path d="M4 11l8-7 8 7" /><path d="M6 10v10h12V10" /><path d="M10 20v-5h4v5" /></svg>;
  }
}
