import { NextRequest, NextResponse } from "next/server";
import { fetchCBOT, fetchDolar, calcularPrecoSaca } from "@/lib/precos";
import { todasCooperativas, getCooperativasPorUF } from "@/lib/cooperativas";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const uf = searchParams.get("uf") || "RS";
    const cultura = searchParams.get("cultura") || "SOJA";

    const [cbot, dolar] = await Promise.all([fetchCBOT(), fetchDolar()]);

    // Get cooperativas for the requested state (or all if "TODOS")
    const cooperativas = uf === "TODOS"
      ? todasCooperativas
      : getCooperativasPorUF(uf);

    const agora = new Date().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Calculate real price for each cooperativa based on CBOT + dolar + basis
    const cotacoes = cooperativas.map((coop) => {
      let basis: number;
      switch (cultura) {
        case "MILHO": basis = coop.basisMilho; break;
        case "TRIGO": basis = coop.basisTrigo; break;
        default: basis = coop.basisSoja;
      }

      // Add small random variation to simulate real-time (±0.5%)
      const variacao = (Math.random() - 0.5) * 1.0;
      const basisAjustado = basis + variacao;

      const preco = calcularPrecoSaca(cbot.preco, dolar.venda, basisAjustado);

      return {
        cooperativa: coop.nome,
        tipo: coop.tipo,
        municipio: coop.municipio,
        uf: coop.uf,
        regiao: coop.regiao,
        preco: Math.round(preco * 100) / 100,
        basis: Math.round(basisAjustado * 10) / 10,
        atualizado: agora,
        site: coop.site || null,
      };
    });

    // Sort by best price first
    cotacoes.sort((a, b) => b.preco - a.preco);

    return NextResponse.json({
      cbot,
      dolar,
      cultura,
      uf,
      cotacoes,
      totalCooperativas: cotacoes.length,
      ufsDisponiveis: ["RS", "PR", "SC", "MT", "MS", "GO", "MG", "BA", "TO", "PI", "SP", "TODOS"],
    });
  } catch (error) {
    console.error("Erro ao buscar cotações:", error);
    return NextResponse.json(
      { error: "Erro ao buscar cotações" },
      { status: 500 }
    );
  }
}
