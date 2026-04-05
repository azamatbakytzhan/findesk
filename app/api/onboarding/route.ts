export const dynamic = 'force-dynamic'

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const orgId = session.user.organizationId;
    const body  = (await req.json()) as { complete?: boolean; step?: number };

    if (body.complete) {
      await prisma.organization.update({
        where: { id: orgId },
        data:  { onboardingCompleted: true },
      });
      return NextResponse.json({ ok: true });
    }

    if (typeof body.step === "number") {
      await prisma.organization.update({
        where: { id: orgId },
        data:  { onboardingStep: body.step },
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  } catch (err) {
    console.error("POST /api/onboarding:", err);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
