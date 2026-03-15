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
          select: {
            id: true,
            nome: true,
            area: true,
            cultura: true,
            safra: true,
            status: true,
            _count: {
              select: {
                aplicacoes: true,
                lotes: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!propriedade) {
      return NextResponse.json({ propriedade: null });
    }

    const areaUtilizada = propriedade.talhoes.reduce(
      (acc, t) => acc + t.area,
      0
    );

    return NextResponse.json({
      propriedade: {
        id: propriedade.id,
        nome: propriedade.nome,
        municipio: propriedade.municipio,
        estado: propriedade.estado,
        areaTotal: propriedade.areaTotal,
        areaUtilizada: Math.round(areaUtilizada * 100) / 100,
        nirf: propriedade.nirf,
        car: propriedade.car,
        createdAt: propriedade.createdAt,
        talhoes: propriedade.talhoes.map((t) => ({
          id: t.id,
          nome: t.nome,
          area: t.area,
          cultura: t.cultura,
          safra: t.safra,
          status: t.status,
          totalAplicacoes: t._count.aplicacoes,
          totalLotes: t._count.lotes,
        })),
        totalTalhoes: propriedade.talhoes.length,
      },
    });
  } catch (error) {
    console.error("GET /api/v1/propriedade error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
