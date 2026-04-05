export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyPaymentRequest } from "@/lib/telegram";

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Нет доступа" }, { status: 401 });

    const requests = await prisma.paymentRequest.findMany({
      where:   { organizationId: session.user.organizationId },
      orderBy: { createdAt: "desc" },
      take:    50,
    });

    return NextResponse.json({ requests });
  } catch (err) {
    console.error("GET /api/approvals:", err);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Нет доступа" }, { status: 401 });

    const orgId = session.user.organizationId;
    const { amount, description, dueDate, categoryId, projectId } =
      (await req.json()) as {
        amount:      number;
        description: string;
        dueDate?:    string | null;
        categoryId?: string | null;
        projectId?:  string | null;
      };

    if (!description || !amount || amount <= 0) {
      return NextResponse.json({ error: "Сумма и описание обязательны" }, { status: 400 });
    }

    const request = await prisma.paymentRequest.create({
      data: {
        organizationId: orgId,
        amount,
        currency:       "KZT",
        description,
        dueDate:        dueDate ? new Date(dueDate) : null,
        categoryId:     categoryId ?? null,
        projectId:      projectId  ?? null,
        status:         "PENDING",
        createdById:    session.user.id,
      },
    });

    // Notify via Telegram if configured
    const notifSettings = await prisma.notificationSettings.findUnique({
      where: { organizationId: orgId },
    });
    if (notifSettings?.telegramChatId && notifSettings.telegramPayments) {
      const creator = await prisma.user.findUnique({
        where:  { id: session.user.id },
        select: { name: true, email: true },
      });
      await notifyPaymentRequest(notifSettings.telegramChatId, {
        id:          request.id,
        amount:      Number(request.amount),
        currency:    request.currency,
        description: request.description,
        createdBy:   creator?.name ?? creator?.email ?? session.user.id,
      });
    }

    return NextResponse.json({ request });
  } catch (err) {
    console.error("POST /api/approvals:", err);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
