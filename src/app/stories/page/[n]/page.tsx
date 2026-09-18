import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StoriesListing, storyPageCount } from "../../listing";

type Props = { params: Promise<{ n: string }> };
export const dynamicParams = false;

export function generateStaticParams() {
  return Array.from({ length: storyPageCount() - 1 }, (_, i) => ({ n: String(i + 2) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { n } = await params;
  return { title: `All stories, page ${n}`, alternates: { canonical: `/stories/page/${n}` } };
}

export default async function StoriesPageN({ params }: Props) {
  const page = Number((await params).n);
  if (!Number.isInteger(page) || page < 2) notFound();
  return <StoriesListing page={page} />;
}
