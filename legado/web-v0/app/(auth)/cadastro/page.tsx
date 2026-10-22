"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export default function CadastroPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/cadastro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erro ao criar conta. Tente novamente.");
        setLoading(false);
        return;
      }

      router.push("/login");
    } catch {
      setError("Erro de conexão. Verifique sua internet e tente novamente.");
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="mb-2 flex items-center justify-center gap-2">
          <span className="text-[#6fcf3e] text-3xl leading-none">⬡</span>
          <h1 className="font-display text-3xl text-[#edf2ea]">GrãoRaiz</h1>
        </div>
        <p className="font-sans text-sm text-[#6b9464]">
          Do campo até o mercado, cada grão rastreado.
        </p>
      </div>

      <Card className="border-[#243d21] bg-[#111f0f]">
        <CardHeader>
          <CardTitle className="text-[#edf2ea]">Crie sua conta</CardTitle>
          <CardDescription className="text-[#6b9464]">
            Cadastre-se para rastrear sua produção.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name" className="text-[#edf2ea]">
                Nome completo
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="João da Silva"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="border-[#243d21] bg-[#0a1209] text-[#edf2ea] placeholder:text-[#6b9464] focus-visible:border-[#6fcf3e] focus-visible:ring-[#6fcf3e]/30"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email" className="text-[#edf2ea]">
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-[#243d21] bg-[#0a1209] text-[#edf2ea] placeholder:text-[#6b9464] focus-visible:border-[#6fcf3e] focus-visible:ring-[#6fcf3e]/30"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone" className="text-[#edf2ea]">
                Telefone
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(00) 00000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="border-[#243d21] bg-[#0a1209] text-[#edf2ea] placeholder:text-[#6b9464] focus-visible:border-[#6fcf3e] focus-visible:ring-[#6fcf3e]/30"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password" className="text-[#edf2ea]">
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="border-[#243d21] bg-[#0a1209] text-[#edf2ea] placeholder:text-[#6b9464] focus-visible:border-[#6fcf3e] focus-visible:ring-[#6fcf3e]/30"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#6fcf3e] text-[#0a1209] hover:bg-[#5db832] font-semibold"
            >
              {loading ? "Criando conta..." : "Criar conta"}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-[#6b9464]">
            Já tem uma conta?{" "}
            <Link
              href="/login"
              className="font-medium text-[#6fcf3e] hover:underline"
            >
              Faça login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
