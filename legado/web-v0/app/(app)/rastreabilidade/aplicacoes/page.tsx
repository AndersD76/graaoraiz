"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Droplets } from "lucide-react";

interface Aplicacao {
  id: string;
  tipo: string;
  produto: string;
  fabricante: string | null;
  dose: number;
  unidade: string;
  data: string;
  operador: string;
  nota: string | null;
  talhao: {
    nome: string;
    cultura: string;
    safra: string;
  };
}

const tipoColors: Record<string, string> = {
  HERBICIDA: "border-green-500 text-green-400",
  FUNGICIDA: "border-blue-500 text-blue-400",
  INSETICIDA: "border-red-400 text-red-400",
  FERTILIZANTE: "border-brand-gold text-brand-gold",
  SEMENTE: "border-purple-400 text-purple-400",
  OUTRO: "border-brand-muted text-brand-muted",
};

const mockAplicacoes: Aplicacao[] = [
  {
    id: "app-1",
    tipo: "HERBICIDA",
    produto: "Glifosato 480 SL",
    fabricante: "Nortox",
    dose: 3.0,
    unidade: "L/ha",
    data: "2025-11-15T00:00:00Z",
    operador: "João Silva",
    nota: "Aplicação pré-plantio",
    talhao: { nome: "Talhão Norte", cultura: "SOJA", safra: "2025/26" },
  },
  {
    id: "app-2",
    tipo: "FUNGICIDA",
    produto: "Fox Xpro",
    fabricante: "Bayer",
    dose: 0.4,
    unidade: "L/ha",
    data: "2026-01-20T00:00:00Z",
    operador: "João Silva",
    nota: null,
    talhao: { nome: "Talhão Norte", cultura: "SOJA", safra: "2025/26" },
  },
  {
    id: "app-3",
    tipo: "INSETICIDA",
    produto: "Connect",
    fabricante: "Bayer",
    dose: 1.0,
    unidade: "L/ha",
    data: "2026-01-25T00:00:00Z",
    operador: "Carlos Mendes",
    nota: "Percevejo marrom",
    talhao: { nome: "Talhão Sul", cultura: "MILHO", safra: "2025/26" },
  },
  {
    id: "app-4",
    tipo: "FERTILIZANTE",
    produto: "KCl 60%",
    fabricante: "Mosaic",
    dose: 200,
    unidade: "kg/ha",
    data: "2025-10-05T00:00:00Z",
    operador: "João Silva",
    nota: "Adubação de base",
    talhao: { nome: "Talhão Leste", cultura: "TRIGO", safra: "2025/26" },
  },
  {
    id: "app-5",
    tipo: "SEMENTE",
    produto: "TMG 2381 IPRO",
    fabricante: "TMG",
    dose: 14,
    unidade: "sem/m",
    data: "2025-11-20T00:00:00Z",
    operador: "Carlos Mendes",
    nota: null,
    talhao: { nome: "Talhão Norte", cultura: "SOJA", safra: "2025/26" },
  },
];

const tipos = [
  { value: "ALL", label: "Todos os tipos" },
  { value: "HERBICIDA", label: "Herbicida" },
  { value: "FUNGICIDA", label: "Fungicida" },
  { value: "INSETICIDA", label: "Inseticida" },
  { value: "FERTILIZANTE", label: "Fertilizante" },
  { value: "SEMENTE", label: "Semente" },
  { value: "OUTRO", label: "Outro" },
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

export default function AplicacoesPage() {
  const [aplicacoes, setAplicacoes] = useState<Aplicacao[]>(mockAplicacoes);
  const [loading, setLoading] = useState(true);
  const [filterTipo, setFilterTipo] = useState("ALL");
  const [filterCultura, setFilterCultura] = useState("ALL");

  useEffect(() => {
    const params = new URLSearchParams();
    if (filterTipo !== "ALL") params.set("tipo", filterTipo);
    if (filterCultura !== "ALL") params.set("cultura", filterCultura);

    fetch(`/api/aplicacoes?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.aplicacoes && data.aplicacoes.length > 0) {
          setAplicacoes(data.aplicacoes);
        }
      })
      .catch(() => {
        // Keep mock data
      })
      .finally(() => setLoading(false));
  }, [filterTipo, filterCultura]);

  const filtered = aplicacoes.filter((a) => {
    if (filterTipo !== "ALL" && a.tipo !== filterTipo) return false;
    if (filterCultura !== "ALL" && a.talhao.cultura !== filterCultura) return false;
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
            Aplicações
          </h1>
          <p className="text-sm text-brand-muted mt-0.5">
            Todas as aplicações registradas nos talhões
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-brand-surface border-brand-border">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Droplets className="h-4 w-4 text-brand-accent" />
              <span className="text-sm text-brand-muted">Filtros:</span>
            </div>
            <Select value={filterTipo} onValueChange={(v) => v !== null && setFilterTipo(v)}>
              <SelectTrigger className="bg-brand-alt border-brand-border text-brand-text w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-brand-surface border-brand-border">
                {tipos.map((t) => (
                  <SelectItem key={t.value} value={t.value} className="text-brand-text hover:bg-brand-alt">
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterCultura} onValueChange={(v) => v !== null && setFilterCultura(v)}>
              <SelectTrigger className="bg-brand-alt border-brand-border text-brand-text w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-brand-surface border-brand-border">
                {culturasFilter.map((c) => (
                  <SelectItem key={c.value} value={c.value} className="text-brand-text hover:bg-brand-alt">
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs text-brand-muted ml-auto">
              {filtered.length} registro(s)
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-brand-surface border-brand-border">
        <CardHeader>
          <CardTitle className="text-brand-text text-base">
            Registro de Aplicações
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <p className="text-brand-muted text-sm">Carregando...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-brand-border hover:bg-transparent">
                    <TableHead className="text-brand-muted">Data</TableHead>
                    <TableHead className="text-brand-muted">Talhão</TableHead>
                    <TableHead className="text-brand-muted">Tipo</TableHead>
                    <TableHead className="text-brand-muted">Produto</TableHead>
                    <TableHead className="text-brand-muted">Fabricante</TableHead>
                    <TableHead className="text-brand-muted">Dose</TableHead>
                    <TableHead className="text-brand-muted">Operador</TableHead>
                    <TableHead className="text-brand-muted">Nota</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((a) => (
                    <TableRow
                      key={a.id}
                      className="border-brand-border hover:bg-brand-alt/50"
                    >
                      <TableCell className="text-brand-text font-mono text-sm">
                        {new Date(a.data).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        <div>
                          <span className="text-brand-text text-sm">{a.talhao.nome}</span>
                          <br />
                          <span className="text-brand-muted text-xs">
                            {a.talhao.cultura} — {a.talhao.safra}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={tipoColors[a.tipo] || tipoColors.OUTRO}
                        >
                          {a.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-brand-text text-sm">
                        {a.produto}
                      </TableCell>
                      <TableCell className="text-brand-muted text-sm">
                        {a.fabricante || "—"}
                      </TableCell>
                      <TableCell className="text-brand-text font-mono text-sm">
                        {a.dose} {a.unidade}
                      </TableCell>
                      <TableCell className="text-brand-text text-sm">
                        {a.operador}
                      </TableCell>
                      <TableCell className="text-brand-muted text-sm max-w-[200px] truncate">
                        {a.nota || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center text-brand-muted py-8"
                      >
                        Nenhuma aplicação encontrada com esses filtros.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
