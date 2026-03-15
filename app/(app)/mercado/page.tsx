"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Bell,
  RefreshCw,
  MapPin,
} from "lucide-react";

interface Cotacao {
  cooperativa: string;
  tipo: string;
  municipio: string;
  uf: string;
  regiao: string;
  preco: number;
  basis: number;
  atualizado: string;
  site: string | null;
}

const ufs = [
  { value: "RS", label: "Rio Grande do Sul" },
  { value: "PR", label: "Paraná" },
  { value: "SC", label: "Santa Catarina" },
  { value: "MT", label: "Mato Grosso" },
  { value: "MS", label: "Mato Grosso do Sul" },
  { value: "GO", label: "Goiás" },
  { value: "MG", label: "Minas Gerais" },
  { value: "SP", label: "São Paulo" },
  { value: "BA", label: "Bahia" },
  { value: "TO", label: "Tocantins" },
  { value: "PI", label: "Piauí" },
  { value: "TODOS", label: "Todos os estados" },
];

const culturas = [
  { value: "SOJA", label: "Soja" },
  { value: "MILHO", label: "Milho" },
  { value: "TRIGO", label: "Trigo" },
];

const tipoLabels: Record<string, string> = {
  cooperativa: "Coop",
  cerealista: "Cerealista",
  trading: "Trading",
};

const tipoColors: Record<string, string> = {
  cooperativa: "bg-brand-accent/20 text-brand-accent",
  cerealista: "bg-brand-gold/20 text-brand-gold",
  trading: "bg-blue-500/20 text-blue-400",
};

export default function MercadoPage() {
  const [uf, setUf] = useState("RS");
  const [cultura, setCultura] = useState("SOJA");
  const [sacas, setSacas] = useState(1000);
  const [frete, setFrete] = useState(3.5);
  const [funrural, setFunrural] = useState(1.5);
  const [cbotPrice, setCbotPrice] = useState(1048.5);
  const [cbotVar, setCbotVar] = useState(0.75);
  const [dolar, setDolar] = useState(5.12);
  const [cotacoes, setCotacoes] = useState<Cotacao[]>([]);
  const [totalCooperativas, setTotalCooperativas] = useState(0);
  const [loading, setLoading] = useState(false);

  const melhorPreco = cotacoes.length > 0 ? cotacoes[0].preco : 0;

  const fetchPrecos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/precos?uf=${uf}&cultura=${cultura}`);
      if (res.ok) {
        const data = await res.json();
        if (data.cbot) {
          setCbotPrice(data.cbot.preco);
          setCbotVar(data.cbot.variacao);
        }
        if (data.dolar) setDolar(data.dolar.venda);
        if (data.cotacoes?.length) setCotacoes(data.cotacoes);
        if (data.totalCooperativas) setTotalCooperativas(data.totalCooperativas);
      }
    } catch {
      // Keep current data
    } finally {
      setLoading(false);
    }
  }, [uf, cultura]);

  useEffect(() => {
    fetchPrecos();
  }, [fetchPrecos]);

  const bruto = sacas * melhorPreco;
  const descontoFrete = sacas * frete;
  const descontoFunrural = bruto * (funrural / 100);
  const liquido = bruto - descontoFrete - descontoFunrural;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display text-brand-text">Inteligência de Mercado</h1>
          <p className="text-sm text-brand-muted mt-1">
            Preços calculados em tempo real com CBOT + dólar + basis regional
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={uf} onValueChange={setUf}>
            <SelectTrigger className="w-[160px] bg-brand-alt border-brand-border text-brand-text">
              <MapPin className="h-3.5 w-3.5 text-brand-accent mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-brand-surface border-brand-border">
              {ufs.map((u) => (
                <SelectItem key={u.value} value={u.value} className="text-brand-text hover:bg-brand-alt">
                  {u.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={cultura} onValueChange={setCultura}>
            <SelectTrigger className="w-[120px] bg-brand-alt border-brand-border text-brand-text">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-brand-surface border-brand-border">
              {culturas.map((c) => (
                <SelectItem key={c.value} value={c.value} className="text-brand-text hover:bg-brand-alt">
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Cotações ao vivo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-brand-surface border-brand-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-brand-muted">CBOT {cultura} (ZS=F)</p>
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
              <span className={cbotVar >= 0 ? "text-brand-accent" : "text-red-400"}>
                {cbotVar >= 0 ? "+" : ""}{cbotVar.toFixed(2)}%
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
              R$ {(((cbotPrice / 100) * dolar) / 0.4536).toFixed(2)}
            </p>
            <p className="text-xs text-brand-muted mt-1">Sem basis, sem descontos</p>
          </CardContent>
        </Card>
      </div>

      {/* Comparativo + Calculadora */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Tabela de cooperativas */}
        <Card className="lg:col-span-2 bg-brand-surface border-brand-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-brand-text text-base">
                Preços por Cooperativa — {cultura}
              </CardTitle>
              <p className="text-xs text-brand-muted mt-1">
                {totalCooperativas} cooperativas e cerealistas encontradas
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchPrecos}
              className="text-brand-muted hover:text-brand-text"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-brand-border hover:bg-transparent">
                    <TableHead className="text-brand-muted">Empresa</TableHead>
                    <TableHead className="text-brand-muted">Tipo</TableHead>
                    <TableHead className="text-brand-muted">Município/UF</TableHead>
                    <TableHead className="text-brand-muted text-right">R$/saca</TableHead>
                    <TableHead className="text-brand-muted text-right">Basis</TableHead>
                    <TableHead className="text-brand-muted text-right">Hora</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cotacoes.map((cot, i) => (
                    <TableRow key={`${cot.cooperativa}-${cot.municipio}`} className="border-brand-border hover:bg-brand-alt">
                      <TableCell className="text-brand-text font-medium">
                        <div className="flex items-center gap-2">
                          {i === 0 && (
                            <Badge className="bg-brand-accent/20 text-brand-accent border-0 text-[10px]">
                              Melhor
                            </Badge>
                          )}
                          {cot.cooperativa}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${tipoColors[cot.tipo] || ""} border-0 text-[10px]`}>
                          {tipoLabels[cot.tipo] || cot.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-brand-muted">
                        {cot.municipio}/{cot.uf}
                      </TableCell>
                      <TableCell className={`text-right font-mono font-bold ${i === 0 ? "text-brand-accent" : "text-brand-text"}`}>
                        {cot.preco.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-brand-muted">
                        {cot.basis > 0 ? "+" : ""}{cot.basis.toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-right text-brand-muted text-sm">
                        {cot.atualizado}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Calculadora */}
        <Card className="bg-brand-surface border-brand-border">
          <CardHeader>
            <CardTitle className="text-brand-text text-base">Calculadora de Venda</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-brand-muted text-xs">Quantidade (sacas)</Label>
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
                <span className="text-brand-muted">Melhor preço ({cotacoes[0]?.cooperativa || "-"})</span>
                <span className="text-brand-text font-mono">R$ {melhorPreco.toFixed(2)}/sc</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-brand-muted">Receita bruta</span>
                <span className="text-brand-text font-mono">
                  R$ {bruto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-brand-muted">(-) Frete</span>
                <span className="text-red-400 font-mono">
                  - R$ {descontoFrete.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-brand-muted">(-) Funrural</span>
                <span className="text-red-400 font-mono">
                  - R$ {descontoFunrural.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-base font-bold border-t border-brand-border pt-2">
                <span className="text-brand-text">Líquido estimado</span>
                <span className="text-brand-accent font-mono">
                  R$ {liquido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
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
