"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, MapPin, Save, Navigation, Loader2 } from "lucide-react";
import Link from "next/link";

const LeafletMap = dynamic(() => import("@/components/app/leaflet-map"), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] bg-brand-alt rounded-lg flex items-center justify-center">
      <p className="text-brand-muted text-sm">Carregando mapa...</p>
    </div>
  ),
});

const culturas = [
  { value: "SOJA", label: "Soja" },
  { value: "MILHO", label: "Milho" },
  { value: "TRIGO", label: "Trigo" },
  { value: "AVEIA", label: "Aveia" },
  { value: "CANOLA", label: "Canola" },
  { value: "OUTRO", label: "Outro" },
];

export default function NovoTalhaoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [nome, setNome] = useState("");
  const [area, setArea] = useState("");
  const [cultura, setCultura] = useState("SOJA");
  const [safra, setSafra] = useState("2025/26");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState("");

  const handleMapClick = (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
    setGpsError("");
  };

  const handleUseGPS = () => {
    if (!navigator.geolocation) {
      setGpsError("Geolocalização não suportada neste navegador.");
      return;
    }
    setGpsLoading(true);
    setGpsError("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setGpsLoading(false);
      },
      (err) => {
        setGpsLoading(false);
        if (err.code === 1) {
          setGpsError("Permissão de localização negada. Ative nas configurações do navegador.");
        } else if (err.code === 2) {
          setGpsError("Localização indisponível. Verifique o GPS do dispositivo.");
        } else {
          setGpsError("Tempo esgotado ao obter localização. Tente novamente.");
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!nome || !area || !cultura || !safra) {
      setError("Preencha todos os campos obrigatórios.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/talhoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          area,
          cultura,
          safra,
          latitude,
          longitude,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erro ao criar talhão.");
        return;
      }

      router.push("/rastreabilidade");
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const markers =
    latitude && longitude
      ? [{ id: "new", lat: latitude, lng: longitude, label: nome || "Novo Talhão" }]
      : [];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
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
          <h1 className="text-2xl font-display text-brand-text">Novo Talhão</h1>
          <p className="text-sm text-brand-muted mt-0.5">
            Cadastre um novo talhão georreferenciado
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Form fields */}
        <Card className="bg-brand-surface border-brand-border">
          <CardHeader>
            <CardTitle className="text-brand-text text-base">
              Dados do Talhão
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-brand-text text-sm">
                  Nome *
                </Label>
                <Input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Talhão Norte"
                  className="bg-brand-alt border-brand-border text-brand-text placeholder:text-brand-muted/50 focus-visible:ring-brand-accent"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-brand-text text-sm">
                  Área (ha) *
                </Label>
                <Input
                  type="number"
                  step="0.1"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="Ex: 85.5"
                  className="bg-brand-alt border-brand-border text-brand-text placeholder:text-brand-muted/50 focus-visible:ring-brand-accent font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-brand-text text-sm">
                  Cultura *
                </Label>
                <Select value={cultura} onValueChange={(v) => v !== null && setCultura(v)}>
                  <SelectTrigger className="bg-brand-alt border-brand-border text-brand-text w-full">
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
              <div className="space-y-2">
                <Label className="text-brand-text text-sm">
                  Safra *
                </Label>
                <Input
                  value={safra}
                  onChange={(e) => setSafra(e.target.value)}
                  placeholder="Ex: 2025/26"
                  className="bg-brand-alt border-brand-border text-brand-text placeholder:text-brand-muted/50 focus-visible:ring-brand-accent font-mono"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Map */}
        <Card className="bg-brand-surface border-brand-border overflow-hidden">
          <CardHeader>
            <CardTitle className="text-brand-text text-base flex items-center gap-2">
              <MapPin className="h-4 w-4 text-brand-accent" />
              Localização
            </CardTitle>
            <p className="text-xs text-brand-muted">
              Clique no mapa ou use o GPS do celular para definir as coordenadas
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleUseGPS}
                disabled={gpsLoading}
                className="border-brand-accent/40 text-brand-accent hover:bg-brand-accent/10"
              >
                {gpsLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Navigation className="h-4 w-4 mr-2" />
                )}
                {gpsLoading ? "Obtendo localização..." : "Usar GPS do celular"}
              </Button>
              {gpsError && (
                <span className="text-red-400 text-xs self-center">{gpsError}</span>
              )}
            </div>
            <div className="h-[300px] rounded-lg overflow-hidden">
              <LeafletMap
                center={[-28.2622, -52.4083]}
                zoom={13}
                markers={markers}
                onClick={handleMapClick}
                flyTo={latitude && longitude ? [latitude, longitude] : null}
              />
            </div>
            {latitude && longitude && (
              <div className="flex gap-4 text-sm">
                <span className="text-brand-muted">
                  Lat:{" "}
                  <span className="text-brand-text font-mono">
                    {latitude.toFixed(6)}
                  </span>
                </span>
                <span className="text-brand-muted">
                  Lng:{" "}
                  <span className="text-brand-text font-mono">
                    {longitude.toFixed(6)}
                  </span>
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Link href="/rastreabilidade">
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
            disabled={loading}
            className="bg-brand-accent text-brand-bg hover:bg-brand-accent/90 font-medium"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Salvando..." : "Salvar Talhão"}
          </Button>
        </div>
      </form>
    </div>
  );
}
