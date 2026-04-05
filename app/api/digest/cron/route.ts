export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendDigestEmail } from "@/lib/digest";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const settings = await prisma.notificationSettings.findMany({
      where:  { emailDigest: true },
      select: { organizationId: true },
    });

    const results = await Promise.allSettled(
      settings.map((s) => sendDigestEmail(s.organizationId))
    );

    const sent   = results.filter((r) => r.status === "fulfilled" && r.value).length;
    const failed = results.length - sent;

    return NextResponse.json({ processed: settings.length, sent, failed });
  } catch (err) {
    console.error("GET /api/digest/cron:", err);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
