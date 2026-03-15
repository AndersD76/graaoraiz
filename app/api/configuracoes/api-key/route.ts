import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const userId = (session.user as Record<string, unknown>).id as string;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { apiKey: true },
    });

    return NextResponse.json({ apiKey: user?.apiKey || null });
  } catch (error) {
    console.error("GET /api/configuracoes/api-key error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar chave de API" },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const userId = (session.user as Record<string, unknown>).id as string;

    // Generate a new API key: gr_ prefix + 32 random hex chars
    const apiKey = `gr_${crypto.randomBytes(24).toString("hex")}`;

    await prisma.user.update({
      where: { id: userId },
      data: { apiKey },
    });

    return NextResponse.json({ apiKey });
  } catch (error) {
    console.error("POST /api/configuracoes/api-key error:", error);
    return NextResponse.json(
      { error: "Erro ao gerar chave de API" },
      { status: 500 }
    );
  }
}
