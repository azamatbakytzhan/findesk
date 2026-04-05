export const dynamic = 'force-dynamic'

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "OWNER" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 });
    }

    const { id } = await params;
    const orgId = session.user.organizationId;
    const { role } = (await req.json()) as { role: string };

    if (!role) return NextResponse.json({ error: "role required" }, { status: 400 });

    // Cannot change own role
    if (id === session.user.id) {
      return NextResponse.json({ error: "Нельзя изменить свою роль" }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!user) return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });

    // Cannot demote OWNER
    if (user.role === "OWNER") {
      return NextResponse.json({ error: "Нельзя изменить роль владельца" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id },
      data:  { role: role as never },
    });

    return NextResponse.json({ user: updated });
  } catch (err) {
    console.error("PATCH /api/team/[id]:", err);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "OWNER" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 });
    }

    const { id } = await params;
    const orgId = session.user.organizationId;

    if (id === session.user.id) {
      return NextResponse.json({ error: "Нельзя удалить себя" }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!user) return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
    if (user.role === "OWNER") {
      return NextResponse.json({ error: "Нельзя удалить владельца" }, { status: 400 });
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/team/[id]:", err);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
