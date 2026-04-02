import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS, getEffectivePlan, type PlanKey } from "@/lib/plan-limits";
import crypto from "crypto";

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const orgId = session.user.organizationId;

    const invites = await prisma.invite.findMany({
      where:   { organizationId: orgId, acceptedAt: null },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ invites });
  } catch (err) {
    console.error("GET /api/team/invite:", err);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "OWNER" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 });
    }

    const orgId = session.user.organizationId;
    const { email, role } = (await req.json()) as { email: string; role: string };

    if (!email || !role) {
      return NextResponse.json({ error: "Email и роль обязательны" }, { status: 400 });
    }

    // Check plan user limit
    const effectivePlan = getEffectivePlan(session.user.plan, session.user.trialEndsAt);
    const limits = PLAN_LIMITS[effectivePlan as PlanKey] ?? PLAN_LIMITS.START;

    const currentCount = await prisma.user.count({ where: { organizationId: orgId } });
    if (currentCount >= limits.maxUsers) {
      return NextResponse.json(
        { error: `Лимит пользователей (${limits.maxUsers}) достигнут. Обновите тариф.` },
        { status: 403 }
      );
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Пользователь уже зарегистрирован" }, { status: 409 });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Upsert invite (re-invite same email refreshes token)
    await prisma.invite.deleteMany({ where: { organizationId: orgId, email } });
    const invite = await prisma.invite.create({
      data: {
        organizationId: orgId,
        email,
        role:      role as never,
        token,
        expiresAt,
      },
    });

    const inviteUrl = `${process.env.NEXTAUTH_URL ?? ""}/invite/${token}`;

    return NextResponse.json({ invite, inviteUrl });
  } catch (err) {
    console.error("POST /api/team/invite:", err);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "OWNER" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const orgId = session.user.organizationId;
    await prisma.invite.deleteMany({ where: { id, organizationId: orgId } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/team/invite:", err);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
