export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  name:           z.string().min(1).optional(),
  conditions:     z.array(z.object({ field: z.string(), operator: z.string(), value: z.string() })).optional(),
  conditionLogic: z.enum(["AND", "OR"]).optional(),
  actions:        z.array(z.object({ field: z.string(), value: z.string() })).optional(),
  priority:       z.number().int().min(0).max(100).optional(),
  isActive:       z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Нет доступа" }, { status: 401 });
    const orgId = session.user.organizationId;

    const rule = await prisma.automationRule.findFirst({
      where: { id: params.id, organizationId: orgId },
    });
    if (!rule) return NextResponse.json({ error: "Не найдено" }, { status: 404 });

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });

    const updated = await prisma.automationRule.update({
      where: { id: params.id },
      data:  parsed.data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/automation/[id]:", error);
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

    const rule = await prisma.automationRule.findFirst({
      where: { id: params.id, organizationId: orgId },
    });
    if (!rule) return NextResponse.json({ error: "Не найдено" }, { status: 404 });

    await prisma.automationRule.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/automation/[id]:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
