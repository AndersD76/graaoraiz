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
    const safra = searchParams.get("safra") || "2025/26";
    const formato = searchParams.get("formato") || "json";

    const propriedade = await prisma.propriedade.findUnique({
      where: { userId },
      include: {
        talhoes: {
          where: { safra },
          include: {
            aplicacoes: { orderBy: { data: "asc" } },
            lotes: { orderBy: { dataEntrega: "asc" } },
          },
        },
      },
    });

    if (!propriedade) {
      return NextResponse.json(
        { error: "Propriedade não encontrada" },
        { status: 404 }
      );
    }

    const relatorio = {
      versao: "1.0",
      geradoEm: new Date().toISOString(),
      regulamento: "EU 2023/1115 (EUDR)",
      propriedade: {
        nome: propriedade.nome,
        municipio: propriedade.municipio,
        estado: propriedade.estado,
        areaTotal: propriedade.areaTotal,
        car: propriedade.car,
        nirf: propriedade.nirf,
      },
      safra,
      talhoes: propriedade.talhoes.map((t) => ({
        nome: t.nome,
        area: t.area,
        cultura: t.cultura,
        coordenadas: {
          latitude: t.latitude,
          longitude: t.longitude,
          geojson: t.geojson,
        },
        aplicacoes: t.aplicacoes.map((a) => ({
          tipo: a.tipo,
          produto: a.produto,
          fabricante: a.fabricante,
          dose: a.dose,
          unidade: a.unidade,
          data: a.data,
          operador: a.operador,
        })),
        lotes: t.lotes.map((l) => ({
          numeroLote: l.numeroLote,
          peso: l.peso,
          sacas: l.sacas,
          destino: l.destino,
          dataEntrega: l.dataEntrega,
          nfe: l.nfe,
          ticket: l.ticket,
        })),
      })),
      declaracao: `Declaro que a produção descrita neste relatório não está associada a desmatamento conforme definido pelo Regulamento (UE) 2023/1115 do Parlamento Europeu.`,
    };

    if (formato === "json") {
      return new NextResponse(JSON.stringify(relatorio, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="relatorio-eudr-${safra.replace("/", "-")}.json"`,
        },
      });
    }

    // For PDF format, return the report data for client-side rendering
    return NextResponse.json(relatorio);
  } catch (error) {
    console.error("Erro ao gerar relatório:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
