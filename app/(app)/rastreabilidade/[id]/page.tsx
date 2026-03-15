"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  MapPin,
  Droplets,
  Package,
  ShieldCheck,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import type { MapMarker } from "@/components/app/leaflet-map";

const LeafletMap = dynamic(() => import("@/components/app/leaflet-map"), {
  ssr: false,
  loading: () => (
    <div className="h-[250px] bg-brand-alt rounded-lg flex items-center justify-center">
      <p className="text-brand-muted text-sm">Carregando mapa...</p>
    </div>
  ),
});

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
}

interface Lote {
  id: string;
  numeroLote: string;
  peso: number;
  sacas: number;
  destino: string;
  dataEntrega: string;
  nfe: string | null;
  ticket: string | null;
  preco: number | null;
}

interface TalhaoDetail {
  id: string;
  nome: string;
  area: number;
  cultura: string;
  safra: string;
  status: string;
  latitude: number | null;
  longitude: number | null;
  aplicacoes: Aplicacao[];
  lotes: Lote[];
  compliance: number;
  complianceDetails: {
    georeferenciado: boolean;
    aplicacoesRegistradas: boolean;
    loteVinculadoNfe: boolean;
    relatorioEudr: boolean;
  };
  propriedade: { nome: string };
  createdAt: string;
}

const statusColors: Record<string, string> = {
  ATIVO: "border-brand-accent text-brand-accent",
  COLHIDO: "border-brand-gold text-brand-gold",
  POUSIO: "border-brand-muted text-brand-muted",
};

const tipoColors: Record<string, string> = {
  HERBICIDA: "border-green-500 text-green-400",
  FUNGICIDA: "border-blue-500 text-blue-400",
  INSETICIDA: "border-red-400 text-red-400",
  FERTILIZANTE: "border-brand-gold text-brand-gold",
  SEMENTE: "border-purple-400 text-purple-400",
  OUTRO: "border-brand-muted text-brand-muted",
};

const tiposAplicacao = [
  { value: "HERBICIDA", label: "Herbicida" },
  { value: "FUNGICIDA", label: "Fungicida" },
  { value: "INSETICIDA", label: "Inseticida" },
  { value: "FERTILIZANTE", label: "Fertilizante" },
  { value: "SEMENTE", label: "Semente" },
  { value: "OUTRO", label: "Outro" },
];

// Mock data fallback
const mockTalhao: TalhaoDetail = {
  id: "demo-1",
  nome: "Talhão Norte",
  area: 85.5,
  cultura: "SOJA",
  safra: "2025/26",
  status: "ATIVO",
  latitude: -28.2522,
  longitude: -52.3983,
  propriedade: { nome: "Fazenda São José" },
  createdAt: "2025-09-01T00:00:00Z",
  compliance: 80,
  complianceDetails: {
    georeferenciado: true,
    aplicacoesRegistradas: true,
    loteVinculadoNfe: true,
    relatorioEudr: false,
  },
  aplicacoes: [
    {
      id: "app-1",
      tipo: "HERBICIDA",
      produto: "Glifosato 480 SL",
      fabricante: "Nortox",
      dose: 3.0,
      unidade: "L/ha",
      data: "2025-11-15T00:00:00Z",
      operador: "João Silva",
      nota: "Aplicação pré-plantio dessecação",
    },
    {
      id: "app-2",
      tipo: "SEMENTE",
      produto: "TMG 2381 IPRO",
      fabricante: "TMG",
      dose: 14,
      unidade: "sem/m",
      data: "2025-11-20T00:00:00Z",
      operador: "Carlos Mendes",
      nota: null,
    },
    {
      id: "app-3",
      tipo: "FUNGICIDA",
      produto: "Fox Xpro",
      fabricante: "Bayer",
      dose: 0.4,
      unidade: "L/ha",
      data: "2026-01-20T00:00:00Z",
      operador: "João Silva",
      nota: "Preventivo ferrugem asiática",
    },
    {
      id: "app-4",
      tipo: "INSETICIDA",
      produto: "Connect",
      fabricante: "Bayer",
      dose: 1.0,
      unidade: "L/ha",
      data: "2026-01-25T00:00:00Z",
      operador: "João Silva",
      nota: "Percevejo marrom",
    },
  ],
  lotes: [
    {
      id: "lote-1",
      numeroLote: "LT-2026-001",
      peso: 5130,
      sacas: 85.5,
      destino: "Cotripal Não-Me-Toque",
      dataEntrega: "2026-03-10T00:00:00Z",
      nfe: "NF-e 001234",
      ticket: "TK-8891",
      preco: 132.5,
    },
  ],
};

export default function TalhaoDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [talhao, setTalhao] = useState<TalhaoDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [aplicacaoOpen, setAplicacaoOpen] = useState(false);
  const [loteOpen, setLoteOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Aplicação form
  const [appTipo, setAppTipo] = useState("HERBICIDA");
  const [appProduto, setAppProduto] = useState("");
  const [appFabricante, setAppFabricante] = useState("");
  const [appDose, setAppDose] = useState("");
  const [appUnidade, setAppUnidade] = useState("L/ha");
  const [appData, setAppData] = useState("");
  const [appOperador, setAppOperador] = useState("");
  const [appNota, setAppNota] = useState("");

  // Lote form
  const [loteNumero, setLoteNumero] = useState("");
  const [lotePeso, setLotePeso] = useState("");
  const [loteDestino, setLoteDestino] = useState("");
  const [loteDataEntrega, setLoteDataEntrega] = useState("");
  const [loteNfe, setLoteNfe] = useState("");
  const [loteTicket, setLoteTicket] = useState("");
  const [lotePreco, setLotePreco] = useState("");

  const loteSacas = lotePeso ? (parseFloat(lotePeso) / 60).toFixed(1) : "0";

  useEffect(() => {
    fetch(`/api/talhoes/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.talhao) {
          setTalhao(data.talhao);
        } else {
          // Use mock data for demo IDs
          setTalhao(mockTalhao);
        }
      })
      .catch(() => {
        setTalhao(mockTalhao);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmitAplicacao = async () => {
    if (!appProduto || !appDose || !appData || !appOperador) return;
    setSaving(true);

    try {
      const res = await fetch("/api/aplicacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          talhaoId: id,
          tipo: appTipo,
          produto: appProduto,
          fabricante: appFabricante || null,
          dose: appDose,
          unidade: appUnidade,
          data: appData,
          operador: appOperador,
          nota: appNota || null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setTalhao((prev) =>
          prev
            ? {
                ...prev,
                aplicacoes: [data.aplicacao, ...prev.aplicacoes],
                compliance: Math.min(prev.compliance + (prev.aplicacoes.length === 0 ? 30 : 0), 100),
                complianceDetails: {
                  ...prev.complianceDetails,
                  aplicacoesRegistradas: true,
                },
              }
            : prev
        );
        setAplicacaoOpen(false);
        resetAplicacaoForm();
      }
    } catch {
      // Silently fail
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitLote = async () => {
    if (!loteNumero || !lotePeso || !loteDestino || !loteDataEntrega) return;
    setSaving(true);

    try {
      await fetch(`/api/talhoes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _action: "addLote" }),
      });

      // For now, add locally regardless
      const newLote: Lote = {
        id: `lote-${Date.now()}`,
        numeroLote: loteNumero,
        peso: parseFloat(lotePeso),
        sacas: parseFloat(loteSacas),
        destino: loteDestino,
        dataEntrega: new Date(loteDataEntrega).toISOString(),
        nfe: loteNfe || null,
        ticket: loteTicket || null,
        preco: lotePreco ? parseFloat(lotePreco) : null,
      };

      setTalhao((prev) =>
        prev
          ? {
              ...prev,
              lotes: [newLote, ...prev.lotes],
              compliance: Math.min(
                prev.compliance + (loteNfe && !prev.complianceDetails.loteVinculadoNfe ? 25 : 0),
                100
              ),
              complianceDetails: {
                ...prev.complianceDetails,
                loteVinculadoNfe: prev.complianceDetails.loteVinculadoNfe || !!loteNfe,
              },
            }
          : prev
      );

      setLoteOpen(false);
      resetLoteForm();
    } catch {
      // Silently fail
    } finally {
      setSaving(false);
    }
  };

  const resetAplicacaoForm = () => {
    setAppTipo("HERBICIDA");
    setAppProduto("");
    setAppFabricante("");
    setAppDose("");
    setAppUnidade("L/ha");
    setAppData("");
    setAppOperador("");
    setAppNota("");
  };

  const resetLoteForm = () => {
    setLoteNumero("");
    setLotePeso("");
    setLoteDestino("");
    setLoteDataEntrega("");
    setLoteNfe("");
    setLoteTicket("");
    setLotePreco("");
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="text-brand-accent text-4xl animate-pulse">&#x2B21;</span>
          <p className="text-brand-muted text-sm">Carregando talhão...</p>
        </div>
      </div>
    );
  }

  if (!talhao) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-brand-muted">Talhão não encontrado.</p>
      </div>
    );
  }

  const markers: MapMarker[] =
    talhao.latitude && talhao.longitude
      ? [{ id: talhao.id, lat: talhao.latitude, lng: talhao.longitude, label: talhao.nome }]
      : [];

  const mapCenter: [number, number] =
    talhao.latitude && talhao.longitude
      ? [talhao.latitude, talhao.longitude]
      : [-28.2622, -52.4083];

  const complianceItems = [
    { label: "Georreferenciado", done: talhao.complianceDetails.georeferenciado, points: 25 },
    { label: "Aplicações registradas", done: talhao.complianceDetails.aplicacoesRegistradas, points: 30 },
    { label: "Lote vinculado NF-e", done: talhao.complianceDetails.loteVinculadoNfe, points: 25 },
    { label: "Relatório EUDR", done: talhao.complianceDetails.relatorioEudr, points: 20 },
  ];

  const inputClass =
    "bg-brand-alt border-brand-border text-brand-text placeholder:text-brand-muted/50 focus-visible:ring-brand-accent";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-display text-brand-text">
                {talhao.nome}
              </h1>
              <Badge
                variant="outline"
                className={statusColors[talhao.status] || statusColors.ATIVO}
              >
                {talhao.status}
              </Badge>
            </div>
            <p className="text-sm text-brand-muted mt-0.5">
              {talhao.propriedade.nome} &mdash; {talhao.cultura} &mdash; Safra {talhao.safra}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={aplicacaoOpen} onOpenChange={setAplicacaoOpen}>
            <DialogTrigger
              render={
                <Button className="bg-brand-accent text-brand-bg hover:bg-brand-accent/90 font-medium" />
              }
            >
              <Droplets className="h-4 w-4 mr-2" />
              Registrar Aplicação
            </DialogTrigger>
            <DialogContent className="bg-brand-surface border-brand-border sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-brand-text">Nova Aplicação</DialogTitle>
                <DialogDescription className="text-brand-muted">
                  Registre uma aplicação de insumo neste talhão.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-brand-text text-sm">Tipo *</Label>
                    <Select value={appTipo} onValueChange={(v) => v !== null && setAppTipo(v)}>
                      <SelectTrigger className={`${inputClass} w-full`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-brand-surface border-brand-border">
                        {tiposAplicacao.map((t) => (
                          <SelectItem key={t.value} value={t.value} className="text-brand-text hover:bg-brand-alt">
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-brand-text text-sm">Produto *</Label>
                    <Input
                      value={appProduto}
                      onChange={(e) => setAppProduto(e.target.value)}
                      placeholder="Ex: Glifosato 480 SL"
                      className={inputClass}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-brand-text text-sm">Fabricante</Label>
                    <Input
                      value={appFabricante}
                      onChange={(e) => setAppFabricante(e.target.value)}
                      placeholder="Ex: Nortox"
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-brand-text text-sm">Dose *</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        step="0.1"
                        value={appDose}
                        onChange={(e) => setAppDose(e.target.value)}
                        placeholder="3.0"
                        className={`${inputClass} font-mono flex-1`}
                      />
                      <Input
                        value={appUnidade}
                        onChange={(e) => setAppUnidade(e.target.value)}
                        placeholder="L/ha"
                        className={`${inputClass} w-20`}
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-brand-text text-sm">Data *</Label>
                    <Input
                      type="date"
                      value={appData}
                      onChange={(e) => setAppData(e.target.value)}
                      className={`${inputClass} font-mono`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-brand-text text-sm">Operador *</Label>
                    <Input
                      value={appOperador}
                      onChange={(e) => setAppOperador(e.target.value)}
                      placeholder="Nome do operador"
                      className={inputClass}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-brand-text text-sm">Observações</Label>
                  <Textarea
                    value={appNota}
                    onChange={(e) => setAppNota(e.target.value)}
                    placeholder="Notas adicionais..."
                    rows={2}
                    className={inputClass}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleSubmitAplicacao}
                  disabled={saving || !appProduto || !appDose || !appData || !appOperador}
                  className="bg-brand-accent text-brand-bg hover:bg-brand-accent/90 font-medium"
                >
                  {saving ? "Salvando..." : "Salvar Aplicação"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={loteOpen} onOpenChange={setLoteOpen}>
            <DialogTrigger
              render={
                <Button
                  variant="outline"
                  className="border-brand-border text-brand-text hover:bg-brand-alt"
                />
              }
            >
              <Package className="h-4 w-4 mr-2" />
              Registrar Entrega
            </DialogTrigger>
            <DialogContent className="bg-brand-surface border-brand-border sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-brand-text">Novo Lote / Entrega</DialogTitle>
                <DialogDescription className="text-brand-muted">
                  Registre uma entrega de produção deste talhão.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-brand-text text-sm">Número do Lote *</Label>
                    <Input
                      value={loteNumero}
                      onChange={(e) => setLoteNumero(e.target.value)}
                      placeholder="LT-2026-001"
                      className={`${inputClass} font-mono`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-brand-text text-sm">Peso (kg) *</Label>
                    <Input
                      type="number"
                      value={lotePeso}
                      onChange={(e) => setLotePeso(e.target.value)}
                      placeholder="5130"
                      className={`${inputClass} font-mono`}
                    />
                    {lotePeso && (
                      <p className="text-xs text-brand-muted">
                        = <span className="font-mono text-brand-accent">{loteSacas}</span> sacas (60kg)
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-brand-text text-sm">Destino *</Label>
                    <Input
                      value={loteDestino}
                      onChange={(e) => setLoteDestino(e.target.value)}
                      placeholder="Cotripal Não-Me-Toque"
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-brand-text text-sm">Data da Entrega *</Label>
                    <Input
                      type="date"
                      value={loteDataEntrega}
                      onChange={(e) => setLoteDataEntrega(e.target.value)}
                      className={`${inputClass} font-mono`}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-brand-text text-sm">NF-e</Label>
                    <Input
                      value={loteNfe}
                      onChange={(e) => setLoteNfe(e.target.value)}
                      placeholder="NF-e 001234"
                      className={`${inputClass} font-mono`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-brand-text text-sm">Ticket</Label>
                    <Input
                      value={loteTicket}
                      onChange={(e) => setLoteTicket(e.target.value)}
                      placeholder="TK-8891"
                      className={`${inputClass} font-mono`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-brand-text text-sm">Preço (R$/sc)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={lotePreco}
                      onChange={(e) => setLotePreco(e.target.value)}
                      placeholder="132.50"
                      className={`${inputClass} font-mono`}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleSubmitLote}
                  disabled={saving || !loteNumero || !lotePeso || !loteDestino || !loteDataEntrega}
                  className="bg-brand-accent text-brand-bg hover:bg-brand-accent/90 font-medium"
                >
                  {saving ? "Salvando..." : "Salvar Entrega"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Map + General Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Map */}
        <Card className="bg-brand-surface border-brand-border overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-brand-text text-base flex items-center gap-2">
              <MapPin className="h-4 w-4 text-brand-accent" />
              Localização
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[250px]">
              <LeafletMap
                center={mapCenter}
                zoom={14}
                markers={markers}
              />
            </div>
            {talhao.latitude && talhao.longitude && (
              <div className="px-4 py-2 flex gap-4 text-xs border-t border-brand-border">
                <span className="text-brand-muted">
                  Lat: <span className="text-brand-text font-mono">{talhao.latitude.toFixed(6)}</span>
                </span>
                <span className="text-brand-muted">
                  Lng: <span className="text-brand-text font-mono">{talhao.longitude.toFixed(6)}</span>
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* General Data + Compliance */}
        <div className="space-y-4">
          <Card className="bg-brand-surface border-brand-border">
            <CardHeader>
              <CardTitle className="text-brand-text text-base">
                Dados Gerais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
                <div>
                  <span className="text-brand-muted">Cultura</span>
                  <p className="text-brand-text font-medium">{talhao.cultura}</p>
                </div>
                <div>
                  <span className="text-brand-muted">Safra</span>
                  <p className="text-brand-text font-mono">{talhao.safra}</p>
                </div>
                <div>
                  <span className="text-brand-muted">Área</span>
                  <p className="text-brand-text font-mono font-medium">{talhao.area.toFixed(1)} ha</p>
                </div>
                <div>
                  <span className="text-brand-muted">Propriedade</span>
                  <p className="text-brand-text">{talhao.propriedade.nome}</p>
                </div>
                <div>
                  <span className="text-brand-muted">Aplicações</span>
                  <p className="text-brand-text font-mono">{talhao.aplicacoes.length}</p>
                </div>
                <div>
                  <span className="text-brand-muted">Lotes</span>
                  <p className="text-brand-text font-mono">{talhao.lotes.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-brand-surface border-brand-border">
            <CardHeader>
              <CardTitle className="text-brand-text text-base flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-brand-gold" />
                Compliance EUDR
                <span className="ml-auto font-mono text-lg">
                  <span
                    className={
                      talhao.compliance >= 80
                        ? "text-brand-accent"
                        : talhao.compliance >= 50
                        ? "text-brand-gold"
                        : "text-red-400"
                    }
                  >
                    {talhao.compliance}%
                  </span>
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Progress
                value={talhao.compliance}
                className="h-2 bg-brand-alt [&>div]:bg-brand-accent"
              />
              {complianceItems.map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-sm">
                  {item.done ? (
                    <CheckCircle2 className="h-4 w-4 text-brand-accent shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-brand-muted shrink-0" />
                  )}
                  <span className={item.done ? "text-brand-text" : "text-brand-muted"}>
                    {item.label}
                  </span>
                  <span className="ml-auto font-mono text-xs text-brand-muted">
                    +{item.points}%
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Timeline de Aplicações */}
      <Card className="bg-brand-surface border-brand-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-brand-text text-base flex items-center gap-2">
              <Droplets className="h-4 w-4 text-brand-accent" />
              Aplicações ({talhao.aplicacoes.length})
            </CardTitle>
            <Link href="/rastreabilidade/aplicacoes">
              <Button
                variant="ghost"
                size="sm"
                className="text-brand-accent hover:text-brand-accent hover:bg-brand-alt text-xs"
              >
                Ver todas
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {talhao.aplicacoes.length === 0 ? (
            <p className="text-brand-muted text-sm text-center py-6">
              Nenhuma aplicação registrada ainda.
            </p>
          ) : (
            <div className="space-y-3">
              {talhao.aplicacoes.map((app, idx) => (
                <div
                  key={app.id}
                  className="flex items-start gap-4 p-3 rounded-lg bg-brand-alt relative"
                >
                  {/* Timeline line */}
                  {idx < talhao.aplicacoes.length - 1 && (
                    <div className="absolute left-[29px] top-[44px] bottom-[-12px] w-px bg-brand-border" />
                  )}
                  <div className="flex flex-col items-center shrink-0">
                    <div className="w-3 h-3 rounded-full bg-brand-accent mt-1" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant="outline"
                        className={tipoColors[app.tipo] || tipoColors.OUTRO}
                      >
                        {app.tipo}
                      </Badge>
                      <span className="text-brand-text text-sm font-medium">
                        {app.produto}
                      </span>
                      {app.fabricante && (
                        <span className="text-brand-muted text-xs">({app.fabricante})</span>
                      )}
                    </div>
                    <div className="flex gap-4 mt-1 text-xs text-brand-muted">
                      <span className="font-mono">
                        {app.dose} {app.unidade}
                      </span>
                      <span>{app.operador}</span>
                      <span className="font-mono">
                        {new Date(app.data).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    {app.nota && (
                      <p className="text-xs text-brand-muted mt-1 italic">
                        {app.nota}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lotes / Entregas */}
      <Card className="bg-brand-surface border-brand-border">
        <CardHeader>
          <CardTitle className="text-brand-text text-base flex items-center gap-2">
            <Package className="h-4 w-4 text-brand-gold" />
            Lotes / Entregas ({talhao.lotes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {talhao.lotes.length === 0 ? (
            <p className="text-brand-muted text-sm text-center py-6">
              Nenhum lote registrado ainda.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-brand-border hover:bg-transparent">
                    <TableHead className="text-brand-muted">Lote</TableHead>
                    <TableHead className="text-brand-muted">Peso (kg)</TableHead>
                    <TableHead className="text-brand-muted">Sacas</TableHead>
                    <TableHead className="text-brand-muted">Destino</TableHead>
                    <TableHead className="text-brand-muted">Data</TableHead>
                    <TableHead className="text-brand-muted">NF-e</TableHead>
                    <TableHead className="text-brand-muted">Ticket</TableHead>
                    <TableHead className="text-brand-muted">Preço (R$/sc)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {talhao.lotes.map((lote) => (
                    <TableRow
                      key={lote.id}
                      className="border-brand-border hover:bg-brand-alt/50"
                    >
                      <TableCell className="text-brand-text font-mono font-medium">
                        {lote.numeroLote}
                      </TableCell>
                      <TableCell className="text-brand-text font-mono">
                        {lote.peso.toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-brand-text font-mono">
                        {lote.sacas.toFixed(1)}
                      </TableCell>
                      <TableCell className="text-brand-text">
                        {lote.destino}
                      </TableCell>
                      <TableCell className="text-brand-text font-mono">
                        {new Date(lote.dataEntrega).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        {lote.nfe ? (
                          <Badge variant="outline" className="border-brand-accent text-brand-accent font-mono">
                            {lote.nfe}
                          </Badge>
                        ) : (
                          <span className="text-brand-muted">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-brand-muted font-mono">
                        {lote.ticket || "—"}
                      </TableCell>
                      <TableCell className="text-brand-text font-mono font-medium">
                        {lote.preco ? `R$ ${lote.preco.toFixed(2)}` : "—"}
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
