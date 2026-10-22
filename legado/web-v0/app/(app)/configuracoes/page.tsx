"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  User,
  MapPin,
  CreditCard,
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  ChevronRight,
  Crown,
} from "lucide-react";
import Link from "next/link";

const planoLabels: Record<string, string> = {
  GRATUITO: "Gratuito",
  BASICO: "Básico",
  PRO: "Profissional",
  COOPERATIVA: "Cooperativa",
};

export default function ConfiguracoesPage() {
  const { data: session } = useSession();
  const user = session?.user as
    | { name?: string; email?: string; phone?: string; plano?: string }
    | undefined;

  const [name, setName] = useState(user?.name || "");
  const [email] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");

  const [notifEmail, setNotifEmail] = useState(true);
  const [notifWhatsapp, setNotifWhatsapp] = useState(false);
  const [notifApp, setNotifApp] = useState(true);

  const plano = (user as Record<string, unknown>)?.plano as string | undefined;
  const planoLabel = planoLabels[plano || "GRATUITO"] || "Gratuito";

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display text-brand-text">
          Configurações
        </h1>
        <p className="text-sm text-brand-muted mt-0.5">
          Gerencie seu perfil, propriedade e preferências
        </p>
      </div>

      {/* Meu Perfil */}
      <Card className="bg-brand-surface border-brand-border">
        <CardHeader>
          <CardTitle className="text-brand-text text-base flex items-center gap-2">
            <User className="h-4 w-4 text-brand-accent" />
            Meu Perfil
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-brand-text text-sm">Nome</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
              className="bg-brand-alt border-brand-border text-brand-text placeholder:text-brand-muted/50 focus-visible:ring-brand-accent"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-brand-text text-sm">Email</Label>
            <Input
              value={email}
              readOnly
              className="bg-brand-alt border-brand-border text-brand-muted cursor-not-allowed"
            />
            <p className="text-xs text-brand-muted">
              O email não pode ser alterado
            </p>
          </div>
          <div className="space-y-2">
            <Label className="text-brand-text text-sm">Telefone</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(00) 00000-0000"
              className="bg-brand-alt border-brand-border text-brand-text placeholder:text-brand-muted/50 focus-visible:ring-brand-accent"
            />
          </div>
        </CardContent>
      </Card>

      {/* Minha Propriedade */}
      <Card className="bg-brand-surface border-brand-border">
        <CardHeader>
          <CardTitle className="text-brand-text text-base flex items-center gap-2">
            <MapPin className="h-4 w-4 text-brand-accent" />
            Minha Propriedade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Link href="/propriedade">
            <div className="flex items-center justify-between p-3 rounded-lg bg-brand-alt hover:bg-brand-alt/80 transition-colors cursor-pointer">
              <div>
                <p className="text-sm text-brand-text font-medium">
                  Gerenciar propriedade
                </p>
                <p className="text-xs text-brand-muted mt-0.5">
                  Cadastre ou edite os dados da sua propriedade rural
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-brand-muted" />
            </div>
          </Link>
        </CardContent>
      </Card>

      {/* Plano Atual */}
      <Card className="bg-brand-surface border-brand-border">
        <CardHeader>
          <CardTitle className="text-brand-text text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-brand-accent" />
            Plano Atual
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-brand-alt">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-brand-accent/10 flex items-center justify-center">
                <Crown className="h-5 w-5 text-brand-gold" />
              </div>
              <div>
                <p className="text-sm text-brand-text font-medium">
                  Plano {planoLabel}
                </p>
                <p className="text-xs text-brand-muted mt-0.5">
                  {plano === "PRO" || plano === "COOPERATIVA"
                    ? "Acesso completo a todas as funcionalidades"
                    : "Funcionalidades limitadas"}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-brand-accent hover:text-brand-accent/80 hover:bg-brand-accent/10 font-medium text-xs"
              onClick={() => {
                // non-functional for now
              }}
            >
              Fazer Upgrade
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notificações */}
      <Card className="bg-brand-surface border-brand-border">
        <CardHeader>
          <CardTitle className="text-brand-text text-base flex items-center gap-2">
            <Bell className="h-4 w-4 text-brand-accent" />
            Notificações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <ToggleRow
            icon={Mail}
            label="Email"
            description="Receba alertas e relatórios por email"
            checked={notifEmail}
            onChange={setNotifEmail}
          />
          <Separator className="bg-brand-border" />
          <ToggleRow
            icon={MessageSquare}
            label="WhatsApp"
            description="Receba notificações por WhatsApp"
            checked={notifWhatsapp}
            onChange={setNotifWhatsapp}
          />
          <Separator className="bg-brand-border" />
          <ToggleRow
            icon={Smartphone}
            label="App (Push)"
            description="Notificações push no aplicativo"
            checked={notifApp}
            onChange={setNotifApp}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function ToggleRow({
  icon: Icon,
  label,
  description,
  checked,
  onChange,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3 px-1">
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4 text-brand-muted" />
        <div>
          <p className="text-sm text-brand-text">{label}</p>
          <p className="text-xs text-brand-muted">{description}</p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? "bg-brand-accent" : "bg-brand-alt"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
