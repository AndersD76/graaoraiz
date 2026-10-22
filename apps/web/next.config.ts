import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // O pacote compartilhado é TypeScript puro (sem build próprio).
  transpilePackages: ["@graoraiz/clima"],
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
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
