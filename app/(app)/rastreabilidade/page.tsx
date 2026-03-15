"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
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
import { Plus, MapPin, Eye } from "lucide-react";
import type { MapMarker } from "@/components/app/leaflet-map";

const LeafletMap = dynamic(() => import("@/components/app/leaflet-map"), {
  ssr: false,
  loading: () => (
    <div className="h-[350px] bg-brand-alt rounded-lg flex items-center justify-center">
      <p className="text-brand-muted text-sm">Carregando mapa...</p>
    </div>
  ),
});

interface Talhao {
  id: string;
  nome: string;
  area: number;
  cultura: string;
  safra: string;
  status: string;
  latitude: number | null;
  longitude: number | null;
  compliance: number;
  aplicacoesCount: number;
  lotesCount: number;
}

const mockTalhoes: Talhao[] = [
  {
    id: "demo-1",
    nome: "Talhão Norte",
    area: 85.5,
    cultura: "SOJA",
    safra: "2025/26",
    status: "ATIVO",
    latitude: -28.2522,
    longitude: -52.3983,
    compliance: 80,
    aplicacoesCount: 4,
    lotesCount: 1,
  },
  {
    id: "demo-2",
    nome: "Talhão Sul",
    area: 62.3,
    cultura: "MILHO",
    safra: "2025/26",
    status: "ATIVO",
    latitude: -28.2722,
    longitude: -52.4183,
    compliance: 55,
    aplicacoesCount: 2,
    lotesCount: 0,
  },
  {
    id: "demo-3",
    nome: "Talhão Leste",
    area: 120.0,
    cultura: "TRIGO",
    safra: "2025/26",
    status: "COLHIDO",
    latitude: -28.2622,
    longitude: -52.3883,
    compliance: 100,
    aplicacoesCount: 6,
    lotesCount: 3,
  },
  {
    id: "demo-4",
    nome: "Talhão Oeste",
    area: 74.2,
    cultura: "SOJA",
    safra: "2025/26",
    status: "POUSIO",
    latitude: -28.2622,
    longitude: -52.4283,
    compliance: 25,
    aplicacoesCount: 0,
    lotesCount: 0,
  },
];

const statusColors: Record<string, string> = {
  ATIVO: "border-brand-accent text-brand-accent",
  COLHIDO: "border-brand-gold text-brand-gold",
  POUSIO: "border-brand-muted text-brand-muted",
};

function complianceColor(value: number) {
  if (value >= 80) return "text-brand-accent";
  if (value >= 50) return "text-brand-gold";
  return "text-red-400";
}

export default function RastreabilidadePage() {
  const [talhoes, setTalhoes] = useState<Talhao[]>(mockTalhoes);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/talhoes")
      .then((res) => res.json())
      .then((data) => {
        if (data.talhoes && data.talhoes.length > 0) {
          setTalhoes(data.talhoes);
        }
      })
      .catch(() => {
        // Keep mock data
      })
      .finally(() => setLoading(false));
  }, []);

  const markers: MapMarker[] = talhoes
    .filter((t) => t.latitude && t.longitude)
    .map((t) => ({
      id: t.id,
      lat: t.latitude!,
      lng: t.longitude!,
      label: `${t.nome} — ${t.area} ha (${t.cultura})`,
    }));

  const mapCenter: [number, number] =
    markers.length > 0
      ? [markers[0].lat, markers[0].lng]
      : [-28.2622, -52.4083];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display text-brand-text">
            Rastreabilidade
          </h1>
          <p className="text-sm text-brand-muted mt-1">
            Gerencie talhões, aplicações e lotes para compliance EUDR
          </p>
        </div>
        <Link href="/rastreabilidade/novo">
          <Button className="bg-brand-accent text-brand-bg hover:bg-brand-accent/90 font-medium">
            <Plus className="h-4 w-4 mr-2" />
            Novo Talhão
          </Button>
        </Link>
      </div>

      {/* Map */}
      <Card className="bg-brand-surface border-brand-border overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-brand-text text-base flex items-center gap-2">
            <MapPin className="h-4 w-4 text-brand-accent" />
            Mapa de Talhões
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[350px]">
            <LeafletMap
              center={mapCenter}
              zoom={12}
              markers={markers}
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-brand-surface border-brand-border">
        <CardHeader>
          <CardTitle className="text-brand-text text-base">
            Talhões ({talhoes.length})
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
                    <TableHead className="text-brand-muted">Nome</TableHead>
                    <TableHead className="text-brand-muted">Área (ha)</TableHead>
                    <TableHead className="text-brand-muted">Cultura</TableHead>
                    <TableHead className="text-brand-muted">Safra</TableHead>
                    <TableHead className="text-brand-muted">Compliance %</TableHead>
                    <TableHead className="text-brand-muted">Status</TableHead>
                    <TableHead className="text-brand-muted text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {talhoes.map((t) => (
                    <TableRow
                      key={t.id}
                      className="border-brand-border hover:bg-brand-alt/50"
                    >
                      <TableCell className="text-brand-text font-medium">
                        {t.nome}
                      </TableCell>
                      <TableCell className="text-brand-text font-mono">
                        {t.area.toFixed(1)}
                      </TableCell>
                      <TableCell className="text-brand-text">{t.cultura}</TableCell>
                      <TableCell className="text-brand-text font-mono">
                        {t.safra}
                      </TableCell>
                      <TableCell>
                        <span className={`font-mono font-bold ${complianceColor(t.compliance)}`}>
                          {t.compliance}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={statusColors[t.status] || "border-brand-muted text-brand-muted"}
                        >
                          {t.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/rastreabilidade/${t.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-brand-accent hover:text-brand-accent hover:bg-brand-alt"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
