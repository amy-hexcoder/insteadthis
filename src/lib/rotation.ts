/**
 * Homepage rotation.
 *
 * The homepage is rebuilt in the background every hour (see `revalidate` in app/page.tsx),
 * and its picks change once a day. Every slot is deterministic for a given day, so all
 * visitors see the same homepage that day and nothing flickers or shifts on load.
 *
 *  - Hero: a pinned story if one is scheduled in data/homepage.json, otherwise the next
 *    story in a fixed shuffled cycle of featured posts. Every featured post gets a turn
 *    before any repeats.
 *  - "New on InsteadThis": stories published in the last 30 days, when there are any.
 *  - "In season": stories matching whatever seasons are active today.
 *  - "Picked for today": a random daily mix, at most two per topic.
 *  - Three topic sections, rotating through the seven topics day by day.
 */
import config from "../../data/homepage.json";
import type { Post } from "./posts";
import { TOPICS, type Topic } from "./topics";

type Season = { label: string; from: string; to: string; match: string[] };
type Pin = { slug: string; from: string; to: string };

const GENERIC_TITLE = /^\s*(akira\s*-\s*)?product reviews?\s*$/i;
const RECENT_DAYS = 30;

/* ---------- deterministic randomness ---------- */
function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
function rng(seed: number) {
  // mulberry32
  return () => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffle<T>(items: T[], seed: string): T[] {
  const a = [...items];
  const r = rng(hash(seed));
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ---------- dates ---------- */
export function today(now = new Date()) {
  const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: config.timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const [y, m, d] = ymd.split("-").map(Number);
  return { ymd, mmdd: ymd.slice(5), dayNumber: Math.floor(Date.UTC(y, m - 1, d) / 86400000) };
}
function inWindow(mmdd: string, from: string, to: string) {
  return from <= to ? mmdd >= from && mmdd <= to : mmdd >= from || mmdd <= to; // windows can wrap past New Year
}

/* ---------- helpers ---------- */
function isQuality(p: Post) {
  return Boolean(p.image) && !GENERIC_TITLE.test(p.title) && p.description.length > 40;
}
function searchText(p: Post) {
  return `${p.title} ${p.tags.join(" ")}`;
}
function windowLength(s: Season) {
  const toDays = (mmdd: string) => (Number(mmdd.slice(0, 2)) - 1) * 31 + Number(mmdd.slice(3));
  const d = toDays(s.to) - toDays(s.from);
  return d >= 0 ? d : d + 372;
}
function matcher(words: string[]) {
  const esc = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return new RegExp(`\\b(${esc.join("|")})(?:s|es)?\\b`, "i");
}
function take(pool: Post[], n: number, used: Set<string>, perTopic = Infinity) {
  const out: Post[] = [];
  const counts = new Map<string, number>();
  for (const p of pool) {
    if (out.length >= n) break;
    if (used.has(p.slug)) continue;
    const c = counts.get(p.topic.slug) ?? 0;
    if (c >= perTopic) continue;
    counts.set(p.topic.slug, c + 1);
    out.push(p);
  }
  out.forEach((p) => used.add(p.slug));
  return out;
}

export type Homepage = {
  hero: Post;
  heroIsPinned: boolean;
  strip: Post[];
  recent: Post[];
  season: { label: string; posts: Post[] } | null;
  picks: Post[];
  spotlights: { topic: Topic; posts: Post[] }[];
  day: string;
};

export function buildHomepage(all: Post[], now = new Date()): Homepage {
  const { ymd, mmdd, dayNumber } = today(now);
  const bySlug = new Map(all.map((p) => [p.slug, p]));
  const quality = all.filter(isQuality);
  const used = new Set<string>();

  // Keep holiday posts out of rotation when their season isn't on, and skip
  // posts with a past year in the title ("... in 2024"), which read as stale.
  const seasons = config.seasons as Season[];
  const active = seasons.filter((s) => inWindow(mmdd, s.from, s.to));
  const offSeason = seasons.filter((s) => !active.includes(s)).map((s) => matcher(s.match));
  const onSeason = active.map((s) => matcher(s.match));
  const year = Number(ymd.slice(0, 4));
  const pool = quality.filter((p) => {
    const text = searchText(p);
    const years = (p.title.match(/\b20\d\d\b/g) ?? []).map(Number);
    if (years.some((y) => y < year)) return false;
    return !offSeason.some((rx) => rx.test(text)) || onSeason.some((rx) => rx.test(text));
  });

  // Hero: pinned story, else the day's turn in the featured cycle
  const pin = (config.pinned as Pin[]).find((x) => ymd >= x.from && ymd <= x.to && bySlug.has(x.slug));
  let hero: Post;
  if (pin) {
    hero = bySlug.get(pin.slug)!;
  } else {
    // A fixed shuffled order of all featured posts; each day takes the next one that's
    // currently in rotation, so every featured post gets a turn before any repeats.
    const featured = quality.filter((p) => p.featured);
    const cycle = shuffle(featured.length >= 7 ? featured : quality, "hero-cycle");
    const allowed = new Set(pool.map((p) => p.slug));
    hero = cycle[dayNumber % cycle.length];
    for (let i = 0; i < cycle.length && !allowed.has(hero.slug); i++) hero = cycle[(dayNumber + i) % cycle.length];
  }
  used.add(hero.slug);

  // Genuinely new posts come first when there are any
  const cutoff = new Date(now.getTime() - RECENT_DAYS * 86400000).toISOString().slice(0, 19);
  const recent = take(all.filter((p) => p.date >= cutoff && !GENERIC_TITLE.test(p.title)), 6, used);

  // Seasonal section: the most specific active season (shortest window) with enough stories
  const activeSorted = [...active].sort((a, b) => windowLength(a) - windowLength(b));
  let season: Homepage["season"] = null;
  for (const s of activeSorted) {
    const rx = matcher(s.match);
    const matches = pool.filter((p) => rx.test(searchText(p)));
    const posts = take(shuffle(matches, `season-${s.label}-${ymd}`), 3, used, 2);
    if (posts.length === 3) {
      season = { label: s.label, posts };
      break;
    }
    posts.forEach((p) => used.delete(p.slug));
  }

  // Daily mix
  const daily = shuffle(pool, `daily-${ymd}`);
  const strip = take(daily, 3, used, 1);
  const picks = take(daily, recent.length ? 3 : 6, used, 2);

  // Three topics a day, rotating through all seven
  const spotlights = [0, 1, 2].map((i) => {
    const topic = TOPICS[(dayNumber * 3 + i) % TOPICS.length];
    const topicPool = shuffle(pool.filter((p) => p.topic.slug === topic.slug), `topic-${topic.slug}-${ymd}`);
    return { topic, posts: take(topicPool, 3, used) };
  });

  return { hero, heroIsPinned: Boolean(pin), strip, recent, season, picks, spotlights, day: ymd };
}
