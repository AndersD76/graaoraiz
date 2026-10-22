"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { MapPin, ShieldCheck, TrendingUp, Bell } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const precoData = Array.from({ length: 30 }, (_, i) => ({
  dia: `${i + 1}/03`,
  preco: 128 + Math.random() * 12 - 6,
}));

const kpis = [
  {
    title: "Área Total",
    value: "342 ha",
    icon: MapPin,
    change: "+12 ha",
    color: "text-brand-accent",
  },
  {
    title: "Compliance EUDR",
    value: "87%",
    icon: ShieldCheck,
    change: "+5%",
    color: "text-brand-gold",
  },
  {
    title: "Melhor Preço Hoje",
    value: "R$ 132,50/sc",
    icon: TrendingUp,
    change: "+R$ 1,20",
    color: "text-brand-accent",
  },
  {
    title: "Alertas Ativos",
    value: "3",
    icon: Bell,
    change: "1 disparado",
    color: "text-brand-gold",
  },
];

const complianceModules = [
  { label: "Talhões georreferenciados", value: 95 },
  { label: "Aplicações registradas", value: 78 },
  { label: "Lotes vinculados a NF-e", value: 65 },
  { label: "Relatórios EUDR gerados", value: 40 },
];

const alertasRecentes = [
  {
    msg: "Soja atingiu R$ 132,50/sc na Cotripal",
    time: "Há 2h",
    type: "preco",
  },
  {
    msg: "Talhão Norte sem aplicação há 15 dias",
    time: "Há 5h",
    type: "prazo",
  },
  {
    msg: "Relatório EUDR vence em 47 dias",
    time: "Há 1d",
    type: "eudr",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card
            key={kpi.title}
            className="bg-brand-surface border-brand-border"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-brand-muted">{kpi.title}</p>
                <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
              </div>
              <p className="text-2xl font-bold text-brand-text mt-1 font-mono">
                {kpi.value}
              </p>
              <p className="text-xs text-brand-accent mt-1">{kpi.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráfico de preços */}
      <Card className="bg-brand-surface border-brand-border">
        <CardHeader>
          <CardTitle className="text-brand-text text-base">
            Preço da Soja — Últimos 30 dias (R$/saca)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={precoData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#243d21" />
                <XAxis
                  dataKey="dia"
                  stroke="#6b9464"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis
                  stroke="#6b9464"
                  fontSize={12}
                  tickLine={false}
                  domain={["auto", "auto"]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#111f0f",
                    border: "1px solid #243d21",
                    borderRadius: "8px",
                    color: "#edf2ea",
                  }}
                  formatter={(value) => [
                    `R$ ${Number(value).toFixed(2)}`,
                    "Preço",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="preco"
                  stroke="#6fcf3e"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: "#6fcf3e" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Compliance */}
        <Card className="bg-brand-surface border-brand-border">
          <CardHeader>
            <CardTitle className="text-brand-text text-base">
              Status de Compliance EUDR
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {complianceModules.map((mod) => (
              <div key={mod.label} className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-brand-muted">{mod.label}</span>
                  <span className="text-brand-text font-mono">
                    {mod.value}%
                  </span>
                </div>
                <Progress
                  value={mod.value}
                  className="h-2 bg-brand-alt [&>div]:bg-brand-accent"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Alertas recentes */}
        <Card className="bg-brand-surface border-brand-border">
          <CardHeader>
            <CardTitle className="text-brand-text text-base">
              Alertas Recentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alertasRecentes.map((alerta, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-lg bg-brand-alt"
              >
                <Badge
                  variant="outline"
                  className={`shrink-0 ${
                    alerta.type === "preco"
                      ? "border-brand-accent text-brand-accent"
                      : alerta.type === "eudr"
                      ? "border-brand-gold text-brand-gold"
                      : "border-brand-muted text-brand-muted"
                  }`}
                >
                  {alerta.type === "preco"
                    ? "Preço"
                    : alerta.type === "eudr"
                    ? "EUDR"
                    : "Prazo"}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-brand-text">{alerta.msg}</p>
                  <p className="text-xs text-brand-muted mt-0.5">
                    {alerta.time}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
