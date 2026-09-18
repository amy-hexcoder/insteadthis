import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTopic } from "@/lib/topics";
import { TopicListing, topicPageParams } from "../../listing";

type Props = { params: Promise<{ topic: string; n: string }> };
export const dynamicParams = false;

export function generateStaticParams() {
  return topicPageParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { topic, n } = await params;
  const t = getTopic(topic);
  return t ? { title: `${t.name}, page ${n}`, alternates: { canonical: `/topics/${t.slug}/page/${n}` } } : {};
}

export default async function TopicPageN({ params }: Props) {
  const { topic, n } = await params;
  const page = Number(n);
  if (!Number.isInteger(page) || page < 2) notFound();
  return <TopicListing slug={topic} page={page} />;
}
