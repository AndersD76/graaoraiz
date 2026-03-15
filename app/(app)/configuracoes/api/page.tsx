"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Key,
  Copy,
  RefreshCw,
  Check,
  Code,
  Shield,
  BookOpen,
} from "lucide-react";

const ENDPOINTS = [
  {
    method: "GET",
    path: "/api/v1/talhoes",
    description: "Lista todos os talhoes com aplicacoes e lotes",
    params: "Nenhum",
  },
  {
    method: "GET",
    path: "/api/v1/lotes",
    description: "Lista todos os lotes com informacoes do talhao",
    params: "Nenhum",
  },
  {
    method: "GET",
    path: "/api/v1/cotacoes",
    description: "Cotacoes atuais de precos",
    params: "uf (ex: RS), cultura (ex: SOJA)",
  },
  {
    method: "GET",
    path: "/api/v1/propriedade",
    description: "Dados da propriedade com resumo dos talhoes",
    params: "Nenhum",
  },
];

export default function ApiConfigPage() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    fetchApiKey();
  }, []);

  async function fetchApiKey() {
    try {
      const res = await fetch("/api/configuracoes/api-key");
      const data = await res.json();
      setApiKey(data.apiKey);
    } catch {
      console.error("Erro ao buscar chave de API");
    } finally {
      setLoading(false);
    }
  }

  async function generateApiKey() {
    setGenerating(true);
    try {
      const res = await fetch("/api/configuracoes/api-key", {
        method: "POST",
      });
      const data = await res.json();
      setApiKey(data.apiKey);
      setShowKey(true);
    } catch {
      console.error("Erro ao gerar chave de API");
    } finally {
      setGenerating(false);
    }
  }

  function copyToClipboard() {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const maskedKey = apiKey
    ? `${apiKey.slice(0, 7)}${"*".repeat(20)}${apiKey.slice(-6)}`
    : null;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display text-brand-text">
          API para ERP
        </h1>
        <p className="text-sm text-brand-muted mt-0.5">
          Integre seu sistema ERP com o GraoRaiz via API REST
        </p>
      </div>

      {/* API Key Card */}
      <Card className="bg-brand-surface border-brand-border">
        <CardHeader>
          <CardTitle className="text-brand-text text-base flex items-center gap-2">
            <Key className="h-4 w-4 text-brand-accent" />
            Chave de API
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="h-10 bg-brand-alt rounded animate-pulse" />
          ) : apiKey ? (
            <>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={showKey ? apiKey : maskedKey || ""}
                  className="bg-brand-alt border-brand-border text-brand-text font-mono text-sm"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={copyToClipboard}
                  className="text-brand-muted hover:text-brand-accent hover:bg-brand-alt shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowKey(!showKey)}
                  className="text-brand-muted hover:text-brand-accent hover:bg-brand-alt text-xs"
                >
                  {showKey ? "Ocultar chave" : "Mostrar chave"}
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <Shield className="h-8 w-8 text-brand-muted mx-auto mb-2" />
              <p className="text-sm text-brand-muted mb-1">
                Nenhuma chave de API gerada
              </p>
              <p className="text-xs text-brand-muted">
                Gere uma chave para integrar seu ERP com o GraoRaiz
              </p>
            </div>
          )}

          <Separator className="bg-brand-border" />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-brand-text font-medium">
                {apiKey ? "Gerar nova chave" : "Gerar chave de API"}
              </p>
              <p className="text-xs text-brand-muted mt-0.5">
                {apiKey
                  ? "A chave anterior sera invalidada"
                  : "Necessario para autenticacao via API"}
              </p>
            </div>
            <Button
              onClick={generateApiKey}
              disabled={generating}
              size="sm"
              className="bg-brand-accent hover:bg-brand-accent/90 text-white"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${generating ? "animate-spin" : ""}`}
              />
              {generating ? "Gerando..." : "Gerar nova chave"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* How to Use */}
      <Card className="bg-brand-surface border-brand-border">
        <CardHeader>
          <CardTitle className="text-brand-text text-base flex items-center gap-2">
            <Code className="h-4 w-4 text-brand-accent" />
            Como usar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-brand-text font-medium mb-2">
              Autenticacao via Header
            </p>
            <div className="bg-brand-alt rounded-lg p-3 font-mono text-xs text-brand-muted overflow-x-auto">
              <pre>{`curl -H "Authorization: Bearer SUA_CHAVE_API" \\
  https://seudominio.com/api/v1/talhoes`}</pre>
            </div>
          </div>

          <Separator className="bg-brand-border" />

          <div>
            <p className="text-sm text-brand-text font-medium mb-2">
              Exemplo com fetch (JavaScript)
            </p>
            <div className="bg-brand-alt rounded-lg p-3 font-mono text-xs text-brand-muted overflow-x-auto">
              <pre>{`const response = await fetch("/api/v1/talhoes", {
  headers: {
    "Authorization": "Bearer SUA_CHAVE_API"
  }
});
const data = await response.json();
console.log(data.talhoes);`}</pre>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Endpoints */}
      <Card className="bg-brand-surface border-brand-border">
        <CardHeader>
          <CardTitle className="text-brand-text text-base flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-brand-accent" />
            Endpoints disponíveis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {ENDPOINTS.map((ep, i) => (
            <div key={i}>
              {i > 0 && <Separator className="bg-brand-border mb-3" />}
              <div className="flex items-start gap-3">
                <Badge
                  variant="outline"
                  className="border-brand-accent text-brand-accent text-[10px] font-mono shrink-0 mt-0.5"
                >
                  {ep.method}
                </Badge>
                <div className="min-w-0">
                  <p className="text-sm text-brand-text font-mono break-all">
                    {ep.path}
                  </p>
                  <p className="text-xs text-brand-muted mt-0.5">
                    {ep.description}
                  </p>
                  <p className="text-xs text-brand-muted mt-0.5">
                    <span className="text-brand-text">Params:</span> {ep.params}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Response Format */}
      <Card className="bg-brand-surface border-brand-border">
        <CardHeader>
          <CardTitle className="text-brand-text text-base">
            Formato de resposta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="bg-brand-alt rounded-lg p-3 font-mono text-xs text-brand-muted overflow-x-auto">
            <pre>{`// GET /api/v1/talhoes
{
  "talhoes": [
    {
      "id": "abc123",
      "nome": "Talhao 1",
      "area": 50.5,
      "cultura": "SOJA",
      "safra": "2025/2026",
      "status": "ATIVO",
      "compliance": 80,
      "aplicacoes": [...],
      "lotes": [...]
    }
  ],
  "total": 1,
  "propriedade": {
    "id": "xyz789",
    "nome": "Fazenda Exemplo"
  }
}`}</pre>
          </div>
          <div className="bg-brand-alt rounded-lg p-3">
            <p className="text-xs text-brand-muted">
              <span className="text-brand-text font-medium">Erros:</span> Respostas
              de erro retornam um objeto com campo{" "}
              <code className="text-brand-accent">{`"error"`}</code> e o status HTTP
              correspondente (401 para nao autorizado, 500 para erro interno).
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
