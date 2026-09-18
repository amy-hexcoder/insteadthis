import type { Metadata } from "next";
import { getTopic, TOPICS } from "@/lib/topics";
import { TopicListing } from "./listing";

type Props = { params: Promise<{ topic: string }> };
export const dynamicParams = false;

export function generateStaticParams() {
  return TOPICS.map((t) => ({ topic: t.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = getTopic((await params).topic);
  return t ? { title: t.name, description: `${t.blurb}. Stories from InsteadThis.`, alternates: { canonical: `/topics/${t.slug}` } } : {};
}

export default async function TopicPage({ params }: Props) {
  return <TopicListing slug={(await params).topic} page={1} />;
}
