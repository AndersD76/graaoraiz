import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lote = await prisma.lote.findUnique({
      where: { id: params.id },
      include: {
        talhao: {
          include: {
            propriedade: {
              select: { nome: true, municipio: true, estado: true },
            },
            aplicacoes: {
              orderBy: { data: "desc" },
              select: {
                id: true,
                tipo: true,
                produto: true,
                fabricante: true,
                dose: true,
                unidade: true,
                data: true,
                operador: true,
              },
            },
          },
        },
      },
    });

    if (!lote) {
      return NextResponse.json(
        { error: "Lote não encontrado" },
        { status: 404 }
      );
    }

    // Calculate compliance
    const talhao = lote.talhao;
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
    if (lote.nfe) {
      compliance += 25;
      complianceDetails.loteVinculadoNfe = true;
    }
    if (compliance >= 75) {
      compliance += 20;
      complianceDetails.relatorioEudr = true;
    }

    return NextResponse.json({
      lote: {
        id: lote.id,
        numeroLote: lote.numeroLote,
        peso: lote.peso,
        sacas: lote.sacas,
        destino: lote.destino,
        dataEntrega: lote.dataEntrega,
        nfe: lote.nfe,
        ticket: lote.ticket,
        createdAt: lote.createdAt,
        talhao: {
          id: talhao.id,
          nome: talhao.nome,
          area: talhao.area,
          cultura: talhao.cultura,
          safra: talhao.safra,
          latitude: talhao.latitude,
          longitude: talhao.longitude,
          propriedade: talhao.propriedade,
          aplicacoes: talhao.aplicacoes,
        },
        compliance,
        complianceDetails,
      },
    });
  } catch (error) {
    console.error("GET /api/lotes/[id] error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
