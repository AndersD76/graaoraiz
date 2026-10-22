"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, History, Filter } from "lucide-react";

interface Operacao {
  id: string;
  type: "aplicacao" | "colheita";
  date: string;
  talhaoNome: string;
  cultura: string;
  safra: string;
  details: string;
  badge: string;
}

const badgeColors: Record<string, string> = {
  HERBICIDA: "border-green-500 text-green-400",
  FUNGICIDA: "border-blue-500 text-blue-400",
  INSETICIDA: "border-red-400 text-red-400",
  FERTILIZANTE: "border-brand-gold text-brand-gold",
  SEMENTE: "border-purple-400 text-purple-400",
  COLHEITA: "border-amber-500 text-amber-400",
  OUTRO: "border-brand-muted text-brand-muted",
};

const badgeLabels: Record<string, string> = {
  HERBICIDA: "Herbicida",
  FUNGICIDA: "Fungicida",
  INSETICIDA: "Inseticida",
  FERTILIZANTE: "Fertilizante",
  SEMENTE: "Semente",
  COLHEITA: "Colheita",
  OUTRO: "Outro",
};

const safrasFilter = [
  { value: "ALL", label: "Todas as safras" },
  { value: "2025/26", label: "2025/26" },
  { value: "2024/25", label: "2024/25" },
  { value: "2023/24", label: "2023/24" },
];

const culturasFilter = [
  { value: "ALL", label: "Todas as culturas" },
  { value: "SOJA", label: "Soja" },
  { value: "MILHO", label: "Milho" },
  { value: "TRIGO", label: "Trigo" },
  { value: "AVEIA", label: "Aveia" },
  { value: "CANOLA", label: "Canola" },
  { value: "OUTRO", label: "Outro" },
];

const mockOperacoes: Operacao[] = [
  {
    id: "h1",
    type: "aplicacao",
    date: "2026-01-25T00:00:00Z",
    talhaoNome: "Talhão Norte",
    cultura: "SOJA",
    safra: "2025/26",
    details: "Connect — 1.0 L/ha",
    badge: "INSETICIDA",
  },
  {
    id: "h2",
    type: "aplicacao",
    date: "2026-01-20T00:00:00Z",
    talhaoNome: "Talhão Norte",
    cultura: "SOJA",
    safra: "2025/26",
    details: "Fox Xpro — 0.4 L/ha",
    badge: "FUNGICIDA",
  },
  {
    id: "h3",
    type: "colheita",
    date: "2026-01-15T00:00:00Z",
    talhaoNome: "Talhão Sul",
    cultura: "MILHO",
    safra: "2025/26",
    details: "Lote 001 — 12000 kg (200 sc)",
    badge: "COLHEITA",
  },
  {
    id: "h4",
    type: "aplicacao",
    date: "2025-11-20T00:00:00Z",
    talhaoNome: "Talhão Norte",
    cultura: "SOJA",
    safra: "2025/26",
    details: "TMG 2381 IPRO — 14 sem/m",
    badge: "SEMENTE",
  },
  {
    id: "h5",
    type: "aplicacao",
    date: "2025-11-15T00:00:00Z",
    talhaoNome: "Talhão Norte",
    cultura: "SOJA",
    safra: "2025/26",
    details: "Glifosato 480 SL — 3.0 L/ha",
    badge: "HERBICIDA",
  },
  {
    id: "h6",
    type: "aplicacao",
    date: "2025-10-05T00:00:00Z",
    talhaoNome: "Talhão Leste",
    cultura: "TRIGO",
    safra: "2025/26",
    details: "KCl 60% — 200 kg/ha",
    badge: "FERTILIZANTE",
  },
];

export default function HistoricoPage() {
  const [operacoes, setOperacoes] = useState<Operacao[]>(mockOperacoes);
  const [loading, setLoading] = useState(true);
  const [filterSafra, setFilterSafra] = useState("ALL");
  const [filterCultura, setFilterCultura] = useState("ALL");

  useEffect(() => {
    const params = new URLSearchParams();
    if (filterSafra !== "ALL") params.set("safra", filterSafra);
    if (filterCultura !== "ALL") params.set("cultura", filterCultura);

    fetch(`/api/historico?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.operacoes && data.operacoes.length > 0) {
          setOperacoes(data.operacoes);
        }
      })
      .catch(() => {
        // Keep mock data on error
      })
      .finally(() => setLoading(false));
  }, [filterSafra, filterCultura]);

  const filtered = operacoes.filter((op) => {
    if (filterSafra !== "ALL" && op.safra !== filterSafra) return false;
    if (filterCultura !== "ALL" && op.cultura !== filterCultura) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/rastreabilidade">
          <Button
            variant="ghost"
            size="sm"
            className="text-brand-muted hover:text-brand-text hover:bg-brand-alt"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-display text-brand-text">
            Historico de Operacoes
          </h1>
          <p className="text-sm text-brand-muted mt-0.5">
            Timeline unificada de aplicacoes e colheitas
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-brand-surface border-brand-border">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-brand-accent" />
              <span className="text-sm text-brand-muted">Filtros:</span>
            </div>
            <Select
              value={filterSafra}
              onValueChange={(v) => v !== null && setFilterSafra(v)}
            >
              <SelectTrigger className="bg-brand-alt border-brand-border text-brand-text w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-brand-surface border-brand-border">
                {safrasFilter.map((s) => (
                  <SelectItem
                    key={s.value}
                    value={s.value}
                    className="text-brand-text hover:bg-brand-alt"
                  >
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filterCultura}
              onValueChange={(v) => v !== null && setFilterCultura(v)}
            >
              <SelectTrigger className="bg-brand-alt border-brand-border text-brand-text w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-brand-surface border-brand-border">
                {culturasFilter.map((c) => (
                  <SelectItem
                    key={c.value}
                    value={c.value}
                    className="text-brand-text hover:bg-brand-alt"
                  >
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs text-brand-muted ml-auto font-mono">
              {filtered.length} operacao(oes)
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card className="bg-brand-surface border-brand-border">
        <CardHeader>
          <CardTitle className="text-brand-text text-base flex items-center gap-2">
            <History className="h-4 w-4 text-brand-accent" />
            Timeline de Operacoes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <p className="text-brand-muted text-sm">Carregando...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <History className="h-10 w-10 text-brand-muted mb-3" />
              <p className="text-brand-muted text-sm">
                Nenhuma operacao encontrada com esses filtros.
              </p>
            </div>
          ) : (
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-[19px] top-2 bottom-2 w-px bg-brand-border" />

              <div className="space-y-6">
                {filtered.map((op) => (
                  <div key={op.id} className="relative flex gap-4 pl-1">
                    {/* Dot */}
                    <div
                      className={`relative z-10 mt-1.5 h-[10px] w-[10px] shrink-0 rounded-full border-2 ${
                        op.type === "colheita"
                          ? "border-amber-500 bg-amber-500/30"
                          : "border-brand-accent bg-brand-accent/30"
                      }`}
                    />

                    {/* Content */}
                    <div className="flex-1 rounded-lg border border-brand-border bg-brand-alt/50 p-4 hover:bg-brand-alt transition-colors">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                              variant="outline"
                              className={
                                badgeColors[op.badge] || badgeColors.OUTRO
                              }
                            >
                              {badgeLabels[op.badge] || op.badge}
                            </Badge>
                            <span className="text-sm text-brand-text font-medium">
                              {op.talhaoNome}
                            </span>
                            <span className="text-xs text-brand-muted">
                              {op.cultura} -- {op.safra}
                            </span>
                          </div>
                          <p className="text-sm text-brand-muted">
                            {op.details}
                          </p>
                        </div>
                        <span className="text-xs text-brand-muted font-mono whitespace-nowrap">
                          {new Date(op.date).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
