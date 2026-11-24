import { readdirSync } from "node:fs";
import { join } from "node:path";
import type { NextConfig } from "next";

const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/+$/, "");
const HOST_CANONICO = SITE.startsWith("https://") ? new URL(SITE).host : null;

// Telas do app web, lidas das rotas do expo-router (apps/mobile/src/app):
// "(tabs)/chuva.tsx" vira "/chuva" e "maquina/[id].tsx" vira "/maquina/:id".
// Só essas caem no index.html; qualquer outro endereço responde 404 de verdade (sem "soft 404").
export function telasDoApp(pasta: string): string[] {
  const telas = new Set<string>();
  for (const arquivo of readdirSync(pasta, { recursive: true, encoding: "utf8" })) {
    if (!/\.(tsx|ts|jsx|js)$/.test(arquivo)) continue;
    const partes = arquivo.replace(/\.(tsx|ts|jsx|js)$/, "").split(/[\\/]/);
    if (partes.some((p) => p.startsWith("_") || p.startsWith("+"))) continue;
    const caminho = partes
      .filter((p) => !/^\(.*\)$/.test(p) && p !== "index")
      .map((p) => p.replace(/^\[\.\.\.(\w+)\]$/, ":$1*").replace(/^\[(\w+)\]$/, ":$1"))
      .join("/");
    if (caminho) telas.add(`/${caminho}`);
  }
  return [...telas].sort();
}

function lerTelas(): string[] | null {
  try {
    const telas = telasDoApp(join(process.cwd(), "../mobile/src/app"));
    return telas.length > 0 ? telas : null;
  } catch {
    return null;
  }
}

// null = pasta do app indisponível: volta ao comportamento antigo (tudo cai no index.html).
const TELAS_DO_APP = lerTelas();

const SEGURANCA = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self), geolocation=(self), microphone=(), payment=(), usb=()" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Política mínima que não quebra o app web (React Native Web injeta estilos e o mapa usa workers).
  { key: "Content-Security-Policy", value: "frame-ancestors 'self'; base-uri 'self'; object-src 'none'; form-action 'self'" },
];

const PRIVADO = [
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "X-Robots-Tag", value: "noindex, nofollow" },
];

const nextConfig: NextConfig = {
  // Um endereço só para buscadores: outros hosts (ex.: o do Railway) redirecionam para o www.
  // A API fica de fora, para os apps antigos que ainda chamam o endereço do Railway.
  async redirects() {
    // Painéis antigos (chave na URL) foram trocados pelo painel com login em /admin.
    const paineisAntigos = [
      { source: "/painel/maquinas", destination: "/admin/vendas", permanent: true },
      { source: "/painel/funil", destination: "/admin/funil", permanent: true },
      { source: "/avaliacoes", destination: "/admin/avaliacoes", permanent: true },
    ];
    if (!HOST_CANONICO) return paineisAntigos;
    return [
      ...paineisAntigos,
      {
        source: "/:caminho((?!api/).*)",
        missing: [{ type: "host", value: HOST_CANONICO.replace(/\./g, "\\.") }],
        destination: `${SITE}/:caminho`,
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      { source: "/:caminho*", headers: SEGURANCA },
      // Telas do app dependem de conta ou repetem as páginas públicas: fora do índice.
      ...(TELAS_DO_APP ?? []).map((source) => ({ source, headers: [{ key: "X-Robots-Tag", value: "noindex, follow" }] })),
      // Service worker dos avisos de mensagem (apps/mobile/public/sw-avisos.js): sempre a versão nova.
      { source: "/sw-avisos.js", headers: [{ key: "Cache-Control", value: "no-cache" }] },
      { source: "/admin", headers: PRIVADO },
      { source: "/admin/:caminho*", headers: PRIVADO },
    ];
  },
  // O pacote compartilhado é TypeScript puro (sem build próprio).
  transpilePackages: ["@graoraiz/clima"],
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  // O app web (exportado para public/ por scripts/montar-app.mjs) ocupa a raiz. As rotas do app
  // (/lavoura, /precos...) são do lado do navegador e caem no index.html; o resto vai para o 404.
  async rewrites() {
    return {
      beforeFiles: [{ source: "/", destination: "/index.html" }],
      afterFiles: [],
      fallback: TELAS_DO_APP
        ? TELAS_DO_APP.map((source) => ({ source, destination: "/index.html" }))
        : [{ source: "/:caminho((?!api/|_next/).*)", destination: "/index.html" }],
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
