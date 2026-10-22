"use client";

import { useState, useRef } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  Download,
  Eye,
  MapPin,
  SprayCan,
  Package,
  Shield,
  QrCode,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface Aplicacao {
  tipo: string;
  produto: string;
  fabricante: string | null;
  dose: number;
  unidade: string;
  data: string;
  operador: string;
}

interface Lote {
  numeroLote: string;
  peso: number;
  sacas: number;
  destino: string;
  dataEntrega: string;
  nfe: string | null;
  ticket: string | null;
}

interface TalhaoRelatorio {
  nome: string;
  area: number;
  cultura: string;
  coordenadas: {
    latitude: number | null;
    longitude: number | null;
    geojson: unknown;
  };
  aplicacoes: Aplicacao[];
  lotes: Lote[];
}

interface Relatorio {
  versao: string;
  geradoEm: string;
  regulamento: string;
  propriedade: {
    nome: string;
    municipio: string;
    estado: string;
    areaTotal: number;
    car: string | null;
    nirf: string | null;
  };
  safra: string;
  talhoes: TalhaoRelatorio[];
  declaracao: string;
}

export default function RelatoriosPage() {
  const [safra, setSafra] = useState("2025/26");
  const [relatorio, setRelatorio] = useState<Relatorio | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  async function gerarRelatorio() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/relatorios?safra=${encodeURIComponent(safra)}&formato=preview`
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao gerar relatório");
      }
      const data: Relatorio = await res.json();
      setRelatorio(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao gerar relatório"
      );
      setRelatorio(null);
    } finally {
      setLoading(false);
    }
  }

  async function exportarJSON() {
    try {
      const res = await fetch(
        `/api/relatorios?safra=${encodeURIComponent(safra)}&formato=json`
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao exportar JSON");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `relatorio-eudr-${safra.replace("/", "-")}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao exportar JSON"
      );
    }
  }

  function exportarPDF() {
    if (!printRef.current) return;

    const printContents = printRef.current.innerHTML;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Relatório EUDR - Safra ${safra}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            color: #1a1a1a;
            padding: 40px;
            line-height: 1.6;
          }
          .report-header {
            text-align: center;
            border-bottom: 2px solid #16a34a;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .report-header h1 {
            color: #16a34a;
            font-size: 22px;
            margin-bottom: 4px;
          }
          .report-header p { color: #666; font-size: 13px; }
          .section { margin-bottom: 24px; }
          .section-title {
            font-size: 15px;
            font-weight: 600;
            color: #16a34a;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 6px;
            margin-bottom: 12px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
          }
          .info-item { font-size: 13px; }
          .info-label { color: #666; }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
            margin-top: 8px;
          }
          th, td {
            border: 1px solid #e5e7eb;
            padding: 6px 10px;
            text-align: left;
          }
          th { background: #f3f4f6; font-weight: 600; }
          .declaration {
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 8px;
            padding: 16px;
            font-size: 13px;
            color: #166534;
          }
          @media print {
            body { padding: 20px; }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        ${printContents}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 300);
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("pt-BR");
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

      {/* Configuração */}
      <Card className="bg-brand-surface border-brand-border">
        <CardHeader>
          <CardTitle className="text-brand-text text-base">
            Gerar Relatório de Conformidade
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-brand-muted text-xs">Safra</Label>
            <Select value={safra} onValueChange={setSafra}>
              <SelectTrigger className="bg-brand-alt border-brand-border text-brand-text mt-1 w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-brand-surface border-brand-border">
                <SelectItem value="2025/26">2025/26</SelectItem>
                <SelectItem value="2024/25">2024/25</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              className="bg-brand-accent text-brand-bg hover:bg-brand-dim"
              onClick={gerarRelatorio}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Eye className="h-4 w-4 mr-2" />
              )}
              Gerar Relatório
            </Button>
            <Button
              variant="outline"
              className="border-brand-border text-brand-text hover:bg-brand-alt"
              onClick={exportarPDF}
              disabled={!relatorio}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
            <Button
              variant="outline"
              className="border-brand-border text-brand-text hover:bg-brand-alt"
              onClick={exportarJSON}
              disabled={loading}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar JSON
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
            <div>
              <p className="text-sm text-red-400">{error}</p>
              <p className="text-xs text-brand-muted mt-1">
                Cadastre uma propriedade e talhões para gerar o relatório EUDR.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No data message */}
      {!relatorio && !error && !loading && (
        <Card className="bg-brand-surface border-brand-border">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-brand-muted mb-4" />
            <p className="text-sm text-brand-muted">
              Cadastre uma propriedade e talhões para gerar o relatório EUDR.
            </p>
            <p className="text-xs text-brand-muted mt-1">
              Clique em &quot;Gerar Relatório&quot; para visualizar os dados da
              safra selecionada.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Preview do relatório */}
      {relatorio && (
        <Card className="bg-brand-surface border-brand-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-brand-text text-base">
                Preview — Relatório EUDR
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge className="bg-brand-accent/20 text-brand-accent border-0 text-[10px]">
                  v{relatorio.versao}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRelatorio(null)}
                  className="text-brand-muted"
                >
                  Fechar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-brand-bg rounded-lg p-6 space-y-6 border border-brand-border">
              {/* Printable content */}
              <div ref={printRef}>
                {/* Header */}
                <div className="report-header text-center border-b border-brand-border pb-4">
                  <h1 className="text-lg font-display text-brand-accent">
                    RELATÓRIO DE CONFORMIDADE EUDR
                  </h1>
                  <p className="text-sm text-brand-muted mt-1">
                    {relatorio.regulamento}
                  </p>
                  <p className="text-xs text-brand-muted mt-1">
                    Gerado em {formatDate(relatorio.geradoEm)} — Safra{" "}
                    {relatorio.safra}
                  </p>
                </div>

                {/* 1. Identificação da Propriedade */}
                <div className="section mt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="h-4 w-4 text-brand-accent" />
                    <h4 className="section-title text-sm font-medium text-brand-text">
                      1. Identificação da Propriedade
                    </h4>
                  </div>
                  <div className="info-grid grid grid-cols-1 sm:grid-cols-2 gap-2 ml-6">
                    <div className="info-item text-xs">
                      <span className="info-label text-brand-muted">
                        Propriedade:{" "}
                      </span>
                      <span className="text-brand-text">
                        {relatorio.propriedade.nome}
                      </span>
                    </div>
                    <div className="info-item text-xs">
                      <span className="info-label text-brand-muted">
                        Município:{" "}
                      </span>
                      <span className="text-brand-text">
                        {relatorio.propriedade.municipio} —{" "}
                        {relatorio.propriedade.estado}
                      </span>
                    </div>
                    <div className="info-item text-xs">
                      <span className="info-label text-brand-muted">
                        CAR:{" "}
                      </span>
                      <span className="text-brand-text">
                        {relatorio.propriedade.car || "Não informado"}
                      </span>
                    </div>
                    <div className="info-item text-xs">
                      <span className="info-label text-brand-muted">
                        NIRF:{" "}
                      </span>
                      <span className="text-brand-text">
                        {relatorio.propriedade.nirf || "Não informado"}
                      </span>
                    </div>
                    <div className="info-item text-xs">
                      <span className="info-label text-brand-muted">
                        Área total:{" "}
                      </span>
                      <span className="text-brand-text">
                        {relatorio.propriedade.areaTotal} ha
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Talhões Incluídos */}
                <div className="section mt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="h-4 w-4 text-brand-accent" />
                    <h4 className="section-title text-sm font-medium text-brand-text">
                      2. Talhões Incluídos
                    </h4>
                  </div>
                  {relatorio.talhoes.length > 0 ? (
                    <div className="ml-6">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-brand-border">
                            <TableHead className="text-brand-muted text-xs">
                              Nome
                            </TableHead>
                            <TableHead className="text-brand-muted text-xs">
                              Cultura
                            </TableHead>
                            <TableHead className="text-brand-muted text-xs">
                              Área (ha)
                            </TableHead>
                            <TableHead className="text-brand-muted text-xs">
                              Latitude
                            </TableHead>
                            <TableHead className="text-brand-muted text-xs">
                              Longitude
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {relatorio.talhoes.map((t, i) => (
                            <TableRow
                              key={i}
                              className="border-brand-border"
                            >
                              <TableCell className="text-brand-text text-xs">
                                {t.nome}
                              </TableCell>
                              <TableCell className="text-brand-text text-xs">
                                <Badge className="bg-brand-accent/20 text-brand-accent border-0 text-[10px]">
                                  {t.cultura}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-brand-text text-xs">
                                {t.area}
                              </TableCell>
                              <TableCell className="text-brand-text text-xs">
                                {t.coordenadas.latitude ?? "—"}
                              </TableCell>
                              <TableCell className="text-brand-text text-xs">
                                {t.coordenadas.longitude ?? "—"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-xs text-brand-muted ml-6">
                      Nenhum talhão cadastrado para esta safra.
                    </p>
                  )}
                </div>

                {/* 3. Histórico de Aplicações */}
                <div className="section mt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <SprayCan className="h-4 w-4 text-brand-accent" />
                    <h4 className="section-title text-sm font-medium text-brand-text">
                      3. Histórico de Aplicações
                    </h4>
                  </div>
                  {relatorio.talhoes.some((t) => t.aplicacoes.length > 0) ? (
                    <div className="ml-6">
                      {relatorio.talhoes
                        .filter((t) => t.aplicacoes.length > 0)
                        .map((t, ti) => (
                          <div key={ti} className="mb-4">
                            <p className="text-xs font-medium text-brand-text mb-2">
                              {t.nome}
                            </p>
                            <Table>
                              <TableHeader>
                                <TableRow className="border-brand-border">
                                  <TableHead className="text-brand-muted text-xs">
                                    Data
                                  </TableHead>
                                  <TableHead className="text-brand-muted text-xs">
                                    Tipo
                                  </TableHead>
                                  <TableHead className="text-brand-muted text-xs">
                                    Produto
                                  </TableHead>
                                  <TableHead className="text-brand-muted text-xs">
                                    Dose
                                  </TableHead>
                                  <TableHead className="text-brand-muted text-xs">
                                    Operador
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {t.aplicacoes.map((a, ai) => (
                                  <TableRow
                                    key={ai}
                                    className="border-brand-border"
                                  >
                                    <TableCell className="text-brand-text text-xs">
                                      {formatDate(a.data)}
                                    </TableCell>
                                    <TableCell className="text-brand-text text-xs">
                                      {a.tipo}
                                    </TableCell>
                                    <TableCell className="text-brand-text text-xs">
                                      {a.produto}
                                      {a.fabricante
                                        ? ` (${a.fabricante})`
                                        : ""}
                                    </TableCell>
                                    <TableCell className="text-brand-text text-xs">
                                      {a.dose} {a.unidade}
                                    </TableCell>
                                    <TableCell className="text-brand-text text-xs">
                                      {a.operador}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-xs text-brand-muted ml-6">
                      Nenhuma aplicação registrada.
                    </p>
                  )}
                </div>

                {/* 4. Lotes Vinculados */}
                <div className="section mt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Package className="h-4 w-4 text-brand-accent" />
                    <h4 className="section-title text-sm font-medium text-brand-text">
                      4. Lotes Vinculados
                    </h4>
                  </div>
                  {relatorio.talhoes.some((t) => t.lotes.length > 0) ? (
                    <div className="ml-6">
                      {relatorio.talhoes
                        .filter((t) => t.lotes.length > 0)
                        .map((t, ti) => (
                          <div key={ti} className="mb-4">
                            <p className="text-xs font-medium text-brand-text mb-2">
                              {t.nome}
                            </p>
                            <Table>
                              <TableHeader>
                                <TableRow className="border-brand-border">
                                  <TableHead className="text-brand-muted text-xs">
                                    Lote
                                  </TableHead>
                                  <TableHead className="text-brand-muted text-xs">
                                    Peso (kg)
                                  </TableHead>
                                  <TableHead className="text-brand-muted text-xs">
                                    Sacas
                                  </TableHead>
                                  <TableHead className="text-brand-muted text-xs">
                                    Destino
                                  </TableHead>
                                  <TableHead className="text-brand-muted text-xs">
                                    NF-e
                                  </TableHead>
                                  <TableHead className="text-brand-muted text-xs">
                                    Data
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {t.lotes.map((l, li) => (
                                  <TableRow
                                    key={li}
                                    className="border-brand-border"
                                  >
                                    <TableCell className="text-brand-text text-xs">
                                      {l.numeroLote}
                                    </TableCell>
                                    <TableCell className="text-brand-text text-xs">
                                      {l.peso.toLocaleString("pt-BR")}
                                    </TableCell>
                                    <TableCell className="text-brand-text text-xs">
                                      {l.sacas.toLocaleString("pt-BR")}
                                    </TableCell>
                                    <TableCell className="text-brand-text text-xs">
                                      {l.destino}
                                    </TableCell>
                                    <TableCell className="text-brand-text text-xs">
                                      {l.nfe || "—"}
                                    </TableCell>
                                    <TableCell className="text-brand-text text-xs">
                                      {formatDate(l.dataEntrega)}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-xs text-brand-muted ml-6">
                      Nenhum lote vinculado.
                    </p>
                  )}
                </div>

                {/* 5. Declaração de Conformidade */}
                <div className="section mt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="h-4 w-4 text-brand-accent" />
                    <h4 className="section-title text-sm font-medium text-brand-text">
                      5. Declaração de Conformidade
                    </h4>
                  </div>
                  <div className="declaration ml-6 rounded-lg bg-brand-accent/10 border border-brand-accent/20 p-4">
                    <p className="text-xs text-brand-text leading-relaxed">
                      {relatorio.declaracao}
                    </p>
                    <p className="text-xs text-brand-muted mt-2">
                      Nenhuma área de produção está localizada em área desmatada
                      após 31/12/2020. Todos os dados são verificáveis e
                      auditáveis.
                    </p>
                  </div>
                </div>

                {/* QR Code placeholder */}
                <div className="flex items-center justify-center pt-6 mt-6 border-t border-brand-border">
                  <div className="text-center">
                    <QrCode className="h-16 w-16 text-brand-muted mx-auto" />
                    <p className="text-xs text-brand-muted mt-2">
                      QR Code de verificação
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
