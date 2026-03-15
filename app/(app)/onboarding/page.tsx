"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { MapPin, ArrowLeft, ArrowRight, SkipForward, Check, Leaf, BarChart3, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TOTAL_STEPS = 5;

const UFS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

const CULTURAS = [
  "Soja","Milho","Café","Algodão","Trigo","Arroz","Feijão","Cana-de-açúcar",
  "Sorgo","Aveia","Cevada","Girassol",
];

const SAFRAS = ["2024/2025", "2025/2026", "2026/2027"];

export default function OnboardingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1 - name
  const userName = session?.user?.name || "";

  // Step 2 - propriedade
  const [propNome, setPropNome] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [estado, setEstado] = useState("RS");
  const [areaTotal, setAreaTotal] = useState("");
  const [car, setCar] = useState("");
  const [nirf, setNirf] = useState("");
  const [propriedadeCreated, setPropriedadeCreated] = useState(false);

  // Step 3 - talhao
  const [talhaoNome, setTalhaoNome] = useState("");
  const [talhaoArea, setTalhaoArea] = useState("");
  const [talhaoCultura, setTalhaoCultura] = useState("");
  const [talhaoSafra, setTalhaoSafra] = useState("2025/2026");
  const [talhaoLat, setTalhaoLat] = useState("");
  const [talhaoLng, setTalhaoLng] = useState("");
  const [talhaoCreated, setTalhaoCreated] = useState(false);

  // Step 4 - mercado
  const [alertaUf, setAlertaUf] = useState("RS");
  const [alertaCultura, setAlertaCultura] = useState("Soja");
  const [alertaCreated, setAlertaCreated] = useState(false);

  const progressValue = (step / TOTAL_STEPS) * 100;


  async function handleCreatePropriedade() {
    if (!propNome || !municipio || !areaTotal) {
      setError("Preencha nome, município e área total.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/propriedade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: propNome, municipio, estado, areaTotal, car, nirf }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao criar propriedade.");
        return;
      }
      setPropriedadeCreated(true);
      setStep(3);
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateTalhao() {
    if (!talhaoNome || !talhaoArea || !talhaoCultura) {
      setError("Preencha nome, área e cultura do talhão.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/talhoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: talhaoNome,
          area: talhaoArea,
          cultura: talhaoCultura,
          safra: talhaoSafra,
          latitude: talhaoLat || null,
          longitude: talhaoLng || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao criar talhão.");
        return;
      }
      setTalhaoCreated(true);
      setStep(4);
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateAlerta() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/alertas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "ACIMA",
          cultura: alertaCultura,
          precoMeta: 0,
          canal: "APP",
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erro ao criar alerta.");
        return;
      }
      setAlertaCreated(true);
      setStep(5);
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  function handleGetGPS() {
    if (!navigator.geolocation) {
      setError("Geolocalização não suportada pelo navegador.");
      return;
    }
    setError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setTalhaoLat(pos.coords.latitude.toFixed(6));
        setTalhaoLng(pos.coords.longitude.toFixed(6));
      },
      () => {
        setError("Não foi possível obter a localização.");
      }
    );
  }

  function handleNext() {
    setError("");
    if (step === 2 && !propriedadeCreated) {
      handleCreatePropriedade();
      return;
    }
    if (step === 3 && !talhaoCreated) {
      if (talhaoNome || talhaoArea || talhaoCultura) {
        handleCreateTalhao();
        return;
      }
    }
    if (step === 4 && !alertaCreated) {
      if (alertaCultura) {
        handleCreateAlerta();
        return;
      }
    }
    if (step < TOTAL_STEPS) setStep(step + 1);
  }

  function handleBack() {
    setError("");
    if (step > 1) setStep(step - 1);
  }

  function handleSkip() {
    setError("");
    if (step < TOTAL_STEPS) setStep(step + 1);
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-lg flex-col items-center justify-start gap-6 py-6">
      {/* Progress */}
      <div className="w-full space-y-2">
        <div className="flex items-center justify-between text-xs text-brand-muted">
          <span>Etapa {step} de {TOTAL_STEPS}</span>
          <span className="font-mono">{Math.round(progressValue)}%</span>
        </div>
        <Progress value={progressValue} className="h-2 bg-brand-border [&>div]:bg-brand-accent" />
      </div>

      {/* Step content with transition */}
      <div className="w-full transition-opacity duration-300 ease-in-out">
        {step === 1 && (
          <Card className="bg-brand-surface border-brand-border">
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-brand-alt">
                <Leaf className="h-8 w-8 text-brand-accent" />
              </div>
              <CardTitle className="font-display text-2xl text-brand-text">
                Bem-vindo ao GrãoRaiz{userName ? `, ${userName.split(" ")[0]}` : ""}!
              </CardTitle>
              <CardDescription className="text-brand-muted">
                Sua plataforma completa de rastreabilidade e mercado agrícola.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-brand-muted">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-accent" />
                <p>
                  <strong className="text-brand-text">Rastreabilidade:</strong> registre talhões, aplicações e lotes com
                  conformidade automática.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <BarChart3 className="mt-0.5 h-5 w-5 shrink-0 text-brand-gold" />
                <p>
                  <strong className="text-brand-text">Mercado:</strong> acompanhe cotações em tempo real e crie alertas
                  de preço personalizados.
                </p>
              </div>
              <p className="pt-2 text-center text-brand-muted">
                Vamos configurar sua conta em poucos passos.
              </p>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card className="bg-brand-surface border-brand-border">
            <CardHeader>
              <CardTitle className="font-display text-xl text-brand-text">
                Cadastre sua Propriedade
              </CardTitle>
              <CardDescription className="text-brand-muted">
                Informe os dados da sua propriedade rural.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-brand-text">Nome da Propriedade *</Label>
                <Input
                  placeholder="Ex: Fazenda Boa Vista"
                  value={propNome}
                  onChange={(e) => setPropNome(e.target.value)}
                  className="bg-brand-bg border-brand-border text-brand-text"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-brand-text">Município *</Label>
                  <Input
                    placeholder="Ex: Cruz Alta"
                    value={municipio}
                    onChange={(e) => setMunicipio(e.target.value)}
                    className="bg-brand-bg border-brand-border text-brand-text"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-brand-text">Estado</Label>
                  <Select value={estado} onValueChange={setEstado}>
                    <SelectTrigger className="bg-brand-bg border-brand-border text-brand-text">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UFS.map((uf) => (
                        <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-brand-text">Área Total (ha) *</Label>
                <Input
                  type="number"
                  placeholder="Ex: 250"
                  value={areaTotal}
                  onChange={(e) => setAreaTotal(e.target.value)}
                  className="bg-brand-bg border-brand-border text-brand-text font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-brand-text">CAR</Label>
                  <Input
                    placeholder="Opcional"
                    value={car}
                    onChange={(e) => setCar(e.target.value)}
                    className="bg-brand-bg border-brand-border text-brand-text"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-brand-text">NIRF</Label>
                  <Input
                    placeholder="Opcional"
                    value={nirf}
                    onChange={(e) => setNirf(e.target.value)}
                    className="bg-brand-bg border-brand-border text-brand-text"
                  />
                </div>
              </div>
              {propriedadeCreated && (
                <p className="text-sm text-green-500 flex items-center gap-1">
                  <Check className="h-4 w-4" /> Propriedade criada com sucesso!
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card className="bg-brand-surface border-brand-border">
            <CardHeader>
              <CardTitle className="font-display text-xl text-brand-text">
                Primeiro Talhão
              </CardTitle>
              <CardDescription className="text-brand-muted">
                Cadastre seu primeiro talhão. Você pode pular e adicionar depois.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-brand-text">Nome do Talhão</Label>
                <Input
                  placeholder="Ex: Talhão A1"
                  value={talhaoNome}
                  onChange={(e) => setTalhaoNome(e.target.value)}
                  className="bg-brand-bg border-brand-border text-brand-text"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-brand-text">Área (ha)</Label>
                  <Input
                    type="number"
                    placeholder="Ex: 50"
                    value={talhaoArea}
                    onChange={(e) => setTalhaoArea(e.target.value)}
                    className="bg-brand-bg border-brand-border text-brand-text font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-brand-text">Safra</Label>
                  <Select value={talhaoSafra} onValueChange={setTalhaoSafra}>
                    <SelectTrigger className="bg-brand-bg border-brand-border text-brand-text">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SAFRAS.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-brand-text">Cultura</Label>
                <Select value={talhaoCultura} onValueChange={setTalhaoCultura}>
                  <SelectTrigger className="bg-brand-bg border-brand-border text-brand-text">
                    <SelectValue placeholder="Selecione a cultura" />
                  </SelectTrigger>
                  <SelectContent>
                    {CULTURAS.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-brand-text">Localização GPS</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Latitude"
                    value={talhaoLat}
                    onChange={(e) => setTalhaoLat(e.target.value)}
                    className="bg-brand-bg border-brand-border text-brand-text font-mono flex-1"
                  />
                  <Input
                    placeholder="Longitude"
                    value={talhaoLng}
                    onChange={(e) => setTalhaoLng(e.target.value)}
                    className="bg-brand-bg border-brand-border text-brand-text font-mono flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleGetGPS}
                    title="Obter localização atual"
                    className="shrink-0 border-brand-border"
                  >
                    <MapPin className="h-4 w-4 text-brand-accent" />
                  </Button>
                </div>
              </div>
              {talhaoCreated && (
                <p className="text-sm text-green-500 flex items-center gap-1">
                  <Check className="h-4 w-4" /> Talhão criado com sucesso!
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {step === 4 && (
          <Card className="bg-brand-surface border-brand-border">
            <CardHeader>
              <CardTitle className="font-display text-xl text-brand-text">
                Alertas de Mercado
              </CardTitle>
              <CardDescription className="text-brand-muted">
                Configure alertas de preço para suas culturas. Você pode pular e ajustar depois.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-brand-text">Seu Estado (UF)</Label>
                <Select value={alertaUf} onValueChange={setAlertaUf}>
                  <SelectTrigger className="bg-brand-bg border-brand-border text-brand-text">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UFS.map((uf) => (
                      <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-brand-text">Cultura para alertas de preço</Label>
                <Select value={alertaCultura} onValueChange={setAlertaCultura}>
                  <SelectTrigger className="bg-brand-bg border-brand-border text-brand-text">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CULTURAS.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-brand-muted">
                Você receberá notificações quando o preço da {alertaCultura} em {alertaUf} tiver variações significativas.
              </p>
              {alertaCreated && (
                <p className="text-sm text-green-500 flex items-center gap-1">
                  <Check className="h-4 w-4" /> Alerta criado com sucesso!
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {step === 5 && (
          <Card className="bg-brand-surface border-brand-border">
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                <Check className="h-8 w-8 text-green-500" />
              </div>
              <CardTitle className="font-display text-2xl text-brand-text">
                Tudo pronto!
              </CardTitle>
              <CardDescription className="text-brand-muted">
                Sua conta está configurada. Explore o GrãoRaiz.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full"
                onClick={() => router.push("/dashboard")}
              >
                Ir para o Dashboard
              </Button>
              <Button
                variant="outline"
                className="w-full border-brand-border"
                onClick={() => router.push("/rastreabilidade")}
              >
                <ShieldCheck className="mr-2 h-4 w-4" />
                Rastreabilidade
              </Button>
              <Button
                variant="outline"
                className="w-full border-brand-border"
                onClick={() => router.push("/mercado")}
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                Mercado
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="w-full text-center text-sm text-red-400">{error}</p>
      )}

      {/* Navigation buttons */}
      {step < 5 && (
        <div className="flex w-full items-center justify-between gap-3">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={step === 1 || loading}
            className="text-brand-muted"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Voltar
          </Button>

          <div className="flex gap-2">
            {(step === 3 || step === 4) && (
              <Button
                variant="ghost"
                onClick={handleSkip}
                disabled={loading}
                className="text-brand-muted"
              >
                Pular
                <SkipForward className="ml-1 h-4 w-4" />
              </Button>
            )}
            <Button
              onClick={handleNext}
              disabled={loading || (step === 2 && propriedadeCreated)}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Salvando...
                </span>
              ) : step === 2 ? (
                propriedadeCreated ? (
                  <>
                    <Check className="mr-1 h-4 w-4" />
                    Salvo
                  </>
                ) : (
                  "Salvar e Continuar"
                )
              ) : (
                <>
                  Próximo
                  <ArrowRight className="ml-1 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
