import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const orgId = session.user.organizationId;

    const category = await prisma.category.findFirst({
      where: { id: params.id, organizationId: orgId },
    });
    if (!category) return NextResponse.json({ error: "Не найдено" }, { status: 404 });
    if (category.isSystem) {
      return NextResponse.json({ error: "Системные категории нельзя удалить" }, { status: 403 });
    }

    await prisma.category.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/categories/[id] error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
