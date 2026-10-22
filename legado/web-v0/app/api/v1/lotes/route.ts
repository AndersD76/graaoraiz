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
            lotes: {
              orderBy: { dataEntrega: "desc" },
            },
          },
        },
      },
    });

    if (!propriedade) {
      return NextResponse.json({ lotes: [], total: 0 });
    }

    const lotes = propriedade.talhoes.flatMap((t) =>
      t.lotes.map((l) => ({
        id: l.id,
        numeroLote: l.numeroLote,
        peso: l.peso,
        sacas: l.sacas,
        destino: l.destino,
        dataEntrega: l.dataEntrega,
        nfe: l.nfe,
        ticket: l.ticket,
        preco: l.preco,
        createdAt: l.createdAt,
        talhao: {
          id: t.id,
          nome: t.nome,
          cultura: t.cultura,
          safra: t.safra,
          area: t.area,
        },
      }))
    );

    // Sort by dataEntrega descending
    lotes.sort(
      (a, b) =>
        new Date(b.dataEntrega).getTime() - new Date(a.dataEntrega).getTime()
    );

    return NextResponse.json({
      lotes,
      total: lotes.length,
      propriedade: {
        id: propriedade.id,
        nome: propriedade.nome,
      },
    });
  } catch (error) {
    console.error("GET /api/v1/lotes error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
