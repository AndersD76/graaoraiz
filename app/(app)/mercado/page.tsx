"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Bell,
  RefreshCw,
} from "lucide-react";

interface Cotacao {
  cooperativa: string;
  municipio: string;
  preco: number;
  basis: number;
  atualizado: string;
}

const mockCotacoes: Cotacao[] = [
  {
    cooperativa: "Cotripal",
    municipio: "Panambi",
    preco: 132.5,
    basis: -2.3,
    atualizado: "14:30",
  },
  {
    cooperativa: "Cotrisa",
    municipio: "Sarandi",
    preco: 131.8,
    basis: -2.8,
    atualizado: "14:15",
  },
  {
    cooperativa: "C.Vale",
    municipio: "Passo Fundo",
    preco: 131.2,
    basis: -3.1,
    atualizado: "13:45",
  },
  {
    cooperativa: "Cotrijal",
    municipio: "Não-Me-Toque",
    preco: 130.9,
    basis: -3.4,
    atualizado: "14:00",
  },
  {
    cooperativa: "Coopasso",
    municipio: "Passo Fundo",
    preco: 130.5,
    basis: -3.7,
    atualizado: "13:30",
  },
];

export default function MercadoPage() {
  const [sacas, setSacas] = useState(1000);
  const [frete, setFrete] = useState(3.5);
  const [funrural, setFunrural] = useState(1.5);
  const [cbotPrice, setCbotPrice] = useState(1048.5);
  const [cbotVar, setCbotVar] = useState(0.75);
  const [dolar, setDolar] = useState(5.12);
  const [cotacoes, setCotacoes] = useState<Cotacao[]>(mockCotacoes);
  const [loading, setLoading] = useState(false);

  const melhorPreco = cotacoes.length > 0 ? cotacoes[0].preco : 0;

  useEffect(() => {
    fetchPrecos();
  }, []);

  async function fetchPrecos() {
    setLoading(true);
    try {
      const res = await fetch("/api/precos");
      if (res.ok) {
        const data = await res.json();
        if (data.cbot) setCbotPrice(data.cbot.preco);
        if (data.cbot) setCbotVar(data.cbot.variacao);
        if (data.dolar) setDolar(data.dolar.venda);
        if (data.cotacoes?.length) setCotacoes(data.cotacoes);
      }
    } catch {
      // Use mock data
    } finally {
      setLoading(false);
    }
  }

  const bruto = sacas * melhorPreco;
  const descontoFrete = sacas * frete;
  const descontoFunrural = bruto * (funrural / 100);
  const liquido = bruto - descontoFrete - descontoFunrural;

  return (
    <div className="space-y-6">
      {/* Cotações ao vivo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-brand-surface border-brand-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-brand-muted">CBOT Soja (ZS=F)</p>
              <BarChart3 className="h-4 w-4 text-brand-accent" />
            </div>
            <p className="text-2xl font-bold text-brand-text font-mono mt-1">
              {cbotPrice.toFixed(2)}
            </p>
            <p className="text-xs flex items-center gap-1 mt-1">
              {cbotVar >= 0 ? (
                <TrendingUp className="h-3 w-3 text-brand-accent" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-400" />
              )}
              <span
                className={cbotVar >= 0 ? "text-brand-accent" : "text-red-400"}
              >
                {cbotVar >= 0 ? "+" : ""}
                {cbotVar.toFixed(2)}%
              </span>
              <span className="text-brand-muted ml-1">cents/bushel</span>
            </p>
          </CardContent>
        </Card>

        <Card className="bg-brand-surface border-brand-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-brand-muted">Dólar (USD/BRL)</p>
              <DollarSign className="h-4 w-4 text-brand-gold" />
            </div>
            <p className="text-2xl font-bold text-brand-text font-mono mt-1">
              R$ {dolar.toFixed(2)}
            </p>
            <p className="text-xs text-brand-muted mt-1">Cotação comercial</p>
          </CardContent>
        </Card>

        <Card className="bg-brand-surface border-brand-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-brand-muted">Equivalente R$/saca</p>
              <TrendingUp className="h-4 w-4 text-brand-accent" />
            </div>
            <p className="text-2xl font-bold text-brand-accent font-mono mt-1">
              R${" "}
              {(((cbotPrice / 100) * dolar) / 0.4536).toFixed(2)}
            </p>
            <p className="text-xs text-brand-muted mt-1">
              Sem basis, sem descontos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Comparativo + Calculadora */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Tabela de cooperativas */}
        <Card className="lg:col-span-2 bg-brand-surface border-brand-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-brand-text text-base">
              Preços por Cooperativa — Soja
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchPrecos}
              className="text-brand-muted hover:text-brand-text"
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`}
              />
              Atualizar
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-brand-border hover:bg-transparent">
                  <TableHead className="text-brand-muted">
                    Cooperativa
                  </TableHead>
                  <TableHead className="text-brand-muted">Município</TableHead>
                  <TableHead className="text-brand-muted text-right">
                    R$/saca
                  </TableHead>
                  <TableHead className="text-brand-muted text-right">
                    Basis
                  </TableHead>
                  <TableHead className="text-brand-muted text-right">
                    Atualizado
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cotacoes.map((cot, i) => (
                  <TableRow
                    key={cot.cooperativa}
                    className="border-brand-border hover:bg-brand-alt"
                  >
                    <TableCell className="text-brand-text font-medium">
                      {i === 0 && (
                        <Badge className="bg-brand-accent/20 text-brand-accent border-0 mr-2 text-[10px]">
                          Melhor
                        </Badge>
                      )}
                      {cot.cooperativa}
                    </TableCell>
                    <TableCell className="text-brand-muted">
                      {cot.municipio}
                    </TableCell>
                    <TableCell
                      className={`text-right font-mono font-bold ${
                        i === 0 ? "text-brand-accent" : "text-brand-text"
                      }`}
                    >
                      {cot.preco.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-brand-muted">
                      {cot.basis > 0 ? "+" : ""}
                      {cot.basis.toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-right text-brand-muted text-sm">
                      {cot.atualizado}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Calculadora */}
        <Card className="bg-brand-surface border-brand-border">
          <CardHeader>
            <CardTitle className="text-brand-text text-base">
              Calculadora de Venda
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-brand-muted text-xs">
                Quantidade (sacas)
              </Label>
              <Input
                type="number"
                value={sacas}
                onChange={(e) => setSacas(Number(e.target.value))}
                className="bg-brand-alt border-brand-border text-brand-text font-mono mt-1"
              />
            </div>
            <div>
              <Label className="text-brand-muted text-xs">Frete (R$/sc)</Label>
              <Input
                type="number"
                step="0.1"
                value={frete}
                onChange={(e) => setFrete(Number(e.target.value))}
                className="bg-brand-alt border-brand-border text-brand-text font-mono mt-1"
              />
            </div>
            <div>
              <Label className="text-brand-muted text-xs">Funrural (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={funrural}
                onChange={(e) => setFunrural(Number(e.target.value))}
                className="bg-brand-alt border-brand-border text-brand-text font-mono mt-1"
              />
            </div>

            <div className="border-t border-brand-border pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-brand-muted">Receita bruta</span>
                <span className="text-brand-text font-mono">
                  R$ {bruto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-brand-muted">(-) Frete</span>
                <span className="text-red-400 font-mono">
                  - R${" "}
                  {descontoFrete.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-brand-muted">(-) Funrural</span>
                <span className="text-red-400 font-mono">
                  - R${" "}
                  {descontoFunrural.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between text-base font-bold border-t border-brand-border pt-2">
                <span className="text-brand-text">Líquido estimado</span>
                <span className="text-brand-accent font-mono">
                  R${" "}
                  {liquido.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>

            <Button className="w-full bg-brand-accent text-brand-bg hover:bg-brand-dim">
              <Bell className="h-4 w-4 mr-2" />
              Criar alerta para este preço
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
