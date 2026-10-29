import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // O pacote compartilhado é TypeScript puro (sem build próprio).
  transpilePackages: ["@graoraiz/clima"],
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  // O app web (exportado para public/ por scripts/montar-app.mjs) ocupa a raiz. As rotas do app
  // (/lavoura, /precos...) são do lado do navegador: o que não for página, arquivo ou /api cai no index.html.
  async rewrites() {
    return {
      beforeFiles: [{ source: "/", destination: "/index.html" }],
      afterFiles: [],
      fallback: [{ source: "/:caminho((?!api/|_next/).*)", destination: "/index.html" }],
    };
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
