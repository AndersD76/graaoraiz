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
    });

    if (!propriedade) {
      return NextResponse.json({ propriedade: null });
    }

    return NextResponse.json({ propriedade });
  } catch (error) {
    console.error("GET /api/propriedade error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar propriedade" },
      { status: 500 }
    );
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

    const existing = await prisma.propriedade.findUnique({
      where: { userId },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Propriedade já cadastrada. Use PUT para atualizar." },
        { status: 400 }
      );
    }

    const propriedade = await prisma.propriedade.create({
      data: {
        nome: body.nome,
        municipio: body.municipio,
        estado: body.estado || "RS",
        areaTotal: parseFloat(body.areaTotal),
        nirf: body.nirf || null,
        car: body.car || null,
        userId,
      },
    });

    return NextResponse.json({ propriedade }, { status: 201 });
  } catch (error) {
    console.error("POST /api/propriedade error:", error);
    return NextResponse.json(
      { error: "Erro ao criar propriedade" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const userId = (session.user as Record<string, unknown>).id as string;
    const body = await req.json();

    const existing = await prisma.propriedade.findUnique({
      where: { userId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Propriedade não encontrada." },
        { status: 404 }
      );
    }

    const propriedade = await prisma.propriedade.update({
      where: { userId },
      data: {
        nome: body.nome,
        municipio: body.municipio,
        estado: body.estado || "RS",
        areaTotal: parseFloat(body.areaTotal),
        nirf: body.nirf || null,
        car: body.car || null,
      },
    });

    return NextResponse.json({ propriedade });
  } catch (error) {
    console.error("PUT /api/propriedade error:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar propriedade" },
      { status: 500 }
    );
  }
}
