import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const talhao = await prisma.talhao.findUnique({
      where: { id: params.id },
      include: {
        aplicacoes: { orderBy: { data: "desc" } },
        lotes: { orderBy: { dataEntrega: "desc" } },
        propriedade: { select: { nome: true, userId: true } },
      },
    });

    if (!talhao) {
      return NextResponse.json({ error: "Talhão não encontrado" }, { status: 404 });
    }

    // Calculate compliance
    let compliance = 0;
    const complianceDetails = {
      georeferenciado: false,
      aplicacoesRegistradas: false,
      loteVinculadoNfe: false,
      relatorioEudr: false,
    };

    if (talhao.latitude && talhao.longitude) {
      compliance += 25;
      complianceDetails.georeferenciado = true;
    }
    if (talhao.aplicacoes.length > 0) {
      compliance += 30;
      complianceDetails.aplicacoesRegistradas = true;
    }
    if (talhao.lotes.some((l: { nfe: string | null }) => l.nfe)) {
      compliance += 25;
      complianceDetails.loteVinculadoNfe = true;
    }
    if (compliance >= 75) {
      compliance += 20;
      complianceDetails.relatorioEudr = true;
    }

    return NextResponse.json({
      talhao: {
        ...talhao,
        compliance,
        complianceDetails,
      },
    });
  } catch (error) {
    console.error("GET /api/talhoes/[id] error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await req.json();

    const talhao = await prisma.talhao.update({
      where: { id: params.id },
      data: {
        ...(body.nome && { nome: body.nome }),
        ...(body.area && { area: parseFloat(body.area) }),
        ...(body.cultura && { cultura: body.cultura }),
        ...(body.safra && { safra: body.safra }),
        ...(body.status && { status: body.status }),
        ...(body.latitude !== undefined && { latitude: body.latitude ? parseFloat(body.latitude) : null }),
        ...(body.longitude !== undefined && { longitude: body.longitude ? parseFloat(body.longitude) : null }),
      },
    });

    return NextResponse.json({ talhao });
  } catch (error) {
    console.error("PUT /api/talhoes/[id] error:", error);
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    await prisma.talhao.delete({ where: { id: params.id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/talhoes/[id] error:", error);
    return NextResponse.json({ error: "Erro ao excluir" }, { status: 500 });
  }
}
