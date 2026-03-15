"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Bell, Plus, Trash2, Smartphone, Mail, Monitor } from "lucide-react";

interface AlertaItem {
  id: string;
  tipo: string;
  cultura: string;
  precoMeta: number | null;
  canal: string;
  ativo: boolean;
  disparadoEm: string | null;
}

const mockAlertas: AlertaItem[] = [
  {
    id: "1",
    tipo: "PRECO_META",
    cultura: "SOJA",
    precoMeta: 135,
    canal: "WHATSAPP",
    ativo: true,
    disparadoEm: null,
  },
  {
    id: "2",
    tipo: "PRECO_META",
    cultura: "SOJA",
    precoMeta: 130,
    canal: "APP",
    ativo: true,
    disparadoEm: "2026-03-12T14:30:00",
  },
  {
    id: "3",
    tipo: "PRAZO_EUDR",
    cultura: "SOJA",
    precoMeta: null,
    canal: "EMAIL",
    ativo: true,
    disparadoEm: null,
  },
];

const tipoLabels: Record<string, string> = {
  PRECO_META: "Preço-alvo",
  VARIACAO_PERCENTUAL: "Variação %",
  PRAZO_EUDR: "Prazo EUDR",
  PRAZO_CONTRATO: "Prazo contrato",
};

const canalIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  APP: Monitor,
  WHATSAPP: Smartphone,
  EMAIL: Mail,
};

export default function AlertasPage() {
  const [alertas, setAlertas] = useState<AlertaItem[]>(mockAlertas);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [novoTipo, setNovoTipo] = useState("PRECO_META");
  const [novoCultura, setNovoCultura] = useState("SOJA");
  const [novoPreco, setNovoPreco] = useState("");
  const [novoCanal, setNovoCanal] = useState("APP");

  function handleCreate() {
    const novo: AlertaItem = {
      id: Date.now().toString(),
      tipo: novoTipo,
      cultura: novoCultura,
      precoMeta: novoPreco ? parseFloat(novoPreco) : null,
      canal: novoCanal,
      ativo: true,
      disparadoEm: null,
    };
    setAlertas([novo, ...alertas]);
    setDialogOpen(false);
    setNovoPreco("");
  }

  function handleDelete(id: string) {
    setAlertas(alertas.filter((a) => a.id !== id));
  }

  function handleToggle(id: string) {
    setAlertas(
      alertas.map((a) => (a.id === id ? { ...a, ativo: !a.ativo } : a))
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display text-brand-text">
            Gestão de Alertas
          </h2>
          <p className="text-sm text-brand-muted mt-1">
            Receba notificações quando o preço atingir seu alvo
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger
            render={<Button className="bg-brand-accent text-brand-bg hover:bg-brand-dim" />}
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Alerta
          </DialogTrigger>
          <DialogContent className="bg-brand-surface border-brand-border">
            <DialogHeader>
              <DialogTitle className="text-brand-text">
                Criar Novo Alerta
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label className="text-brand-muted text-xs">Tipo</Label>
                <Select value={novoTipo} onValueChange={(v) => v !== null && setNovoTipo(v)}>
                  <SelectTrigger className="bg-brand-alt border-brand-border text-brand-text mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-brand-surface border-brand-border">
                    <SelectItem value="PRECO_META">Preço-alvo</SelectItem>
                    <SelectItem value="VARIACAO_PERCENTUAL">
                      Variação %
                    </SelectItem>
                    <SelectItem value="PRAZO_EUDR">Prazo EUDR</SelectItem>
                    <SelectItem value="PRAZO_CONTRATO">
                      Prazo contrato
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-brand-muted text-xs">Cultura</Label>
                <Select value={novoCultura} onValueChange={(v) => v !== null && setNovoCultura(v)}>
                  <SelectTrigger className="bg-brand-alt border-brand-border text-brand-text mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-brand-surface border-brand-border">
                    <SelectItem value="SOJA">Soja</SelectItem>
                    <SelectItem value="MILHO">Milho</SelectItem>
                    <SelectItem value="TRIGO">Trigo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(novoTipo === "PRECO_META" ||
                novoTipo === "VARIACAO_PERCENTUAL") && (
                <div>
                  <Label className="text-brand-muted text-xs">
                    {novoTipo === "PRECO_META"
                      ? "Preço-alvo (R$/saca)"
                      : "Variação (%)"}
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={novoPreco}
                    onChange={(e) => setNovoPreco(e.target.value)}
                    className="bg-brand-alt border-brand-border text-brand-text font-mono mt-1"
                    placeholder={
                      novoTipo === "PRECO_META" ? "135.00" : "5"
                    }
                  />
                </div>
              )}
              <div>
                <Label className="text-brand-muted text-xs">
                  Canal de notificação
                </Label>
                <Select value={novoCanal} onValueChange={(v) => v !== null && setNovoCanal(v)}>
                  <SelectTrigger className="bg-brand-alt border-brand-border text-brand-text mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-brand-surface border-brand-border">
                    <SelectItem value="APP">App</SelectItem>
                    <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                    <SelectItem value="EMAIL">Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleCreate}
                className="w-full bg-brand-accent text-brand-bg hover:bg-brand-dim"
              >
                Criar Alerta
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {alertas.map((alerta) => {
          const CanalIcon = canalIcons[alerta.canal] || Monitor;
          return (
            <Card
              key={alerta.id}
              className={`bg-brand-surface border-brand-border ${
                !alerta.ativo ? "opacity-50" : ""
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Bell
                      className={`h-4 w-4 ${
                        alerta.ativo
                          ? "text-brand-accent"
                          : "text-brand-muted"
                      }`}
                    />
                    <Badge
                      variant="outline"
                      className="border-brand-border text-brand-muted"
                    >
                      {tipoLabels[alerta.tipo]}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-brand-muted hover:text-red-400 h-8 w-8"
                    onClick={() => handleDelete(alerta.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="mt-3">
                  <p className="text-sm text-brand-muted">{alerta.cultura}</p>
                  {alerta.precoMeta && (
                    <p className="text-xl font-bold text-brand-text font-mono mt-1">
                      R$ {alerta.precoMeta.toFixed(2)}/sc
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-1.5 text-brand-muted">
                    <CanalIcon className="h-3.5 w-3.5" />
                    <span className="text-xs">{alerta.canal}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggle(alerta.id)}
                    className={`text-xs h-7 ${
                      alerta.ativo
                        ? "border-brand-accent text-brand-accent hover:bg-brand-accent/10"
                        : "border-brand-border text-brand-muted hover:bg-brand-alt"
                    }`}
                  >
                    {alerta.ativo ? "Ativo" : "Pausado"}
                  </Button>
                </div>

                {alerta.disparadoEm && (
                  <p className="text-xs text-brand-gold mt-2">
                    Disparado em{" "}
                    {new Date(alerta.disparadoEm).toLocaleDateString("pt-BR")}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
