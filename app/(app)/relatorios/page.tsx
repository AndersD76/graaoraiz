"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Download,
  Eye,
  CheckCircle2,
  MapPin,
  SprayCan,
  Package,
  Shield,
  QrCode,
} from "lucide-react";

interface TalhaoOption {
  id: string;
  nome: string;
  cultura: string;
  area: number;
  compliance: number;
}

const mockTalhoes: TalhaoOption[] = [
  { id: "1", nome: "Talhão Norte", cultura: "SOJA", area: 85, compliance: 100 },
  { id: "2", nome: "Talhão Sul", cultura: "SOJA", area: 120, compliance: 75 },
  { id: "3", nome: "Talhão Leste", cultura: "MILHO", area: 65, compliance: 50 },
  { id: "4", nome: "Talhão Oeste", cultura: "TRIGO", area: 72, compliance: 25 },
];

const relatoriosGerados = [
  {
    id: "1",
    data: "10/03/2026",
    safra: "2025/26",
    talhoes: 3,
    status: "completo",
  },
  {
    id: "2",
    data: "15/02/2026",
    safra: "2025/26",
    talhoes: 2,
    status: "completo",
  },
];

export default function RelatoriosPage() {
  const [safra, setSafra] = useState("2025/26");
  const [selectedTalhoes, setSelectedTalhoes] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  function toggleTalhao(id: string) {
    setSelectedTalhoes((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-display text-brand-text">
          Relatórios EUDR
        </h2>
        <p className="text-sm text-brand-muted mt-1">
          Gere relatórios de conformidade para exportação de grãos à União
          Europeia
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuração */}
        <Card className="lg:col-span-2 bg-brand-surface border-brand-border">
          <CardHeader>
            <CardTitle className="text-brand-text text-base">
              Gerar Novo Relatório
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-brand-muted text-xs">Safra</Label>
              <Select value={safra} onValueChange={(v) => v !== null && setSafra(v)}>
                <SelectTrigger className="bg-brand-alt border-brand-border text-brand-text mt-1 w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-brand-surface border-brand-border">
                  <SelectItem value="2025/26">2025/26</SelectItem>
                  <SelectItem value="2024/25">2024/25</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-brand-muted text-xs mb-2 block">
                Selecione os talhões
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {mockTalhoes.map((talhao) => (
                  <button
                    key={talhao.id}
                    onClick={() => toggleTalhao(talhao.id)}
                    className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                      selectedTalhoes.includes(talhao.id)
                        ? "border-brand-accent bg-brand-accent/10"
                        : "border-brand-border bg-brand-alt hover:border-brand-muted"
                    }`}
                  >
                    <div
                      className={`h-5 w-5 rounded border flex items-center justify-center ${
                        selectedTalhoes.includes(talhao.id)
                          ? "bg-brand-accent border-brand-accent"
                          : "border-brand-border"
                      }`}
                    >
                      {selectedTalhoes.includes(talhao.id) && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-brand-bg" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-brand-text">
                        {talhao.nome}
                      </p>
                      <p className="text-xs text-brand-muted">
                        {talhao.cultura} · {talhao.area} ha · Compliance{" "}
                        {talhao.compliance}%
                      </p>
                    </div>
                    <Badge
                      className={`text-[10px] ${
                        talhao.compliance === 100
                          ? "bg-brand-accent/20 text-brand-accent border-0"
                          : talhao.compliance >= 50
                          ? "bg-brand-gold/20 text-brand-gold border-0"
                          : "bg-red-500/20 text-red-400 border-0"
                      }`}
                    >
                      {talhao.compliance}%
                    </Badge>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                className="bg-brand-accent text-brand-bg hover:bg-brand-dim"
                disabled={selectedTalhoes.length === 0}
                onClick={() => setShowPreview(true)}
              >
                <Eye className="h-4 w-4 mr-2" />
                Visualizar Relatório
              </Button>
              <Button
                variant="outline"
                className="border-brand-border text-brand-text hover:bg-brand-alt"
                disabled={selectedTalhoes.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar PDF
              </Button>
              <Button
                variant="outline"
                className="border-brand-border text-brand-text hover:bg-brand-alt"
                disabled={selectedTalhoes.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar JSON
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Relatórios anteriores */}
        <Card className="bg-brand-surface border-brand-border">
          <CardHeader>
            <CardTitle className="text-brand-text text-base">
              Relatórios Gerados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {relatoriosGerados.map((rel) => (
              <div
                key={rel.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-brand-alt"
              >
                <FileText className="h-5 w-5 text-brand-accent shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-brand-text">
                    Safra {rel.safra} · {rel.talhoes} talhões
                  </p>
                  <p className="text-xs text-brand-muted">{rel.data}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-brand-muted hover:text-brand-text h-8 w-8"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Preview do relatório */}
      {showPreview && selectedTalhoes.length > 0 && (
        <Card className="bg-brand-surface border-brand-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-brand-text text-base">
                Preview — Relatório EUDR
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(false)}
                className="text-brand-muted"
              >
                Fechar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-brand-bg rounded-lg p-6 space-y-6 border border-brand-border">
              {/* Header */}
              <div className="text-center border-b border-brand-border pb-4">
                <h3 className="text-lg font-display text-brand-accent">
                  RELATÓRIO DE CONFORMIDADE EUDR
                </h3>
                <p className="text-sm text-brand-muted mt-1">
                  Regulamento (UE) 2023/1115
                </p>
                <p className="text-xs text-brand-muted mt-1">
                  Gerado em{" "}
                  {new Date().toLocaleDateString("pt-BR")} · Safra {safra}
                </p>
              </div>

              {/* Seções */}
              <div className="space-y-4">
                <ReportSection
                  icon={MapPin}
                  title="1. Identificação da Propriedade"
                  items={[
                    "Propriedade: Fazenda São Luís",
                    "CAR: RS-4314902-XXXXXXXX",
                    "NIRF: 0.000.000-0",
                    "Município: Passo Fundo — RS",
                    "Coordenadas: -28.2622, -52.4083",
                  ]}
                />
                <ReportSection
                  icon={MapPin}
                  title="2. Talhões Incluídos"
                  items={selectedTalhoes.map((id) => {
                    const t = mockTalhoes.find((x) => x.id === id);
                    return t
                      ? `${t.nome} — ${t.cultura} — ${t.area} ha — Georreferenciado`
                      : "";
                  })}
                />
                <ReportSection
                  icon={SprayCan}
                  title="3. Histórico de Aplicações"
                  items={[
                    "12/01/2026 — Glifosato 2.5 L/ha — Operador: João Silva",
                    "28/01/2026 — Azoxistrobina 0.3 L/ha — Operador: João Silva",
                    "15/02/2026 — Adubo NPK 300 kg/ha — Operador: Carlos",
                  ]}
                />
                <ReportSection
                  icon={Package}
                  title="4. Lotes Vinculados"
                  items={[
                    "Lote 2026-001 — 45.000 kg (750 sacas) — NF-e 123456 — Cotripal",
                    "Lote 2026-002 — 38.000 kg (633 sacas) — NF-e 123457 — C.Vale",
                  ]}
                />
                <ReportSection
                  icon={Shield}
                  title="5. Declaração de Conformidade"
                  items={[
                    "Declaro que os produtos acima foram produzidos em conformidade com o Regulamento EUDR (UE) 2023/1115.",
                    "Nenhuma área de produção está localizada em área desmatada após 31/12/2020.",
                    "Todos os dados são verificáveis e auditáveis.",
                  ]}
                />
              </div>

              {/* QR Code placeholder */}
              <div className="flex items-center justify-center pt-4 border-t border-brand-border">
                <div className="text-center">
                  <QrCode className="h-16 w-16 text-brand-muted mx-auto" />
                  <p className="text-xs text-brand-muted mt-2">
                    QR Code de verificação
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ReportSection({
  icon: Icon,
  title,
  items,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  items: string[];
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4 text-brand-accent" />
        <h4 className="text-sm font-medium text-brand-text">{title}</h4>
      </div>
      <ul className="space-y-1 ml-6">
        {items.map((item, i) => (
          <li key={i} className="text-xs text-brand-muted">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
