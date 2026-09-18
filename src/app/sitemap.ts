import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/posts";
import { TOPICS } from "@/lib/topics";
import { SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const iso = (d: string) => new Date(d + (d.endsWith("Z") ? "" : "Z"));
  return [
    { url: `${SITE.url}/`, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${SITE.url}/stories`, changeFrequency: "weekly" },
    ...TOPICS.map((t) => ({ url: `${SITE.url}/topics/${t.slug}`, changeFrequency: "weekly" as const })),
    ...getAllPosts().map((p) => ({ url: `${SITE.url}/stories/${p.slug}`, lastModified: iso(p.updated > p.date ? p.updated : p.date),
      ...(p.image ? { images: [`${SITE.url}${p.image}`] } : {}),
    })),
  ];
}
