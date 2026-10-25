import type { NextConfig } from "next";

// The browser only ever talks to this app (/api/v1/*); Next forwards it to the backend.
// That makes the auth cookie first-party, so login works across two *.vercel.app domains.
const BACKEND_URL = (process.env.BACKEND_URL ?? "http://localhost:5000").replace(/\/+$/, "");

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  async rewrites() {
    return [{ source: "/api/v1/:path*", destination: `${BACKEND_URL}/api/v1/:path*` }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
