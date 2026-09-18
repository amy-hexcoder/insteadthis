import type { Metadata } from "next";
import { StoriesListing } from "./listing";

export const metadata: Metadata = { title: "All stories", alternates: { canonical: "/stories" } };

export default function StoriesPage() {
  return <StoriesListing page={1} />;
}
