import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.note.com",
      },
      {
        protocol: "https",
        hostname: "assets.st-note.com",
      },
      {
        protocol: "https",
        hostname: "cdn.bsky.app",
      },
    ],
  },
  turbopack: {
    root: ".",
  },
} as any;

export default nextConfig;
