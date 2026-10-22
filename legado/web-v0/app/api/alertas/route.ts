import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as Record<string, unknown>)?.id as string;
    if (!userId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
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
    const session = await getServerSession(authOptions);
    const userId = (session?.user as Record<string, unknown>)?.id as string;
    if (!userId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await req.json();
    const { tipo, cultura, preco, precoMeta, canal } = body;
    const precoValue = preco ?? precoMeta;

    if (!tipo || !cultura || precoValue == null) {
      return NextResponse.json(
        { error: "tipo, cultura e preco são obrigatórios" },
        { status: 400 }
      );
    }

    const alerta = await prisma.alerta.create({
      data: {
        userId,
        tipo,
        cultura,
        precoMeta: parseFloat(precoValue),
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

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as Record<string, unknown>)?.id as string;
    if (!userId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "id é obrigatório" },
        { status: 400 }
      );
    }

    // Ensure the alert belongs to the user
    const existing = await prisma.alerta.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return NextResponse.json(
        { error: "Alerta não encontrado" },
        { status: 404 }
      );
    }

    await prisma.alerta.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Erro ao deletar alerta" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as Record<string, unknown>)?.id as string;
    if (!userId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await req.json();
    const { id, ativo } = body;

    if (!id || typeof ativo !== "boolean") {
      return NextResponse.json(
        { error: "id e ativo são obrigatórios" },
        { status: 400 }
      );
    }

    // Ensure the alert belongs to the user
    const existing = await prisma.alerta.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return NextResponse.json(
        { error: "Alerta não encontrado" },
        { status: 404 }
      );
    }

    const alerta = await prisma.alerta.update({
      where: { id },
      data: { ativo },
    });

    return NextResponse.json(alerta);
  } catch {
    return NextResponse.json(
      { error: "Erro ao atualizar alerta" },
      { status: 500 }
    );
  }
}
