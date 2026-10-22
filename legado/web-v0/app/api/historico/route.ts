import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

interface OperacaoHistorico {
  id: string;
  type: "aplicacao" | "colheita";
  date: string;
  talhaoNome: string;
  cultura: string;
  safra: string;
  details: string;
  badge: string;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const userId = (session.user as Record<string, unknown>).id as string;
    const { searchParams } = new URL(req.url);
    const safra = searchParams.get("safra");
    const cultura = searchParams.get("cultura");

    const propriedade = await prisma.propriedade.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!propriedade) {
      return NextResponse.json({ operacoes: [] });
    }

    const talhaoFilter = {
      propriedadeId: propriedade.id,
      ...(safra ? { safra } : {}),
      ...(cultura ? { cultura: cultura as never } : {}),
    };

    const [aplicacoes, lotes] = await Promise.all([
      prisma.aplicacao.findMany({
        where: { talhao: talhaoFilter },
        include: {
          talhao: { select: { nome: true, cultura: true, safra: true } },
        },
        orderBy: { data: "desc" },
      }),
      prisma.lote.findMany({
        where: { talhao: talhaoFilter },
        include: {
          talhao: { select: { nome: true, cultura: true, safra: true } },
        },
        orderBy: { dataEntrega: "desc" },
      }),
    ]);

    const operacoes: OperacaoHistorico[] = [];

    for (const a of aplicacoes) {
      operacoes.push({
        id: a.id,
        type: "aplicacao",
        date: a.data.toISOString(),
        talhaoNome: a.talhao.nome,
        cultura: a.talhao.cultura,
        safra: a.talhao.safra,
        details: `${a.produto} — ${a.dose} ${a.unidade}`,
        badge: a.tipo,
      });
    }

    for (const l of lotes) {
      operacoes.push({
        id: l.id,
        type: "colheita",
        date: l.dataEntrega.toISOString(),
        talhaoNome: l.talhao.nome,
        cultura: l.talhao.cultura,
        safra: l.talhao.safra,
        details: `Lote ${l.numeroLote} — ${l.peso} kg (${l.sacas} sc)`,
        badge: "COLHEITA",
      });
    }

    operacoes.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return NextResponse.json({ operacoes });
  } catch (error) {
    console.error("GET /api/historico error:", error);
    return NextResponse.json({ operacoes: [] });
  }
}
