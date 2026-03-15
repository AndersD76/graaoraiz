import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          bg: '#0a1209',
          surface: '#111f0f',
          alt: '#172915',
          border: '#243d21',
          accent: '#6fcf3e',
          dim: '#3d7a22',
          gold: '#e6b93a',
          'gold-dim': '#a07d1a',
          muted: '#6b9464',
          text: '#edf2ea',
        },
      },
      fontFamily: {
        display: ['Instrument Serif', 'serif'],
        sans: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
export default config;
