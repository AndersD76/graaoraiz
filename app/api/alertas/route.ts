import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json(
        { error: "userId obrigatório" },
        { status: 400 }
      );
    }

    const alertas = await prisma.alerta.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(alertas);
  } catch {
    return NextResponse.json(
      { error: "Erro ao buscar alertas" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, tipo, cultura, precoMeta, canal } = body;

    if (!userId || !tipo) {
      return NextResponse.json(
        { error: "userId e tipo são obrigatórios" },
        { status: 400 }
      );
    }

    const alerta = await prisma.alerta.create({
      data: {
        userId,
        tipo,
        cultura: cultura || "SOJA",
        precoMeta: precoMeta ? parseFloat(precoMeta) : null,
        canal: canal || "APP",
      },
    });

    return NextResponse.json(alerta, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Erro ao criar alerta" },
      { status: 500 }
    );
  }
}
