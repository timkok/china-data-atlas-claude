import type { NextConfig } from "next";

// Fully static export: every indicator / region page is pre-rendered at build time
// (SEO-readable HTML); charts hydrate on the client. No server, no API keys.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
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
