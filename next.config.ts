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
    ],
  },
  turbopack: {
    root: ".",
  },
} as any;

export default nextConfig;
