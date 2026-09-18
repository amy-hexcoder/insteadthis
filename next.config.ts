import type { NextConfig } from "next";
import legacyRedirects from "./data/redirects.json";

const nextConfig: NextConfig = {
  // Old WordPress URLs (/2023/05/12/some-post) go to /stories/some-post.
  async redirects() {
    return [
      ...legacyRedirects,
      { source: "/category/:slug*", destination: "/stories", permanent: true },
      { source: "/tag/:slug*", destination: "/stories", permanent: true },
      { source: "/author/:slug*", destination: "/stories", permanent: true },
      { source: "/wp-content/uploads/:path*", destination: "/images/uploads/:path*", permanent: true },
      { source: "/feed", destination: "/", permanent: false },
    ];
  },
};

export default nextConfig;
