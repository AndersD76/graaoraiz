"use client";

import { useEffect, useState, useCallback } from "react";
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
import {
  Bell,
  Plus,
  Trash2,
  Smartphone,
  Mail,
  Monitor,
  Loader2,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

interface Alerta {
  id: string;
  tipo: "PRECO_META" | "VARIACAO_PERCENTUAL";
  cultura: string;
  precoMeta: number;
  canal: "APP" | "EMAIL" | "WHATSAPP";
  ativo: boolean;
  createdAt: string;
}

const culturaLabels: Record<string, string> = {
  SOJA: "Soja",
  MILHO: "Milho",
  TRIGO: "Trigo",
  AVEIA: "Aveia",
  CANOLA: "Canola",
  OUTRO: "Outro",
};

const tipoLabels: Record<string, string> = {
  PRECO_META: "Preço meta de",
  VARIACAO_PERCENTUAL: "Variação % de",
};

const canalLabels: Record<string, string> = {
  APP: "App",
  EMAIL: "Email",
  WHATSAPP: "WhatsApp",
};

const canalIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  APP: Monitor,
  WHATSAPP: Smartphone,
  EMAIL: Mail,
};

export default function AlertasPage() {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [novoTipo, setNovoTipo] = useState("PRECO_META");
  const [novoCultura, setNovoCultura] = useState("SOJA");
  const [novoPreco, setNovoPreco] = useState("");
  const [novoCanal, setNovoCanal] = useState("APP");

  const fetchAlertas = useCallback(async () => {
    try {
      const res = await fetch("/api/alertas");
      if (res.ok) {
        const data = await res.json();
        setAlertas(data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlertas();
  }, [fetchAlertas]);

  async function handleCreate() {
    if (!novoPreco) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/alertas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: novoTipo,
          cultura: novoCultura,
          precoMeta: novoPreco,
          canal: novoCanal,
        }),
      });
      if (res.ok) {
        const created = await res.json();
        setAlertas((prev) => [created, ...prev]);
        setDialogOpen(false);
        resetForm();
      }
    } catch {
      // silently fail
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setNovoTipo("PRECO_META");
    setNovoCultura("SOJA");
    setNovoPreco("");
    setNovoCanal("APP");
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/alertas?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setAlertas((prev) => prev.filter((a) => a.id !== id));
      }
    } catch {
      // silently fail
    }
  }

  async function handleToggle(id: string, currentAtivo: boolean) {
    try {
      const res = await fetch("/api/alertas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ativo: !currentAtivo }),
      });
      if (res.ok) {
        const updated = await res.json();
        setAlertas((prev) =>
          prev.map((a) => (a.id === id ? updated : a))
        );
      }
    } catch {
      // silently fail
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
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
          <DialogTrigger asChild>
            <Button className="bg-brand-accent text-brand-bg hover:bg-brand-dim">
              <Plus className="h-4 w-4 mr-2" />
              Novo Alerta
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-brand-surface border-brand-border">
            <DialogHeader>
              <DialogTitle className="text-brand-text">
                Criar Novo Alerta
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              {/* Cultura */}
              <div>
                <Label className="text-brand-muted text-xs">Cultura</Label>
                <Select value={novoCultura} onValueChange={setNovoCultura}>
                  <SelectTrigger className="bg-brand-alt border-brand-border text-brand-text mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-brand-surface border-brand-border">
                    <SelectItem value="SOJA">Soja</SelectItem>
                    <SelectItem value="MILHO">Milho</SelectItem>
                    <SelectItem value="TRIGO">Trigo</SelectItem>
                    <SelectItem value="AVEIA">Aveia</SelectItem>
                    <SelectItem value="CANOLA">Canola</SelectItem>
                    <SelectItem value="OUTRO">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tipo */}
              <div>
                <Label className="text-brand-muted text-xs">Condição</Label>
                <Select value={novoTipo} onValueChange={setNovoTipo}>
                  <SelectTrigger className="bg-brand-alt border-brand-border text-brand-text mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-brand-surface border-brand-border">
                    <SelectItem value="PRECO_META">Preço meta</SelectItem>
                    <SelectItem value="VARIACAO_PERCENTUAL">Variação percentual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Preço */}
              <div>
                <Label className="text-brand-muted text-xs">
                  Preço-alvo (R$/saca)
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={novoPreco}
                  onChange={(e) => setNovoPreco(e.target.value)}
                  className="bg-brand-alt border-brand-border text-brand-text font-mono mt-1"
                  placeholder="135.00"
                />
              </div>

              {/* Canal */}
              <div>
                <Label className="text-brand-muted text-xs">
                  Canal de notificação
                </Label>
                <Select value={novoCanal} onValueChange={setNovoCanal}>
                  <SelectTrigger className="bg-brand-alt border-brand-border text-brand-text mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-brand-surface border-brand-border">
                    <SelectItem value="APP">App</SelectItem>
                    <SelectItem value="EMAIL">Email</SelectItem>
                    <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleCreate}
                disabled={submitting || !novoPreco}
                className="w-full bg-brand-accent text-brand-bg hover:bg-brand-dim"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Criar Alerta
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-brand-muted" />
        </div>
      )}

      {/* Empty state */}
      {!loading && alertas.length === 0 && (
        <Card className="bg-brand-surface border-brand-border">
          <CardContent className="p-8 text-center">
            <Bell className="h-10 w-10 text-brand-muted mx-auto mb-3" />
            <p className="text-brand-muted text-sm">
              Nenhum alerta configurado. Crie seu primeiro alerta para ser
              notificado sobre variações de preço.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Alerts grid */}
      {!loading && alertas.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {alertas.map((alerta) => {
            const CanalIcon = canalIcons[alerta.canal] || Monitor;
            const TipoIcon =
              alerta.tipo === "PRECO_META" ? TrendingUp : TrendingDown;

            return (
              <Card
                key={alerta.id}
                className={`bg-brand-surface border-brand-border transition-opacity ${
                  !alerta.ativo ? "opacity-50" : ""
                }`}
              >
                <CardContent className="p-4">
                  {/* Top row: tipo badge + delete */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <TipoIcon
                        className={`h-4 w-4 ${
                          alerta.tipo === "PRECO_META"
                            ? "text-brand-accent"
                            : "text-brand-gold"
                        }`}
                      />
                      <Badge
                        variant="outline"
                        className="border-brand-border text-brand-muted text-xs"
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

                  {/* Cultura + price */}
                  <div className="mt-3">
                    <p className="text-sm text-brand-muted">
                      {culturaLabels[alerta.cultura] || alerta.cultura}
                    </p>
                    <p className="text-xl font-bold text-brand-text font-mono mt-1">
                      R$ {alerta.precoMeta.toFixed(2)}/sc
                    </p>
                  </div>

                  {/* Bottom row: canal + toggle */}
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-1.5 text-brand-muted">
                      <CanalIcon className="h-3.5 w-3.5" />
                      <span className="text-xs">
                        {canalLabels[alerta.canal] || alerta.canal}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggle(alerta.id, alerta.ativo)}
                      className={`text-xs h-7 ${
                        alerta.ativo
                          ? "border-brand-accent text-brand-accent hover:bg-brand-accent/10"
                          : "border-brand-border text-brand-muted hover:bg-brand-alt"
                      }`}
                    >
                      {alerta.ativo ? "Ativo" : "Pausado"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
