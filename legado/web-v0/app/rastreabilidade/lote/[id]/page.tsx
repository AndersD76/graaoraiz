"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  MapPin,
  Droplets,
  Package,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Leaf,
} from "lucide-react";

interface Aplicacao {
  id: string;
  tipo: string;
  produto: string;
  fabricante: string | null;
  dose: number;
  unidade: string;
  data: string;
  operador: string;
}

interface LotePublic {
  id: string;
  numeroLote: string;
  peso: number;
  sacas: number;
  destino: string;
  dataEntrega: string;
  nfe: string | null;
  ticket: string | null;
  createdAt: string;
  talhao: {
    id: string;
    nome: string;
    area: number;
    cultura: string;
    safra: string;
    latitude: number | null;
    longitude: number | null;
    propriedade: {
      nome: string;
      municipio: string;
      estado: string;
    };
    aplicacoes: Aplicacao[];
  };
  compliance: number;
  complianceDetails: {
    georeferenciado: boolean;
    aplicacoesRegistradas: boolean;
    loteVinculadoNfe: boolean;
    relatorioEudr: boolean;
  };
}

const tipoColors: Record<string, string> = {
  HERBICIDA: "border-green-500 text-green-400",
  FUNGICIDA: "border-blue-500 text-blue-400",
  INSETICIDA: "border-red-400 text-red-400",
  FERTILIZANTE: "border-yellow-500 text-yellow-400",
  SEMENTE: "border-purple-400 text-purple-400",
  OUTRO: "border-gray-400 text-gray-400",
};

export default function LotePublicPage() {
  const params = useParams();
  const id = params.id as string;

  const [lote, setLote] = useState<LotePublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/lotes/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        if (data.lote) {
          setLote(data.lote);
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="text-[#4ade80] text-4xl animate-pulse">&#x2B21;</span>
          <p className="text-[#a3a3a3] text-sm">Carregando rastreabilidade...</p>
        </div>
      </div>
    );
  }

  if (error || !lote) {
    return (
      <div className="min-h-screen bg-[#0f1a0f] flex items-center justify-center px-4">
        <div className="text-center">
          <Leaf className="h-12 w-12 text-[#4ade80] mx-auto mb-4" />
          <h1 className="text-xl font-bold text-[#e5e5e5] mb-2">
            Lote nao encontrado
          </h1>
          <p className="text-[#a3a3a3] text-sm">
            O lote solicitado nao existe ou foi removido.
          </p>
        </div>
      </div>
    );
  }

  const complianceColor =
    lote.compliance >= 80
      ? "text-[#4ade80]"
      : lote.compliance >= 50
      ? "text-[#facc15]"
      : "text-red-400";

  const complianceItems = [
    { label: "Georreferenciado", done: lote.complianceDetails.georeferenciado },
    { label: "Aplicacoes registradas", done: lote.complianceDetails.aplicacoesRegistradas },
    { label: "Lote vinculado NF-e", done: lote.complianceDetails.loteVinculadoNfe },
    { label: "Relatorio EUDR", done: lote.complianceDetails.relatorioEudr },
  ];

  return (
    <div className="min-h-screen bg-[#0f1a0f]">
      {/* Header */}
      <header className="border-b border-[#2a3a2a] bg-[#162016]">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Leaf className="h-6 w-6 text-[#4ade80]" />
          <div>
            <h1 className="text-lg font-bold text-[#e5e5e5]">
              GraoRaiz - Rastreabilidade
            </h1>
            <p className="text-xs text-[#a3a3a3]">
              Verificacao publica de origem e conformidade
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Lote Info */}
        <div className="bg-[#162016] border border-[#2a3a2a] rounded-lg p-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Package className="h-5 w-5 text-[#facc15]" />
                <h2 className="text-xl font-bold text-[#e5e5e5] font-mono">
                  {lote.numeroLote}
                </h2>
              </div>
              <p className="text-sm text-[#a3a3a3]">
                {lote.talhao.propriedade.nome} &mdash;{" "}
                {lote.talhao.propriedade.municipio}/{lote.talhao.propriedade.estado}
              </p>
            </div>
            <div className="text-right">
              <span
                className={`text-2xl font-bold font-mono ${complianceColor}`}
              >
                {lote.compliance}%
              </span>
              <p className="text-xs text-[#a3a3a3]">EUDR Compliance</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-[#a3a3a3] text-xs">Cultura</span>
              <p className="text-[#e5e5e5] font-medium">{lote.talhao.cultura}</p>
            </div>
            <div>
              <span className="text-[#a3a3a3] text-xs">Safra</span>
              <p className="text-[#e5e5e5] font-mono">{lote.talhao.safra}</p>
            </div>
            <div>
              <span className="text-[#a3a3a3] text-xs">Talhao</span>
              <p className="text-[#e5e5e5]">{lote.talhao.nome}</p>
            </div>
            <div>
              <span className="text-[#a3a3a3] text-xs">Area</span>
              <p className="text-[#e5e5e5] font-mono">{lote.talhao.area.toFixed(1)} ha</p>
            </div>
            <div>
              <span className="text-[#a3a3a3] text-xs">Peso</span>
              <p className="text-[#e5e5e5] font-mono">
                {lote.peso.toLocaleString("pt-BR")} kg
              </p>
            </div>
            <div>
              <span className="text-[#a3a3a3] text-xs">Sacas</span>
              <p className="text-[#e5e5e5] font-mono">{lote.sacas.toFixed(1)}</p>
            </div>
            <div>
              <span className="text-[#a3a3a3] text-xs">Destino</span>
              <p className="text-[#e5e5e5]">{lote.destino}</p>
            </div>
            <div>
              <span className="text-[#a3a3a3] text-xs">Entrega</span>
              <p className="text-[#e5e5e5] font-mono">
                {new Date(lote.dataEntrega).toLocaleDateString("pt-BR")}
              </p>
            </div>
          </div>

          {(lote.nfe || lote.ticket) && (
            <div className="flex gap-4 mt-4 pt-3 border-t border-[#2a3a2a]">
              {lote.nfe && (
                <div>
                  <span className="text-[#a3a3a3] text-xs">NF-e</span>
                  <p className="text-[#4ade80] font-mono text-sm">{lote.nfe}</p>
                </div>
              )}
              {lote.ticket && (
                <div>
                  <span className="text-[#a3a3a3] text-xs">Ticket</span>
                  <p className="text-[#e5e5e5] font-mono text-sm">{lote.ticket}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Coordenadas */}
        {lote.talhao.latitude && lote.talhao.longitude && (
          <div className="bg-[#162016] border border-[#2a3a2a] rounded-lg p-5">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-4 w-4 text-[#4ade80]" />
              <h3 className="text-sm font-semibold text-[#e5e5e5]">
                Georreferenciamento
              </h3>
            </div>
            <div className="flex gap-6 text-sm">
              <div>
                <span className="text-[#a3a3a3] text-xs">Latitude</span>
                <p className="text-[#e5e5e5] font-mono">
                  {lote.talhao.latitude.toFixed(6)}
                </p>
              </div>
              <div>
                <span className="text-[#a3a3a3] text-xs">Longitude</span>
                <p className="text-[#e5e5e5] font-mono">
                  {lote.talhao.longitude.toFixed(6)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Compliance EUDR */}
        <div className="bg-[#162016] border border-[#2a3a2a] rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="h-4 w-4 text-[#facc15]" />
            <h3 className="text-sm font-semibold text-[#e5e5e5]">
              Compliance EUDR
            </h3>
            <span className={`ml-auto font-mono text-lg font-bold ${complianceColor}`}>
              {lote.compliance}%
            </span>
          </div>
          <div className="w-full bg-[#1a2e1a] rounded-full h-2 mb-4">
            <div
              className="bg-[#4ade80] h-2 rounded-full transition-all"
              style={{ width: `${lote.compliance}%` }}
            />
          </div>
          <div className="space-y-2">
            {complianceItems.map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-sm">
                {item.done ? (
                  <CheckCircle2 className="h-4 w-4 text-[#4ade80] shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-[#666] shrink-0" />
                )}
                <span className={item.done ? "text-[#e5e5e5]" : "text-[#666]"}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Aplicacoes */}
        <div className="bg-[#162016] border border-[#2a3a2a] rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <Droplets className="h-4 w-4 text-[#4ade80]" />
            <h3 className="text-sm font-semibold text-[#e5e5e5]">
              Historico de Aplicacoes ({lote.talhao.aplicacoes.length})
            </h3>
          </div>
          {lote.talhao.aplicacoes.length === 0 ? (
            <p className="text-[#a3a3a3] text-sm text-center py-4">
              Nenhuma aplicacao registrada.
            </p>
          ) : (
            <div className="space-y-3">
              {lote.talhao.aplicacoes.map((app) => (
                <div
                  key={app.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-[#1a2e1a]"
                >
                  <div className="w-2 h-2 rounded-full bg-[#4ade80] mt-2 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-xs px-2 py-0.5 rounded border ${
                          tipoColors[app.tipo] || tipoColors.OUTRO
                        }`}
                      >
                        {app.tipo}
                      </span>
                      <span className="text-[#e5e5e5] text-sm font-medium">
                        {app.produto}
                      </span>
                      {app.fabricante && (
                        <span className="text-[#a3a3a3] text-xs">
                          ({app.fabricante})
                        </span>
                      )}
                    </div>
                    <div className="flex gap-4 mt-1 text-xs text-[#a3a3a3]">
                      <span className="font-mono">
                        {app.dose} {app.unidade}
                      </span>
                      <span>{app.operador}</span>
                      <span className="font-mono">
                        {new Date(app.data).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center py-6 border-t border-[#2a3a2a]">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Leaf className="h-4 w-4 text-[#4ade80]" />
            <span className="text-sm font-semibold text-[#e5e5e5]">GraoRaiz</span>
          </div>
          <p className="text-xs text-[#a3a3a3]">
            Rastreabilidade de graos &mdash; Do campo a mesa com transparencia.
          </p>
          <p className="text-xs text-[#666] mt-1">
            Verificado em{" "}
            {new Date().toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </main>
    </div>
  );
}
