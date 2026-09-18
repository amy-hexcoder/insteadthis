export const SITE = {
  name: "InsteadThis",
  wordmark: "instead this",
  description: "Everyday ideas on relationships, style, wellness, food, and travel, with a better way to try instead.",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "https://insteadthis.com").replace(/\/$/, ""),
  postsPerPage: 24,
};
