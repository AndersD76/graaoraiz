import { NextResponse } from "next/server";
import { fetchCBOT, fetchDolar } from "@/lib/precos";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [cbot, dolar] = await Promise.all([fetchCBOT(), fetchDolar()]);

    const cotacoes = [
      {
        cooperativa: "Cotripal",
        municipio: "Panambi",
        preco: 132.5,
        basis: -2.3,
        atualizado: new Date().toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
      {
        cooperativa: "Cotrisa",
        municipio: "Sarandi",
        preco: 131.8,
        basis: -2.8,
        atualizado: new Date().toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
      {
        cooperativa: "C.Vale",
        municipio: "Passo Fundo",
        preco: 131.2,
        basis: -3.1,
        atualizado: new Date().toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
      {
        cooperativa: "Cotrijal",
        municipio: "Não-Me-Toque",
        preco: 130.9,
        basis: -3.4,
        atualizado: new Date().toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
      {
        cooperativa: "Coopasso",
        municipio: "Passo Fundo",
        preco: 130.5,
        basis: -3.7,
        atualizado: new Date().toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ];

    return NextResponse.json({ cbot, dolar, cotacoes });
  } catch {
    return NextResponse.json(
      { error: "Erro ao buscar cotações" },
      { status: 500 }
    );
  }
}
