export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const orgId = session.user.organizationId;

    const settings = await prisma.notificationSettings.upsert({
      where:  { organizationId: orgId },
      create: { organizationId: orgId },
      update: {},
    });

    return NextResponse.json({ settings });
  } catch (err) {
    console.error("GET /api/notifications:", err);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const orgId = session.user.organizationId;
    const body = (await req.json()) as {
      telegramChatId?:   string | null;
      emailDigest?:      boolean;
      telegramPayments?: boolean;
    };

    const settings = await prisma.notificationSettings.upsert({
      where:  { organizationId: orgId },
      create: { organizationId: orgId, ...body },
      update: body,
    });

    return NextResponse.json({ settings });
  } catch (err) {
    console.error("PATCH /api/notifications:", err);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
