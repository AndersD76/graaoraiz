import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const userId = await authenticateApiRequest(req);
    if (!userId) {
      return NextResponse.json(
        { error: "Não autorizado. Forneça um Bearer token válido ou faça login." },
        { status: 401 }
      );
    }

    const propriedade = await prisma.propriedade.findUnique({
      where: { userId },
      include: {
        talhoes: {
          include: {
            aplicacoes: {
              orderBy: { data: "desc" },
            },
            lotes: {
              orderBy: { dataEntrega: "desc" },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!propriedade) {
      return NextResponse.json({ talhoes: [], total: 0 });
    }

    const talhoes = propriedade.talhoes.map((t) => {
      let compliance = 0;
      if (t.latitude && t.longitude) compliance += 25;
      if (t.aplicacoes.length > 0) compliance += 30;
      if (t.lotes.some((l) => l.nfe)) compliance += 25;
      if (compliance >= 75) compliance += 20;

      return {
        id: t.id,
        nome: t.nome,
        area: t.area,
        cultura: t.cultura,
        safra: t.safra,
        status: t.status,
        latitude: t.latitude,
        longitude: t.longitude,
        compliance,
        aplicacoes: t.aplicacoes.map((a) => ({
          id: a.id,
          tipo: a.tipo,
          produto: a.produto,
          fabricante: a.fabricante,
          dose: a.dose,
          unidade: a.unidade,
          data: a.data,
          operador: a.operador,
          nota: a.nota,
        })),
        lotes: t.lotes.map((l) => ({
          id: l.id,
          numeroLote: l.numeroLote,
          peso: l.peso,
          sacas: l.sacas,
          destino: l.destino,
          dataEntrega: l.dataEntrega,
          nfe: l.nfe,
          ticket: l.ticket,
          preco: l.preco,
        })),
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      };
    });

    return NextResponse.json({
      talhoes,
      total: talhoes.length,
      propriedade: {
        id: propriedade.id,
        nome: propriedade.nome,
      },
    });
  } catch (error) {
    console.error("GET /api/v1/talhoes error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
