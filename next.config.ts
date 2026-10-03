import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
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
  async redirects() {
    return [{ source: "/about", destination: "/", permanent: true }];
  },
  turbopack: {
    root: ".",
  },
} as any;

export default nextConfig;
