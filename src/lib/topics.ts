export type TopicSlug =
  | "relationships"
  | "style"
  | "wellness"
  | "food"
  | "travel"
  | "culture"
  | "home";

export type Topic = {
  slug: TopicSlug;
  name: string;
  /** short label for navigation */
  short: string;
  blurb: string;
  /** soft background tint */
  tint: string;
  /** readable text color on the tint (at least 4.5:1) */
  ink: string;
  /** a slightly deeper tint used for decorative shapes */
  shape: string;
};

export const TOPICS: Topic[] = [
  { slug: "relationships", short: "Relationships", name: "Relationships", blurb: "Love, dating, marriage, and friendship", tint: "#FAD9DF", ink: "#8E2446", shape: "#F6C3CD" },
  { slug: "style", short: "Style", name: "Style & beauty", blurb: "Outfits, makeup, and honest reviews", tint: "#FCE7B8", ink: "#7A4E08", shape: "#F8D98F" },
  { slug: "wellness", short: "Wellness", name: "Wellness & growth", blurb: "Health, habits, and feeling better", tint: "#DCEACB", ink: "#3D5A26", shape: "#C8DDB1" },
  { slug: "food", short: "Food", name: "Food & drink", blurb: "Easy eats and what to sip", tint: "#F9DCC8", ink: "#8A3F16", shape: "#F4C6A6" },
  { slug: "travel", short: "Travel", name: "Travel", blurb: "Trips, packing, and places worth it", tint: "#CDE9E4", ink: "#1C5C55", shape: "#B1DCD4" },
  { slug: "culture", short: "Culture", name: "Culture & celebrations", blurb: "Festivals, movies, music, and books", tint: "#E7DDF4", ink: "#553177", shape: "#D6C6EC" },
  { slug: "home", short: "Home", name: "Home & pets", blurb: "Plants, pets, and cozy spaces", tint: "#D8E6F5", ink: "#24507A", shape: "#BFD5EE" },
];

const BY_SLUG = new Map(TOPICS.map((t) => [t.slug, t]));

export function getTopic(slug: string): Topic | undefined {
  return BY_SLUG.get(slug as TopicSlug);
}

export function topicStyle(t: Topic): React.CSSProperties {
  return { "--tint": t.tint, "--t-ink": t.ink, "--shape": t.shape } as React.CSSProperties;
}
