import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const loteId = searchParams.get("loteId");

    if (!loteId) {
      return NextResponse.json(
        { error: "loteId é obrigatório" },
        { status: 400 }
      );
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
    const traceabilityUrl = `${baseUrl}/rastreabilidade/lote/${loteId}`;

    const qrcode = await QRCode.toDataURL(traceabilityUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: "#1a2e1a",
        light: "#ffffff",
      },
      errorCorrectionLevel: "H",
    });

    return NextResponse.json({ qrcode, url: traceabilityUrl });
  } catch (error) {
    console.error("GET /api/lotes/qrcode error:", error);
    return NextResponse.json({ error: "Erro ao gerar QR Code" }, { status: 500 });
  }
}
