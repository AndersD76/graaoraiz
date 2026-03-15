import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const userId = (session.user as Record<string, unknown>).id as string;
    const { searchParams } = new URL(req.url);
    const tipo = searchParams.get("tipo");
    const cultura = searchParams.get("cultura");

    const propriedade = await prisma.propriedade.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!propriedade) {
      return NextResponse.json({ aplicacoes: [] });
    }

    const aplicacoes = await prisma.aplicacao.findMany({
      where: {
        talhao: {
          propriedadeId: propriedade.id,
          ...(cultura ? { cultura: cultura as never } : {}),
        },
        ...(tipo ? { tipo: tipo as never } : {}),
      },
      include: {
        talhao: {
          select: { nome: true, cultura: true, safra: true },
        },
      },
      orderBy: { data: "desc" },
    });

    return NextResponse.json({ aplicacoes });
  } catch (error) {
    console.error("GET /api/aplicacoes error:", error);
    return NextResponse.json({ aplicacoes: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await req.json();

    const aplicacao = await prisma.aplicacao.create({
      data: {
        talhaoId: body.talhaoId,
        tipo: body.tipo,
        produto: body.produto,
        fabricante: body.fabricante || null,
        dose: parseFloat(body.dose),
        unidade: body.unidade || "L/ha",
        data: new Date(body.data),
        operador: body.operador,
        nota: body.nota || null,
      },
    });

    return NextResponse.json({ aplicacao }, { status: 201 });
  } catch (error) {
    console.error("POST /api/aplicacoes error:", error);
    return NextResponse.json(
      { error: "Erro ao criar aplicação" },
      { status: 500 }
    );
  }
}
