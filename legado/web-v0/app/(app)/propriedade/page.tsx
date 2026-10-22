"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function PropriedadePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isEdit, setIsEdit] = useState(false);

  const [nome, setNome] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [estado, setEstado] = useState("RS");
  const [areaTotal, setAreaTotal] = useState("");
  const [nirf, setNirf] = useState("");
  const [car, setCar] = useState("");

  useEffect(() => {
    async function fetchPropriedade() {
      try {
        const res = await fetch("/api/propriedade");
        if (!res.ok) return;
        const data = await res.json();
        if (data.propriedade) {
          setNome(data.propriedade.nome);
          setMunicipio(data.propriedade.municipio);
          setEstado(data.propriedade.estado);
          setAreaTotal(String(data.propriedade.areaTotal));
          setNirf(data.propriedade.nirf || "");
          setCar(data.propriedade.car || "");
          setIsEdit(true);
        }
      } catch {
        // ignore fetch error, show empty form
      } finally {
        setLoading(false);
      }
    }
    fetchPropriedade();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!nome || !municipio || !estado || !areaTotal) {
      setError("Preencha todos os campos obrigatórios.");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/propriedade", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          municipio,
          estado,
          areaTotal,
          nirf: nirf || null,
          car: car || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erro ao salvar propriedade.");
        return;
      }

      setIsEdit(true);
      setSuccess("Propriedade salva com sucesso!");
      setTimeout(() => setSuccess(""), 4000);
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-brand-muted text-sm">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
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
          <h1 className="text-2xl font-display text-brand-text">
            {isEdit ? "Editar Propriedade" : "Cadastrar Propriedade"}
          </h1>
          <p className="text-sm text-brand-muted mt-0.5">
            {isEdit
              ? "Atualize os dados da sua propriedade rural"
              : "Cadastre sua propriedade rural para começar"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="bg-brand-surface border-brand-border">
          <CardHeader>
            <CardTitle className="text-brand-text text-base">
              Dados da Propriedade
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-brand-text text-sm">
                Nome da Propriedade *
              </Label>
              <Input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Fazenda São João"
                className="bg-brand-alt border-brand-border text-brand-text placeholder:text-brand-muted/50 focus-visible:ring-brand-accent"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-brand-text text-sm">
                  Município *
                </Label>
                <Input
                  value={municipio}
                  onChange={(e) => setMunicipio(e.target.value)}
                  placeholder="Ex: Passo Fundo"
                  className="bg-brand-alt border-brand-border text-brand-text placeholder:text-brand-muted/50 focus-visible:ring-brand-accent"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-brand-text text-sm">
                  Estado *
                </Label>
                <Input
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                  placeholder="RS"
                  className="bg-brand-alt border-brand-border text-brand-text placeholder:text-brand-muted/50 focus-visible:ring-brand-accent"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-brand-text text-sm">
                Área Total (ha) *
              </Label>
              <Input
                type="number"
                step="0.1"
                value={areaTotal}
                onChange={(e) => setAreaTotal(e.target.value)}
                placeholder="Ex: 250.0"
                className="bg-brand-alt border-brand-border text-brand-text placeholder:text-brand-muted/50 focus-visible:ring-brand-accent font-mono"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-brand-surface border-brand-border">
          <CardHeader>
            <CardTitle className="text-brand-text text-base">
              Documentação (opcional)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-brand-text text-sm">
                NIRF (Número do Imóvel Rural na Receita Federal)
              </Label>
              <Input
                value={nirf}
                onChange={(e) => setNirf(e.target.value)}
                placeholder="Ex: 0.000.000-0"
                className="bg-brand-alt border-brand-border text-brand-text placeholder:text-brand-muted/50 focus-visible:ring-brand-accent font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-brand-text text-sm">
                CAR (Cadastro Ambiental Rural)
              </Label>
              <Input
                value={car}
                onChange={(e) => setCar(e.target.value)}
                placeholder="Ex: RS-4300000-000000000000000"
                className="bg-brand-alt border-brand-border text-brand-text placeholder:text-brand-muted/50 focus-visible:ring-brand-accent font-mono"
              />
            </div>
          </CardContent>
        </Card>

        {/* Success */}
        {success && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-400" />
            <p className="text-green-400 text-sm">{success}</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Link href="/dashboard">
            <Button
              type="button"
              variant="ghost"
              className="text-brand-muted hover:text-brand-text hover:bg-brand-alt"
            >
              Cancelar
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={saving}
            className="bg-brand-accent text-brand-bg hover:bg-brand-accent/90 font-medium"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Salvando..." : isEdit ? "Atualizar" : "Cadastrar"}
          </Button>
        </div>
      </form>
    </div>
  );
}
