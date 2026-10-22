import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET: list members of user's propriedade
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const userId = (session.user as Record<string, unknown>).id as string;

    // Find user's propriedade (as owner)
    const propriedade = await prisma.propriedade.findUnique({
      where: { userId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        membros: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!propriedade) {
      return NextResponse.json(
        { error: "Propriedade não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      owner: propriedade.user,
      membros: propriedade.membros,
    });
  } catch (error) {
    console.error("GET /api/propriedade/membros error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar membros" },
      { status: 500 }
    );
  }
}

// POST: invite member by email
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const userId = (session.user as Record<string, unknown>).id as string;
    const body = await req.json();
    const { email, papel } = body;

    if (!email || !papel) {
      return NextResponse.json(
        { error: "Email e papel são obrigatórios" },
        { status: 400 }
      );
    }

    if (!["admin", "editor", "visualizador"].includes(papel)) {
      return NextResponse.json(
        { error: "Papel inválido" },
        { status: 400 }
      );
    }

    // Verify user owns a propriedade
    const propriedade = await prisma.propriedade.findUnique({
      where: { userId },
    });

    if (!propriedade) {
      return NextResponse.json(
        { error: "Propriedade não encontrada" },
        { status: 404 }
      );
    }

    // Find the user to invite
    const invitedUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!invitedUser) {
      return NextResponse.json(
        { error: "Usuário não encontrado com este email" },
        { status: 404 }
      );
    }

    if (invitedUser.id === userId) {
      return NextResponse.json(
        { error: "Você não pode se adicionar como membro" },
        { status: 400 }
      );
    }

    // Check if already a member
    const existing = await prisma.propriedadeMembro.findUnique({
      where: {
        propriedadeId_userId: {
          propriedadeId: propriedade.id,
          userId: invitedUser.id,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Este usuário já é membro desta propriedade" },
        { status: 400 }
      );
    }

    const membro = await prisma.propriedadeMembro.create({
      data: {
        propriedadeId: propriedade.id,
        userId: invitedUser.id,
        papel,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ membro }, { status: 201 });
  } catch (error) {
    console.error("POST /api/propriedade/membros error:", error);
    return NextResponse.json(
      { error: "Erro ao adicionar membro" },
      { status: 500 }
    );
  }
}

// DELETE: remove member
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const userId = (session.user as Record<string, unknown>).id as string;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID do membro é obrigatório" },
        { status: 400 }
      );
    }

    // Verify user owns the propriedade
    const propriedade = await prisma.propriedade.findUnique({
      where: { userId },
    });

    if (!propriedade) {
      return NextResponse.json(
        { error: "Propriedade não encontrada" },
        { status: 404 }
      );
    }

    // Verify the member belongs to this propriedade
    const membro = await prisma.propriedadeMembro.findFirst({
      where: { id, propriedadeId: propriedade.id },
    });

    if (!membro) {
      return NextResponse.json(
        { error: "Membro não encontrado" },
        { status: 404 }
      );
    }

    await prisma.propriedadeMembro.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/propriedade/membros error:", error);
    return NextResponse.json(
      { error: "Erro ao remover membro" },
      { status: 500 }
    );
  }
}

// PATCH: update member role
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const userId = (session.user as Record<string, unknown>).id as string;
    const body = await req.json();
    const { id, papel } = body;

    if (!id || !papel) {
      return NextResponse.json(
        { error: "ID e papel são obrigatórios" },
        { status: 400 }
      );
    }

    if (!["admin", "editor", "visualizador"].includes(papel)) {
      return NextResponse.json(
        { error: "Papel inválido" },
        { status: 400 }
      );
    }

    // Verify user owns the propriedade
    const propriedade = await prisma.propriedade.findUnique({
      where: { userId },
    });

    if (!propriedade) {
      return NextResponse.json(
        { error: "Propriedade não encontrada" },
        { status: 404 }
      );
    }

    // Verify the member belongs to this propriedade
    const membro = await prisma.propriedadeMembro.findFirst({
      where: { id, propriedadeId: propriedade.id },
    });

    if (!membro) {
      return NextResponse.json(
        { error: "Membro não encontrado" },
        { status: 404 }
      );
    }

    const updated = await prisma.propriedadeMembro.update({
      where: { id },
      data: { papel },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ membro: updated });
  } catch (error) {
    console.error("PATCH /api/propriedade/membros error:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar papel do membro" },
      { status: 500 }
    );
  }
}
