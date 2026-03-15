"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Palette, Save, Eye, Loader2 } from "lucide-react";

interface CooperativaConfig {
  id?: string;
  nomeCooperativa: string;
  logoUrl: string;
  corPrimaria: string;
  corSecundaria: string;
  corFundo: string;
  corSuperficie: string;
  corTexto: string;
  corMuted: string;
  corBorda: string;
  dominio: string;
  ativo: boolean;
}

const defaultConfig: CooperativaConfig = {
  nomeCooperativa: "",
  logoUrl: "",
  corPrimaria: "#6fcf3e",
  corSecundaria: "#e6b93a",
  corFundo: "#0a1209",
  corSuperficie: "#111a10",
  corTexto: "#e8f5e0",
  corMuted: "#7a8a72",
  corBorda: "#1e2e1a",
  dominio: "",
  ativo: false,
};

const colorFields: { key: keyof CooperativaConfig; label: string }[] = [
  { key: "corPrimaria", label: "Cor Primária (Accent)" },
  { key: "corSecundaria", label: "Cor Secundária (Gold)" },
  { key: "corFundo", label: "Cor de Fundo" },
  { key: "corSuperficie", label: "Cor de Superfície" },
  { key: "corTexto", label: "Cor do Texto" },
  { key: "corMuted", label: "Cor Muted" },
  { key: "corBorda", label: "Cor da Borda" },
];

export default function WhitelabelPage() {
  const [config, setConfig] = useState<CooperativaConfig>(defaultConfig);
  const [isExisting, setIsExisting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/cooperativa/config")
      .then((res) => res.json())
      .then((data) => {
        if (data.config) {
          setConfig({
            ...defaultConfig,
            ...data.config,
            logoUrl: data.config.logoUrl || "",
            dominio: data.config.dominio || "",
          });
          setIsExisting(true);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!config.nomeCooperativa.trim()) {
      setMessage("Nome da cooperativa é obrigatório.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const method = isExisting ? "PUT" : "POST";
      const res = await fetch("/api/cooperativa/config", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (res.ok) {
        const data = await res.json();
        setConfig({
          ...defaultConfig,
          ...data.config,
          logoUrl: data.config.logoUrl || "",
          dominio: data.config.dominio || "",
        });
        setIsExisting(true);
        setMessage("Configurações salvas com sucesso!");
      } else {
        const err = await res.json();
        setMessage(err.error || "Erro ao salvar.");
      }
    } catch {
      setMessage("Erro de conexão.");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (key: keyof CooperativaConfig, value: string | boolean) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-display text-brand-text">Whitelabel</h1>
        <p className="text-sm text-brand-muted mt-0.5">
          Personalize a aparência da plataforma com a identidade da sua cooperativa
        </p>
      </div>

      {/* Dados da Cooperativa */}
      <Card className="bg-brand-surface border-brand-border">
        <CardHeader>
          <CardTitle className="text-brand-text text-base flex items-center gap-2">
            <Palette className="h-4 w-4 text-brand-accent" />
            Dados da Cooperativa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-brand-text text-sm">Nome da Cooperativa *</Label>
            <Input
              value={config.nomeCooperativa}
              onChange={(e) => updateField("nomeCooperativa", e.target.value)}
              placeholder="Ex: Cooperativa Grão Verde"
              className="bg-brand-alt border-brand-border text-brand-text placeholder:text-brand-muted/50 focus-visible:ring-brand-accent"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-brand-text text-sm">URL do Logo</Label>
            <Input
              value={config.logoUrl}
              onChange={(e) => updateField("logoUrl", e.target.value)}
              placeholder="https://exemplo.com/logo.png"
              className="bg-brand-alt border-brand-border text-brand-text placeholder:text-brand-muted/50 focus-visible:ring-brand-accent"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-brand-text text-sm">Domínio Personalizado</Label>
            <Input
              value={config.dominio}
              onChange={(e) => updateField("dominio", e.target.value)}
              placeholder="app.suacooperativa.com.br"
              className="bg-brand-alt border-brand-border text-brand-text placeholder:text-brand-muted/50 focus-visible:ring-brand-accent"
            />
            <p className="text-xs text-brand-muted">
              Opcional. Configure o DNS para apontar para nossa plataforma.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Cores */}
      <Card className="bg-brand-surface border-brand-border">
        <CardHeader>
          <CardTitle className="text-brand-text text-base flex items-center gap-2">
            <Palette className="h-4 w-4 text-brand-accent" />
            Cores Personalizadas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {colorFields.map(({ key, label }) => (
            <div key={key} className="space-y-1">
              <Label className="text-brand-text text-sm">{label}</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={config[key] as string}
                  onChange={(e) => updateField(key, e.target.value)}
                  className="h-10 w-12 cursor-pointer rounded border border-brand-border bg-transparent p-0.5"
                />
                <Input
                  value={config[key] as string}
                  onChange={(e) => updateField(key, e.target.value)}
                  placeholder="#000000"
                  maxLength={7}
                  className="bg-brand-alt border-brand-border text-brand-text font-mono text-sm placeholder:text-brand-muted/50 focus-visible:ring-brand-accent"
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Preview */}
      <Card className="bg-brand-surface border-brand-border">
        <CardHeader>
          <CardTitle className="text-brand-text text-base flex items-center gap-2">
            <Eye className="h-4 w-4 text-brand-accent" />
            Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="rounded-lg p-6 space-y-4"
            style={{
              backgroundColor: config.corFundo,
              color: config.corTexto,
              border: `1px solid ${config.corBorda}`,
            }}
          >
            <div className="flex items-center gap-3">
              {config.logoUrl && (
                <img
                  src={config.logoUrl}
                  alt="Logo"
                  className="h-8 w-8 rounded object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              )}
              <h3 className="text-lg font-semibold" style={{ color: config.corTexto }}>
                {config.nomeCooperativa || "Nome da Cooperativa"}
              </h3>
            </div>

            <div
              className="rounded-md p-4 space-y-2"
              style={{
                backgroundColor: config.corSuperficie,
                border: `1px solid ${config.corBorda}`,
              }}
            >
              <p className="text-sm font-medium" style={{ color: config.corTexto }}>
                Card de Exemplo
              </p>
              <p className="text-xs" style={{ color: config.corMuted }}>
                Texto secundário com cor muted
              </p>
              <div className="flex gap-2 mt-3">
                <span
                  className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
                  style={{
                    backgroundColor: config.corPrimaria + "20",
                    color: config.corPrimaria,
                  }}
                >
                  Accent
                </span>
                <span
                  className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
                  style={{
                    backgroundColor: config.corSecundaria + "20",
                    color: config.corSecundaria,
                  }}
                >
                  Gold
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                className="rounded-md px-4 py-2 text-sm font-medium"
                style={{
                  backgroundColor: config.corPrimaria,
                  color: config.corFundo,
                }}
              >
                Botão Primário
              </button>
              <button
                className="rounded-md px-4 py-2 text-sm font-medium"
                style={{
                  backgroundColor: "transparent",
                  color: config.corPrimaria,
                  border: `1px solid ${config.corBorda}`,
                }}
              >
                Botão Secundário
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ativar + Salvar */}
      <Card className="bg-brand-surface border-brand-border">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-brand-text font-medium">Ativar Whitelabel</p>
              <p className="text-xs text-brand-muted mt-0.5">
                Quando ativo, as cores personalizadas serão aplicadas em toda a plataforma
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={config.ativo}
              onClick={() => updateField("ativo", !config.ativo)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                config.ativo ? "bg-brand-accent" : "bg-brand-alt"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  config.ativo ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {message && (
            <p
              className={`mt-4 text-sm ${
                message.includes("sucesso") ? "text-brand-accent" : "text-red-400"
              }`}
            >
              {message}
            </p>
          )}

          <Button
            onClick={handleSave}
            disabled={saving}
            className="mt-4 w-full bg-brand-accent text-brand-bg hover:bg-brand-accent/90 font-medium"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar Configurações
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
