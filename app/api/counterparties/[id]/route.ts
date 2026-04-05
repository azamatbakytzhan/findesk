export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  name:  z.string().min(1).optional(),
  type:  z.enum(["CLIENT", "SUPPLIER", "EMPLOYEE", "OTHER"]).optional(),
  bin:   z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email("Некорректный email").nullable().optional().or(z.literal("")),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Нет доступа" }, { status: 401 });
    const orgId = session.user.organizationId;

    const cp = await prisma.counterparty.findFirst({
      where: { id: params.id, organizationId: orgId },
    });
    if (!cp) return NextResponse.json({ error: "Не найдено" }, { status: 404 });

    const body   = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Ошибка валидации" },
        { status: 400 }
      );
    }

    const { email, ...rest } = parsed.data;
    const updated = await prisma.counterparty.update({
      where: { id: params.id },
      data:  { ...rest, ...(email !== undefined ? { email: email || null } : {}) },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/counterparties/[id] error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Нет доступа" }, { status: 401 });
    const orgId = session.user.organizationId;

    const cp = await prisma.counterparty.findFirst({
      where: { id: params.id, organizationId: orgId },
    });
    if (!cp) return NextResponse.json({ error: "Не найдено" }, { status: 404 });

    await prisma.counterparty.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/counterparties/[id] error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
