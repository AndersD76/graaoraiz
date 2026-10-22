import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const userId = (session.user as Record<string, unknown>).id as string;

    const propriedade = await prisma.propriedade.findUnique({
      where: { userId },
      include: {
        talhoes: {
          include: {
            aplicacoes: true,
            lotes: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!propriedade) {
      return NextResponse.json({ talhoes: [] });
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
        aplicacoesCount: t.aplicacoes.length,
        lotesCount: t.lotes.length,
        createdAt: t.createdAt,
      };
    });

    return NextResponse.json({ talhoes });
  } catch (error) {
    console.error("GET /api/talhoes error:", error);
    return NextResponse.json({ talhoes: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const userId = (session.user as Record<string, unknown>).id as string;
    const body = await req.json();

    const propriedade = await prisma.propriedade.findUnique({
      where: { userId },
    });

    if (!propriedade) {
      return NextResponse.json(
        { error: "Propriedade não encontrada. Cadastre sua propriedade primeiro." },
        { status: 400 }
      );
    }

    const talhao = await prisma.talhao.create({
      data: {
        nome: body.nome,
        area: parseFloat(body.area),
        cultura: body.cultura,
        safra: body.safra,
        latitude: body.latitude ? parseFloat(body.latitude) : null,
        longitude: body.longitude ? parseFloat(body.longitude) : null,
        geojson: body.geojson || null,
        propriedadeId: propriedade.id,
      },
    });

    return NextResponse.json({ talhao }, { status: 201 });
  } catch (error) {
    console.error("POST /api/talhoes error:", error);
    return NextResponse.json(
      { error: "Erro ao criar talhão" },
      { status: 500 }
    );
  }
}
