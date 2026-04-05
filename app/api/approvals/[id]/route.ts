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

    const { id } = await params;
    const orgId  = session.user.organizationId;
    const { status } = (await req.json()) as { status: string };

    const valid = ["APPROVED", "REJECTED", "PAID"];
    if (!valid.includes(status)) {
      return NextResponse.json({ error: "Недопустимый статус" }, { status: 400 });
    }

    const existing = await prisma.paymentRequest.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!existing) return NextResponse.json({ error: "Не найдено" }, { status: 404 });

    const updated = await prisma.paymentRequest.update({
      where: { id },
      data: {
        status:      status as never,
        approvedById: ["APPROVED", "REJECTED"].includes(status)
          ? session.user.id
          : undefined,
      },
    });

    return NextResponse.json({ request: updated });
  } catch (err) {
    console.error("PATCH /api/approvals/[id]:", err);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
