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
    return [
      // foxtrotdesign.dev は廃止。旧URLはパスを保ったまま新ドメインへ
      {
        source: "/:path*",
        has: [{ type: "host", value: "(www\\.)?foxtrotdesign\\.dev" }],
        destination: "https://dev.85-store.com/:path*",
        permanent: true,
      },
      { source: "/about", destination: "/", permanent: true },
    ];
  },
  turbopack: {
    root: ".",
  },
} as any;

export default nextConfig;
