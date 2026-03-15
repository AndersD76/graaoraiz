"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface WhitelabelConfig {
  nomeCooperativa: string;
  logoUrl: string | null;
  corPrimaria: string;
  corSecundaria: string;
  corFundo: string;
  corSuperficie: string;
  corTexto: string;
  corMuted: string;
  corBorda: string;
  ativo: boolean;
}

interface WhitelabelContextValue {
  config: WhitelabelConfig | null;
  loading: boolean;
  refresh: () => void;
}

const WhitelabelContext = createContext<WhitelabelContextValue>({
  config: null,
  loading: true,
  refresh: () => {},
});

export function useWhitelabel() {
  return useContext(WhitelabelContext);
}

function applyColors(config: WhitelabelConfig) {
  const root = document.documentElement;
  root.style.setProperty("--color-brand-accent", config.corPrimaria);
  root.style.setProperty("--color-brand-dim", adjustBrightness(config.corPrimaria, -40));
  root.style.setProperty("--color-brand-gold", config.corSecundaria);
  root.style.setProperty("--color-brand-gold-dim", adjustBrightness(config.corSecundaria, -40));
  root.style.setProperty("--color-brand-bg", config.corFundo);
  root.style.setProperty("--color-brand-surface", config.corSuperficie);
  root.style.setProperty("--color-brand-alt", adjustBrightness(config.corSuperficie, 10));
  root.style.setProperty("--color-brand-text", config.corTexto);
  root.style.setProperty("--color-brand-muted", config.corMuted);
  root.style.setProperty("--color-brand-border", config.corBorda);
}

function clearColors() {
  const root = document.documentElement;
  const props = [
    "--color-brand-accent",
    "--color-brand-dim",
    "--color-brand-gold",
    "--color-brand-gold-dim",
    "--color-brand-bg",
    "--color-brand-surface",
    "--color-brand-alt",
    "--color-brand-text",
    "--color-brand-muted",
    "--color-brand-border",
  ];
  props.forEach((p) => root.style.removeProperty(p));
}

function adjustBrightness(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

export function WhitelabelProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<WhitelabelConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchConfig = () => {
    fetch("/api/cooperativa/config")
      .then((res) => res.json())
      .then((data) => {
        if (data.config && data.config.ativo) {
          setConfig(data.config);
          applyColors(data.config);
        } else {
          setConfig(null);
          clearColors();
        }
      })
      .catch(() => {
        setConfig(null);
        clearColors();
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <WhitelabelContext.Provider value={{ config, loading, refresh: fetchConfig }}>
      {children}
    </WhitelabelContext.Provider>
  );
}
