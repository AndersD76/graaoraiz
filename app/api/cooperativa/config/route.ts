import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function getUserId() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return (session.user as Record<string, unknown>)?.id as string;
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const config = await prisma.cooperativaConfig.findUnique({
    where: { userId },
  });

  return NextResponse.json({ config });
}

export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json();

  const existing = await prisma.cooperativaConfig.findUnique({
    where: { userId },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Configuração já existe. Use PUT para atualizar." },
      { status: 409 }
    );
  }

  const config = await prisma.cooperativaConfig.create({
    data: {
      userId,
      nomeCooperativa: body.nomeCooperativa,
      logoUrl: body.logoUrl || null,
      corPrimaria: body.corPrimaria || "#6fcf3e",
      corSecundaria: body.corSecundaria || "#e6b93a",
      corFundo: body.corFundo || "#0a1209",
      corSuperficie: body.corSuperficie || "#111a10",
      corTexto: body.corTexto || "#e8f5e0",
      corMuted: body.corMuted || "#7a8a72",
      corBorda: body.corBorda || "#1e2e1a",
      dominio: body.dominio || null,
      ativo: body.ativo ?? false,
    },
  });

  return NextResponse.json({ config }, { status: 201 });
}

export async function PUT(req: Request) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json();

  const existing = await prisma.cooperativaConfig.findUnique({
    where: { userId },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Configuração não encontrada. Use POST para criar." },
      { status: 404 }
    );
  }

  const config = await prisma.cooperativaConfig.update({
    where: { userId },
    data: {
      ...(body.nomeCooperativa !== undefined && { nomeCooperativa: body.nomeCooperativa }),
      ...(body.logoUrl !== undefined && { logoUrl: body.logoUrl || null }),
      ...(body.corPrimaria !== undefined && { corPrimaria: body.corPrimaria }),
      ...(body.corSecundaria !== undefined && { corSecundaria: body.corSecundaria }),
      ...(body.corFundo !== undefined && { corFundo: body.corFundo }),
      ...(body.corSuperficie !== undefined && { corSuperficie: body.corSuperficie }),
      ...(body.corTexto !== undefined && { corTexto: body.corTexto }),
      ...(body.corMuted !== undefined && { corMuted: body.corMuted }),
      ...(body.corBorda !== undefined && { corBorda: body.corBorda }),
      ...(body.dominio !== undefined && { dominio: body.dominio || null }),
      ...(body.ativo !== undefined && { ativo: body.ativo }),
    },
  });

  return NextResponse.json({ config });
}
